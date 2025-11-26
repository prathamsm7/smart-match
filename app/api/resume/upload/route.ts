import { NextRequest, NextResponse } from 'next/server';
import { runMasterAgent } from '@/lib/backend';
import { extractTextFromPDFBuffer, qdrantClient } from '@/lib/agents';
import { prisma } from '@/lib/prisma';
import { createServerSupabase } from '@/lib/superbase/server';

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

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const skipJobSearch = formData.get('skipJobSearch') === 'true'; // Check if job search should be skipped

    if (!file) {
      return NextResponse.json(
        { error: 'Please provide either a file or resume text' },
        { status: 400 }
      );
    }

    let text = '';

    // If file is provided, extract text from PDF
    if (file) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      text = await extractTextFromPDFBuffer(buffer);
    }

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Could not extract text from resume' },
        { status: 400 }
      );
    }

    // Call the master agent to process the resume
    const result = await runMasterAgent({
      source: 'file',
      resumeText: text,
      skipJobSearch: skipJobSearch,
    });

    // The master agent is instructed to return:
    // { "resumeId": "<id>", "matches": [...] }
    let resumeId: string | null = null;
    let parsedOutput: any = null;
    let resumeData: any = null;

    if (result.finalOutput) {
      try {
        parsedOutput = JSON.parse(result.finalOutput as string);
        resumeId = parsedOutput?.resumeId || null;
      } catch {
        // If parsing fails, we fall back to toolCalls below
      }
    }

    // Extract resumeData from extractResumeData tool call
    if (!resumeData) {
      try {
        // Retrieve from Qdrant using the resumeId
        const qdrantResult = await qdrantClient.retrieve('resumes', {
          ids: [resumeId as string],
          with_payload: true,
        });
        
        if (qdrantResult && qdrantResult.length > 0) {
          resumeData = qdrantResult[0].payload;
        }
      } catch (error) {
        console.error('Error retrieving resume from Qdrant:', error);
      }
    }

    // Fallback: if for some reason the agent didn't follow the contract,
    // try to recover resumeId from tool calls (uploadResume result)
    if (!resumeId && (result as any).toolCalls) {
      const resultAny = result as any;
      if (Array.isArray(resultAny.toolCalls)) {
        for (const call of resultAny.toolCalls) {
          const toolName = call.toolName || call.name;
          const toolResult = call.result || call.output || call.data;

          if (toolName === 'uploadResume' && toolResult?.resumeId) {
            resumeId = toolResult.resumeId;
            break;
          }
        }
      }
    }

    if (!resumeId) {
      return NextResponse.json(
        { error: 'Failed to create resume. Please try again.' },
        { status: 500 }
      );
    }

    console.log("🚀 ~ POST ~ resumeData:", resumeData)
    const resume = await prisma.resume.create({
      data: {
        userId: dbUser.id,
        vectorId: resumeId,
        json: resumeData
      },
    });

    return NextResponse.json({
      success: true,
      resumeId,
      message: 'Resume uploaded successfully',
    });
  } catch (error: any) {
    console.error('Error uploading resume:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

