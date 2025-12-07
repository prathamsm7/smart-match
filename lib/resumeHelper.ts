import { Agent, tool, run } from "@openai/agents";
import { PDFParse, VerbosityLevel } from "pdf-parse";
import resumeSchema from "./schema";
import { openaiClient, qdrantClient } from "./clients";
import redisClient from "./redisClient";
import crypto from "crypto";
import { embedText } from "./agents";



/**
 * Generate AI-enhanced embedding text for resumes
 * Emphasizes domain-specific skills, technologies, and expertise areas
 * to improve job matching accuracy across different domains
 */
async function generateEnhancedResumeEmbeddingText(resumeData: any): Promise<string> {
    try {
        console.log("🚀 ~ calling generateEnhancedResumeEmbeddingText");
        // Extract categorized skills for better domain awareness
        const categorizedSkills = resumeData.categorizedSkills || {};
        const languages = categorizedSkills.languages || [];
        const frameworks = categorizedSkills.frameworks || [];
        const ai = categorizedSkills.ai || [];
        const databases = categorizedSkills.databases || [];
        const tools = categorizedSkills.tools || [];
        const other = categorizedSkills.other || [];
        
        // Build structured skill sections with emphasis
        const skillSections: string[] = [];
        
        if (languages.length > 0) {
            skillSections.push(`Programming Languages: ${languages.join(', ')}`);
        }
        if (frameworks.length > 0) {
            skillSections.push(`Frameworks and Libraries: ${frameworks.join(', ')}`);
        }
        if (ai.length > 0) {
            skillSections.push(`AI and Machine Learning: ${ai.join(', ')}`);
        }
        if (databases.length > 0) {
            skillSections.push(`Databases: ${databases.join(', ')}`);
        }
        if (tools.length > 0) {
            skillSections.push(`Tools and Technologies: ${tools.join(', ')}`);
        }
        if (other.length > 0) {
            skillSections.push(`Other Technical Skills: ${other.join(', ')}`);
        }
        
        // Build experience descriptions with role titles
        const experienceText = resumeData.experience?.map((e: any) => {
            return `${e.title} role at ${e.company}: ${e.description}`;
        }).join(' | ') || '';
        
        // Use LLM to enhance the embedding text with domain context
        const prompt = `You are an expert at creating domain-aware text embeddings for job matching. 
                        Given a candidate's resume information, create an enhanced text representation that emphasizes:
                        1. Domain-specific technical skills and technologies (e.g., React, Python, AWS for frontend/backend roles)
                        2. Specialization areas (e.g., frontend development, machine learning, cloud infrastructure)
                        3. Years of experience and expertise level
                        4. Key technologies and tools used in their work

                        Resume Information:
                        - Summary: ${resumeData.summary || 'N/A'}
                        - Total Experience: ${resumeData.totalExperienceYears || 0} years
                        - Skills by Category: ${skillSections.join('\n')}
                        - Experience: ${experienceText}

                        Create a concise, domain-focused text (max 500 words) that:
                        - Emphasizes specific technologies, frameworks, and tools (not generic terms like "software engineer")
                        - Highlights the candidate's domain/specialization (e.g., "Frontend Developer specializing in React and Next.js" vs generic "Software Engineer")
                        - Includes years of experience and expertise level
                        - Focuses on technical skills that differentiate this candidate from others in different domains
                        - Avoids generic terms that match across all domains (like "build", "test", "software engineer" without context)

                        Output ONLY the enhanced text, no explanations or markdown.`;

        const response = await openaiClient.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: 'You are an expert at creating domain-aware text for semantic search. Create concise, technical, domain-specific text that emphasizes unique skills and technologies.'
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
        console.error('❌ Error generating enhanced resume embedding text:', error);
        // Fallback to structured text
        const categorizedSkills = resumeData.categorizedSkills || {};
        const skillSections: string[] = [];
        Object.entries(categorizedSkills).forEach(([category, skills]: [string, any]) => {
            if (Array.isArray(skills) && skills.length > 0) {
                skillSections.push(`${category}: ${skills.join(', ')}`);
            }
        });
        
        return [
            resumeData.summary,
            `Experience: ${resumeData.totalExperienceYears || 0} years`,
            ...skillSections,
            resumeData.experience?.map((e: any) => `${e.title} at ${e.company}: ${e.description}`).join(' ')
        ].filter(Boolean).join(' ');
    }
}

/**
 * Tool to extract structured resume data from raw text
 */
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

                    For social media profiles, return the url of the profile mentioned in the resume. If no social media profile is mentioned, return an empty array.

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
        console.log("🚀 ~ calling extractResumeData");
        return resumeData;
    },
});

/**
 * Tool to upload resume data to vector database with enhanced embeddings
 */
const uploadResume = tool({
    name: 'uploadResume',
    description: `Upload the extracted resume data to the vector database. Takes the structured resume object and stores it with embeddings. Returns the resumeId.`,
    parameters: resumeSchema,
    execute: async (resumeData: any) => {
        try {
            console.log("\n📤 Uploading resume to database...");

            // Generate AI-enhanced embedding text for better domain-aware matching
            const vectorText = await generateEnhancedResumeEmbeddingText(resumeData);
            console.log("✅ Generated enhanced resume embedding text", vectorText);

            // Generate embedding
            const vector = await embedText(vectorText);

            // Generate unique ID
            const resumeId = crypto.randomUUID();
            console.log(`🆔 Generated Resume ID: ${resumeId}`);

            // Upstash Redis uses 'ex' (lowercase) for expiration in seconds
            await redisClient.set(`resumeData:${resumeId}`, JSON.stringify({ resumeData, vector }), { ex: 7 * 24 * 60 * 60 });

            // Upload to Qdrant
            await qdrantClient.upsert("resumes", {
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
});

/**
 * Resume Agent that extracts and uploads resume data
 */
const resumeAgent = new Agent({
    name: 'resumeAgent',
    model: "gpt-5-nano",
    instructions: `You are a resume analyser and data extractor agent that extracts the data from the resume and returns it in a structured format and also generates an enhanced resume embedding text.

                    Inputs you may receive: text of the resume.
                    
                    CRITICAL OUTPUT FORMAT: You MUST return ONLY a JSON object with this exact structure:
                    {"resumeId": "<the resumeId value from uploadResume tool result>"}
                    
                    Steps to follow:
                    1) Extract the data from the resume and return it in a structured format by calling the extractResumeData tool. Return the resume data in JSON format to next tool call.
                    2) Store the resume data and the enhanced resume embedding text in the database and vector database by calling the uploadResume tool.
                    3) Extract the "resumeId" field from the uploadResume tool result and return it in the exact format: {"resumeId": "<value>"}

                    Rules:
                    - Do not ask the user to call tools; you decide and call them yourself.
                    - When extracting, ensure totalExperienceYears follows the inclusive month-counting rule described in extractResumeData.
                    - The uploadResume tool returns: { success: true, resumeId: "...", message: "..." }
                    - You MUST extract ONLY the resumeId field and return it as: {"resumeId": "<value>"}
                    - Do NOT return the full tool result, only the resumeId in the specified format.
                    - Do NOT add any other text, explanations, or markdown - ONLY return the JSON object.
    
    `,
    tools: [extractResumeData, uploadResume]
});

/**
 * Extract text from PDF buffer
 */
export async function extractTextFromPDFBuffer(buffer: Buffer) {
    const parser = new PDFParse({ data: buffer, verbosity: VerbosityLevel.WARNINGS });
    const result = await parser.getText();
    await parser.destroy();
    return result.text;
}

/**
 * Run the resume agent to process resume text and upload it
 * Returns the resumeId from the agent result
 */
export async function runResumeAgent(resumeText: string) {
    console.log("🚀 ~ calling resume agent");
    const result = await run(resumeAgent, resumeText);

    // Handle different return formats
    let finalOutput = result.finalOutput;
    
    // If finalOutput is a string, try to parse it as JSON
    if (typeof finalOutput === 'string') {
        try {
            finalOutput = JSON.parse(finalOutput);
        } catch (e) {
            console.warn("⚠️ Could not parse finalOutput as JSON:", e);
        }
    }
    
    return finalOutput;
}

