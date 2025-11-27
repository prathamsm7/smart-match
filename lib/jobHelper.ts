import { QdrantClient } from "@qdrant/js-client-rest";
import redisClient from './redisClient.js';
import { prisma } from './prisma.js';

const qdrantClient = new QdrantClient({
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY
});

/**
 * Search for jobs matching a resume - standalone function (bypasses agent framework)
 * This is the fast path for job search without LLM orchestration overhead
 */
export async function searchJobsForResume(resumeId: string) {
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
            console.log("🚀 ~ cachedResumeData found");
            const parsed = typeof cachedResumeData === 'string' 
                ? JSON.parse(cachedResumeData) 
                : cachedResumeData;
            resumeVec = parsed.vector;
            resumeInfo = parsed.resumeData;
        } else {
            console.log("🚀 ~ fetching from Qdrant");
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

            await redisClient.set(cacheKey, JSON.stringify({resumeData: resumeInfo, vector: resumeVec}), { ex: 60 * 60 });
        }

        if (!resumeVec || !resumeInfo) {
            throw new Error("Resume data is incomplete - missing vector or payload");
        }

        // Vector similarity from Qdrant - get jobIds and scores only
        const matches = await qdrantClient.search("jobs", {
            vector: resumeVec,
            limit: 20, // Increased limit for better results
            with_payload: true,
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

        // Create a map for quick lookup
        type JobType = typeof jobs[number];
        const jobMap = new Map<string, JobType>(jobs.map((job: JobType) => [job.id, job]));

        // Create a map of vector scores by jobId
        const scoreMap = new Map<string, number>(matches.map((match: any) => [match.payload.id, match.score]));

        // Process matches with full data from PostgreSQL - NO LLM calls
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
                vectorScore: Math.round(vectorScore * 100),
            };
        }).filter(Boolean);

        // Sort by vectorScore in descending order
        results.sort((a: any, b: any) => b.vectorScore - a.vectorScore);

        return results;
    } catch (error: any) {
        console.error("❌ Error in searchJobsForResume:", error);
        throw new Error(`Job search failed: ${error.message}`);
    }
}

