import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import redisClient from "@/lib/redisClient";
import { runATSAgent, streamATSAgent } from "@/lib/ats/workflow";
import type { ATSProgressEvent } from "@/lib/ats/progress";

import { authenticateRequest } from "@/lib/auth";
import { checkUsageLimit, incrementUsage } from "@/lib/usageHelper";

const DRAFT_TTL_SECONDS = 24 * 60 * 60; // 24h

function sseLine(data: ATSProgressEvent | Record<string, unknown>): string {
    return `data: ${JSON.stringify(data)}\n\n`;
}

export async function POST(request: NextRequest) {
    try {
        const { user: dbUser, error } = await authenticateRequest();
        if (error) return error;

        const { allowed, limit, used } = await checkUsageLimit(dbUser.id, "ats_analysis");
        if (!allowed) {
            return NextResponse.json(
                {
                    error: "Monthly ATS analysis limit reached",
                    limit,
                    used,
                    upgradeRequired: true,
                },
                { status: 403 }
            );
        }

        const formData = await request.formData();
        const file = formData.get("file") as File | null;
        const resumeTextInput = formData.get("resumeText") as string | null;
        const jobDescription = (formData.get("jobDescription") as string | null)?.trim() || undefined;

        if (!file && !resumeTextInput) {
            return NextResponse.json(
                { error: "Either file or resume text is required" },
                { status: 400 }
            );
        }

        const fileName = file?.name ?? "resume.txt";
        const workflowInput = {
            resumeText: resumeTextInput?.trim() || undefined,
            fileBuffer: file ? Buffer.from(await file.arrayBuffer()) : undefined,
            jobDescription,
        };

        const useStream = request.nextUrl.searchParams.get("stream") === "1";

        if (useStream) {
            const stream = new ReadableStream({
                async start(controller) {
                    const encoder = new TextEncoder();
                    const send = (event: ATSProgressEvent | Record<string, unknown>) => {
                        controller.enqueue(encoder.encode(sseLine(event)));
                    };

                    try {
                        const pipeline = streamATSAgent(workflowInput);
                        let result: Awaited<ReturnType<typeof runATSAgent>> | undefined;

                        while (true) {
                            const { value, done } = await pipeline.next();
                            if (done) {
                                result = value;
                                break;
                            }
                            send(value);
                        }

                        if (!result) {
                            throw new Error("ATS workflow returned no result");
                        }

                        const draftId = crypto.randomUUID();
                        await redisClient.set(
                            `ats:draft:${draftId}`,
                            JSON.stringify({
                                resumeText: result.resumeText,
                                resumeData: result.resumeData,
                                analysis: result.analysis,
                                fileName,
                                jobDescription,
                            }),
                            { ex: DRAFT_TTL_SECONDS }
                        );

                        await incrementUsage(dbUser.id, "ats_analysis");

                        send({
                            type: "complete",
                            draftId,
                            analysis: result.analysis,
                            resumeData: result.resumeData,
                            fileName,
                        });
                    } catch (err: unknown) {
                        const message =
                            err instanceof Error ? err.message : "Internal server error";
                        console.error("ATS analyze stream error:", err);
                        send({ type: "error", message });
                    } finally {
                        controller.close();
                    }
                },
            });

            return new Response(stream, {
                headers: {
                    "Content-Type": "text/event-stream",
                    "Cache-Control": "no-cache, no-transform",
                    Connection: "keep-alive",
                },
            });
        }

        const { resumeText, resumeData, analysis } = await runATSAgent(workflowInput);

        const draftId = crypto.randomUUID();
        await redisClient.set(
            `ats:draft:${draftId}`,
            JSON.stringify({ resumeText, resumeData, analysis, fileName, jobDescription }),
            { ex: DRAFT_TTL_SECONDS }
        );

        await incrementUsage(dbUser.id, "ats_analysis");

        return NextResponse.json({ draftId, analysis, resumeData, fileName });
    } catch (error: unknown) {
        console.error("ATS analyze error:", error);
        const message = error instanceof Error ? error.message : "Internal server error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
