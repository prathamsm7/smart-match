import { NextRequest, NextResponse } from 'next/server';
import { searchJobsForResume } from '@/lib/jobHelper';
import { authenticateRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import redisClient from '@/lib/redisClient';
import type { JobSearchMode } from '@/lib/jobSearch.types';

function cacheKey(resumeId: string, mode: string, query: string) {
    const hash = Buffer.from(`${mode}:${query}`).toString('base64url').slice(0, 16);
    return `jobs:${resumeId}:${hash}`;
}

export async function GET(request: NextRequest) {
  try {
    const { user: dbUser, error } = await authenticateRequest();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const mode = (searchParams.get('mode') || 'profile') as JobSearchMode;
    const query = searchParams.get('query') || '';
    const forceRefresh = searchParams.get('forceRefresh') === 'true';

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
    const key = cacheKey(resumeId, mode, query);

    if (!forceRefresh) {
      const cachedData = await redisClient.get(key);
      if (cachedData) {
        const matches = typeof cachedData === 'string' ? JSON.parse(cachedData) : cachedData;
        return NextResponse.json({ success: true, matches, resumeId, mode, cached: true });
      }
    }

    const matches = await searchJobsForResume(resumeId, { mode, query: query || undefined });

    await redisClient.set(key, JSON.stringify(matches), { ex: 300 });

    return NextResponse.json({ 
      success: true, 
      matches, 
      resumeId, 
      mode, 
      cached: false,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('Error fetching job matches:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
