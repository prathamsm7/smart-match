import { NextRequest, NextResponse } from 'next/server';
import { searchJobsForResume } from '@/lib/jobHelper';
import redisClient from '@/lib/redisClient';
import { authenticateRequest } from '@/lib/auth';
import { checkUsageLimit, incrementUsage } from '@/lib/usageHelper';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: resumeId } = await params;

        if (!resumeId) {
            return NextResponse.json(
                { error: 'Resume ID is required' },
                { status: 400 }
            );
        }

        // Authenticate user
        const { user: dbUser, error } = await authenticateRequest();
        if (error) return error;

        // Check usage limit
        const { allowed, limit, used } = await checkUsageLimit(dbUser.id, 'job_match');
        if (!allowed) {
            return NextResponse.json({ 
                error: "Monthly job match limit reached", 
                limit, 
                used,
                upgradeRequired: true 
            }, { status: 403 });
        }

        // Check cache first
        const cachedKey = `jobs:${resumeId}`;
        const cachedData = await redisClient.get(cachedKey);

        if (cachedData) {
            const matches = typeof cachedData === 'string' ? JSON.parse(cachedData) : cachedData;
            return NextResponse.json({
                success: true,
                matches,
                cached: true,
            });
        }

        // Call searchJobsForResume directly (bypasses agent framework for speed)
        const matches = await searchJobsForResume(resumeId);

        // Cache results for 5 minutes
        await redisClient.set(cachedKey, JSON.stringify(matches), { ex: 300 });

        // 3) Increment usage (only on cache miss when we actually perform the search)
        await incrementUsage(dbUser.id, 'job_match');

        return NextResponse.json({
            success: true,
            matches,
            cached: false,
        });
    } catch (error: any) {
        console.error('Error fetching job matches:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
