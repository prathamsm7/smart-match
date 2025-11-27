import { NextRequest, NextResponse } from 'next/server';
import { searchJobsForResume } from '@/lib/jobHelper';
import redisClient from '@/lib/redisClient';

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

