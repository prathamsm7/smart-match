import type { ATSAnalysis, Job, JobTargetedATSAnalysis, Resume } from "@/types";
import { buildFinalAnalysis, buildFinalJobAnalysis } from "./ats/normalize";
import { extractResume, analyzeResume } from "./ats/llm";

function jobToDescription(job: Job): string {
    return [job.title, job.description, job.requirements, job.responsibilities]
        .filter(Boolean)
        .join("\n\n");
}

export {
    buildATSAnalysisPrompt,
    buildATSAnalysisSystemPrompt,
    buildATSAnalysisUserPrompt,
} from "./ats/prompts";

export async function runATSAnalysis(
    resume: Resume,
    jobDescription?: string
): Promise<ATSAnalysis | JobTargetedATSAnalysis> {
    const raw = await analyzeResume(resume, jobDescription);
    return jobDescription?.trim() ? buildFinalJobAnalysis(raw) : buildFinalAnalysis(raw);
}

export async function extractResumeDataForATS(resumeText: string): Promise<Resume> {
    return extractResume(resumeText);
}

/** Used by saved-resume + job routes; same analyze path as checker */
export async function runJobTargetedATSAnalysis(
    resume: Resume,
    job: Job
): Promise<JobTargetedATSAnalysis> {
    const result = await runATSAnalysis(resume, jobToDescription(job));
    return result as JobTargetedATSAnalysis;
}
