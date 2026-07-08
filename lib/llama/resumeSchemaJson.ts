/**
 * JSON Schema for LlamaCloud Extract — mirrors `lib/schema.js` field names/shape
 * so extracted data matches the app Resume schema without remapping keys.
 */
export const RESUME_EXTRACT_DATA_SCHEMA = {
    type: "object",
    properties: {
        name: {
            type: "string",
            description: "Full name of the candidate",
        },
        email: {
            type: "string",
            description: "Email address",
        },
        phone: {
            type: "string",
            description: "Phone number (empty string if not provided)",
        },
        social: {
            type: "array",
            description:
                "Social media profile URLs mentioned in the resume (LinkedIn, GitHub, portfolio, etc.). Empty array if none.",
            items: { type: "string" },
        },
        categorizedSkills: {
            type: "object",
            description: "Categorized technical skills organized by type",
            properties: {
                languages: {
                    type: "array",
                    description:
                        "Programming languages (e.g., Java, JavaScript, Python, TypeScript, HTML, CSS)",
                    items: { type: "string" },
                },
                frameworks: {
                    type: "array",
                    description:
                        "Frameworks and libraries (e.g., React, Next.js, Spring, Express.js, Tailwind CSS)",
                    items: { type: "string" },
                },
                ai: {
                    type: "array",
                    description:
                        "AI and Machine Learning technologies (e.g., Generative AI, LLMs, LangChain, OpenAI APIs, ChatGPT, RAG)",
                    items: { type: "string" },
                },
                databases: {
                    type: "array",
                    description:
                        "Databases and systems (e.g., MongoDB, MySQL, PostgreSQL, Redis, Vector Databases)",
                    items: { type: "string" },
                },
                tools: {
                    type: "array",
                    description:
                        "Tools and technologies (e.g., Git, GitHub, VS Code, Postman, Vercel, AWS, Docker)",
                    items: { type: "string" },
                },
                other: {
                    type: "array",
                    description:
                        "Other technical skills that don't fit the above categories (e.g., RESTful APIs, OOP, System Design, Cloud Computing)",
                    items: { type: "string" },
                },
            },
            required: ["languages", "frameworks", "ai", "databases", "tools", "other"],
            additionalProperties: false,
        },
        location: {
            type: "string",
            description: "Current location or address (empty string if not provided)",
        },
        experience: {
            type: "array",
            description: "Work experience entries",
            items: {
                type: "object",
                properties: {
                    title: { type: "string", description: "Job title" },
                    company: { type: "string", description: "Company name" },
                    startDate: {
                        type: "string",
                        description: "Start date in Month Year format",
                    },
                    endDate: {
                        type: "string",
                        description: "End date in Month Year format or Present",
                    },
                    location: {
                        type: "string",
                        description: "Job location (empty string if not provided)",
                    },
                    description: {
                        type: "string",
                        description: "Job responsibilities and achievements",
                    },
                },
                required: [
                    "title",
                    "company",
                    "startDate",
                    "endDate",
                    "location",
                    "description",
                ],
                additionalProperties: false,
            },
        },
        totalExperienceYears: {
            type: "number",
            description:
                "Total years of experience calculated by summing all experience durations inclusively. For Present/Current/Now end dates use the current date. Formula: months = (end_year - start_year) * 12 + (end_month - start_month + 1); years = months / 12; sum all roles; round to 1 decimal.",
        },
        summary: {
            type: "string",
            description:
                "Brief professional summary highlighting candidate's profile, key skills, and experience",
        },
        projects: {
            type: "array",
            description: "Notable projects",
            items: {
                type: "object",
                properties: {
                    name: { type: "string", description: "Project name" },
                    description: { type: "string", description: "Project description" },
                },
                required: ["name", "description"],
                additionalProperties: false,
            },
        },
        languages: {
            type: "array",
            description: "Programming languages or spoken languages",
            items: { type: "string" },
        },
        softSkills: {
            type: "array",
            description:
                "Soft skills and interpersonal abilities explicitly mentioned or clearly implied (e.g., Communication, Problem Solving, Team Collaboration). Do not invent generic soft skills.",
            items: { type: "string" },
        },
        candidateProfile: {
            type: "object",
            description:
                "Derived job-matching profile for this resume (used for semantic search). Must be grounded only in extracted resume facts.",
            properties: {
                profileSummary: {
                    type: "string",
                    description:
                        "4-5 sentence technical profile for job matching based on summary, skills, experience, and projects.",
                },
                domains: {
                    type: "array",
                    description:
                        "Domains the candidate has worked in (e.g. frontend, backend, ai, devops). Empty if unclear.",
                    items: { type: "string" },
                },
                seniority: {
                    type: "string",
                    description: 'One of: "junior", "mid", "senior", "lead"',
                },
                coreSkills: {
                    type: "array",
                    description: "Top 8-12 core skills for matching (from categorizedSkills / experience).",
                    items: { type: "string" },
                },
                experienceYears: {
                    type: "number",
                    description: "Same value as totalExperienceYears.",
                },
            },
            required: [
                "profileSummary",
                "domains",
                "seniority",
                "coreSkills",
                "experienceYears",
            ],
            additionalProperties: false,
        },
    },
    required: [
        "name",
        "email",
        "phone",
        "social",
        "categorizedSkills",
        "location",
        "experience",
        "totalExperienceYears",
        "summary",
        "projects",
        "languages",
        "softSkills",
        "candidateProfile",
    ],
    additionalProperties: false,
} as const;

export const RESUME_EXTRACT_SYSTEM_PROMPT = `You are an expert resume extractor.
Extract ONLY facts present in the document.
Categorize every technical skill into categorizedSkills (languages, frameworks, ai, databases, tools, other).
social must be an array of URL strings.
Dates must use Month Year format; use "Present" when the role is current.
For totalExperienceYears, sum all experience durations with inclusive month counting and round to 1 decimal place.
Return empty strings or empty arrays when a field is missing — never invent contact details.`;
