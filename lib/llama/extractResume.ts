import { toFile } from "@llamaindex/llama-cloud";
import type { ExtractConfiguration } from "@llamaindex/llama-cloud/resources/extract";
import { z } from "zod";
import resumeSchema from "@/lib/schema";
import { getLlamaCloudClient } from "./client";
import { RESUME_EXTRACT_DATA_SCHEMA } from "./resumeSchemaJson";
import type { CandidateProfile } from "@/lib/candidateProfile";
import { embedProfile } from "@/lib/candidateProfile";

const candidateProfileSchema = z.object({
    profileSummary: z.string(),
    domains: z.array(z.string()),
    seniority: z.string(),
    coreSkills: z.array(z.string()),
    experienceYears: z.number(),
});

export type ExtractedResumeData = ReturnType<typeof resumeSchema.parse> & {
    skills: string[];
    candidateProfile: CandidateProfile;
};

function flattenSkills(categorizedSkills: {
    languages?: string[];
    frameworks?: string[];
    ai?: string[];
    databases?: string[];
    tools?: string[];
    other?: string[];
} | undefined): string[] {
    const c = categorizedSkills || {};
    return [
        ...(c.languages || []),
        ...(c.frameworks || []),
        ...(c.ai || []),
        ...(c.databases || []),
        ...(c.tools || []),
        ...(c.other || []),
    ];
}

/**
 * Extract structured resume + candidateProfile from a PDF via LlamaCloud.
 * Profile vector is embedded once for Qdrant (no second LLM call).
 */
export async function extractResumeWithLlama(
    buffer: Buffer,
    fileName = "resume.pdf"
): Promise<{
    resumeData: ExtractedResumeData;
    profileVector: number[];
    jobId: string;
}> {
    const client = getLlamaCloudClient();

    const file = await toFile(buffer, fileName, { type: "application/pdf" });
    const fileObj = await client.files.create({
        file,
        purpose: "extract",
    });

    const job = await client.extract.run(
        {
            file_input: fileObj.id,
            configuration: {
                data_schema:
                    RESUME_EXTRACT_DATA_SCHEMA as unknown as ExtractConfiguration["data_schema"],
                tier: "cost_effective",
                extraction_target: "per_doc",
                parse_tier: "agentic",
                cite_sources: true,
                confidence_scores: true,
                system_prompt: `
                    CRITICAL: For totalExperienceYears calculation:
                        - Calculate EACH experience duration separately in months
                        - If endDate is "Present", "Current", or "Now", use November 2025
                        - Formula: months = (end_year - start_year) * 12 + (end_month - start_month + 1)
                        - Convert to years: years = months / 12
                        - SUM all experience durations
                        - Round final total to 1 decimal place
                        - Return as NUMBER type

                        Example calculation:
                        - August 2022 to November 2025 = 40 months = 3.33 years
                        - September 2019 to July 2021 = 23 months = 1.92 years
                        - September 2018 to July 2019 = 11 months = 0.92 years
                        Total: 3.33 + 1.92 + 0.92 = 6.17 → 6.2 years

                    CRITICAL: Also fill candidateProfile from the same resume facts:
                        - profileSummary: 4-5 sentence technical profile for job matching
                        - domains: from experience/skills/projects (empty array if unclear)
                        - seniority: junior | mid | senior | lead
                        - coreSkills: top 8-12 skills from categorizedSkills / experience
                        - experienceYears: must equal totalExperienceYears
                        - Do not invent skills or domains not present in the resume
                `,
            },
        },
        { pollingInterval: 2, maxInterval: 5, timeout: 300 }
    );

    if (job.status !== "COMPLETED") {
        throw new Error(
            `Llama extract job ${job.id} ended in ${job.status}: ${job.error_message || "unknown error"}`
        );
    }

    const raw = job.extract_result as Record<string, unknown>;
    const resumeData = resumeSchema.parse(raw);
    const skills = flattenSkills(resumeData.categorizedSkills);
    const candidateProfile = candidateProfileSchema.parse(raw.candidateProfile);

    if (!candidateProfile.coreSkills.length && skills.length) {
        candidateProfile.coreSkills = skills.slice(0, 12);
    }
    if (!candidateProfile.experienceYears) {
        candidateProfile.experienceYears = resumeData.totalExperienceYears || 0;
    }

    const profileVector = await embedProfile(candidateProfile);

    return {
        resumeData: { ...resumeData, skills, candidateProfile },
        profileVector,
        jobId: job.id,
    };
}
