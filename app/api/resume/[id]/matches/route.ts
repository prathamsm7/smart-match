import { NextRequest, NextResponse } from 'next/server';
import { runMasterAgent } from '@/lib/agents';
import redisClient from '@/lib/redisClient';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: resumeId } = await params;

    // const cachedKey = `jobs:${resumeId}`;
    // const cachedData = await redisClient.get(cachedKey);

    //!TODO: Uncomment this when we have a way to cache the matches
    // if (cachedData) {
    //   return NextResponse.json({
    //     success: true,
    //     matches: cachedData,
    //   });
    // }

    if (!resumeId) {
      return NextResponse.json(
        { error: 'Resume ID is required' },
        { status: 400 }
      );
    }

    // Call the master agent to search for jobs
    const result = await runMasterAgent({
      source: 'id',
      resumeId,
    });

    // Extract matches from the result
    let matches: any[] = [];

    // Try to extract from tool calls first (most reliable)
    const resultAny = result as any;
    if (resultAny.toolCalls) {
      for (const call of resultAny.toolCalls) {
        if (call.toolName === 'searchJobs' && call.result) {
          matches = Array.isArray(call.result) ? call.result : [];
          break;
        }
      }
    }

    // Fallback: try to parse from finalOutput if no tool calls found
    if (matches.length === 0 && result.finalOutput) {
      try {
        const output = JSON.parse(result.finalOutput);
        matches = Array.isArray(output) ? output : output.matches || [];
      } catch {
        // If parsing fails, matches stays empty
      }
    }

    // await redisClient.set(cachedKey, JSON.stringify(matches), { ex: 600 });

    return NextResponse.json({
      success: true,
      matches,
    });
  } catch (error: any) {
    console.error('Error fetching job matches:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

