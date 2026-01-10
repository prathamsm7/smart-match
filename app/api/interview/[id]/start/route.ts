import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createServerSupabase } from '@/lib/superbase/server';

// POST - Start an interview with validation
export async function POST(
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

    // Validate: Check if interview belongs to the user
    if (interview.userId !== dbUser.id) {
      return NextResponse.json(
        { error: 'You can only start your own interviews' },
        { status: 403 }
      );
    }

    // Validate: Check if interview is in correct status (PENDING)
    if (interview.status !== 'PENDING') {
      return NextResponse.json(
        { error: `Interview cannot be started. Current status: ${interview.status}. Interview can only be started once when status is PENDING.` },
        { status: 400 }
      );
    }

    // Validate: Check if application status is correct (INTERVIEW or HIRED)
    if (interview.application.status !== 'INTERVIEW' && interview.application.status !== 'HIRED') {
      return NextResponse.json(
        { error: `Application status must be INTERVIEW or HIRED. Current status: ${interview.application.status}` },
        { status: 400 }
      );
    }

    // Update interview to IN_PROGRESS
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
  } catch (error: any) {
    console.error('Error starting interview:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}


