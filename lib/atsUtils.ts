import type { SectionAnalysis } from "@/types";

export type LLMSection = {
    score: number;
    issues?: string[];
    fixes?: string[];
    examples?: string[];
    improvements?: Array<{ original: string; improved: string }>;
    tips?: string[];
    goodThings?: string[];
};

export const clampScore = (value: unknown) => {
    const num = typeof value === "number" ? value : Number(value);
    if (Number.isNaN(num)) return 0;
    if (num < 0) return 0;
    if (num > 100) return 100;
    return num;
};

export const normalizeSection = (section: LLMSection): SectionAnalysis => ({
    score: clampScore(section.score),
    issues: section.issues ?? [],
    fixes: section.fixes ?? [],
    examples: section.examples ?? [],
    improvements: section.improvements ?? [],
    tips: section.tips ?? [],
    goodThings: section.goodThings ?? [],
});

export const SCORE_WEIGHTS = {
    experience: 0.3,
    skills: 0.2,
    structure: 0.2,
    summary: 0.15,
    projects: 0.15,
};

export function computeOverallScoreFallback(sections: {
    experience: { score: number };
    skills: { score: number };
    structure: { score: number };
    summary: { score: number };
    projects: { score: number };
}): number {
    const weighted =
        sections.experience.score * SCORE_WEIGHTS.experience +
        sections.skills.score * SCORE_WEIGHTS.skills +
        sections.structure.score * SCORE_WEIGHTS.structure +
        sections.summary.score * SCORE_WEIGHTS.summary +
        sections.projects.score * SCORE_WEIGHTS.projects;
    return Math.round(weighted);
}

export function refinePriorityFixes(
    fixes: Array<{ text: string; impact?: string }> | undefined
): Array<{ text: string; impact: "high" | "medium" }> {
    if (!fixes || !Array.isArray(fixes)) return [];
    const cleaned = fixes
        .map((f) => {
            const impact: "high" | "medium" =
                f?.impact === "high" || f?.impact === "medium" ? f.impact : "high";
            return {
                text: (f?.text ?? "").trim(),
                impact,
            };
        })
        .filter((f) => f.text.length > 5)
        .slice(0, 5);
    return cleaned;
}

export function getScoreGrade(score: number) {
    if (score >= 90) return { label: "Excellent", color: "var(--green2)" };
    if (score >= 75) return { label: "Good", color: "var(--cyan)" };
    if (score >= 60) return { label: "Fair", color: "var(--amber2)" };
    return { label: "Needs Work", color: "var(--red2)" };
}

export function getSectionChip(score: number) {
    if (score >= 90)
        return {
            label: "Excellent",
            bg: "rgba(0,212,255,.1)",
            color: "var(--cyan)",
        };
    if (score >= 85)
        return { label: "Strong", bg: "rgba(0,229,195,.1)", color: "var(--teal)" };
    if (score >= 75)
        return { label: "Good", bg: "rgba(255,171,64,.1)", color: "var(--amber2)" };
    return {
        label: "Needs Work",
        bg: "rgba(255,82,82,.1)",
        color: "var(--red2)",
    };
}

export function getScoreColor(score: number) {
    if (score >= 90) return "var(--cyan)";
    if (score >= 85) return "var(--teal)";
    if (score >= 75) return "var(--amber2)";
    return "var(--red2)";
}

export function getBarGradient(score: number) {
    if (score >= 90) return "linear-gradient(90deg,#00d4ff,#2979ff)";
    if (score >= 85) return "linear-gradient(90deg,#00e5c3,#00d4ff)";
    if (score >= 75) return "linear-gradient(90deg,#ffab40,#ffc04d)";
    return "linear-gradient(90deg,#ff5252,#ff7070)";
}
