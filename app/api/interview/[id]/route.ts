import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createServerSupabase } from '@/lib/superbase/server';

// GET - Get a specific interview
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    const interview = await prisma.interview.findUnique({
      where: { id },
      include: {
        application: {
          include: {
            job: true,
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

    return NextResponse.json({
      success: true,
      interview,
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


