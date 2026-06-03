import { openaiClient } from "./clients";
import type { ATSAnalysis, JobTargetedATSAnalysis, Resume, Job } from "@/types";
import { buildFinalAnalysis, buildFinalJobAnalysis } from "./ats/normalize";
import { buildJobTargetedPrompt } from "./ats/prompts";
import { extractResume, analyzeResume } from "./ats/llm";
import type { LLMAnalysis } from "./ats/types";

export { buildATSAnalysisPrompt } from "./ats/prompts";

/** Simple path: extract → analyze → normalize (no LangGraph) */
export async function runATSAnalysis(resume: Resume): Promise<ATSAnalysis> {
    const raw = await analyzeResume(resume);
    return buildFinalAnalysis(raw);
}

export async function extractResumeDataForATS(resumeText: string): Promise<Resume> {
    return extractResume(resumeText);
}

export async function runJobTargetedATSAnalysis(
    resume: Resume,
    job: Job
): Promise<JobTargetedATSAnalysis> {
    const prompt = buildJobTargetedPrompt(resume, job);

    const response = await openaiClient.chat.completions.create({
        model: "gpt-5.4",
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
            {
                role: "system",
                content:
                    "You are an skilled ATS (Applicant Tracking System) scanner with a deep understanding of data science and ATS functionality, your task is to evaluate the resume",
            },
            { role: "user", content: prompt },
        ],
    });

    const content = response.choices[0]?.message?.content ?? "{}";
    const parsed: LLMAnalysis = JSON.parse(content);
    return buildFinalJobAnalysis(parsed);
}
