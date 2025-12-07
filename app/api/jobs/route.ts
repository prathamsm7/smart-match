import { NextRequest, NextResponse } from 'next/server';
import { storeJob, JobData } from '@/lib/agents';
import { prisma } from '@/lib/prisma';
import { createServerSupabase } from '@/lib/superbase/server';

export async function POST(request: NextRequest) {
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

    // 3. Check if user is a recruiter
    if (dbUser.role !== 'recruiter') {
      return NextResponse.json(
        { error: 'Only recruiters can post jobs' },
        { status: 403 }
      );
    }

    // 4. Get job data from request
    const jobData: JobData = await request.json();

    // 5. Validate and normalize data - ensure requirements and responsibilities are strings
    if (Array.isArray(jobData.requirements)) {
      jobData.requirements = jobData.requirements.join('\n');
    } else if (jobData.requirements && typeof jobData.requirements !== 'string') {
      jobData.requirements = String(jobData.requirements);
    }

    if (Array.isArray(jobData.responsibilities)) {
      jobData.responsibilities = jobData.responsibilities.join('\n');
    } else if (jobData.responsibilities && typeof jobData.responsibilities !== 'string') {
      jobData.responsibilities = String(jobData.responsibilities);
    }

    // 6. Validate required fields
    if (!jobData.title) {
      return NextResponse.json(
        { error: 'Job title is required' },
        { status: 400 }
      );
    }

    // 7. Store job in both PostgreSQL and Qdrant with postedBy
    const jobId = await storeJob({
      ...jobData,
      postedBy: dbUser.id,
    });

    return NextResponse.json({
      success: true,
      jobId,
      message: 'Job stored successfully',
    });
  } catch (error: any) {
    console.error('Error storing job:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to list jobs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const myJobs = searchParams.get('myJobs') === 'true'; // Filter to only recruiter's jobs

    // If myJobs is true, require authentication
    let dbUser = null;
    if (myJobs) {
      const supabase = await createServerSupabase();
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }

      dbUser = await prisma.user.findUnique({
        where: { email: user.email! },
      });

      if (!dbUser) {
        return NextResponse.json(
          { error: 'User not found in database' },
          { status: 404 }
        );
      }
    }

    // Build where clause
    const where = myJobs && dbUser ? { postedBy: dbUser.id } : {};

    const jobs = await prisma.job.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        poster: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            applications: true,
          },
        },
      },
    });

    const total = await prisma.job.count({ where });

    return NextResponse.json({
      success: true,
      jobs,
      total,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

