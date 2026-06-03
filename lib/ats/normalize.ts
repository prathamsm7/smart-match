import type { ATSAnalysis, JobTargetedATSAnalysis } from "@/types";
import {
    clampScore,
    normalizeSection,
    computeOverallScoreFallback,
    refinePriorityFixes,
} from "../atsUtils";
import type { LLMAnalysis } from "./types";

export function buildFinalAnalysis(raw: LLMAnalysis): ATSAnalysis {
    const sections = {
        summary: normalizeSection(raw.sections.summary),
        skills: normalizeSection(raw.sections.skills),
        experience: normalizeSection(raw.sections.experience),
        projects: normalizeSection(raw.sections.projects),
        structure: normalizeSection(raw.sections.structure),
    };

    const llmScore = typeof raw.overallScore === "number" ? raw.overallScore : NaN;
    const overallScore = clampScore(
        !Number.isNaN(llmScore) ? llmScore : computeOverallScoreFallback(sections)
    );

    const llmPotential = typeof raw.improvementPotential === "number" ? raw.improvementPotential : 0;
    const maxPotential = 100 - overallScore;
    const potential = Math.max(0, Math.min(llmPotential, maxPotential));

    return {
        sections,
        priorityFixes: refinePriorityFixes(raw.priorityFixes),
        globalTips: raw.globalTips ?? [],
        improvementPotential: `+${Math.round(potential)} points`,
        overallScore,
    };
}

export function buildFinalJobAnalysis(raw: LLMAnalysis): JobTargetedATSAnalysis {
    const base = buildFinalAnalysis(raw);
    return {
        ...base,
        keywordAnalysis: {
            matched: raw.keywordAnalysis?.matched ?? [],
            missing: raw.keywordAnalysis?.missing ?? [],
            matchPercentage: clampScore(raw.keywordAnalysis?.matchPercentage ?? 0),
        },
        tailoredSuggestions: raw.tailoredSuggestions ?? [],
    };
}
