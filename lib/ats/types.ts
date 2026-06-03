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
