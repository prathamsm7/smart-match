import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createServerSupabase } from '@/lib/superbase/server';

// GET applications for a specific job
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
        { error: 'Only recruiters can view job applications' },
        { status: 403 }
      );
    }

    // 4. Get job ID
    const { id } = await params;

    // 5. Check if job exists and belongs to user
    const job = await prisma.job.findUnique({
      where: { id },
    });

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    if (job.postedBy !== dbUser.id) {
      return NextResponse.json(
        { error: 'You can only view applications for your own jobs' },
        { status: 403 }
      );
    }

    // 6. Fetch applications for this job (matchScore is pre-computed and stored!)
    const applications = await prisma.jobApplication.findMany({
      where: { jobId: id },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        resume: {
          select: {
            id: true,
            json: true,
          },
        },
      },
    });

    // 7. Format applications - matchScore comes directly from DB (instant!)
    const formattedApplications = applications.map((app: typeof applications[0]) => {
      const snapshot = app.snapshot as any || {};
      const resumeJson = app.resume?.json as any || {};

      return {
        id: app.id,
        appliedDate: app.createdAt,
        matchScore: app.matchScore ?? 50,  // Read from DB, fallback to 50 for old records
        user: {
          id: app.user.id,
          name: snapshot.applicantName || app.user.name || 'Unknown',
          email: snapshot.applicantEmail || app.user.email,
        },
        candidate: {
          name: snapshot.applicantName || app.user.name || 'Unknown',
          email: snapshot.applicantEmail || app.user.email,
          phone: resumeJson.phone || snapshot.phone || null,
          city: snapshot.applicantCity || resumeJson.location || null,
          experience: snapshot.applicantTotalExperienceYears || resumeJson.totalExperienceYears || 0,
          skills: snapshot.applicantSkills || resumeJson.skills || [],
          summary: snapshot.applicantSummary || resumeJson.summary || '',
          languages: snapshot.applicantLanguages || resumeJson.languages || [],
          education: resumeJson.education || [],
          experience_details: snapshot.applicantExperience || resumeJson.experience || [],
          socialLinks: resumeJson.socialLinks || [],
          softSkills: resumeJson.softSkills || [],
          categorizedSkills: resumeJson.categorizedSkills || {},
        },
      };
    });

    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        title: job.title,
        employerName: job.employerName,
        location: job.location,
        salary: job.salary,
        description: job.description,
        employmentType: job.employmentType,
        createdAt: job.createdAt,
      },
      applications: formattedApplications,
      total: formattedApplications.length,
    });
  } catch (error: any) {
    console.error('Error fetching job applications:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
