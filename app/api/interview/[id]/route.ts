import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { loadInterviewSession } from '@/lib/interview/loadSession';

// GET - Get a specific interview
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const forSession = request.nextUrl.searchParams.get('ready') === '1';
    const result = await loadInterviewSession(
      id,
      forSession ? 'start' : 'view',
    );

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status },
      );
    }

    const { interview, candidateProfile, jobProfile } = result.data;

    return NextResponse.json({
      success: true,
      interview,
      userData: {
        ...candidateProfile,
        email:
          (interview.application.snapshot as { applicantEmail?: string } | null)
            ?.applicantEmail ||
          interview.user.email ||
          '',
      },
      jobData: {
        ...jobProfile,
        location: interview.application.job.location,
        salary: interview.application.job.salary,
        employmentType: interview.application.job.employmentType,
      },
    });
  } catch (error: any) {
    console.error('Error fetching interview:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - Update interview status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user
    const { user: dbUser, error } = await authenticateRequest();
    if (error) return error;

    const { id } = await params;
    const body = await request.json();
    const { status, action } = body;

    const interview = await prisma.interview.findUnique({
      where: { id },
      include: {
        application: true,
      },
    });

    if (!interview) {
      return NextResponse.json(
        { error: 'Interview not found' },
        { status: 404 }
      );
    }

    // Only the candidate can update their own interview status
    if (interview.userId !== dbUser.id) {
      return NextResponse.json(
        { error: 'You can only update your own interviews' },
        { status: 403 }
      );
    }

    // Validate status transitions
    const validStatuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Handle start action
    if (action === 'start') {
      if (interview.status !== 'PENDING') {
        return NextResponse.json(
          { error: 'Interview can only be started if it is in PENDING status' },
          { status: 400 }
        );
      }

      const updated = await prisma.interview.update({
        where: { id },
        data: {
          status: 'IN_PROGRESS',
          startedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        interview: updated,
      });
    }

    // Handle status update
    if (status) {
      const updateData: any = {
        status,
      };

      if (status === 'COMPLETED' || status === 'FAILED' || status === 'CANCELLED') {
        updateData.completedAt = new Date();
      }

      const updated = await prisma.interview.update({
        where: { id },
        data: updateData,
      });

      return NextResponse.json({
        success: true,
        interview: updated,
      });
    }

    return NextResponse.json(
      { error: 'Missing status or action' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error updating interview:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}


