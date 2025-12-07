import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromPDFBuffer, runResumeAgent } from '@/lib/resumeHelper';
import { qdrantClient } from '@/lib/clients';
import { prisma } from '@/lib/prisma';
import { createServerSupabase } from '@/lib/superbase/server';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const resumeText = formData.get('resumeText') as string | null;
        const skipJobSearch = formData.get('skipJobSearch') === 'true';

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
        const {resumeId} = await runResumeAgent(text);
        console.log("🚀 ~ POST ~ result:", resumeId)

        // If successful, we need to associate the resume with the user
        if (resumeId) {
            const supabase = await createServerSupabase();
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                // Find user in our DB
                const dbUser = await prisma.user.findUnique({
                    where: { email: user.email! }
                });

                if (dbUser) {
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
                    }
                }
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
