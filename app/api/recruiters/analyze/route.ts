import { NextRequest, NextResponse } from 'next/server';
import { analyzeCandidate } from '@/lib/recruiterSearchHelper';

/**
 * [POST] /api/recruiters/analyze
 * Performs a deep AI analysis for a specific candidate on-demand.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { resumeId, query } = body;

        console.log(`📥 [POST] /api/recruiters/analyze - ResumeId: ${resumeId} | Query: "${query}"`);

        if (!resumeId || typeof resumeId !== 'string') {
            return NextResponse.json(
                { error: 'resumeId is required' },
                { status: 400 }
            );
        }

        if (!query || typeof query !== 'string') {
            return NextResponse.json(
                { error: 'Search query is required' },
                { status: 400 }
            );
        }

        // Perform the AI analysis
        const analysis = await analyzeCandidate(resumeId, query);

        console.log(`✅ Analysis complete for Resume: ${resumeId}`);

        return NextResponse.json({
            resumeId,
            matchScore: analysis.matchScore,
            reason: analysis.reason,
            strengths: analysis.strengths,
            weaknesses: analysis.weaknesses,
            skills: analysis.skills,
            locationMatched: analysis.locationMatched
        });

    } catch (error: any) {
        console.error('❌ Error in /api/recruiters/analyze:', error);
        
        return NextResponse.json(
            { error: error.message || 'Internal server error during analysis' },
            { status: 500 }
        );
    }
}
