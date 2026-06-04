import type { LLMSection } from "../atsUtils";

/** Raw JSON shape returned by the analyze LLM call (before normalize). */
export type LLMAnalysis = {
    sections: {
        summary: LLMSection;
        skills: LLMSection;
        experience: LLMSection;
        projects: LLMSection;
        structure: LLMSection;
    };
    overallScore?: number;
    improvementPotential?: number;
    priorityFixes: Array<{ text: string; impact?: "high" | "medium" | "low" }>;
    globalTips: string[];
    keywordAnalysis?: {
        matched: string[];
        missing: string[];
        matchPercentage: number;
    };
    tailoredSuggestions?: string[];
};

const sectionSchema = {
    type: "object",
    description: "Per-section ATS analysis",
    properties: {
        score: {
            type: "number",
            description: "Section score from 0 to 100",
        },
        issues: {
            type: "array",
            description:
                "Unique objective issues for this section only; no duplicates anywhere in the response",
            items: { type: "string" },
        },
        fixes: {
            type: "array",
            description:
                "Unique suggested fixes for this section only; no duplicates anywhere in the response",
            items: { type: "string" },
        },
        examples: {
            type: "array",
            description: "Example improvements",
            items: { type: "string" },
        },
        improvements: {
            type: "array",
            description:
                "Unique before/after improvements; one per resume phrase; no duplicate improved text",
            items: {
                type: "object",
                properties: {
                    original: {
                        type: "string",
                        description: "Exact quote from the resume",
                    },
                    improved: {
                        type: "string",
                        description: "Improved version",
                    },
                },
                required: ["original", "improved"],
                additionalProperties: false,
            },
        },
        tips: {
            type: "array",
            description: "Unique tips for this section; no duplicates across the response",
            items: { type: "string" },
        },
        goodThings: {
            type: "array",
            description: "Unique strengths; no duplicates across the response",
            items: { type: "string" },
        },
    },
    required: ["score", "issues", "fixes", "examples", "improvements", "tips", "goodThings"],
    additionalProperties: false,
};

/** JSON Schema for OpenAI / LangChain structured ATS analysis output */
export const llmAnalysisJsonSchema = {
    title: "ATSAnalysis",
    description: "ATS resume analysis with section scores and recommendations",
    type: "object",
    properties: {
        sections: {
            type: "object",
            description: "Scores and feedback per resume section",
            properties: {
                summary: sectionSchema,
                skills: sectionSchema,
                experience: sectionSchema,
                projects: sectionSchema,
                structure: sectionSchema,
            },
            required: ["summary", "skills", "experience", "projects", "structure"],
            additionalProperties: false,
        },
        overallScore: {
            type: "number",
            description:
                "Weighted overall score 0-100 (experience 30%, skills 20%, structure 20%, summary 15%, projects 15%)",
        },
        improvementPotential: {
            type: "number",
            description:
                "Realistic points still achievable; must satisfy overallScore + improvementPotential <= 100",
        },
        priorityFixes: {
            type: "array",
            description: "High-impact actionable fixes",
            items: {
                type: "object",
                properties: {
                    text: { type: "string", description: "Fix description" },
                    impact: {
                        type: ["string", "null"],
                        enum: ["high", "medium", "low", null],
                        description: "Impact level, or null if not specified",
                    },
                },
                required: ["text", "impact"],
                additionalProperties: false,
            },
        },
        globalTips: {
            type: "array",
            description: "Global resume tips",
            items: { type: "string" },
        },
        keywordAnalysis: {
            description:
                "Job keyword match when a job description was provided; otherwise null",
            anyOf: [
                {
                    type: "object",
                    properties: {
                        matched: {
                            type: "array",
                            description:
                                "Up to 10 most relevant JD keywords/skills clearly present in the resume; Title Case",
                            items: { type: "string" },
                            maxItems: 10,
                        },
                        missing: {
                            type: "array",
                            description:
                                "Up to 10 highest-impact JD requirements not evidenced in the resume; Title Case",
                            items: { type: "string" },
                            maxItems: 10,
                        },
                        matchPercentage: {
                            type: "number",
                            description: "Keyword match percentage 0-100",
                        },
                    },
                    required: ["matched", "missing", "matchPercentage"],
                    additionalProperties: false,
                },
                { type: "null" },
            ],
        },
        tailoredSuggestions: {
            type: "array",
            description:
                "Where to add missing job items (e.g. skills section); empty if no job description",
            items: { type: "string" },
        },
    },
    required: [
        "sections",
        "overallScore",
        "improvementPotential",
        "priorityFixes",
        "globalTips",
        "keywordAnalysis",
        "tailoredSuggestions",
    ],
    additionalProperties: false,
};
