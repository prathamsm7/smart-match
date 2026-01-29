import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';

// GET - Get a specific interview
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user
    const { user: dbUser, error } = await authenticateRequest();
    if (error) return error;

    const { id } = await params;

    const interview = await prisma.interview.findUnique({
      where: { id },
      include: {
        application: {
          include: {
            job: true,
            resume: {
              select: {
                id: true,
                json: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!interview) {
      return NextResponse.json(
        { error: 'Interview not found' },
        { status: 404 }
      );
    }

    // Check if user owns this interview (candidate) or is the recruiter for the job
    const isOwner = interview.userId === dbUser.id;
    const isRecruiter = dbUser.role === 'recruiter' && interview.application.job.postedBy === dbUser.id;

    if (!isOwner && !isRecruiter) {
      return NextResponse.json(
        { error: 'Unauthorized to view this interview' },
        { status: 403 }
      );
    }

    // Extract user data from application snapshot or resume
    const snapshot = interview.application.snapshot as any;
    const resumeData = interview.application.resume?.json as any;

    const userData = {
      name: snapshot?.applicantName || interview.user.name || resumeData?.name || 'Unknown',
      email: snapshot?.applicantEmail || interview.user.email || resumeData?.email || '',
      skills: snapshot?.applicantSkills || resumeData?.skills || [],
      experience: snapshot?.applicantExperience || resumeData?.experience || [],
      projects: resumeData?.projects || [],
      summary: snapshot?.applicantSummary || resumeData?.summary || '',
      totalExperienceYears: snapshot?.applicantTotalExperienceYears || resumeData?.totalExperienceYears || 0,
    };

    const jobData = {
      title: interview.application.job.title,
      employerName: interview.application.job.employerName,
      description: interview.application.job.description,
      requirements: interview.application.job.requirements,
      responsibilities: interview.application.job.responsibilities,
      location: interview.application.job.location,
      salary: interview.application.job.salary,
      employmentType: interview.application.job.employmentType,
    };

    return NextResponse.json({
      success: true,
      interview,
      userData,
      jobData,
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


