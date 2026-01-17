import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createServerSupabase } from '@/lib/superbase/server';

/**
 * GET /api/recruiter/interview-reports
 * Fetches all interview reports for candidates who applied to jobs posted by the authenticated recruiter
 * Sorted by completion date (latest first)
 */
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

    // 2. Find user in database and verify they're a recruiter
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email! },
      select: { id: true, role: true },
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      );
    }

    if (dbUser.role !== 'recruiter') {
      return NextResponse.json(
        { error: 'Only recruiters can access interview reports' },
        { status: 403 }
      );
    }

    // 3. Fetch all completed interviews for jobs posted by this recruiter
    const interviews = await prisma.interview.findMany({
      where: {
        status: 'COMPLETED',
        report: {
          not: null,
        },
        application: {
          job: {
            postedBy: dbUser.id,
          },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        application: {
          include: {
            job: {
              select: {
                id: true,
                title: true,
                employerName: true,
                location: true,
              },
            },
          },
        },
      },
      orderBy: {
        completedAt: 'desc', // Latest first
      },
    });

    // 4. Transform the data for frontend consumption
    const reports = interviews.map((interview: any) => {
      const report = interview.report as any;
      
      return {
        id: interview.id,
        interviewId: interview.id,
        applicationId: interview.applicationId,
        candidateId: interview.user.id,
        candidateName: interview.user.name || 'Unknown',
        candidateEmail: interview.user.email,
        jobTitle: interview.application.job.title,
        jobId: interview.application.job.id,
        company: interview.application.job.employerName,
        location: interview.application.job.location,
        status: interview.status,
        startedAt: interview.startedAt?.toISOString() || null,
        completedAt: interview.completedAt?.toISOString() || null,
        createdAt: interview.createdAt.toISOString(),
        // Extract key metrics from report for quick view
        overallScore: report?.scores?.overall || null,
        technicalScore: report?.scores?.technical || null,
        communicationScore: report?.scores?.communication || null,
        problemSolvingScore: report?.problemSolvingScore || null,
        hiringDecision: report?.hiringRecommendation?.decision || null,
        hasReport: !!interview.report,
      };
    });

    return NextResponse.json({
      success: true,
      reports,
      total: reports.length,
    });
  } catch (error: any) {
    console.error('Error fetching interview reports:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch interview reports' },
      { status: 500 }
    );
  }
}
