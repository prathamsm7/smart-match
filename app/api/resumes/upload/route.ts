import { NextRequest, NextResponse } from "next/server";
import { processAndStoreResume } from "@/lib/resumeHelper";
import { qdrantClient } from "@/lib/clients";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";
import { checkUsageLimit, incrementUsage } from "@/lib/usageHelper";

export const maxDuration = 300;

export async function POST(request: NextRequest) {
    try {
        const { user: dbUser, error } = await authenticateRequest();
        if (error) return error;

        const { allowed, limit, used } = await checkUsageLimit(dbUser.id, "resume_upload");
        if (!allowed) {
            return NextResponse.json(
                {
                    error: "Monthly resume upload limit reached",
                    limit,
                    used,
                    upgradeRequired: true,
                },
                { status: 403 }
            );
        }

        const formData = await request.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ error: "PDF file is required" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const { resumeId } = await processAndStoreResume(buffer, file.name || "resume.pdf");

        console.log("🚀 ~ POST ~ result:", resumeId);

        if (resumeId) {
            const qdrantResult = await qdrantClient.retrieve("resumes", {
                ids: [resumeId],
                with_payload: true,
            });

            if (qdrantResult && qdrantResult[0]) {
                const payload = qdrantResult[0].payload as object;

                const resumeCount = await prisma.resume.count({
                    where: { userId: dbUser.id },
                });

                const isPrimary = resumeCount === 0;

                await prisma.resume.create({
                    data: {
                        id: resumeId,
                        userId: dbUser.id,
                        vectorId: resumeId,
                        json: payload,
                        isPrimary,
                    },
                });

                await qdrantClient.setPayload("resumes", {
                    payload: {
                        userId: dbUser.id,
                        isPrimary,
                    },
                    points: [resumeId],
                });
                console.log(
                    `✅ Synced metadata for Resume ${resumeId} to Qdrant (Primary: ${isPrimary})`
                );

                await incrementUsage(dbUser.id, "resume_upload");
            }
        }

        return NextResponse.json({ resumeId });
    } catch (error: unknown) {
        console.error("Error processing resume:", error);
        const message = error instanceof Error ? error.message : "Internal server error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
