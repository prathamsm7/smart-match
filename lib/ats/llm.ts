import { openaiClient } from "../clients";
import type { Resume } from "@/types";
import { buildExtractResumePrompt, buildATSAnalysisPrompt } from "./prompts";
import type { LLMAnalysis } from "./types";

/** Step 1: resume text → structured Resume JSON */
export async function extractResume(resumeText: string): Promise<Resume> {
    const response = await openaiClient.chat.completions.create({
        model: "gpt-5.4",
        temperature: 0.1,
        response_format: { type: "json_object" },
        messages: [
            {
                role: "system",
                content: "Extract resume JSON exactly as requested. Return strict JSON only.",
            },
            { role: "user", content: buildExtractResumePrompt(resumeText) },
        ],
    });

    const content = response.choices[0]?.message?.content ?? "{}";
    return JSON.parse(content) as Resume;
}

/** Step 2: Resume JSON → raw ATS analysis JSON */
export async function analyzeResume(resume: Resume): Promise<LLMAnalysis> {
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
            { role: "user", content: buildATSAnalysisPrompt(resume) },
        ],
    });

    const content = response.choices[0]?.message?.content ?? "{}";
    return JSON.parse(content) as LLMAnalysis;
}
