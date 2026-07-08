import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import {
    resolveApplicationSkillGap,
    skillGapToSnapshotFields,
} from '@/lib/applicationSkillGap';

const ApplicationStatus = {
    SUBMITTED: 'SUBMITTED',
    VIEWED: 'VIEWED',
    SHORTLISTED: 'SHORTLISTED',
    INTERVIEW: 'INTERVIEW',
    REJECTED: 'REJECTED',
    HIRED: 'HIRED',
    WITHDRAWN: 'WITHDRAWN',
}

// GET - Fetch skill gap analysis for an application (recruiter)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user: dbUser, error } = await authenticateRequest();
    if (error) return error;

    if (dbUser.role !== 'recruiter') {
      return NextResponse.json({ error: 'Only recruiters can access skill analysis' }, { status: 403 });
    }

    const { id } = await params;

    const application = await prisma.jobApplication.findUnique({
      where: { id },
      include: {
        job: true,
        resume: { select: { json: true, vectorId: true } },
      },
    });

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    if (application.job.postedBy !== dbUser.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const snapshot = (application.snapshot as Record<string, unknown>) || {};
    const resumeJson = (application.resume?.json as Record<string, unknown>) || {};

    const skillGap = await resolveApplicationSkillGap(
      snapshot,
      resumeJson,
      {
        title: application.job.title,
        description: application.job.description,
        requirements: application.job.requirements,
        responsibilities: application.job.responsibilities,
        employerName: application.job.employerName,
      },
      application.resume?.vectorId,
      application.jobId,
      { allowLlm: true }
    );

    const hasStored =
      Array.isArray(snapshot.matchedSkills) || Array.isArray(snapshot.missingSkills);
    if (!hasStored && (skillGap.matchedSkills.length > 0 || skillGap.missingSkills.length > 0)) {
      await prisma.jobApplication.update({
        where: { id },
        data: {
          snapshot: {
            ...snapshot,
            ...skillGapToSnapshotFields(skillGap),
          },
        },
      });
    }

    return NextResponse.json({ success: true, ...skillGap });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('Error fetching application skill gap:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PATCH - Update application status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user
    const { user: dbUser, error } = await authenticateRequest();
    if (error) return error;

    // Get application ID and request body
    const { id } = await params;
    const body = await request.json();
    const { status, action } = body;

    // Get the application
    const application = await prisma.jobApplication.findUnique({
      where: { id },
      include: {
        job: true,
      },
    });

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // Handle withdrawal (candidate action)
    if (action === 'withdraw') {
      if (application.userId !== dbUser.id) {
        return NextResponse.json(
          { error: 'You can only withdraw your own applications' },
          { status: 403 }
        );
      }

      const updated = await prisma.jobApplication.update({
        where: { id },
        data: {
          status:ApplicationStatus.WITHDRAWN,
          withdrawnAt: new Date(),
          statusUpdatedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        application: updated,
      });
    }

    // Handle status update (recruiter action)
    if (status) {
      // Check if user is recruiter
      if (dbUser.role !== 'recruiter') {
        return NextResponse.json(
          { error: 'Only recruiters can update application status' },
          { status: 403 }
        );
      }

      // Check if recruiter owns the job
      if (application.job.postedBy !== dbUser.id) {
        return NextResponse.json(
          { error: 'You can only update applications for your own jobs' },
          { status: 403 }
        );
      }

      // Validate status value
      const validStatuses = [ApplicationStatus.VIEWED, ApplicationStatus.SHORTLISTED, ApplicationStatus.INTERVIEW, ApplicationStatus.REJECTED, ApplicationStatus.HIRED];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status' },
          { status: 400 }
        );
      }

      // Update application status
      const updated = await prisma.jobApplication.update({
        where: { id },
        data: {
          status,
          statusUpdatedAt: new Date(),
          statusUpdatedBy: dbUser.id,
        },
      });

      // Create interview if status is INTERVIEW or HIRED and interview doesn't exist
      if (status === ApplicationStatus.INTERVIEW || status === ApplicationStatus.HIRED) {
        const existingInterview = await prisma.interview.findUnique({
          where: { applicationId: id },
        });

        if (!existingInterview) {
          await prisma.interview.create({
            data: {
              applicationId: id,
              userId: application.userId,
              status: 'PENDING',
            },
          });
        }
      }

      return NextResponse.json({
        success: true,
        application: updated,
      });
    }

    return NextResponse.json(
      { error: 'Missing status or action' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error updating application status:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}