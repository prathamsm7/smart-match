import { embed } from 'ai';
import { Agent, tool, run } from "@openai/agents";
import { google } from '@ai-sdk/google';
import { PDFParse } from "pdf-parse";
import { z } from 'zod';
import crypto from "crypto";
import { QdrantClient } from "@qdrant/js-client-rest";
import resumeSchema from './schema.js';
import { normalizeExperienceScore } from './helpers.js';
import OpenAI from 'openai';
import redisClient from './redisClient.js';

// Gemini client for LLM calls
const geminiClient = new OpenAI({
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
});

const qdrantClient = new QdrantClient({
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY
});

// Helper function to embed text using Google's embedding model
async function embedText(text: string) {
    try {
        const { embedding } = await embed({
            model: google.textEmbeddingModel('gemini-embedding-001'),
            value: text,
        });
        return embedding;
    } catch (error) {
        console.error("❌ Error embedding text:", error);
        throw error;
    }
}

const extractResumeData = tool({
    name: 'extractResumeData',
    description: `Extract structured resume information including name, email, skills, experience, and calculate total years of experience. Returns the resume data in JSON format.
            
                    CRITICAL: For totalExperienceYears calculation:
                    - Calculate EACH experience duration separately in months
                    - If endDate is "Present", "Current", or "Now", use November 2025
                    - Formula: months = (end_year - start_year) * 12 + (end_month - start_month + 1)
                    - Convert to years: years = months / 12
                    - SUM all experience durations
                    - Round final total to 1 decimal place
                    - Return as NUMBER type

                    Example calculation:
                    - August 2022 to November 2025 = 40 months = 3.33 years
                    - September 2019 to July 2021 = 23 months = 1.92 years  
                    - September 2018 to July 2019 = 11 months = 0.92 years
                    Total: 3.33 + 1.92 + 0.92 = 6.17 → 6.2 years

                    For social media profiles, return the url of the profile mentioned in the resume. If no social media profile is mentioned, return an empty array. Sometimes links are clickable, so return the url as it is. dont add any other text to the url.

                    CRITICAL: For categorizedSkills, you must categorize ALL skills from the skills array into appropriate categories:
                    - languages: Programming languages (Java, JavaScript, Python, TypeScript, HTML, CSS, C++, C#, Go, Rust, PHP, Ruby, Swift, Kotlin, etc.)
                    - frameworks: Frameworks and libraries (React, Next.js, Vue, Angular, Spring, Spring Boot, Express.js, Django, Flask, Laravel, Tailwind CSS, Bootstrap, Shadcn/UI, etc.)
                    - ai: AI and Machine Learning technologies (Generative AI, LLMs, LangChain, Prompt Engineering, OpenAI APIs, ChatGPT, DALL-E, Hugging Face Transformers, RAG, Machine Learning, etc.)
                    - databases: Databases and systems (MongoDB, MySQL, PostgreSQL, Redis, SQLite, Oracle, Vector Databases, Elasticsearch, DBMS, etc.)
                    - tools: Tools and technologies (Git, GitHub, VS Code, Postman, Vercel, AWS, Azure, GCP, Docker, Kubernetes, Jenkins, CI/CD, Hibernate, Node.js, etc.)
                    - other: Other technical skills that don't fit above categories (RESTful APIs, OOP, System Design, Cloud Computing, Software Engineering, CN, DSA, OS, etc.)
                    
                    Every skill from the skills array MUST be placed in at least one category. Be intelligent about categorization - if a skill could fit multiple categories, choose the most appropriate one. If unsure, place in "other".

                    CRITICAL: For softSkills, extract all soft skills, interpersonal abilities, and non-technical competencies mentioned in the resume. These include:
                    - Communication skills (e.g., English Communication, Technical Communication, Written Communication, Verbal Communication)
                    - Problem-solving abilities (e.g., Problem Solving, Critical Thinking, Analytical Thinking)
                    - Team and collaboration skills (e.g., Team Collaboration, Leadership, Teamwork, Cross-functional Collaboration)
                    - Work methodologies (e.g., Agile Methodologies, Scrum, Kanban)
                    - Personal attributes (e.g., Adaptability, Time Management, Organization, Attention to Detail)
                    - Other soft skills mentioned in the resume (e.g., Aptitude, Logical Reasoning, Technical Writing, Presentation Skills)
                    
                    Only include soft skills that are explicitly mentioned or clearly implied in the resume. Do not add generic soft skills that are not mentioned.

                `,
    parameters: resumeSchema,
    execute: async (resumeData: any) => {
        return resumeData;
    },
})

const uploadResume = tool({
    name: 'uploadResume',
    description: `Upload the extracted resume data to the vector database. Takes the structured resume object and stores it with embeddings.`,
    parameters: resumeSchema,
    execute: async (resumeData: any) => {
        try {
            console.log("\n📤 Uploading resume to database...");

            // Create vector text from resume content
            const vectorText = [
                resumeData.summary,
                resumeData.skills?.join(", "),
                resumeData.experience?.map((e: any) => `${e.title} at ${e.company}: ${e.description}`).join(" "),
            ].filter(Boolean).join(" ");

            // Generate embedding
            const vector = await embedText(vectorText);

            // Generate unique ID
            const resumeId = crypto.randomUUID();
            console.log(`🆔 Generated Resume ID: ${resumeId}`);

            // Upstash Redis uses 'ex' (lowercase) for expiration in seconds
            await redisClient.set(`resumeData:${resumeId}`, JSON.stringify({resumeData, vector}), { ex: 7 * 24 * 60 * 60 });

            // Upload to Qdrant
            const response = await qdrantClient.upsert("resumes", {
                points: [
                    {
                        id: resumeId,
                        vector: vector,
                        payload: resumeData,
                    },
                ],
            });


            return {
                success: true,
                resumeId: resumeId,
                message: `Resume for ${resumeData.name} uploaded successfully`
            };
        } catch (error: any) {
            console.error("❌ Error uploading resume:", error);
            return {
                success: false,
                error: error.message
            };
        }
    },
})

// Helper function to extract text from PDF buffer
export async function extractTextFromPDFBuffer(buffer: Buffer) {
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    await parser.destroy();
    return result.text;
}

// Helper functions for job matching
async function explainMatchAndSkillGap(resume: any, job: any) {
    const prompt = `You are an AI Career Assistant. Compare the candidate's resume with the job requirements.
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
                    - "matchedSkills": Array of skills that appear in BOTH the job description/requirements AND the candidate's resume
                    - "missingSkills": Array of skills that are EXPLICITLY mentioned in the job description or job requirements but are NOT in the candidate's resume. MUST be empty [] if no such skills exist. DO NOT include any skills not mentioned in the job description or requirements.
                    - "improvementSuggestions" means the skills that the candidate should learn to improve the match. It should be a list of overall skills (coding, problem solving, team work, communication, etc.) that the candidate should learn.
                    - Focus on technical match, role fit, and relevant experience

                    Candidate Resume:
                    Skills: ${resume.skills?.join(", ") || ""}
                    Experience: ${resume.experience?.map((e: any) => e.description).join(", ") || ""}
                    Summary: ${resume.summary || ""}

                    Job Description:${job.jobDescription || ""}
                    Job Requirements: ${job?.jobRequirements?.map((r: any) => typeof r === 'string' ? r : r.requirement).join(", ") || ""}

                    Task:
                    - Compare job required skills ★ vs resume skills
                    - Compare the candidate profile summary with the job description and job requirements
                    - Highlight strongest alignments (tech + domain + role level)
                    - Identify missing skills: ONLY include skills that are EXPLICITLY mentioned in the job description or job requirements but are NOT present in the candidate's resume skills list
                    - CRITICAL RULES for missingSkills:
                      * ONLY include skills that appear in the job description or job requirements
                      * ONLY include skills that are NOT in the candidate's resume skills
                      * DO NOT add any skills that are not mentioned in the job description or job requirements
                      * If no skills from the job description/requirements are missing from the resume, return an empty array []
                      * Be strict: if a skill is not explicitly mentioned in the job description or requirements, it should NOT be in missingSkills
                    - Write short and specific suggestions to improve match
                    - matchReason: must be a brief description of the match using the skills and experience
    `;

    try {
        const res = await geminiClient.chat.completions.create({
            model: "gemini-2.0-flash",
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
        Requirements: ${job.jobRequirements?.map((r: any) => typeof r === 'string' ? r : r.requirement).join(", ") || ""}
        
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
        const res = await geminiClient.chat.completions.create({
            model: "gemini-2.5-flash",
            messages: [
                { role: "system", content: "You are an expert recruiter. Analyze candidate-job match and return JSON only." },
                { role: "user", content: prompt }
            ],
            temperature: 0.2
        });

        const raw = res.choices?.[0]?.message?.content?.trim() || '';
        const result = JSON.parse(raw);

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

                await redisClient.set(cacheKey, JSON.stringify({resumeData: resumeInfo, vector: resumeVec}), { ex: 7 * 24 * 60 * 60 });

            }

            if (!resumeVec || !resumeInfo) {
                throw new Error("Resume data is incomplete - missing vector or payload");
            }

            // ✅ Calculate total experience and normalize to 0-1
            const totalYears = parseFloat(resumeInfo.totalExperienceYears) || 0;
            const experienceScore = normalizeExperienceScore(totalYears);
            console.log(`🧾 Total experience: ${totalYears} years (normalized: ${experienceScore})`);

            // ✅ Vector similarity from Qdrant
            const matches = await qdrantClient.search("jobs", {
                vector: resumeVec,
                limit: 5,
                with_payload: true,
                with_vector: false, // We don't need vectors in the response
            });

            if (!matches || matches.length === 0) {
                console.log("⚠️  No job matches found");
                return [];
            }

            console.log(`✅ Found ${matches.length} job matches`);

            const enhancedResults = await Promise.all(
                matches.map(async (match: any) => {
                    const { matchedSkills, skillRatio, experienceRatio } =
                        await calculateSkillAndExperienceMatch(resumeInfo, match.payload);

                    const reasoning = await explainMatchAndSkillGap(resumeInfo, match.payload);

                    const vectorScore = match.score;
                    const finalScore = Number((
                        vectorScore * 0.65 +
                        skillRatio * 0.25 +
                        experienceRatio * 0.05
                    ).toFixed(3));

                    return {
                        jobTitle: match.payload.jobTitle,
                        employerName: match.payload.employerName,
                        jobLocation: match.payload.jobLocation,
                        // Additional job details if available
                        jobDescription: match.payload.jobDescription,
                        jobApplyLink: match.payload.jobApplyLink,
                        jobEmploymentType: match.payload.jobEmploymentType,
                        jobSalary: match.payload.jobSalary,
                        jobRequirements: match.payload.jobRequirements,
                        jobResponsibilities: match.payload.jobResponsibilities,
                        // Match analysis
                        ...reasoning,
                        // Scores
                        finalScore,
                        vectorScore,
                        skillScore: skillRatio,
                        expRelevanceScore: experienceRatio,
                    };
                })
            );

            enhancedResults.sort((a: any, b: any) => b.overallMatchScore - a.overallMatchScore);

            return enhancedResults;
        } catch (error: any) {
            console.error("❌ Error in searchJobs tool:", error);
            throw new Error(`Job search failed: ${error.message}`);
        }
    }
})

// ✅ Single Master Agent (no manual handoffs) that decides which tools to call and when
const masterResumeAgent = new Agent({
    name: "MasterResumeAgent",
    model: "gpt-5-nano",
    instructions: `You are a master agent that manages resumes and job matching using tools.
            
            Inputs you may receive:
            - source: "id" or "file"
            - If source="id": resumeId is provided
            - If source="file": resumeText is provided (raw text of the resume)
            
            Primary objectives:
            1) If source="id" (or a resumeId is present), call searchJobs with the given resumeId to return top job matches.
            2) If source="file", FIRST parse the resumeText into a structured resume object by calling extractResumeData,
               THEN call uploadResume with the EXACT SAME structured object to store it and get a resumeId,
               THEN (ONLY if the task message does NOT say "skip job search" or "do not search for jobs") call searchJobs with that resumeId to return top job matches.
            
            Rules:
            - Do not ask the user to call tools; you decide and call them yourself.
            - When extracting, ensure totalExperienceYears follows the inclusive month-counting rule described in extractResumeData.
            - When uploading, pass the SAME structured object as returned from extractResumeData (no modifications).
            - If the task message says "skip job search" or "do not search for jobs", STOP after uploading the resume and return only the resumeId.
            
            FINAL RESPONSE FORMAT (CRITICAL):
            - If job search was skipped (task says "skip job search" or "do not search for jobs"), return:
              {
                "resumeId": "<the resumeId returned from uploadResume>"
              }
            - If job search was performed, return:
              {
                "resumeId": "<the resumeId returned from uploadResume>",
                "matches": [ /* array returned from searchJobs (can be empty) */ ]
              }
            - "resumeId" MUST come from the uploadResume tool call result.
            - "matches" MUST come from the searchJobs tool call result (only if job search was performed).
            - Do NOT return plain arrays or any other structure; always wrap in the JSON object above.
    `,
    tools: [extractResumeData, uploadResume, searchJobs],
});

 async function runMasterAgent({ source, resumeId, filePath, resumeText, skipJobSearch = false }: {
    source: 'id' | 'file';
    resumeId?: string;
    filePath?: string;
    resumeText?: string;
    skipJobSearch?: boolean;
}) {
    if (source !== 'id' && source !== 'file') {
        throw new Error(`Invalid source "${source}". Use "id" or "file".`);
    }

    let textBlock = '';
    if (source === 'file') {
        let text = resumeText;
        if (!text && filePath) {
            // This won't work in Next.js API routes, but kept for compatibility
            throw new Error('File path not supported in Next.js. Use resumeText instead.');
        }
        if (!text) {
            throw new Error('When source="file", provide either "resumeText" or "filePath".');
        }
        textBlock = `\nresumeText: """\n${text}\n"""`;
    }

    // Build task message based on whether job search should be skipped
    let taskMessage = '';
    if (skipJobSearch && source === 'file') {
        taskMessage = 'Task: Extract and upload the resume. DO NOT search for jobs. Skip job search. Just return the resumeId.';
    } else if (source === 'id') {
        taskMessage = 'Task: Return the top job matches for this user. Call searchJobs with the provided resumeId.';
    } else {
        taskMessage = 'Task: Return the top job matches for this user. Decide which tools to call and when.';
    }

    const message = `${taskMessage} source: ${source}
                    ${resumeId ? `resumeId: ${resumeId}\n` : ''}${textBlock}
                `;

    const result = await run(masterResumeAgent, message);
    return result;
}

// Export qdrantClient for use in API routes
export { qdrantClient,runMasterAgent };

