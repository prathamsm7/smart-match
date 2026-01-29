import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';

// PATCH - Update cover letter (user edits)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user
    const { user: dbUser, error } = await authenticateRequest();
    if (error) return error;

    const { id } = await params;
    const { finalText } = await request.json();

    if (!finalText) {
      return NextResponse.json(
        { error: 'finalText is required' },
        { status: 400 }
      );
    }

    const coverLetter = await prisma.coverLetter.findUnique({
      where: { id },
    });

    if (!coverLetter) {
      return NextResponse.json(
        { error: 'Cover letter not found' },
        { status: 404 }
      );
    }

    if (coverLetter.userId !== dbUser.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const updated = await prisma.coverLetter.update({
      where: { id },
      data: {
        finalText,
        isEdited: finalText !== coverLetter.generatedText,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      coverLetter: updated,
    });
  } catch (error: any) {
    console.error('Error updating cover letter:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

