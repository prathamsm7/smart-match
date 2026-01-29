import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import redisClient from '@/lib/redisClient';
import { qdrantClient } from '@/lib/clients';
import { generateCoverLetter } from '@/lib/coverLetterHelper';

// GET - Fetch existing cover letter by jobId
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const { user: dbUser, error } = await authenticateRequest();
    if (error) return error;

    // Get jobId from query params
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    // 4. Find existing cover letter for this job
    const coverLetter = await prisma.coverLetter.findFirst({
      where: {
        userId: dbUser.id,
        jobId: jobId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!coverLetter) {
      return NextResponse.json({
        success: true,
        coverLetter: null,
      });
    }

    return NextResponse.json({
      success: true,
      coverLetter: {
        id: coverLetter.id,
        generatedText: coverLetter.generatedText,
        finalText: coverLetter.finalText,
        isEdited: coverLetter.isEdited,
        promptVersion: coverLetter.promptVersion,
        regenerationCount: coverLetter.regenerationCount,
        canRegenerate: coverLetter.regenerationCount < 4,
      },
    });
  } catch (error: any) {
    console.error('Error fetching cover letter by jobId:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Generate new cover letter
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const { user: dbUser, error } = await authenticateRequest();
    if (error) return error;

    // Get request body
    const { resumeId, jobId, jobTitle, company, description, requirements } = await request.json();

    if (!resumeId || !jobId) {
      return NextResponse.json(
        { error: 'Resume ID and Job ID are required' },
        { status: 400 }
      );
    }

    // 4. Find Resume by vectorId
    const resumeDbData = await prisma.resume.findFirst({
      where: {
        vectorId: resumeId as string,
        userId: dbUser.id
      }
    });

    if (!resumeDbData) {
      return NextResponse.json(
        { error: 'Resume not found or does not belong to user' },
        { status: 404 }
      );
    }

    // 5. Get resume data
    let resumeData = resumeDbData.json as any;

    if (!resumeData) {
      // Try Redis cache
      const cachedData = await redisClient.get(`resumeData:${resumeId}`);
      if (cachedData) {
        const parsed = typeof cachedData === 'string' ? JSON.parse(cachedData) : cachedData;
        resumeData = parsed.resumeData || parsed;
      }
    }

    if (!resumeData) {
      // Try Qdrant
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

    // 6. Generate cover letter
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

    // 7. Create new cover letter
    const coverLetter = await prisma.coverLetter.create({
      data: {
        userId: dbUser.id,
        jobId: jobId,
        generatedText,
        promptVersion: 'v1',
        regenerationCount: 0,
      },
    });

    return NextResponse.json({
      success: true,
      coverLetter: {
        id: coverLetter.id,
        generatedText: coverLetter.generatedText,
        finalText: coverLetter.finalText,
        isEdited: coverLetter.isEdited,
        promptVersion: coverLetter.promptVersion,
        regenerationCount: coverLetter.regenerationCount,
        canRegenerate: coverLetter.regenerationCount < 4, // Max 5 total (0-4 regenerations)
      },
    });
  } catch (error: any) {
    console.error('Error generating cover letter:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

