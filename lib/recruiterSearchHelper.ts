import { prisma } from "./prisma";
import { qdrantClient, openaiClient } from "./clients";
import { embedText } from "./agents";
import { z } from "zod";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CandidateToRank {
  resumeId: string;
  name: string;
  summary: string;
  skills: string[];
  experience: string;
  yearsOfExperience: number;
  projects: any[];
  location: string;
  semanticScore: number;
}

// ─── Zod Schemas ──────────────────────────────────────────────────────────────

const scoreBreakdownSchema = z.object({
  skill: z.number(),
  role: z.number(),
  experience: z.number(),
  project: z.number(),
  semantic: z.number(),
});

const rankingSchema = z.object({
  rankings: z.array(
    z.object({
      resumeId: z.string(),
      matchScore: z.number().min(0).max(100),
      reason: z.string(),
      scoreBreakdown: scoreBreakdownSchema,
      strengths: z.array(z.string()).optional(),
      weaknesses: z.array(z.string()).optional(),
      skills: z.array(z.string()).optional(),
      locationMatched: z.union([z.boolean(), z.string()]).optional(),
    }),
  ),
});

const analysisSchema = z.object({
  matchScore: z.number().min(0).max(100),
  reason: z.string(),
  scoreBreakdown: scoreBreakdownSchema,
  strengths: z.array(z.string()).optional(),
  weaknesses: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  locationMatched: z.union([z.boolean(), z.string()]).optional(),
});

// ─── Prompts ──────────────────────────────────────────────────────────────────

function buildRankingPrompt(query: string, candidates: CandidateToRank[]): string {
  return `
You are an expert technical recruiter ranking candidates.

--------------------------------
RECRUITER QUERY:
"${query}"

--------------------------------
CANDIDATES:
${JSON.stringify(candidates, null, 2)}

--------------------------------
TASK:

You MUST compute the matchScore using STRICT scoring rules below.

--------------------------------
SCORING SYSTEM (TOTAL = 100):

1. Skill Match (0–40)
- Exact required skills present → +30 to +40
- Partial match → +15 to +29
- Weak match → +0 to +14

2. Role Relevance (0–20)
- Exact role match → +15 to +20
- Related role → +8 to +14
- Irrelevant → +0 to +7

3. Experience Match (0–15) - Only consider if query contains years of experience requirement
- Meets or exceeds required → +12 to +15
- Slightly below → +6 to +11
- Much lower → +0 to +5

4. Project / Impact Quality (0–10)
- Strong measurable impact → +8 to +10
- Moderate → +4 to +7
- Weak → +0 to +3

5. Semantic Score (0–15)
- Normalize given semanticScore into 0–15 scale

--------------------------------
FINAL SCORE:

matchScore = skillScore + roleScore + experienceScore + projectScore + semanticScoreNormalized

--------------------------------
IMPORTANT RULES:

- You MUST assign values for each category
- You MUST compute final score using sum
- DO NOT guess or randomly assign scores
- Similar candidates MUST have similar scores (difference ≤ 2)
- Use semanticScore only as supporting signal, not dominant

--------------------------------
STRENGTHS RULES (3–4 bullet points):

- Each strength MUST be specific and evidence-backed from the resume
- Cite actual tools, frameworks, project names, or measurable outcomes (e.g., "Built RAG pipeline using LangChain and Pinecone", "3+ years of LLM fine-tuning experience")
- Do NOT write generic phrases like "Strong technical skills", "Relevant experience", or "Good project impact"
- Each point must directly relate to what the recruiter query is looking for
- Format: one crisp, recruiter-ready sentence per bullet

WEAKNESSES RULES (2–3 bullet points):

- Only flag REAL, meaningful gaps — skills or experience the query clearly requires but the resume genuinely lacks
- Do NOT flag the mere absence of a buzzword (e.g., do NOT say "No mention of OpenAI" if the candidate works with similar LLM tools)
- Do NOT invent gaps — if there is no significant gap, say so with fewer points
- Each weakness must explain WHY it matters for this role, not just what is missing
- Format: one crisp, actionable sentence per bullet (e.g., "No hands-on RAG or retrieval-augmented system experience, which is central to this role")

--------------------------------
OUTPUT FORMAT (STRICT JSON ONLY):

{
  "rankings": [
    {
      "resumeId": "",
      "matchScore": number,
      "scoreBreakdown": { "skill": number, "role": number, "experience": number, "project": number, "semantic": number },
      "reason": "3-4 concise sentences explaining ranking",
      "strengths": ["specific evidence-backed strength related to the query"],
      "weaknesses": ["meaningful skill gap with context on why it matters"],
      "skills": ["top matching skills"],
      "locationMatched": true
    }
  ]
}

--------------------------------
RULES:

- No extra text
- No markdown
- Always include ALL candidates
- Rankings MUST be sorted by matchScore DESC
  `;
}

function buildAnalysisPrompt(query: string, candidateData: object): string {
  return `
You are an expert technical recruiter analyzing a candidate's fit for a specific hiring query.

--------------------------------
RECRUITER QUERY:
"${query}"

--------------------------------
CANDIDATE:
${JSON.stringify(candidateData, null, 2)}

--------------------------------
TASK:

You MUST compute the matchScore using STRICT scoring rules below.

--------------------------------
SCORING SYSTEM (TOTAL = 100):

1. Skill Match (0–40)
- Exact required skills present → +30 to +40
- Partial match → +15 to +29
- Weak match → +0 to +14

2. Role Relevance (0–20)
- Exact role match → +15 to +20
- Related role → +8 to +14
- Irrelevant → +0 to +7

3. Experience Match (0–15)
- Meets or exceeds required → +12 to +15
- Slightly below → +6 to +11
- Much lower → +0 to +5

4. Project / Impact Quality (0–10)
- Strong measurable impact → +8 to +10
- Moderate → +4 to +7
- Weak → +0 to +3

5. Semantic Score (0–15)
- Assign +0 to +15 based on the overall semantic relevance of the profile to the query.

--------------------------------
FINAL SCORE:

matchScore = skillScore + roleScore + experienceScore + projectScore + semanticScore

--------------------------------
IMPORTANT RULES:

- You MUST assign values for each category
- You MUST compute final score using sum
- DO NOT guess or randomly assign scores

--------------------------------
STRENGTHS RULES (3–4 bullet points):

- Each strength MUST be specific and evidence-backed from the resume
- Cite actual tools, frameworks, project names, or measurable outcomes (e.g., "Built RAG pipeline using LangChain and Pinecone", "3+ years of LLM fine-tuning experience")
- Do NOT write generic phrases like "Strong technical skills", "Relevant experience", or "Good project impact"
- Each point must directly relate to what the recruiter query is looking for
- Format: one crisp, recruiter-ready sentence per bullet

WEAKNESSES RULES (2–3 bullet points):

- Only flag REAL, meaningful gaps — skills or experience the query clearly requires but the resume genuinely lacks
- Do NOT flag the mere absence of a buzzword (e.g., do NOT say "No mention of OpenAI" if the candidate works with similar LLM tools)
- Do NOT invent gaps — if there is no significant gap, say so with fewer points
- Each weakness must explain WHY it matters for this role, not just what is missing
- Format: one crisp, actionable sentence per bullet (e.g., "No hands-on RAG or retrieval-augmented system experience, which is central to this role")

--------------------------------
OUTPUT FORMAT (STRICT JSON ONLY):

{
  "matchScore": number,
  "scoreBreakdown": { "skill": number, "role": number, "experience": number, "project": number, "semantic": number },
  "reason": "3-4 concise sentences explaining ranking",
  "strengths": ["specific evidence-backed strength related to the query"],
  "weaknesses": ["meaningful skill gap with context on why it matters"],
  "skills": ["top matching skills"],
  "locationMatched": true
}

--------------------------------
RULES:

- No extra text
- No markdown
  `;
}

function buildQueryRewritePrompt(query: string): string {
  return `
You are an expert technical recruiter optimizing queries for semantic candidate search.

--------------------------------
RECRUITER QUERY:
"${query}"

--------------------------------
TASK:

1. DO NOT remove or replace the original query.
2. Expand the query into a richer, meaningful sentence by adding ONLY technologies, frameworks, and libraries that are directly and specifically related to the query domain.
3. Generate additional relevant technology variations to improve matching max 5-6.

--------------------------------
INSTRUCTIONS:

- Expand ONLY with:
  - Technologies and tools directly related to the query (e.g., Gen AI → LLMs, LangChain, RAG, Hugging Face, OpenAI, Anthropic, vector databases, prompt engineering)
  - Equivalent names/aliases (React = ReactJS = React.js, Generative AI = Gen AI = LLM)
  - Domain-specific frameworks and libraries (e.g., for backend → Node.js, Express, FastAPI; for data → Pandas, Spark)
  - Role title variations strictly within the same domain

- DO NOT add:
  - Generic responsibilities or job duties (e.g., "UI development", "performance optimization", "collaboration", "communication")
  - Technologies from unrelated domains (e.g., do NOT add React/CSS to a Gen AI query; do NOT add ML/AI to a frontend query)
  - Anything that is not a specific technology, tool, framework, or exact role title

- Keep:
  - Original intent EXACTLY same
  - Concise — no fluff, no descriptions, no job duties
  - Only technology keywords and role synonyms

--------------------------------
EXAMPLES:

Query: "gen ai developer"
Good: "Generative AI developer or LLM engineer with experience in LangChain, RAG, OpenAI, Hugging Face, vector databases, and prompt engineering"
Bad: "Gen AI developer responsible for UI development and performance optimization"

Query: "frontend developer react"
Good: "Frontend developer with React, ReactJS, TypeScript, JavaScript, Next.js, and UI component development"
Bad: "Frontend developer responsible for UI development and DevOps"

Query: "backend nodejs"
Good: "Backend developer Node.js, Express, REST API, TypeScript, PostgreSQL, MongoDB"
Bad: "Backend developer with cloud infrastructure and team collaboration"

--------------------------------
OUTPUT FORMAT (STRICT JSON):

{
  "originalQuery": "${query}",
  "rewrittenQuery": "...",
}

--------------------------------
RULES:

- rewrittenQuery must be 1–2 sentences max, densely packed with relevant tech keywords
- ZERO generic responsibilities or job duties
- NEVER add technologies from a different domain than the query
- No explanation, only JSON
  `;
}

// ─── LLM Functions ────────────────────────────────────────────────────────────

/** Calls the LLM to rank a batch of candidates against a query. */
async function llmRankCandidates(
  candidates: CandidateToRank[],
  query: string,
): Promise<z.infer<typeof rankingSchema>> {
  const response = await openaiClient.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are a specialized ranking engine for recruitment. Output strictly valid JSON.",
      },
      { role: "user", content: buildRankingPrompt(query, candidates) },
    ],
    response_format: { type: "json_object" },
    temperature: 0,
  });

  const raw = response.choices[0]?.message?.content || '{"rankings":[]}';
  return rankingSchema.parse(JSON.parse(raw));
}

/** Calls the LLM to deeply analyze a single candidate's fit for a query. */
async function llmAnalyzeCandidate(
  candidateData: object,
  query: string,
): Promise<z.infer<typeof analysisSchema>> {
  const response = await openaiClient.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are a specialized ranking engine for recruitment. Output strictly valid JSON.",
      },
      { role: "user", content: buildAnalysisPrompt(query, candidateData) },
    ],
    response_format: { type: "json_object" },
    temperature: 0.3,
  });

  const raw = response.choices[0]?.message?.content || "{}";
  return analysisSchema.parse(JSON.parse(raw));
}

/** Calls the LLM to expand and enrich a recruiter search query. */
async function llmRewriteQuery(query: string): Promise<string> {
  const response = await openaiClient.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are a specialized query writer and query understander. Your goal is to understand the query and rewrite it if required incase of ambiguity or lack of clarity. If it is understandable dont rewrite it. Output strictly valid JSON.",
      },
      { role: "user", content: buildQueryRewritePrompt(query) },
    ],
    response_format: { type: "json_object" },
    temperature: 0.8,
  });

  const raw = response.choices[0]?.message?.content || "";
  const parsed = JSON.parse(raw);
  return parsed.rewrittenQuery || query;
}

// ─── Data Functions ───────────────────────────────────────────────────────────

/** Fetches semantically similar resume IDs + scores from Qdrant. */
async function fetchSemanticMatches(queryVector: number[]) {
  return qdrantClient.search("resumes", {
    vector: queryVector,
    filter: {
      must: [{ key: "isPrimary", match: { value: true } }],
    },
    limit: 50,
    with_payload: true,
    score_threshold: 0.5,
  });
}

/** Fetches full resume + user rows from Postgres for the given IDs. */
async function fetchResumesByIds(resumeIds: string[]) {
  return prisma.resume.findMany({
    where: { id: { in: resumeIds } },
    include: { user: { select: { name: true } } },
  });
}

/** Shapes a resume DB row into the CandidateToRank payload sent to the LLM. */
function buildCandidatePayload(resume: any, scoreMap: Map<string, number>): CandidateToRank {
  const json = resume.json as any;
  return {
    resumeId: resume.id,
    name: resume.user?.name || "Unknown",
    summary: json?.summary || "",
    skills: json?.skills || [],
    experience:
      json?.experience?.map((e: any) => `${e.title} at ${e.company}`).join(", ") || "",
    yearsOfExperience: json?.totalExperienceYears || 0,
    projects: json?.projects || [],
    location: json?.location || "",
    semanticScore: scoreMap.get(resume.id) || 0,
  };
}

/** Shapes a resume DB row + LLM ranking into the final AI-ranked result object. */
function buildRankedResult(resume: any, ranking: any) {
  const json = resume.json as any;
  return {
    id: resume.id,
    userId: resume.userId,
    name: resume.user?.name || "Unknown",
    matchScore: ranking?.matchScore || 0,
    reason: ranking?.reason || "Semantic retrieval match.",
    summary: json?.summary || "",
    skills: ranking?.skills || [],
    location: json?.location || "Remote",
    experience: json?.experience || [],
    strengths: ranking?.strengths || [],
    weaknesses: ranking?.weaknesses || [],
    locationMatched: ranking?.locationMatched || false,
  };
}

/** Shapes a resume DB row into a lightweight semantic (unranked) result object. */
function buildSemanticResult(resume: any) {
  const json = resume.json as any;
  return {
    id: resume.id,
    userId: resume.userId,
    name: resume.user?.name || "Unknown",
    matchScore: 0,
    reason: "Semantic match. Click to analyze.",
    summary: json?.summary || "",
    skills: json?.skills || [],
    location: json?.location || "Remote",
    experience: json?.experience || [],
  };
}

/** Shapes a resume DB row into the candidateData payload sent to the analysis LLM. */
function buildAnalysisCandidateData(resume: any) {
  const json = resume.json as any;
  return {
    name: resume.user?.name || "Unknown",
    summary: json?.summary || "",
    skills: json?.skills || [],
    experience:
      json?.experience?.map((e: any) => `${e.title} at ${e.company}`).join(", ") || "",
    location: json?.location || "",
    yearsOfExperience: json?.totalExperienceYears || 0,
    projects: json?.projects || [],
  };
}

// ─── Exported Orchestrators ───────────────────────────────────────────────────

/**
 * Searches and ranks candidates based on a natural language query.
 * - Top 5 are AI-ranked via LLM
 * - Remaining are returned as semantic results (unranked until analyzed)
 */
export async function searchCandidates(query: string) {
  try {
    console.log(`🔍 Starting Smart Search for: "${query}"`);

    const queryVector = await embedText(query);
    const qdrantMatches = await fetchSemanticMatches(queryVector);

    if (!qdrantMatches || qdrantMatches.length === 0) {
      console.log("⚠️ No semantic matches found in Qdrant.");
      return { results: [], total: 0 };
    }

    const resumeIds = qdrantMatches.map((m) => m.id as string);
    const scoreMap = new Map<string, number>(
      qdrantMatches.map((m) => [m.id as string, m.score]),
    );

    const resumes = await fetchResumesByIds(resumeIds);

    const top5Resumes = resumes.slice(0, 5);
    const remainingResumes = resumes.slice(5);

    const candidatesToRank = top5Resumes.map((r: any) => buildCandidatePayload(r, scoreMap));
    const parsedRanking = await llmRankCandidates(candidatesToRank, query);

    const rankingMap = new Map<string, any>(
      parsedRanking.rankings.map((r) => [r.resumeId, r]),
    );

    const rankedResults = top5Resumes
      .map((r: any) => buildRankedResult(r, rankingMap.get(r.id)))
      .sort((a: any, b: any) => b.matchScore - a.matchScore);

    const semanticResults = remainingResumes.map((r: any) => buildSemanticResult(r));

    const finalResults = [...rankedResults, ...semanticResults];

    console.log(
      `✅ Search complete. ${rankedResults.length} AI-ranked, ${semanticResults.length} semantic results.\n`,
    );

    return { results: finalResults, total: finalResults.length };
  } catch (error) {
    console.error("❌ Error in searchCandidates:", error);
    throw error;
  }
}

/**
 * Rewrites a raw recruiter search query into a richer,
 * technology-dense sentence for better semantic recall.
 */
export async function rewriteQuery(query: string): Promise<string> {
  try {
    console.log(`🔎 Rewriting query: "${query}"`);
    return await llmRewriteQuery(query);
  } catch (error) {
    console.error("❌ Error in rewriteQuery:", error);
    throw error;
  }
}

/**
 * Performs a deep AI analysis for a single candidate on-demand.
 */
export async function analyzeCandidate(resumeId: string, query: string) {
  try {
    console.log(`🧠 Analyzing Resume: ${resumeId} | Query: "${query}"`);

    const resume = await prisma.resume.findFirst({
      where: { id: resumeId },
      include: { user: { select: { name: true } } },
    });

    if (!resume) throw new Error(`Resume not found: ${resumeId}`);

    const candidateData = buildAnalysisCandidateData(resume);
    return await llmAnalyzeCandidate(candidateData, query);
  } catch (error) {
    console.error("❌ Error in analyzeCandidate:", error);
    throw error;
  }
}
