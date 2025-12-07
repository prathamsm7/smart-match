import { embed } from 'ai';
import { Agent, tool, run } from "@openai/agents";
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { normalizeExperienceScore } from './helpers';
import redisClient from './redisClient';
import { prisma } from './prisma';
import { openaiClient, qdrantClient } from './clients';


/**
 * Helper function to embed text using OpenAI's embedding model
 * Used specifically for resume embeddings
 */
async function embedText(text: string) {
    try {
        const response = await openaiClient.embeddings.create({
            model: "text-embedding-3-large",
            input: text,
        });
        return response.data[0].embedding;
    } catch (error) {
        console.error("❌ Error embedding text:", error);
        throw error;
    }
}


/**
 * Generate AI-enhanced embedding text for jobs
 * Emphasizes required skills, domain requirements, and specific technologies
 * to improve matching accuracy and avoid cross-domain false matches
 */
async function generateEnhancedJobEmbeddingText(jobData: JobData): Promise<string> {
    try {
        // Use LLM to extract and emphasize domain-specific requirements
        const prompt = `You are an expert at creating domain-aware text embeddings for job matching.
                        Given a job posting, create an enhanced text representation that emphasizes:
                        1. Required domain-specific technical skills and technologies (e.g., React, Python, TensorFlow)
                        2. Job domain/specialization (e.g., Frontend Development, Machine Learning Engineering, DevOps)
                        3. Required vs nice-to-have skills
                        4. Specific technologies, frameworks, and tools mentioned
                        5. Experience level requirements

                        Job Information:
                        - Title: ${jobData.title || 'N/A'}
                        - Description: ${jobData.description || 'N/A'}
                        - Requirements: ${jobData.requirements || 'N/A'}
                        - Responsibilities: ${jobData.responsibilities || 'N/A'}

                        Create a concise, domain-focused text (max 500 words) that:
                        - Emphasizes specific required technologies, frameworks, and tools (not generic terms)
                        - Clearly identifies the job domain/specialization (e.g., "Frontend Developer role requiring React and TypeScript" vs generic "Software Engineer")
                        - Distinguishes between required skills and nice-to-have skills
                        - Highlights domain-specific requirements that differentiate this job from others in different domains
                        - Avoids generic terms that match across all domains (like "build", "test", "software engineer" without context)
                        - If the job is for a specific domain (e.g., AI Engineer, Frontend Developer), make that domain very clear

                        Output ONLY the enhanced text, no explanations or markdown.`;

        const response = await openaiClient.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: 'You are an expert at creating domain-aware text for semantic search. Create concise, technical, domain-specific text that emphasizes unique requirements and technologies.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.3,
            max_tokens: 600,
        });

        const enhancedText = response.choices[0]?.message?.content?.trim() || '';
        
        return enhancedText;
    } catch (error) {
        console.error('❌ Error generating enhanced job embedding text:', error);
        // Fallback to original text
        return [
            jobData.title,
            jobData.description,
            jobData.requirements,
            jobData.responsibilities
        ].filter(Boolean).join(' ');
    }
}


// Helper functions for job matching
async function explainMatchAndSkillGap(resume: any, job: any) {
    const prompt = `You are an AI Career Coach helping a job seeker understand how well they match a job.
                    You are speaking DIRECTLY TO THE CANDIDATE (use "you" and "your", NOT "the candidate").
                    Extract ONLY factual insights — no assumptions.

                    Return response in EXACT JSON format without any markdown or commentary:
                    {
                        "matchReason": "",
                        "overallMatchScore": 0-100,
                        "matchedSkills": [],
                        "missingSkills": [],
                        "strongExperienceAlignment": [],
                        "improvementSuggestions": []
                    }

                    Strict formatting rules:
                    - JSON only (no markdown, no commentary)
                    - "overallMatchScore" must be an integer from 0 to 100
                    - "matchedSkills": Array of skills that appear in BOTH the job description/requirements AND your resume
                    - "missingSkills": Array of skills that are EXPLICITLY mentioned in the job description or job requirements but are NOT in your resume. MUST be empty [] if no such skills exist. DO NOT include any skills not mentioned in the job description or requirements.
                    - "improvementSuggestions": Actionable suggestions for you to improve your match. Should be encouraging and specific (e.g., "Consider learning TypeScript to strengthen your frontend skills").
                    - Focus on technical match, role fit, and relevant experience

                    Your Resume:
                    Skills: ${resume.skills?.join(", ") || ""}
                    Experience: ${resume.experience?.map((e: any) => e.description).join(", ") || ""}
                    Summary: ${resume.summary || ""}

                    Job Description: ${job.jobDescription || ""}
                    Job Requirements: ${job?.jobRequirements || ""}

                    Task:
                    - Compare job required skills vs your skills
                    - Compare your profile summary with the job description and requirements
                    - Highlight your strongest alignments (tech + domain + role level)
                    - Identify missing skills: ONLY include skills EXPLICITLY mentioned in job description/requirements that are NOT in your resume
                    - CRITICAL RULES for missingSkills:
                      * ONLY include skills that appear in the job description or job requirements
                      * ONLY include skills that are NOT in your resume skills
                      * DO NOT add any skills not mentioned in the job description or requirements
                      * If no skills from job description/requirements are missing from your resume, return an empty array []
                      * Be strict: if a skill is not explicitly mentioned in the job, it should NOT be in missingSkills
                    - Write encouraging, actionable suggestions to help you improve your match
                    - matchReason: Write in SECOND PERSON ("You have strong experience in...", "Your skills in X align well with..."). Be encouraging and highlight positives first. Keep it brief (2-3 sentences max).
    `;

    try {
        const res = await openaiClient.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.2,
            response_format: { type: "json_object" },
        });

        const raw = res.choices?.[0]?.message?.content || "";
        return JSON.parse(raw);
    } catch (error) {
        console.error("❌ Error in explainMatchAndSkillGap:", error);
        return {
            matchReason: "Error analyzing match",
            overallMatchScore: 0,
            matchedSkills: [],
            missingSkills: [],
            strongExperienceAlignment: [],
            improvementSuggestions: []
        };
    }
}

async function calculateSkillAndExperienceMatch(resume: any, job: any) {
    const resumeSkills = resume.skills || [];
    const experiences = resume.experience || [];

    // Format experiences for the prompt
    const experienceText = experiences.map((exp: any, idx: number) => {
        return `Experience ${idx + 1}:
                - Title: ${exp.title || "N/A"}
                - Company: ${exp.company || "N/A"}
                - Duration: ${exp.startDate || "N/A"} to ${exp.endDate || "N/A"}
                - Description: ${exp.description || "N/A"}`
    }).join("\n\n");

    const prompt = `
        You are an expert recruiter analyzing how well a candidate matches a job posting.
        
        Analyze the candidate's resume against the job requirements and calculate:
        1. Skill Match: Compare candidate skills with job required skills
        2. Experience Relevance: Evaluate how relevant the candidate's work experience is to the job
        
        Candidate Resume:
        Skills: ${resumeSkills.join(", ")}
        Summary: ${resume.summary || "N/A"}
        
        Candidate Experience:
        ${experienceText || "No experience listed"}
        
        Job Posting:
        Title: ${job.jobTitle || ""}
        Description: ${job.jobDescription || ""}
        Responsibilities: ${job.jobResponsibilities || ""}
        Requirements: ${job.jobRequirements || ""}
        
        TASKS:
        1. Extract ALL technical skills, tools, frameworks, and technologies mentioned in the job posting
        2. Identify which candidate skills match the job requirements (consider variations like "React" = "React.js" = "ReactJS")
        3. Calculate skillRatio: percentage of job required skills that the candidate has (0.0 to 1.0)
        4. Evaluate experience relevance: how well the candidate's work experience aligns with the job (0.0 to 1.0)
           - Consider role similarity, responsibilities, industry match, technical skills used
        
        Return ONLY a JSON object with this exact format:
        {
            "jobSkills": ["javascript", "react", "html", "css", "typescript"],
            "matchedSkills": ["javascript", "react", "html"],
            "skillRatio": 0.6,
            "experienceRatio": 0.75,
            "reasoning": "Brief explanation of the match"
        }
        
        Where:
        - "jobSkills": Array of all technical skills/tools/frameworks extracted from job posting (lowercase, normalized)
        - "matchedSkills": Array of candidate skills that match job requirements (from candidate's skills list)
        - "skillRatio": Number between 0.0 and 1.0 representing matchedSkills.length / jobSkills.length
        - "experienceRatio": Number between 0.0 and 1.0 representing how relevant the experience is (0.0 = not relevant, 1.0 = perfectly relevant)
        - "reasoning": Brief explanation of the calculations
        
        IMPORTANT:
        - skillRatio = matchedSkills.length / jobSkills.length (capped at 1.0)
        - experienceRatio should consider all experience entries and their relevance
        - Return numbers, not strings
        - Be precise with skill matching (handle variations like "React" = "react.js" = "ReactJS")
        
        Return ONLY the JSON. No markdown. No explanation outside JSON.
    `;

    try {
        const res = await openaiClient.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: "You are an expert recruiter. Analyze candidate-job match and return JSON only." },
                { role: "user", content: prompt }
            ],
            temperature: 0.2,
            response_format: { type: "json_object" }
        });

        const raw = res.choices?.[0]?.message?.content?.trim() || '';

        // Clean markdown code fences if present (```json ... ```)
        let cleaned = raw;
        if (cleaned.startsWith('```')) {
            // Remove opening ```json or ```
            cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, '');
            // Remove closing ```
            cleaned = cleaned.replace(/\n?```\s*$/i, '');
        }
        cleaned = cleaned.trim();

        const result = JSON.parse(cleaned);

        return {
            matchedSkills: result.matchedSkills || [],
            jobSkills: result.jobSkills || [],
            skillRatio: Number(Math.min(result.skillRatio || 0, 1.0).toFixed(2)),
            experienceRatio: Number(Math.min(result.experienceRatio || 0, 1.0).toFixed(2))
        };
    } catch (e: any) {
        console.error("❌ Failed to calculate skill and experience match:", e.message);
        // Fallback: return zeros if LLM call fails
        return {
            matchedSkills: [],
            jobSkills: [],
            skillRatio: 0,
            experienceRatio: 0
        };
    }
}

const searchJobs = tool({
    name: 'searchJobs',
    description: `Search for jobs in the vector database. Takes the resume ID and returns the jobs that match the resume.`,
    parameters: z.object({
        resumeId: z.string(),
    }),
    execute: async ({ resumeId }: { resumeId: string }) => {
        try {
            console.log("🔍 Searching jobs for resume ID:", resumeId);

            // Validate resumeId
            if (!resumeId || typeof resumeId !== 'string') {
                throw new Error("Invalid resumeId provided");
            }

            const cacheKey = `resumeData:${resumeId}`;
            const cachedResumeData = await redisClient.get(cacheKey);

            let resumeVec, resumeInfo;
            if (cachedResumeData) {
                console.log("🚀 ~ cachedResumeData:")
                // Upstash may return string or object, handle both
                const parsed = typeof cachedResumeData === 'string'
                    ? JSON.parse(cachedResumeData)
                    : cachedResumeData;
                resumeVec = parsed.vector;
                resumeInfo = parsed.resumeData;
            } else {
                console.log("🚀 ~ no cachedResumeData:")


                const resumeResult = await qdrantClient.retrieve("resumes", {
                    ids: [resumeId],
                    with_payload: true,
                    with_vector: true,
                });

                if (!resumeResult || !resumeResult.length) {
                    throw new Error(`Resume not found with ID: ${resumeId}`);
                }
                resumeVec = resumeResult[0].vector;
                resumeInfo = resumeResult[0].payload;

                await redisClient.set(cacheKey, JSON.stringify({ resumeData: resumeInfo, vector: resumeVec }), { ex: 60 * 60 });

            }

            if (!resumeVec || !resumeInfo) {
                throw new Error("Resume data is incomplete - missing vector or payload");
            }

            // ✅ Calculate total experience and normalize to 0-1
            const totalYears = parseFloat(resumeInfo.totalExperienceYears) || 0;
            const experienceScore = normalizeExperienceScore(totalYears);
            console.log(`🧾 Total experience: ${totalYears} years (normalized: ${experienceScore})`);

            // ✅ Vector similarity from Qdrant - get jobIds and scores only
            const matches = await qdrantClient.search("jobs", {
                vector: resumeVec,
                limit: 5,
                with_payload: true, // Contains only jobId
                with_vector: false,
            });

            if (!matches || matches.length === 0) {
                console.log("⚠️  No job matches found");
                return [];
            }

            console.log(`✅ Found ${matches.length} job matches from Qdrant`);

            // Extract jobIds from matches
            const jobIds = matches.map((match: any) => match.payload.id).filter(Boolean);

            if (jobIds.length === 0) {
                console.log("⚠️  No valid job IDs found in matches");
                return [];
            }

            // Fetch full job data from PostgreSQL
            const jobs = await prisma.job.findMany({
                where: {
                    id: { in: jobIds },
                },
            });

            console.log(`✅ Fetched ${jobs.length} jobs from PostgreSQL`);

            // Create a map for quick lookup with proper typing
            type JobType = typeof jobs[number];
            const jobMap = new Map<string, JobType>(jobs.map((job: JobType) => [job.id, job]));

            // Create a map of vector scores by jobId
            const scoreMap = new Map<string, number>(matches.map((match: any) => [match.payload.id, match.score]));

            // Process matches with full data from PostgreSQL - NO LLM calls for speed
            // Detailed analysis (skills, match explanation) is lazy-loaded via /api/resume/[id]/matches/[jobId]
            const results = matches.map((match: any) => {
                const jobId = match.payload.id as string;
                const job = jobMap.get(jobId);

                if (!job) {
                    console.warn(`⚠️  Job ${jobId} not found in PostgreSQL, skipping`);
                    return null;
                }

                const vectorScore = scoreMap.get(jobId) || 0;

                return {
                    id: job.id,
                    jobId: job.id,
                    jobTitle: job.title,
                    employerName: job.employerName,
                    jobLocation: job.location,
                    jobDescription: job.description,
                    jobApplyLink: job.applyLink,
                    jobEmploymentType: job.employmentType,
                    jobSalary: job.salary,
                    jobRequirements: job.requirements,
                    jobResponsibilities: job.responsibilities,
                    // Vector score only - detailed analysis loaded on demand
                    vectorScore: Math.round(vectorScore * 100),
                };
            }).filter(Boolean);

            // Sort by vectorScore in descending order
            results.sort((a: any, b: any) => b.vectorScore - a.vectorScore);

            return results;
        } catch (error: any) {
            console.error("❌ Error in searchJobs tool:", error);
            throw new Error(`Job search failed: ${error.message}`);
        }
    }
})

// ✅ Job Search Agent - searches for jobs matching a resume ID
const jobSearchAgent = new Agent({
    name: "JobSearchAgent",
    model: "gpt-5-nano",
    instructions: `You are a job search agent that finds matching jobs for a resume.
            
            Input: resumeId (string)
            
            Task: Call searchJobs with the provided resumeId to return top job matches.
            
            Rules:
            - Do not ask the user to call tools; you decide and call them yourself.
            - Return the results from searchJobs directly.
            - Do NOT generate a text summary. Output the JSON tool result immediately as your final answer.
    `,
    tools: [searchJobs],
});

async function runMasterAgent({ source, resumeId, filePath, resumeText, skipJobSearch = false }: {
    source: 'id' | 'file';
    resumeId?: string;
    filePath?: string;
    resumeText?: string;
    skipJobSearch?: boolean;
}) {
    // This function is deprecated - resume upload is now handled by resumeHelper.ts
    // Only job search functionality remains here
    if (source === 'id' && resumeId) {
        const result = await run(jobSearchAgent, `Task: Find matching jobs for resumeId: ${resumeId}`);
        return result;
    }
    
    throw new Error('Resume upload functionality has been moved to resumeHelper.ts. Use runResumeAgent from resumeHelper.ts instead.');
}

/**
 * Store job in both PostgreSQL and Qdrant
 * - Full data in PostgreSQL
 * - Only vector embedding in Qdrant (with jobId reference)
 */
export interface JobData {
    id?: string; // Optional - will generate if not provided
    title: string;
    employerName?: string;
    description?: string;
    requirements?: string;
    location?: string;
    salary?: string;
    employmentType?: string;
    applyLink?: string;
    responsibilities?: string;
    postedBy?: string; // User ID of the recruiter who posted this job
}

export async function storeJob(jobData: JobData): Promise<string> {
    try {

        // 2. Generate AI-enhanced embedding text for better domain-aware matching
        const vectorText = await generateEnhancedJobEmbeddingText(jobData);
        console.log("✅ Generated enhanced job embedding text");

        // 3. Generate embedding
        const vector = await embedText(vectorText);

        // 4. Store in PostgreSQL (upsert - create or update)
        const job = await prisma.job.create({
            data: {
                title: jobData.title,
                employerName: jobData.employerName || null,
                description: jobData.description || null,
                requirements: jobData.requirements || null,
                location: jobData.location || null,
                salary: jobData.salary || null,
                employmentType: jobData.employmentType || null,
                applyLink: jobData.applyLink || null,
                responsibilities: jobData.responsibilities || null,
                postedBy: jobData.postedBy || null,
            },
        });
        
        // 5. Store ONLY vector + jobId in Qdrant (no full payload)
        await qdrantClient.upsert('jobs', {
            points: [
                {
                    id: job.id, // Same ID as PostgreSQL
                    vector: vector,
                    payload: {
                        id: job.id, // Only store jobId in payload for reference
                    },
                },
            ],
        });

        console.log(`✅ Stored job ${job.id} in PostgreSQL and Qdrant`);
        return job.id;
    } catch (error: any) {
        console.error('❌ Error storing job:', error);
        throw new Error(`Failed to store job: ${error.message}`);
    }
}

// Export helper functions for use in API routes
export { 
    runMasterAgent, 
    calculateSkillAndExperienceMatch, 
    explainMatchAndSkillGap, 
    embedText,
    generateEnhancedJobEmbeddingText
};

