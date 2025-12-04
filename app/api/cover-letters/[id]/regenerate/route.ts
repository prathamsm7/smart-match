import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createServerSupabase } from '@/lib/superbase/server';
import redisClient from '@/lib/redisClient';
import { qdrantClient } from '@/lib/clients';
import { generateCoverLetter } from '@/lib/coverLetterHelper';

// POST - Regenerate cover letter
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
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const { id } = await params;
    const { resumeId, jobTitle, company, description, requirements } = await request.json();

    // Get existing cover letter
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

    // Check rate limit (max 5 total: 1 initial + 4 regenerations)
    if (coverLetter.regenerationCount >= 4) {
      return NextResponse.json(
        { error: 'Maximum regeneration limit reached (5 total attempts per job)' },
        { status: 429 }
      );
    }

    // Get resume data
    const resumeDbData = await prisma.resume.findFirst({
      where: {
        vectorId: resumeId as string,
        userId: dbUser.id
      }
    });

    if (!resumeDbData) {
      return NextResponse.json(
        { error: 'Resume not found' },
        { status: 404 }
      );
    }

    let resumeData = resumeDbData.json as any;

    if (!resumeData) {
      const cachedData = await redisClient.get(`resumeData:${resumeId}`);
      if (cachedData) {
        const parsed = typeof cachedData === 'string' ? JSON.parse(cachedData) : cachedData;
        resumeData = parsed.resumeData || parsed;
      }
    }

    if (!resumeData) {
      const qdrantResult = await qdrantClient.retrieve('resumes', {
        ids: [resumeId as string],
        with_payload: true,
      });

      if (qdrantResult && qdrantResult.length > 0) {
        resumeData = qdrantResult[0].payload;
      }
    }

    if (!resumeData) {
      return NextResponse.json(
        { error: 'Resume data not found' },
        { status: 404 }
      );
    }

    // Increment regeneration count
    const newRegenerationCount = coverLetter.regenerationCount + 1;

    // Generate new cover letter
    const generatedText = await generateCoverLetter({
      resumeData: {
        name: resumeData.name || '',
        email: resumeData.email || '',
        skills: resumeData.skills || [],
        experience: resumeData.experience || [],
        summary: resumeData.summary || '',
        totalExperienceYears: resumeData.totalExperienceYears || 0,
      },
      jobData: {
        title: jobTitle || 'Position',
        company: company || 'Company',
        description: description || '',
        requirements: requirements || null,
      },
    });

    // Update cover letter
    const updated = await prisma.coverLetter.update({
      where: { id },
      data: {
        generatedText,
        finalText: null, // Reset final text on regeneration
        isEdited: false,
        promptVersion: 'v1',
        regenerationCount: newRegenerationCount,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      coverLetter: {
        id: updated.id,
        generatedText: updated.generatedText,
        finalText: updated.finalText,
        isEdited: updated.isEdited,
        promptVersion: updated.promptVersion,
        regenerationCount: updated.regenerationCount,
        canRegenerate: updated.regenerationCount < 4,
      },
    });
  } catch (error: any) {
    console.error('Error regenerating cover letter:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

