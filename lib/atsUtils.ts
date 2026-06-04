import type { ATSAnalysis, SectionAnalysis } from "@/types";

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

function dedupeKey(text: string): string {
    return text.trim().toLowerCase();
}

/** Keep first occurrence of each string (case-insensitive). */
export function uniqueList(items: string[] | undefined, seen: Set<string>): string[] {
    const out: string[] = [];
    for (const item of items ?? []) {
        const text = item.trim();
        const key = dedupeKey(text);
        if (text.length < 4 || seen.has(key)) continue;
        seen.add(key);
        out.push(text);
    }
    return out;
}

/** Drop duplicate before/after pairs (same improved text). */
export function uniqueImprovements(
    items: Array<{ original: string; improved: string }> | undefined,
    seen: Set<string>
): Array<{ original: string; improved: string }> {
    const out: Array<{ original: string; improved: string }> = [];
    for (const item of items ?? []) {
        const original = item.original?.trim() ?? "";
        const improved = item.improved?.trim() ?? "";
        const key = dedupeKey(improved);
        if (!original || !improved || dedupeKey(original) === key || seen.has(key)) continue;
        seen.add(key);
        out.push({ original, improved });
    }
    return out;
}

const SECTION_KEYS = [
    "summary",
    "skills",
    "experience",
    "projects",
    "structure",
] as const;

export function dedupeAnalysis(sections: ATSAnalysis["sections"]): {
    sections: ATSAnalysis["sections"];
    seen: Set<string>;
} {
    const seen = new Set<string>();
    const deduped = {} as ATSAnalysis["sections"];

    for (const key of SECTION_KEYS) {
        const section = sections[key];
        deduped[key] = {
            ...section,
            issues: uniqueList(section.issues, seen),
            fixes: uniqueList(section.fixes, seen),
            tips: uniqueList(section.tips, seen),
            goodThings: uniqueList(section.goodThings, seen),
            examples: uniqueList(section.examples, seen),
            improvements: uniqueImprovements(section.improvements, seen),
        };
    }

    return { sections: deduped, seen };
}

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
    fixes: Array<{ text: string; impact?: string }> | undefined,
    seen?: Set<string>
): Array<{ text: string; impact: "high" | "medium" }> {
    if (!fixes || !Array.isArray(fixes)) return [];
    const globalSeen = seen ?? new Set<string>();

    const cleaned: Array<{ text: string; impact: "high" | "medium" }> = [];
    for (const f of fixes) {
        const text = (f?.text ?? "").trim();
        if (text.length <= 5) continue;

        const key = dedupeKey(text);
        if (globalSeen.has(key)) continue;

        globalSeen.add(key);
        const impact: "high" | "medium" =
            f?.impact === "high" || f?.impact === "medium" ? f.impact : "high";
        cleaned.push({ text, impact });
        if (cleaned.length >= 5) break;
    }

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
