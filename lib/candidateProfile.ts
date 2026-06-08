import { ChatGroq } from '@langchain/groq';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { z } from 'zod';
import { openaiClient } from './clients';
import { embedText } from './agents';
import type { JobSearchMode } from './jobSearch.types';

const candidateProfileSchema = z.object({
    profileSummary: z.string(),
    domains: z.array(z.string()),
    seniority: z.string(),
    coreSkills: z.array(z.string()),
    experienceYears: z.number(),
});

const groqProfileModel = new ChatGroq({
    model: 'llama-3.3-70b-versatile',
    temperature: 0.2,
});

export interface CandidateProfile {
    profileSummary: string;
    domains: string[];
    seniority: string;
    coreSkills: string[];
    experienceYears: number;
}

export function blendVectors(a: number[], b: number[], weightA = 0.5): number[] {
    const wB = 1 - weightA;
    const len = Math.min(a.length, b.length);
    const out = new Array(len);
    let mag = 0;
    for (let i = 0; i < len; i++) {
        out[i] = a[i] * weightA + b[i] * wB;
        mag += out[i] * out[i];
    }
    const norm = Math.sqrt(mag) || 1;
    return out.map((v) => v / norm);
}

export async function generateCandidateProfile(resumeData: Record<string, unknown>): Promise<CandidateProfile> {
    const prompt = `You are an expert resume analyzer. Analyze given resume data and return JSON only:

            profileSummary: 4-5 sentence technical profile for job matching. It should be based on the resume summary, skiils, experience, projects, etc.
            domains: list of domains the candidate has worked in, should be based on the experience and skills and projects.
            seniority: seniority of the candidate.
            coreSkills: list of core skills of the candidate.
            experienceYears: total experience of the candidate.

            output format:
            {
            "profileSummary": "4-5 sentence technical profile for job matching.",
            "domains": ["frontend","backend","ai","devops", "sales", "marketing", "etc"],
            "seniority": "junior"|"mid"|"senior"|"lead",
            "coreSkills": ["top 8-12 technical skills", "soft skills", "etc"],
            "experienceYears": number
            }

            Strict rules:
            - Dont make up any information, only based on the resume data.
            - If any information is not present in the resume, keep it empty.

    `;

    const payload = {
        summary: resumeData.summary,
        categorizedSkills: resumeData.categorizedSkills,
        experience: resumeData.experience,
        totalExperienceYears: resumeData.totalExperienceYears,
    };

    try {
        const model = groqProfileModel.withStructuredOutput(candidateProfileSchema, {
            method: 'jsonSchema',
            name: 'candidate_profile',
        });
        const parsed = await model.invoke([
            new SystemMessage(prompt),
            new HumanMessage(`Resume Data: ${JSON.stringify(payload)}`),
        ]);
        return {
            profileSummary: parsed.profileSummary || '',
            domains: parsed.domains || [],
            seniority: parsed.seniority || 'mid',
            coreSkills: parsed.coreSkills || [],
            experienceYears: Number(parsed.experienceYears) || Number(resumeData.totalExperienceYears) || 0,
        };
    } catch {
        const skills = (resumeData.skills as string[]) || [];
        return {
            profileSummary: `Professional with ${resumeData.totalExperienceYears || 0} years experience. Skills: ${skills.slice(0, 10).join(', ')}`,
            domains: [],
            seniority: 'mid',
            coreSkills: skills.slice(0, 12),
            experienceYears: Number(resumeData.totalExperienceYears) || 0,
        };
    }
}

/** Rephrase a natural-language job search query for semantic vector search */
export async function rephraseSearchQuery(query: string): Promise<string> {
    try {
        const res = await openaiClient.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: `You are an expert job search query rephraser. Rewrite this job search query as a concise technical paragraph for semantic job matching. 
                              If query is already clear and concise dont change it return the same query.

                              Capture role, domain, skills, mission, and preferences. Output text only, no markdown. Strict rules:
                              - Dont make up any information, only based on the query.
                              - If any information is not present in the query, keep it empty.  
                              
                              output format:
                              {
                                  "rephrasedQuery": "1-2 sentence technical paragraph for semantic job matching."
                              }
                        `,
                },
                {
                    role: 'user',
                    content: `Query: "${query}"`
                }
            ],
            temperature: 0.2,
            max_tokens: 200,
        });
        return res.choices[0]?.message?.content?.trim() || query;
    } catch {
        return query;
    }
}

export async function embedProfile(profile: CandidateProfile): Promise<number[]> {
    return await embedText(profile.profileSummary);
}

export async function embedQuery(rephrasedQuery: string): Promise<number[]> {
    return await embedText(rephrasedQuery);
}

export interface RerankDimensions {
    skillsFit: number;
    experienceFit: number;
    seniorityFit: number;
    domainFit: number;
    intentFit: number;
}

export interface RerankedJob {
    jobId: string;
    matchScore: number;
    matchReason: string;
    dimensions: RerankDimensions;
}

type RerankJobInput = {
    id: string;
    title: string;
    description?: string | null;
    requirements?: string | null;
    responsibilities?: string | null;
    location?: string | null;
};

// Mode-aware weights. They sum to 1 per mode so the rubric score stays 0-100.
const DIMENSION_WEIGHTS: Record<JobSearchMode, RerankDimensions> = {
    profile: { skillsFit: 0.30, experienceFit: 0.20, seniorityFit: 0.20, domainFit: 0.20, intentFit: 0.10 },
    query:   { skillsFit: 0.10, experienceFit: 0.10, seniorityFit: 0.10, domainFit: 0.15, intentFit: 0.55 },
    hybrid:  { skillsFit: 0.25, experienceFit: 0.15, seniorityFit: 0.15, domainFit: 0.20, intentFit: 0.25 },
};

// Rubric carries the decision; the Qdrant score only nudges it.
const RUBRIC_WEIGHT = 0.85;
const VECTOR_WEIGHT = 0.15;

// Hard-mismatch penalties applied in code after the weighted rubric.
const PENALTY_THRESHOLDS = { seniority: 25, domain: 30, skills: 35 };

type PenaltyConfig = { seniorityOvershoot: number; domainMismatch: number; skillsGap: number };

const PENALTIES: Record<JobSearchMode, PenaltyConfig> = {
    profile: { seniorityOvershoot: 25, domainMismatch: 20, skillsGap: 15 },
    query:   { seniorityOvershoot: 8,  domainMismatch: 0,  skillsGap: 10 },
    hybrid:  { seniorityOvershoot: 15, domainMismatch: 10, skillsGap: 12 },
};

const DIMENSION_KEYS: (keyof RerankDimensions)[] = [
    'skillsFit', 'experienceFit', 'seniorityFit', 'domainFit', 'intentFit',
];

function clampScore(value: unknown): number {
    return Math.min(100, Math.max(0, Math.round(Number(value) || 0)));
}

function normalizeDimensions(raw: Partial<RerankDimensions> | undefined): RerankDimensions {
    return {
        skillsFit: clampScore(raw?.skillsFit),
        experienceFit: clampScore(raw?.experienceFit),
        seniorityFit: clampScore(raw?.seniorityFit),
        domainFit: clampScore(raw?.domainFit),
        intentFit: clampScore(raw?.intentFit),
    };
}

function applyPenalties(dims: RerankDimensions, mode: JobSearchMode, score: number): number {
    const p = PENALTIES[mode];
    let penalty = 0;
    if (dims.seniorityFit < PENALTY_THRESHOLDS.seniority) penalty += p.seniorityOvershoot;
    if (dims.domainFit < PENALTY_THRESHOLDS.domain) penalty += p.domainMismatch;
    if (dims.skillsFit < PENALTY_THRESHOLDS.skills) penalty += p.skillsGap;
    return clampScore(score - penalty);
}

// Final score is computed in code (not by the LLM) for consistent, repeatable weighting.
function computeMatchScore(dims: RerankDimensions, mode: JobSearchMode, vectorScore: number): number {
    const weights = DIMENSION_WEIGHTS[mode];
    const rubric = DIMENSION_KEYS.reduce((sum, key) => sum + dims[key] * weights[key], 0);
    const blended = rubric * RUBRIC_WEIGHT + vectorScore * 100 * VECTOR_WEIGHT;
    return applyPenalties(dims, mode, blended);
}

// Deterministic tie-break: score → skills → seniority → experience → vector similarity.
function compareRanked(
    a: RerankedJob & { vectorScore: number },
    b: RerankedJob & { vectorScore: number }
): number {
    if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
    if (b.dimensions.skillsFit !== a.dimensions.skillsFit) return b.dimensions.skillsFit - a.dimensions.skillsFit;
    if (b.dimensions.seniorityFit !== a.dimensions.seniorityFit) return b.dimensions.seniorityFit - a.dimensions.seniorityFit;
    if (b.dimensions.experienceFit !== a.dimensions.experienceFit) return b.dimensions.experienceFit - a.dimensions.experienceFit;
    return b.vectorScore - a.vectorScore;
}

export async function rerankJobsWithAI(
    profile: CandidateProfile,
    jobs: RerankJobInput[],
    options: {
        mode: JobSearchMode;
        originalQuery?: string;
        rephrasedQuery?: string;
        vectorScores: Record<string, number>;
    }
): Promise<RerankedJob[]> {
    if (!jobs.length) return [];

    // Stable, meaningful order (best vector match first) to reduce position bias.
    const ordered = [...jobs].sort(
        (a, b) => (options.vectorScores[b.id] || 0) - (options.vectorScores[a.id] || 0)
    );

    const jobList = ordered.map((j) => ({
        id: j.id,
        title: j.title,
        location: j.location,
        requirements: j.requirements,
        description: j.description,
        responsibilities: j.responsibilities,
    }));

    const searchContext = options.originalQuery
        ? `User query: "${options.originalQuery}" (rephrased: "${options.rephrasedQuery || options.originalQuery}")`
        : 'No query — match jobs to the candidate profile capability.';

    const prompt = `You are an expert job matching evaluator. Score EACH job for this candidate independently. Return JSON only.

Candidate:
- Profile: ${profile.profileSummary}
- Seniority: ${profile.seniority}
- Experience: ${profile.experienceYears} years
- Skills: ${profile.coreSkills.join(', ')}
- Domains: ${profile.domains.join(', ')}

Search mode: ${options.mode}
${searchContext}

Jobs: ${JSON.stringify(jobList)}

For every job, score these dimensions from 0-100 (use the FULL range, do not cluster):
- skillsFit: overlap between candidate skills and the job's required skills
- experienceFit: how relevant the candidate's experience is to the role
- seniorityFit: candidate seniority vs the role's level (a junior candidate for a senior role MUST score near 0)
- domainFit: candidate domain vs the job domain/industry
- intentFit: alignment with the user's search query/intent (if no query, score how well it matches the profile direction)

Scoring rules:
- Score each job ON ITS OWN MERITS. Ignore the order jobs appear in.
- A hard mismatch (missing must-have skill, wrong seniority, wrong domain) MUST score that dimension near 0 — do not be generous.
- Do not invent skills or experience not present in the candidate or job data.

Return:
{
  "rankings": [
    {
      "jobId": string,
      "dimensions": { "skillsFit": 0-100, "experienceFit": 0-100, "seniorityFit": 0-100, "domainFit": 0-100, "intentFit": 0-100 },
      "matchReason": "2-3 sentences citing specific matched skills/experience and any clear gap or red flag"
    }
  ]
}
Include ALL jobs.`;

    let parsedRankings: Array<{ jobId: string; dimensions?: Partial<RerankDimensions>; matchReason?: string }> = [];

    try {
        const res = await openaiClient.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0,
            response_format: { type: 'json_object' },
        });
        const parsed = JSON.parse(res.choices[0]?.message?.content || '{}');
        parsedRankings = parsed.rankings || [];
    } catch {
        parsedRankings = [];
    }

    const byId = new Map(parsedRankings.map((r) => [r.jobId, r]));

    // Build a result for every job; fall back to vector score if the LLM dropped one.
    const results = ordered.map((job) => {
        const vectorScore = options.vectorScores[job.id] || 0;
        const llm = byId.get(job.id);

        if (!llm) {
            return {
                jobId: job.id,
                matchScore: Math.round(vectorScore * 100),
                matchReason: '',
                dimensions: normalizeDimensions(undefined),
                vectorScore,
            };
        }

        const dimensions = normalizeDimensions(llm.dimensions);
        return {
            jobId: job.id,
            matchScore: computeMatchScore(dimensions, options.mode, vectorScore),
            matchReason: llm.matchReason || '',
            dimensions,
            vectorScore,
        };
    });

    return results
        .sort(compareRanked)
        .map(({ vectorScore, ...rest }) => rest);
}
