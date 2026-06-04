import type { ATSAnalysis, JobTargetedATSAnalysis } from "@/types";
import {
    clampScore,
    normalizeSection,
    dedupeAnalysis,
    uniqueList,
    computeOverallScoreFallback,
    refinePriorityFixes,
} from "../atsUtils";
import type { LLMAnalysis } from "./types";

function normalizeSections(raw: LLMAnalysis["sections"]) {
    return {
        summary: normalizeSection(raw.summary),
        skills: normalizeSection(raw.skills),
        experience: normalizeSection(raw.experience),
        projects: normalizeSection(raw.projects),
        structure: normalizeSection(raw.structure),
    };
}

function buildAnalysis(raw: LLMAnalysis): { analysis: ATSAnalysis; seen: Set<string> } {
    const { sections, seen } = dedupeAnalysis(normalizeSections(raw.sections));

    const llmScore = typeof raw.overallScore === "number" ? raw.overallScore : NaN;
    const overallScore = clampScore(
        !Number.isNaN(llmScore) ? llmScore : computeOverallScoreFallback(sections)
    );

    const llmPotential = typeof raw.improvementPotential === "number" ? raw.improvementPotential : 0;
    const maxPotential = 100 - overallScore;
    const potential = Math.max(0, Math.min(llmPotential, maxPotential));

    return {
        seen,
        analysis: {
            sections,
            priorityFixes: refinePriorityFixes(raw.priorityFixes, seen),
            globalTips: uniqueList(raw.globalTips, seen),
            improvementPotential: `+${Math.round(potential)} points`,
            overallScore,
        },
    };
}

export function buildFinalAnalysis(raw: LLMAnalysis): ATSAnalysis {
    return buildAnalysis(raw).analysis;
}

export function buildFinalJobAnalysis(raw: LLMAnalysis): JobTargetedATSAnalysis {
    const { analysis, seen } = buildAnalysis(raw);
    const kwSeen = new Set<string>();

    return {
        ...analysis,
        keywordAnalysis: {
            matched: uniqueList(raw.keywordAnalysis?.matched, kwSeen),
            missing: uniqueList(raw.keywordAnalysis?.missing, kwSeen),
            matchPercentage: clampScore(raw.keywordAnalysis?.matchPercentage ?? 0),
        },
        tailoredSuggestions: uniqueList(raw.tailoredSuggestions, seen),
    };
}
