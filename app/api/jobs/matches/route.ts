import { NextRequest, NextResponse } from 'next/server';
import { searchJobsForResume } from '@/lib/jobHelper';
import { authenticateRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import redisClient from '@/lib/redisClient';

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const { user: dbUser, error } = await authenticateRequest();
    if (error) return error;

    // Find primary resume for this user
    const primaryResume = await prisma.resume.findFirst({
      where: {
        userId: dbUser.id,
        isPrimary: true,
      },
      select: {
        id: true,
        vectorId: true,
      },
    });

    if (!primaryResume) {
      return NextResponse.json(
        { error: 'No primary resume found. Please upload a resume and set it as primary.' },
        { status: 404 }
      );
    }

    if (!primaryResume.vectorId) {
      return NextResponse.json(
        { error: 'Primary resume has not been processed yet. Please try again later.' },
        { status: 400 }
      );
    }

    const resumeId = primaryResume.vectorId;

    // Check cache first
    const cachedKey = `jobs:${resumeId}`;
    const cachedData = await redisClient.get(cachedKey);

    if (cachedData) {
      const matches = typeof cachedData === 'string' ? JSON.parse(cachedData) : cachedData;
      return NextResponse.json({
        success: true,
        matches,
        resumeId,
        cached: true,
      });
    }

    // Search for matching jobs
    const matches = await searchJobsForResume(resumeId);

    // Cache results for 5 minutes
    await redisClient.set(cachedKey, JSON.stringify(matches), { ex: 300 });

    return NextResponse.json({
      success: true,
      matches,
      resumeId,
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

