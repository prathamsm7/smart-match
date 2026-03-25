import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromPDFBuffer, runResumeAgent } from '@/lib/resumeHelper';
import { qdrantClient } from '@/lib/clients';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { checkUsageLimit, incrementUsage } from '@/lib/usageHelper';

export async function POST(request: NextRequest) {
    try {
        // 1. Authenticate user
        const { user: dbUser, error } = await authenticateRequest();
        if (error) return error;

        // 2. Check usage limit (Check BEFORE heavy processing)
        const { allowed, limit, used } = await checkUsageLimit(dbUser.id, 'resume_upload');
        if (!allowed) {
            return NextResponse.json({ 
                error: "Monthly resume upload limit reached", 
                limit, 
                used,
                upgradeRequired: true 
            }, { status: 403 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const resumeText = formData.get('resumeText') as string | null;

        if (!file && !resumeText) {
            return NextResponse.json(
                { error: 'Either file or resume text is required' },
                { status: 400 }
            );
        }

        let text = resumeText || '';
        if (file) {
            const buffer = Buffer.from(await file.arrayBuffer());
            text = await extractTextFromPDFBuffer(buffer);
        }

        // Run the master agent
        const {resumeId=''} = await runResumeAgent(text) as {resumeId?: string};
        console.log("🚀 ~ POST ~ result:", resumeId)

        // If successful, we need to associate the resume with the user
        if (resumeId) {
            // Get the resume data from Qdrant to save to Postgres
            const qdrantResult = await qdrantClient.retrieve('resumes', {
                ids: [resumeId],
                with_payload: true
            });

            if (qdrantResult && qdrantResult[0]) {
                const payload = qdrantResult[0].payload as any;

                // Check if this is the user's first resume
                const resumeCount = await prisma.resume.count({
                    where: { userId: dbUser.id }
                });

                // Save to Postgres
                await prisma.resume.create({
                    data: {
                        id: resumeId,
                        userId: dbUser.id,
                        vectorId: resumeId,
                        json: payload,
                        isPrimary: resumeCount === 0, // First resume is primary by default
                    }
                });

                // 3. Increment usage
                await incrementUsage(dbUser.id, 'resume_upload');
            }
        }

        return NextResponse.json({ resumeId });
    } catch (error: any) {
        console.error('Error processing resume:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
