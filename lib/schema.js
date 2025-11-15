import { z } from 'zod';

const resumeSchema = z.object({
    name: z.string().describe("Full name of the candidate"),
    email: z.string().describe("Email address"),
    phone: z.string().default("").describe("Phone number (empty string if not provided)"),
    social: z.array(z.string()).default([]).describe("Social media profiles (LinkedIn, GitHub, etc.)"),
    skills: z.array(z.string()).describe("List of technical and professional skills (no duplicates)"),
    categorizedSkills: z.object({
        languages: z.array(z.string()).default([]).describe("Programming languages (e.g., Java, JavaScript, Python, TypeScript, HTML, CSS)"),
        frameworks: z.array(z.string()).default([]).describe("Frameworks and libraries (e.g., React, Next.js, Spring, Express.js, Tailwind CSS)"),
        ai: z.array(z.string()).default([]).describe("AI and Machine Learning technologies (e.g., Generative AI, LLMs, LangChain, OpenAI APIs, ChatGPT, RAG)"),
        databases: z.array(z.string()).default([]).describe("Databases and systems (e.g., MongoDB, MySQL, PostgreSQL, Redis, Vector Databases)"),
        tools: z.array(z.string()).default([]).describe("Tools and technologies (e.g., Git, GitHub, VS Code, Postman, Vercel, AWS, Docker)"),
        other: z.array(z.string()).default([]).describe("Other technical skills that don't fit the above categories (e.g., RESTful APIs, OOP, System Design, Cloud Computing)")
    }).default({ languages: [], frameworks: [], ai: [], databases: [], tools: [], other: [] }).describe("Categorized technical skills organized by type"),
    location: z.string().default("").describe("Current location or address (empty string if not provided)"),
    experience: z.array(
      z.object({
        title: z.string().describe("Job title"),
        company: z.string().describe("Company name"),
        startDate: z.string().describe("Start date in Month Year format"),
        endDate: z.string().describe("End date in Month Year format or Present"),
        location: z.string().default("").describe("Job location (empty string if not provided)"),
        description: z.string().describe("Job responsibilities and achievements"),
      })
    ).describe("Work experience entries"),
    totalExperienceYears: z.number().describe(
      "Total years of experience calculated by summing all experience durations inclusively"
    ),
    summary: z.string().describe(
      "Brief professional summary highlighting candidate's profile, key skills, and experience"
    ),
    projects: z
      .array(
        z.object({
          name: z.string().describe("Project name"),
          description: z.string().describe("Project description"),
        })
      )
      .default([])
      .describe("Notable projects"),
    languages: z.array(z.string()).default([]).describe("Programming languages or spoken languages"),
    softSkills: z.array(z.string()).default([]).describe("Soft skills and interpersonal abilities (e.g., Communication, Problem Solving, Team Collaboration, Leadership, Time Management, Adaptability, Critical Thinking, etc.)"),
  });
  

export default resumeSchema;

