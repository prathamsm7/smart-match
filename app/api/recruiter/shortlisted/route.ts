import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateWithRole } from '@/lib/auth';

/**
 * GET /api/recruiter/shortlisted
 * Fetches all shortlisted candidates for the authenticated recruiter
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user and check role
    const { user: dbUser, error } = await authenticateWithRole('recruiter');
    if (error) return error;

    // Fetch all shortlisted applications for jobs posted by this recruiter
    const shortlistedApplications = await prisma.jobApplication.findMany({
      where: {
        status: 'SHORTLISTED',
        job: {
          postedBy: dbUser.id,
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
        job: {
          select: {
            id: true,
            title: true,
            employerName: true,
            location: true,
          },
        },
        coverLetter: {
          select: {
            id: true,
            finalText: true,
            generatedText: true,
            isEdited: true,
          },
        },
        interview: {
          select: {
            id: true,
            status: true,
            startedAt: true,
            completedAt: true,
            report: true,
          },
        },
      },
      orderBy: {
        statusUpdatedAt: 'desc',
      },
    });

    // Transform the data for frontend consumption
    const candidates = shortlistedApplications.map((app: typeof shortlistedApplications[0]) => {
      // Parse the snapshot to get candidate details
      const snapshot = app.snapshot as any;
      
      return {
        id: app.id,
        applicationId: app.id,
        userId: app.user.id,
        candidateName: app.user.name || 'Unknown',
        candidateEmail: app.user.email,
        jobTitle: app.job.title,
        jobId: app.job.id,
        company: app.job.employerName,
        location: app.job.location,
        appliedDate: app.createdAt.toISOString(),
        shortlistedDate: app.statusUpdatedAt?.toISOString() || app.createdAt.toISOString(),
        matchScore: app.matchScore,
        status: app.status,
        candidate: {
          id: app.user.id,
          name: app.user.name || 'Unknown',
          email: app.user.email,
          phone: snapshot?.phone || null,
          location: snapshot?.location || null,
          experience: snapshot?.experience || [],
          education: snapshot?.education || [],
          skills: snapshot?.skills || [],
          summary: snapshot?.summary || null,
        },
        coverLetter: app.coverLetter ? {
          id: app.coverLetter.id,
          text: app.coverLetter.finalText || app.coverLetter.generatedText,
          isEdited: app.coverLetter.isEdited,
        } : null,
        interview: app.interview ? {
          id: app.interview.id,
          status: app.interview.status,
          startedAt: app.interview.startedAt?.toISOString() || null,
          completedAt: app.interview.completedAt?.toISOString() || null,
          hasReport: !!app.interview.report,
        } : null,
      };
    });

    return NextResponse.json({
      success: true,
      candidates,
      total: candidates.length,
    });
  } catch (error: any) {
    console.error('Error fetching shortlisted candidates:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch shortlisted candidates' },
      { status: 500 }
    );
  }
}
