import { NextRequest, NextResponse } from 'next/server';
import { searchJobsForResume } from '@/lib/jobHelper';
import { createServerSupabase } from '@/lib/superbase/server';
import { prisma } from '@/lib/prisma';
import redisClient from '@/lib/redisClient';

export async function GET(request: NextRequest) {
  try {
    // 1. Get authenticated user
    const supabase = await createServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Find user in database
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email! },
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      );
    }

    // 3. Find primary resume for this user
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

    // 4. Check cache first
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

    // 5. Search for matching jobs
    const matches = await searchJobsForResume(resumeId);

    // 6. Cache results for 5 minutes
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

