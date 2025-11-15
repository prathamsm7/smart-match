import { NextRequest, NextResponse } from 'next/server';
import { runMasterAgent } from '../../../../lib/backend';
import { extractTextFromPDFBuffer } from '../../../../lib/agents';

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

    // Extract resumeId from the result
    // The agent returns structured data, we need to find the resumeId
    let resumeId: string | null = null;

    // Try to extract resumeId from the agent's output
    // The agent should return the resumeId in the finalOutput or tool results
    if (result.finalOutput) {
      try {
        const output = JSON.parse(result.finalOutput);
        resumeId = output.resumeId || null;
      } catch {
        // If not JSON, try to extract from string
        const idMatch = result.finalOutput.match(/resumeId["\s:]+([a-f0-9-]+)/i);
        if (idMatch) {
          resumeId = idMatch[1];
        }
      }
    }

    // If we can't find it in finalOutput, check tool calls
    if (!resumeId && result.toolCalls) {
      for (const call of result.toolCalls) {
        if (call.toolName === 'uploadResume' && call.result?.resumeId) {
          resumeId = call.result.resumeId;
          break;
        }
      }
    }

    if (!resumeId) {
      return NextResponse.json(
        { error: 'Failed to create resume. Please try again.' },
        { status: 500 }
      );
    }

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

