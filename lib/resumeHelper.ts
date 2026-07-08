import crypto from "crypto";
import { qdrantClient } from "./clients";
import redisClient from "./redisClient";
import { extractResumeWithLlama } from "./llama";
import { deriveCandidateProfile, embedProfile, type CandidateProfile } from "./candidateProfile";

type PersistOptions = {
    profile?: CandidateProfile;
    profileVector?: number[];
};

/**
 * Persist structured resume data to Redis + Qdrant.
 * Pass profile/profileVector from Llama extract to skip a second embedding call.
 */
export async function persistResumeData(
    resumeData: Record<string, unknown>,
    options: PersistOptions = {}
): Promise<{
    success: boolean;
    resumeId?: string;
    error?: string;
}> {
    try {
        console.log("\n📤 Uploading resume to database...");

        const profile = options.profile;
        const profileVector = options.profileVector;

        if (!profile || !profileVector) {
            throw new Error("profile and profileVector are required for persistence");
        }

        console.log("✅ Using candidate profile from Llama extract");

        const resumeId = crypto.randomUUID();
        console.log(`🆔 Generated Resume ID: ${resumeId}`);

        const payload = { ...resumeData, candidateProfile: profile };

        await redisClient.set(
            `resumeData:${resumeId}`,
            JSON.stringify({ resumeData: payload, profileVector, candidateProfile: profile }),
            { ex: 7 * 24 * 60 * 60 }
        );

        await qdrantClient.upsert("resumes", {
            points: [{ id: resumeId, vector: profileVector, payload }],
        });

        return {
            success: true,
            resumeId,
        };
    } catch (error: unknown) {
        console.error("❌ Error uploading resume:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to persist resume",
        };
    }
}

/**
 * Extract PDF via LlamaCloud (resume + candidateProfile) then persist.
 */
export async function processAndStoreResume(
    buffer: Buffer,
    fileName = "resume.pdf"
): Promise<{ resumeId: string }> {
    console.log("🚀 ~ extracting resume with LlamaCloud");
    const { resumeData, profileVector, jobId } = await extractResumeWithLlama(buffer, fileName);
    console.log(`🚀 ~ Llama job ${jobId} → persisting resume`);

    const result = await persistResumeData(resumeData as Record<string, unknown>, {
        profile: resumeData.candidateProfile,
        profileVector,
    });
    if (!result.success || !result.resumeId) {
        throw new Error(result.error || "Failed to store resume");
    }

    return { resumeId: result.resumeId };
}

/**
 * Persist already-structured resume JSON (e.g. from ATS draft).
 */
export async function storeStructuredResume(
    resumeData: Record<string, unknown>
): Promise<{ resumeId: string }> {
    const profile = deriveCandidateProfile(resumeData);
    const profileVector = await embedProfile(profile);
    const result = await persistResumeData(resumeData, { profile, profileVector });
    if (!result.success || !result.resumeId) {
        throw new Error(result.error || "Failed to store resume");
    }
    return { resumeId: result.resumeId };
}
