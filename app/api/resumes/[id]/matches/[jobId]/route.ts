import { NextRequest, NextResponse } from 'next/server';
import { calculateSkillAndExperienceMatch, explainMatchAndSkillGap } from '@/lib/agents';
import { qdrantClient } from '@/lib/clients';
// Note: qdrantClient is only used as fallback when resume data is not cached
import redisClient from '@/lib/redisClient';
import { prisma } from '@/lib/prisma';

// Vercel serverless function timeout - set to 60s for LLM operations
export const maxDuration = 60;

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; jobId: string }> }
) {
    try {
        const { id: resumeId, jobId } = await params;

        // Get vectorScore from request body (passed from frontend)
        const body = await request.json();
        const vectorScore = (body.vectorScore || 0) / 100; // Convert from 0-100 to 0-1

        if (!resumeId || !jobId) {
            return NextResponse.json(
                { error: 'Resume ID and Job ID are required' },
                { status: 400 }
            );
        }

        // 1. Check cache first for this resume-job pair
        const cacheKey = `match:${resumeId}:${jobId}`;
        const cached = await redisClient.get(cacheKey);
        if (cached) {
            const parsedCache = typeof cached === 'string' ? JSON.parse(cached) : cached;
            return NextResponse.json({ success: true, match: parsedCache, cached: true });
        }

        // 2. Get resume data from cache or Qdrant
        const resumeCacheKey = `resumeData:${resumeId}`;
        const cachedResumeData = await redisClient.get(resumeCacheKey);

        let resumeInfo: any;

        if (cachedResumeData) {
            const parsed = typeof cachedResumeData === 'string'
                ? JSON.parse(cachedResumeData)
                : cachedResumeData;
            resumeInfo = parsed.resumeData;
        } else {
            // Fetch from Qdrant if not cached
            const resumeResult = await qdrantClient.retrieve("resumes", {
                ids: [resumeId],
                with_payload: true,
                with_vector: true,
            });

            if (!resumeResult || !resumeResult.length) {
                return NextResponse.json(
                    { error: `Resume not found with ID: ${resumeId}` },
                    { status: 404 }
                );
            }

            resumeInfo = resumeResult[0].payload;
            const resumeVec = resumeResult[0].vector;

            // Cache for future use
            await redisClient.set(resumeCacheKey, JSON.stringify({
                resumeData: resumeInfo,
                vector: resumeVec
            }), { ex: 60 * 60 });
        }

        if (!resumeInfo) {
            return NextResponse.json(
                { error: 'Resume data is incomplete' },
                { status: 500 }
            );
        }

        // 3. Get job from PostgreSQL
        const job = await prisma.job.findUnique({ where: { id: jobId } });

        if (!job) {
            return NextResponse.json(
                { error: `Job not found with ID: ${jobId}` },
                { status: 404 }
            );
        }

        // 5. Prepare job data for matching functions
        const jobDataForMatching = {
            jobTitle: job.title,
            jobDescription: job.description || '',
            jobRequirements: job.requirements,
            jobResponsibilities: job.responsibilities || '',
            employerName: job.employerName || '',
        };

        // 6. Run BOTH LLM analyses in PARALLEL for faster response
        const [skillMatch, reasoning] = await Promise.all([
            calculateSkillAndExperienceMatch(resumeInfo, jobDataForMatching),
            explainMatchAndSkillGap(resumeInfo, jobDataForMatching)
        ]);

        // 7. Calculate final score
        const finalScoreRaw = Number((
            vectorScore * 0.65 +
            skillMatch.skillRatio * 0.25 +
            skillMatch.experienceRatio * 0.05
        ).toFixed(3));
        const finalScore = Math.round(finalScoreRaw * 100);

        // 8. Build result
        const result = {
            jobId,
            vectorScore: Math.round(vectorScore * 100),
            skillScore: Math.round(skillMatch.skillRatio * 100),
            expRelevanceScore: Math.round(skillMatch.experienceRatio * 100),
            finalScore,
            matchedSkills: reasoning.matchedSkills || [],
            missingSkills: reasoning.missingSkills || [],
            matchReason: reasoning.matchReason || '',
            overallMatchScore: reasoning.overallMatchScore || finalScore,
            strongExperienceAlignment: reasoning.strongExperienceAlignment || [],
            improvementSuggestions: reasoning.improvementSuggestions || [],
        };

        // 9. Cache for 1 hour
        await redisClient.set(cacheKey, JSON.stringify(result), { ex: 3600 });

        return NextResponse.json({ success: true, match: result, cached: false });
    } catch (error: any) {
        console.error('Error fetching job match details:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
