import { openaiClient } from "../clients";
import type { Resume } from "@/types";
import {
    EXTRACT_RESUME_DATA,
    extractResumeUserPrompt,
    atsAnalysisSystemPrompt,
    atsAnalysisUserPrompt,
} from "./prompts";
import { llmAnalysisJsonSchema, type LLMAnalysis } from "./types";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import resumeSchema from "../schema";

let model = new ChatOpenAI({
    model: "gpt-5.4-mini-2026-03-17",
    temperature: 0,
});

/** Step 1: resume text → structured Resume JSON */
export async function extractResume(resumeText: string) {

    const modelWithStructuredOutput = model.withStructuredOutput(resumeSchema, { method: "jsonSchema" });

    const response = await modelWithStructuredOutput.invoke([
        new SystemMessage(EXTRACT_RESUME_DATA),
        new HumanMessage(extractResumeUserPrompt(resumeText)),
    ]);

    return response;
}

/** Step 2: Resume JSON → raw ATS analysis JSON (optional JD for job-targeted score) */
export async function analyzeResume(
    resume: Resume,
    jobDescription?: string
) {

    const modelWithStructuredOutput = model.withStructuredOutput(llmAnalysisJsonSchema, { method: "jsonSchema" });

    const response = await modelWithStructuredOutput.invoke([
        new SystemMessage(atsAnalysisSystemPrompt(jobDescription)),
        new HumanMessage(atsAnalysisUserPrompt(resume, jobDescription)),
    ]);


    return response
}
