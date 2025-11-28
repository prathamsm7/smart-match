import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/superbase/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email! },
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      );
    }

    // Candidate stats
    if (dbUser.role === 'candidate') {
      return await getCandidateStats(dbUser);
    }

    // Recruiter stats
    if (dbUser.role === 'recruiter') {
      return await getRecruiterStats(dbUser);
    }

    return NextResponse.json({
      success: true,
      role: dbUser.role,
      stats: {},
    });
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

async function getCandidateStats(dbUser: any) {
  // Get application counts
  const totalApplications = await prisma.jobApplication.count({
    where: { userId: dbUser.id },
  });

  // Get resume count
  const resumeCount = await prisma.resume.count({
    where: { userId: dbUser.id },
  });

  // Get primary resume
  const primaryResume = await prisma.resume.findFirst({
    where: { userId: dbUser.id, isPrimary: true },
  });

  // Calculate profile strength based on resume completeness
  let profileStrength = 0;
  if (primaryResume?.json) {
    const resumeData = primaryResume.json as any;
    const fields = ['name', 'email', 'phone', 'summary', 'skills', 'experience', 'education', 'languages'];
    const filledFields = fields.filter(f => {
      const value = resumeData[f];
      return value && (Array.isArray(value) ? value.length > 0 : true);
    });
    profileStrength = Math.round((filledFields.length / fields.length) * 100);
  }

  // Get recent applications for activity
  const recentApplications = await prisma.jobApplication.findMany({
    where: { userId: dbUser.id },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      job: {
        select: {
          title: true,
          employerName: true,
        },
      },
    },
  });

  return NextResponse.json({
    success: true,
    role: 'candidate',
    stats: {
      totalApplications,
      resumeCount,
      profileStrength,
      // These would need interview scheduling feature to be real
      interviewsScheduled: 0,
    },
    recentApplications: recentApplications.map((app: typeof recentApplications[0]) => ({
      id: app.id,
      jobTitle: app.job.title,
      company: app.job.employerName || 'Unknown Company',
      appliedAt: app.createdAt,
    })),
  });
}

async function getRecruiterStats(dbUser: any) {
  const totalJobs = await prisma.job.count({
    where: { postedBy: dbUser.id },
  });

  const jobsWithApplications = await prisma.job.count({
    where: {
      postedBy: dbUser.id,
      applications: {
        some: {},
      },
    },
  });

  const totalApplications = await prisma.jobApplication.count({
    where: {
      job: {
        postedBy: dbUser.id,
      },
    },
  });

  // Get recent applications to recruiter's jobs
  const recentApplications = await prisma.jobApplication.findMany({
    where: {
      job: {
        postedBy: dbUser.id,
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      job: {
        select: {
          title: true,
          employerName: true,
        },
      },
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  return NextResponse.json({
    success: true,
    role: 'recruiter',
    stats: {
      totalJobs,
      totalApplications,
      jobsWithApplications,
      activeJobs: totalJobs, // All jobs are active for now
    },
    recentApplications: recentApplications.map((app: typeof recentApplications[0]) => ({
      id: app.id,
      jobTitle: app.job.title,
      company: app.job.employerName,
      candidateName: (app as any).snapshot?.applicantName || app.user.name || app.user.email,
      appliedAt: app.createdAt,
    })),
  });
}
