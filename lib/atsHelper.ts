import { geminiClient, openaiClient } from "./clients";
import type { ATSAnalysis, JobTargetedATSAnalysis, Resume, Job } from "@/types";
import { 
    clampScore, 
    normalizeSection, 
    computeOverallScoreFallback, 
    refinePriorityFixes, 
    SCORE_WEIGHTS,
    type LLMSection
} from "./atsUtils";

type LLMAnalysis = {
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

function buildFinalAnalysis(raw: LLMAnalysis): ATSAnalysis {
    const sections = {
        summary: normalizeSection(raw.sections.summary),
        skills: normalizeSection(raw.sections.skills),
        experience: normalizeSection(raw.sections.experience),
        projects: normalizeSection(raw.sections.projects),
        structure: normalizeSection(raw.sections.structure),
    };

    // Use LLM-provided overallScore if valid, otherwise compute from weights
    const llmScore = typeof raw.overallScore === "number" ? raw.overallScore : NaN;
    const overallScore = clampScore(!Number.isNaN(llmScore) ? llmScore : computeOverallScoreFallback(sections));

    // Clamp improvementPotential so score + potential <= 100
    const llmPotential = typeof raw.improvementPotential === "number" ? raw.improvementPotential : 0;
    const maxPotential = 100 - overallScore;
    const potential = Math.max(0, Math.min(llmPotential, maxPotential));

    const analysis: ATSAnalysis = {
        sections,
        priorityFixes: refinePriorityFixes(raw.priorityFixes),
        globalTips: raw.globalTips ?? [],
        improvementPotential: `+${Math.round(potential)} points`,
        overallScore,
    };

    return analysis;
}

function buildFinalJobAnalysis(raw: LLMAnalysis): JobTargetedATSAnalysis {
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

export function buildATSAnalysisPrompt(resume: Resume): string {
    return `
            You are an expert Application Tracking System scanner and senior recruiter and resume analyser, your task is to evaluate the given resume using ATS functionality.
            Be strict as much as possible and critical while evaluating the resume, do not give high scores easily.

            Analyze the resume for role "${resume?.preferredJob || ""}" with ${resume?.totalExperienceYears || 0} years of experience.
            Return structured output strictly matching the provided schema.

            --------------------------------------------------
            RESUME (JSON): ${JSON.stringify(resume, null, 2)}
            --------------------------------------------------

            OVERALL SCORE (MANDATORY):
            overallScore = round(
                experience.score * ${SCORE_WEIGHTS.experience} +
                skills.score     * ${SCORE_WEIGHTS.skills} +
                structure.score  * ${SCORE_WEIGHTS.structure} +
                summary.score    * ${SCORE_WEIGHTS.summary} +
                projects.score   * ${SCORE_WEIGHTS.projects}
            )

            --------------------------------------------------
            CORE RULES:

            - Be strict and objective in scoring (0–100 per section)
            - Suggest ONLY high-impact improvements/suggestions (no minor edits)
            - Do NOT estimate scores — follow formula exactly
            - improvementPotential must be realistic and <= remaining gap to 100
            - Output must follow schema exactly

            --------------------------------------------------
            ATS EVALUATION CHECKLIST:

            1. CONTENT
            - Keyword alignment with target role (skills, tools, domain)
            - Clear, specific experience with measurable impact
            - Strong action verbs; avoid vague/passive phrasing
            - Avoid repetition and generic statements
            - Summary aligned with target role
            - If found any spelling mistakes or punctuation errors in resume, correct them and suggest the corrected text.

            2. FORMAT
            - Simple, ATS-readable structure (no complex layouts)
            - Concise bullets; avoid overly long lines

            3. SECTIONS
            - Presence of core sections: summary, skills, experience, projects
            - Clear, standard headings for ATS parsing

            4. SKILLS
            - Relevant and focused (avoid excessive or mixed skills)
            - Proper grouping and no duplicates
            - Skills reflected in experience/projects (not isolated)

            5. STYLE
            - Professional tone, active voice
            - Avoid buzzwords and clichés
            - Clean links and professional contact info

            --------------------------------------------------
            METRIC RULE:

            - If a metric exists → DO NOT modify or judge its value as it is given by the user we can't make any assumption or judgement on the metrics, it may have great metric value for the user perspective and system dont have the overall context of it.
            - Only suggest adding context if unclear
            - If missing → suggest adding metrics using placeholders like [Insert % improvement]
            - Do not ask to add too many metrics, only suggest if it is really necessary, per section 2-3 metrics are enough.
            - Projects are build by the candidates and each and every may not have metrics, so do not suggest adding metrics in projects section if not available.

            --------------------------------------------------
            IMPROVEMENT RULES:

            - Only improve objectively weak content (missing metrics, vague, weak verbs)
            - No synonym swaps or stylistic rewrites
            - No hallucination — use only given content
            - "original" must exactly match resume text
            - Empty improvements are valid and preferred if content is strong

            --------------------------------------------------
            PRIORITY FIXES:

            - Provide a few high-impact, non-overlapping fixes
            - Must be actionable and tied to a section
            - Avoid generic suggestions

            --------------------------------------------------
            DECISION RULES (STABILITY):

            - If overallScore is high OR improvementPotential is low:
            → return minimal/no suggestions

            - If a section is strong or section score is >= 85:
            → do not suggest issues or improvements for that section

            - Empty issues/improvements/priorityFixes are valid outcomes

            --------------------------------------------------
            FINAL GUIDELINES:

            - Focus on keywords, experience impact, and structure (core ATS factors) 
            - Ensure keywords are relevant and used contextually, not just listed
            - Keep feedback concise, specific, and actionable  
            - Always include goodThings for each section   
            
            OUTPUT FORMAT- 
            {
                "sections": {
                    "summary": {
                    "score": 0-100,
                    "issues": [
                        Only list issues that are objectively bad, missing metrics, weak passive verbs, completely vague.
                    ],
                    "fixes": [],
                    "examples": [],
                    "improvements": [
                        { 
                            "original": "exact bad quote from resume", 
                            "improved": "fixed/improved version" 
                        }
                    ],
                    "tips": [],
                    "goodThings": []
                    },
                },
                "overallScore": <number, computed using formula>,
                "improvementPotential": <number, MUST satisfy: overallScore + improvementPotential <= 100 >,
                "priorityFixes": [
                    {
                    "text": "",
                    "impact": "high" | "medium",
                    "category": "experience" | "skills" | "structure" | "projects" | "summary"
                    }
                ],
                "globalTips": [],
                "confidence": <number between 0 and 1>  
            }
    `;
}

export async function runATSAnalysis(resume: Resume): Promise<ATSAnalysis> {
    const prompt = buildATSAnalysisPrompt(resume);

    const response = await geminiClient.chat.completions.create({
        model: "gemini-3-flash-preview",
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
            { role: "system", content: "You are an skilled ATS (Applicant Tracking System) scanner with a deep understanding of data science and ATS functionality, your task is to evaluate the resume" },
            { role: "user", content: prompt },
        ],
    });

    const content = response.choices[0]?.message?.content ?? "{}";
    const parsed: LLMAnalysis = JSON.parse(content);
    return buildFinalAnalysis(parsed);
}

export function buildJobTargetedPrompt(resume: Resume, job: Job): string {
    return `
            You are an expert ATS system and senior recruiter.
            Analyze the resume AGAINST THE JOB below and return STRICT JSON following the schema.

            RESUME (JSON):
            ${JSON.stringify(resume, null, 2)}

            JOB (JSON):
            ${JSON.stringify(job, null, 2)}

            RETURN STRICT JSON ONLY:
            {
            "sections": { ...same shape as general analysis (score, issues, fixes, examples, improvements, tips, goodThings)... },
            "overallScore": <number, computed using the weights above>,
            "improvementPotential": <number, overallScore + improvementPotential <= 100>,
            "priorityFixes": [{ "text": "", "impact": "high|medium" }],
            "globalTips": [],
            "keywordAnalysis": {
                "matched": [],
                "missing": [],
                "matchPercentage": 0-100
            },
            "tailoredSuggestions": []
            }

            CRITICAL: overallScore + improvementPotential MUST be <= 100.

            SCORING & KEYWORDS:
            - Evaluate all resume sections as before.
            - Compare the resume to the job description/requirements/responsibilities.
            - Identify matched and missing keywords/skills; set matchPercentage based on relevance coverage.
            - Tailored suggestions should point to WHERE to add missing items (e.g., experience section, skills section).
        `;
}

export async function runJobTargetedATSAnalysis(resume: Resume, job: Job): Promise<JobTargetedATSAnalysis> {
    const prompt = buildJobTargetedPrompt(resume, job);

    const response = await openaiClient.chat.completions.create({
        model: "gpt-5.4",
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
            { role: "system", content: "You are an skilled ATS (Applicant Tracking System) scanner with a deep understanding of data science and ATS functionality, your task is to evaluate the resume" },
            { role: "user", content: prompt },
        ],
    });

    const content = response.choices[0]?.message?.content ?? "{}";
    const parsed: LLMAnalysis = JSON.parse(content);
    return buildFinalJobAnalysis(parsed);
}

export async function extractResumeDataForATS(resumeText: string): Promise<Resume> {
    const prompt = `
                    Extract structured resume JSON from the text below.
                    Return STRICT JSON ONLY with shape:
                    {
                        "name": "",
                        "email": "",
                        "phone": "",
                        "location": "",
                        "summary": "",
                        "skills": [
                            preferred skills mentioned in resume skills section, Dont give an guess based on data give the skills only mentioned skills section
                            {
                                category: "",
                                skills: []
                            }
                        ],
                        "social": [],
                        "preferredJob":"Top 2 job titles based on profile summary and working experience",
                        "experience": [
                            {
                                "title": "",
                                "company": "",
                                "startDate": "",
                                "endDate": "",
                                "location": "",
                                "description": ""
                            }
                        ],
                        "projects": [{ "name": "", "description": "" }],
                        "languages": [],
                        "softSkills": [],
                        "totalExperienceYears": 0
                    }

                    Resume text:
                    ${resumeText}
                `;

    const response = await openaiClient.chat.completions.create({
        model: "gpt-5.4",
        temperature: 0.1,
        response_format: { type: "json_object" },
        messages: [
            { role: "system", content: "Extract resume JSON exactly as requested. Return strict JSON only." },
            { role: "user", content: prompt },
        ],
    });

    const content = response.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(content) as unknown as Resume;
    return parsed;
}
