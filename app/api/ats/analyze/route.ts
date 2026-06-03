import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import redisClient from "@/lib/redisClient";
import { extractTextFromPDFBuffer } from "@/lib/resumeHelper";
import { runATSAgent, streamATSAgent } from "@/lib/ats/workflow";
import { streamLegacyATS } from "@/lib/ats/legacy";
import { extractResumeDataForATS, runATSAnalysis } from "@/lib/atsHelper";
import type { ATSProgressEvent } from "@/lib/ats/progress";

import { authenticateRequest } from "@/lib/auth";
import { checkUsageLimit, incrementUsage } from "@/lib/usageHelper";

const DRAFT_TTL_SECONDS = 24 * 60 * 60; // 24h

/** true = LangGraph workflow, false = simple extract → analyze */
const USE_AGENT_WORKFLOW = true;

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

        if (!file && !resumeTextInput) {
            return NextResponse.json(
                { error: "Either file or resume text is required" },
                { status: 400 }
            );
        }

        let resumeText = resumeTextInput || "";
        let fileName = "resume.txt";
        if (file) {
            fileName = file.name;
            const buffer = Buffer.from(await file.arrayBuffer());
            resumeText = await extractTextFromPDFBuffer(buffer);
        }

        const useStream = request.nextUrl.searchParams.get("stream") === "1";

        if (useStream) {
            const stream = new ReadableStream({
                async start(controller) {
                    const encoder = new TextEncoder();
                    const send = (event: ATSProgressEvent | Record<string, unknown>) => {
                        controller.enqueue(encoder.encode(sseLine(event)));
                    };

                    try {
                        const pipeline = USE_AGENT_WORKFLOW
                            ? streamATSAgent(resumeText)
                            : streamLegacyATS(resumeText);

                        let result: { resumeData: unknown; analysis: unknown } | undefined;

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
                                resumeText,
                                resumeData: result.resumeData,
                                analysis: result.analysis,
                                fileName,
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

        let resumeData;
        let analysis;

        if (USE_AGENT_WORKFLOW) {
            ({ resumeData, analysis } = await runATSAgent(resumeText));
        } else {
            resumeData = await extractResumeDataForATS(resumeText);
            analysis = await runATSAnalysis(resumeData);
        }

        const draftId = crypto.randomUUID();
        await redisClient.set(
            `ats:draft:${draftId}`,
            JSON.stringify({ resumeText, resumeData, analysis, fileName }),
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
