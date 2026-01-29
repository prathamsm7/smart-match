import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateWithRole } from '@/lib/auth';
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
    // Authenticate user and check role
    const { user: dbUser, error } = await authenticateWithRole('recruiter');
    if (error) return error;

    // Get job ID
    const { id } = await params;

    // Check if job exists and belongs to user
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

    // Get updated job data
    const jobData: JobData = await request.json();

    // Normalize data - ensure requirements and responsibilities are strings
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

    // Update job in PostgreSQL
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

    // Update vector in Qdrant (re-embed with new data using enhanced embedding)
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
    // Authenticate user and check role
    const { user: dbUser, error } = await authenticateWithRole('recruiter');
    if (error) return error;

    // Get job ID
    const { id } = await params;

    // Check if job exists and belongs to user
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

    // Delete from Qdrant first
    try {
      await qdrantClient.delete('jobs', {
        points: [id],
      });
    } catch (qdrantError) {
      console.warn('Error deleting from Qdrant (continuing):', qdrantError);
      // Continue with PostgreSQL deletion even if Qdrant deletion fails
    }

    // Delete from PostgreSQL
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

