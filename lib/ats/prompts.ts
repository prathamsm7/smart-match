import type { Resume } from "@/types";
import { SCORE_WEIGHTS } from "../atsUtils";

export const EXTRACT_RESUME_DATA = `
                            You are now an expert resume analyser and data extractor agent that extracts the data from the resume and returns it in a structured format.
                            Your task is to extract the given resume data.
                            Inputs you may receive: text of the resume.

                            Return STRICT JSON ONLY with shape:
                            `;             

// Extract resume user prompt
export function extractResumeUserPrompt(resumeText: string): string {
    return `Text of the resume:\n${resumeText}`;
}


export function atsAnalysisSystemPrompt(jobDescription?: string): string {
    const jd = jobDescription?.trim();
    const jdRules = jd
        ? `Score the resume against the job description in the user message. Fill keywordAnalysis and tailoredSuggestions.

            KEYWORD ANALYSIS (strict):
            - Compare ONLY the job description vs resume (skills, experience, projects, summary).
            - matched: up to 10 highest-impact skills/keywords clearly present in BOTH JD and resume (most relevant to the role first).
            - missing: up to 10 highest-impact JD requirements NOT evidenced in the resume (most likely to affect screening first).
            - Do NOT list every keyword; omit minor, generic, or duplicate terms.
            - Use consistent Title Case labels (e.g. "Prompt Engineering", "LangChain", "AWS", "CI/CD").
            - matchPercentage: realistic 0–100 estimate of JD keyword coverage.`
        : `No job description was provided. Set keywordAnalysis to null and tailoredSuggestions to [].`;

    return `You are an expert Application Tracking System scanner and resume analyser. Your task is to evaluate the resume provided in the user message using ATS functionality.
            Be strict as much as possible and critical while evaluating the resume; do not give high scores easily.
            Return structured output strictly matching the provided schema. Return strict JSON only.

            ${jdRules}

            OVERALL SCORE (MANDATORY):
            overallScore = round(
                experience.score * ${SCORE_WEIGHTS.experience} +
                skills.score     * ${SCORE_WEIGHTS.skills} +
                structure.score  * ${SCORE_WEIGHTS.structure} +
                summary.score    * ${SCORE_WEIGHTS.summary} +
                projects.score   * ${SCORE_WEIGHTS.projects}
            )

            CORE RULES:
            - Be strict and objective in scoring (0–100 per section)
            - Suggest ONLY high-impact improvements/suggestions (no minor edits)
            - Do NOT estimate scores — follow formula exactly
            - improvementPotential must be realistic and <= remaining gap to 100

            PROFILE / CONTACT (mandatory — report under sections.structure):
            - Use the resume JSON fields name, email, phone (and location if relevant).
            - name: present, professional full name (not empty, not "N/A", not placeholder).
            - email: present and valid email format (contains @ and domain).
            - phone: present and plausible phone number (not empty, not placeholder).
            - If any are missing or invalid: add clear issues and fixes in structure; add a priorityFix when high impact; reduce structure.score.
            - If all are valid: mention them in structure.goodThings.

            ATS EVALUATION CHECKLIST:
            1. CONTENT — keyword alignment, measurable impact, strong verbs, summary aligned with target role
            2. FORMAT — ATS-readable structure, concise bullets
            3. SECTIONS — summary, skills, experience, projects with clear headings
            4. SKILLS — relevant to the job description, grouped, reflected in experience/projects
            5. STYLE — professional tone, no buzzwords, no filler words

            METRIC RULE:
            - If a metric exists → DO NOT modify or judge its value
            - If missing → suggest placeholders like [Insert % improvement]; max 2-3 per section
            - Do not require metrics in projects if not available

            IMPROVEMENT RULES:
            - Only improve objectively weak content; no synonym swaps; no hallucination
            - "original" must exactly match resume text
            - Never suggest the same wording change more than once (e.g. do not output multiple before/after pairs that all become "LLM Fine-Tuning")
            - Skip cosmetic-only edits (casing, hyphenation, word order) unless required for ATS parsing

            UNIQUENESS (MANDATORY — ZERO DUPLICATE CONTENT):
            - Every issue, fix, tip, suggestion, and improvement must be globally unique across the entire JSON response.
            - Applies to ALL of: sections.*.issues, sections.*.fixes, sections.*.tips, sections.*.goodThings, sections.*.improvements, priorityFixes[].text, globalTips, tailoredSuggestions, keywordAnalysis.matched, keywordAnalysis.missing.
            - Do NOT repeat the same point in different sections — assign each finding to exactly one best section.
            - Do NOT paraphrase the same advice twice with different wording.
            - sections.*.improvements: at most ONE entry per resume phrase or skill label; if multiple originals map to the same fix, keep only the single best pair.
            - Before returning JSON, review every list and remove duplicates; when in doubt, omit the weaker duplicate.


            PRIORITY FIXES: few high-impact, actionable, section-tied fixes; must not repeat any section issue or fix text

            DECISION RULES:
            - High overallScore or low improvementPotential → minimal suggestions
            - Section score >= 85 → no issues/improvements for that section

            - Dont make up any information, only based on the resume and the job description.
            - If any information is not present in the resume, keep it empty.

            `;
}

export function atsAnalysisUserPrompt(resume: Resume, jobDescription?: string): string {
    const jd = jobDescription?.trim();
    const jdBlock = jd
        ? `\n\nJOB DESCRIPTION:\n${jd}\n`
        : "";

    return `Analyze this resume${jd ? " against the job description below" : ""} for role "${resume?.preferredJob || ""}" with ${resume?.totalExperienceYears ?? 0} years of experience.

    
            RESUME (JSON):
            ${JSON.stringify(resume, null, 2)}
            
            ${jdBlock}`;
}