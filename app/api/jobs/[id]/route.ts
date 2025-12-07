import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createServerSupabase } from '@/lib/superbase/server';
import { storeJob, JobData, embedText, generateEnhancedJobEmbeddingText } from '@/lib/agents';
import { qdrantClient } from '@/lib/clients';

// GET a single job
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const job = await prisma.job.findUnique({
      where: { id },
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

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      job,
    });
  } catch (error: any) {
    console.error('Error fetching job:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT (update) a job
export async function PUT(
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
        { error: 'Only recruiters can update jobs' },
        { status: 403 }
      );
    }

    // 4. Get job ID
    const { id } = await params;

    // 5. Check if job exists and belongs to user
    const existingJob = await prisma.job.findUnique({
      where: { id },
    });

    if (!existingJob) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    if (existingJob.postedBy !== dbUser.id) {
      return NextResponse.json(
        { error: 'You can only update your own jobs' },
        { status: 403 }
      );
    }

    // 6. Get updated job data
    const jobData: JobData = await request.json();

    // 6.5. Normalize data - ensure requirements and responsibilities are strings
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

    // 7. Update job in PostgreSQL
    const updatedJob = await prisma.job.update({
      where: { id },
      data: {
        title: jobData.title,
        employerName: jobData.employerName || null,
        description: jobData.description || null,
        requirements: jobData.requirements || null,
        location: jobData.location || null,
        salary: jobData.salary || null,
        employmentType: jobData.employmentType || null,
        applyLink: jobData.applyLink || null,
        responsibilities: jobData.responsibilities || null,
      },
    });

    // 8. Update vector in Qdrant (re-embed with new data using enhanced embedding)
    const jobDataForEmbedding: JobData = {
      title: updatedJob.title,
      employerName: updatedJob.employerName || undefined,
      description: updatedJob.description || undefined,
      requirements: typeof updatedJob.requirements === 'string' 
        ? updatedJob.requirements 
        : Array.isArray(updatedJob.requirements)
          ? updatedJob.requirements.join(' ')
          : String(updatedJob.requirements || ''),
      responsibilities: typeof updatedJob.responsibilities === 'string'
        ? updatedJob.responsibilities
        : Array.isArray(updatedJob.responsibilities)
          ? updatedJob.responsibilities.join(' ')
          : String(updatedJob.responsibilities || ''),
    };

    const vectorText = await generateEnhancedJobEmbeddingText(jobDataForEmbedding);
    console.log("✅ Generated enhanced job embedding text for update");

    const vector = await embedText(vectorText);

    await qdrantClient.upsert('jobs', {
      points: [
        {
          id: updatedJob.id,
          vector: vector,
          payload: {
            id: updatedJob.id,
          },
        },
      ],
    });

    return NextResponse.json({
      success: true,
      job: updatedJob,
      message: 'Job updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating job:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE a job
export async function DELETE(
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
        { error: 'Only recruiters can delete jobs' },
        { status: 403 }
      );
    }

    // 4. Get job ID
    const { id } = await params;

    // 5. Check if job exists and belongs to user
    const existingJob = await prisma.job.findUnique({
      where: { id },
    });

    if (!existingJob) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    if (existingJob.postedBy !== dbUser.id) {
      return NextResponse.json(
        { error: 'You can only delete your own jobs' },
        { status: 403 }
      );
    }

    // 6. Delete from Qdrant first
    try {
      await qdrantClient.delete('jobs', {
        points: [id],
      });
    } catch (qdrantError) {
      console.warn('Error deleting from Qdrant (continuing):', qdrantError);
      // Continue with PostgreSQL deletion even if Qdrant deletion fails
    }

    // 7. Delete from PostgreSQL
    await prisma.job.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Job deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting job:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

