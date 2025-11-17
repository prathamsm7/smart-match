import { NextRequest, NextResponse } from 'next/server';
import { runMasterAgent } from '@/lib/backend';
import { extractTextFromPDFBuffer } from '@/lib/agents';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const resumeText = formData.get('resumeText') as string | null;

    if (!file && !resumeText) {
      return NextResponse.json(
        { error: 'Please provide either a file or resume text' },
        { status: 400 }
      );
    }

    let text = resumeText || '';

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
    });

    // The master agent is instructed to return:
    // { "resumeId": "<id>", "matches": [...] }
    let resumeId: string | null = null;
    let parsedOutput: any = null;

    if (result.finalOutput) {
      try {
        parsedOutput = JSON.parse(result.finalOutput as string);
        resumeId = parsedOutput?.resumeId || null;
      } catch {
        // If parsing fails, we fall back to toolCalls below
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

    console.log("🚀 ~ POST ~ resumeId:", resumeId)
    if (!resumeId) {
      return NextResponse.json(
        { error: 'Failed to create resume. Please try again.' },
        { status: 500 }
      );
    }

    const resume = await prisma.resume.create({
      data: {
        userId: "123",
        vectorId: resumeId
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

