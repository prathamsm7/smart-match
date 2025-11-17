import { NextRequest, NextResponse } from 'next/server';
import { qdrantClient } from '@/lib/qdrant';
import { redisClient } from '@/lib/redis';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: resumeId } = await params;
    console.log("🚀 ~ GET ~ resumeId:", resumeId)

    if (!resumeId) {
      return NextResponse.json(
        { error: 'Resume ID is required' },
        { status: 400 }
      );
    }

    // Try Redis cache first (Upstash Redis uses REST API, no connection needed)
    let resumeData;
    try {
      const cacheKey = `resumeData:${resumeId}`;
      const cachedData = await redisClient.get(cacheKey);
      
      if (cachedData) {
        // Upstash returns the value directly, no need to parse if it's already an object
        if (typeof cachedData === 'string') {
          const parsed = JSON.parse(cachedData);
          resumeData = parsed.resumeData;
        } else if (cachedData && typeof cachedData === 'object' && 'resumeData' in cachedData) {
          resumeData = cachedData.resumeData;
        } else {
          resumeData = cachedData;
        }
      }
    } catch (redisError: any) {
      console.warn('Redis cache error, falling back to Qdrant:', redisError?.message || redisError);
    }

    // If not in cache, fetch from Qdrant
    if (!resumeData) {
      const result = await qdrantClient.retrieve('resumes', {
        ids: [resumeId],
        with_payload: true,
      });

      if (!result || result.length === 0) {
        return NextResponse.json(
          { error: 'Resume not found' },
          { status: 404 }
        );
      }

      resumeData = result[0].payload;
    }

    return NextResponse.json({
      success: true,
      resume: resumeData,
    });
  } catch (error: any) {
    console.error('Error fetching resume:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

