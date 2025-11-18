import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/superbase/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/resumes
 * Fetches all resumes for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Find user in database to get their ID
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email! },
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      );
    }

    // Fetch all resumes for the user with application counts
    const resumes = await prisma.resume.findMany({
      where: {
        userId: dbUser.id,
      },
      include: {
        applications: {
          select: {
            id: true,
          },
        },
      },
      orderBy: [
        { isPrimary: 'desc' }, // Primary resumes first
        { createdAt: 'desc' },  // Then by creation date
      ],
    });

    // Transform resumes to include computed fields
    const transformedResumes = resumes.map((resume: any) => {
      const resumeJson = resume.json as any;
      
      // Extract name from resume JSON or generate a default
      const resumeName = resumeJson?.name 
        ? `${resumeJson.name} Resume`
        : `Resume ${resume.id.slice(0, 8)}`;

      // Extract skills for tags
      const skills = resumeJson?.skills || [];
      const tags = skills.slice(0, 5); // Limit to 3 tags

      // Calculate time ago for lastModified
      const createdAt = new Date(resume.createdAt);
      const now = new Date();
      const diffMs = now.getTime() - createdAt.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);
      
      let lastModified = '';
      if (diffHours < 1) {
        lastModified = 'Just now';
      } else if (diffHours < 24) {
        lastModified = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      } else if (diffDays < 7) {
        lastModified = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      } else {
        lastModified = createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }

      // Generate filename from resume data
      const fileName = resumeJson?.name 
        ? `${resumeJson.name.toLowerCase().replace(/\s+/g, '_')}_resume.pdf`
        : `resume_${resume.id.slice(0, 8)}.pdf`;

      // Estimate file size (placeholder - would need actual file size in production)
      const fileSize = "245 KB"; // This would come from actual file storage

      return {
        id: resume.id,
        userId: resume.userId,
        json: resume.json,
        vectorId: resume.vectorId,
        isPrimary: resume.isPrimary,
        createdAt: resume.createdAt,
        // Computed/display fields
        name: resumeName,
        fileName: fileName,
        lastModified: lastModified,
        fileSize: fileSize,
        views: 0, // TODO: Add views tracking
        downloads: 0, // TODO: Add downloads tracking
        applications: resume.applications.length,
        tags: tags,
        matchScore: 85, // TODO: Calculate from actual job matches
      };
    });

    return NextResponse.json({
      success: true,
      resumes: transformedResumes,
    });
  } catch (error: any) {
    console.error('Error fetching resumes:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/resumes
 * Sets a resume as primary (unsetting others)
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Find user in database
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email! },
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { resumeId } = body;

    if (!resumeId) {
      return NextResponse.json(
        { error: 'Resume ID is required' },
        { status: 400 }
      );
    }

    // Verify the resume belongs to the user
    const resume = await prisma.resume.findFirst({
      where: {
        id: resumeId,
        userId: dbUser.id,
      },
    });

    if (!resume) {
      return NextResponse.json(
        { error: 'Resume not found' },
        { status: 404 }
      );
    }

    // Unset all other primary resumes
    await prisma.resume.updateMany({
      where: {
        userId: dbUser.id,
        isPrimary: true,
      },
      data: {
        isPrimary: false,
      },
    });

    // Set the selected resume as primary
    await prisma.resume.update({
      where: {
        id: resumeId,
      },
      data: {
        isPrimary: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Primary resume updated successfully',
    });
  } catch (error: any) {
    console.error('Error setting primary resume:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

