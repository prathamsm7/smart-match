import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/superbase/server";
import redisClient from "@/lib/redisClient";
import { qdrantClient } from "@/lib/agents";


export async function POST(request: NextRequest) {
    try {
        // 1. Get authenticated user
        const supabase = await createServerSupabase();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // 2. Find user in database
        const dbUser = await prisma.user.findUnique({
            where: { email: user.email! },
        });

        if (!dbUser) {
            return NextResponse.json(
                { error: 'User not found in database' },
                { status: 404 }
            );
        }

        // 3. Get request body
        const { jobId, resumeId, jobTitle, employerName, jobDescription, jobRequirements } = await request.json();

        if (!jobId || !resumeId) {
            return NextResponse.json(
                { error: 'Job ID and resume ID are required' },
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

        // 5. Validate resume exists
        if (!resumeDbData) {
            return NextResponse.json(
                { error: 'Resume not found or does not belong to user' },
                { status: 404 }
            );
        }

        // 6. Get resume data (prefer database, fallback to cache/Qdrant)
        let resumeData = resumeDbData.json;

        // Try Redis cache if database doesn't have it
        if (!resumeData) {
            const cachedData = await redisClient.get(`resumeData:${resumeId}`);
            if (cachedData) {
                if (typeof cachedData === 'string') {
                    const parsed = JSON.parse(cachedData);
                    resumeData = parsed.resumeData || parsed;
                } else {
                    resumeData = (cachedData as any).resumeData || cachedData;
                }
            }
        }

        // Try Qdrant if still not found
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

        // 7. Ensure Job exists (create if it doesn't exist - lazy creation)
        let job = await prisma.job.findUnique({
            where: { id: jobId },
        });

        if (!job) {
            // Lazy creation: Create job in PostgreSQL when user applies
            // Note: This job won't have a vector in Qdrant yet, but that's okay
            // The job can be re-indexed later if needed
            job = await prisma.job.create({
                data: {
                    id: jobId,
                    title: jobTitle || 'Unknown Job',
                    employerName: employerName || null,
                    description: jobDescription || null,
                    requirements: jobRequirements || null,
                    location: null, // Not provided in request
                    salary: null, // Not provided in request
                    employmentType: null, // Not provided in request
                    applyLink: null, // Not provided in request
                    responsibilities: null, // Not provided in request
                },
            });
            console.log(`✅ Created job ${jobId} in PostgreSQL (lazy creation)`);
        }

        // 8. Create JobApplication
        const application = await prisma.jobApplication.create({
            data: {
                userId: dbUser.id,           // Database user ID
                resumeId: resumeDbData.id,   // Database resume ID (validated above)
                jobId: jobId,                // Job ID (already a string)
                snapshot: {
                    "jobTitle": jobTitle,
                    "employerName": employerName,
                    "jobDescription": jobDescription,

                    "applicantCity": resumeData?.location,
                    "applicantName": resumeData?.name,
                    "applicantEmail": resumeData?.email,
                    "applicantSkills": resumeData?.skills,
                    "applicantSummary": resumeData?.summary,
                    "applicantLanguages": resumeData?.languages,
                    "applicantExperience": resumeData?.experience,
                    "applicantTotalExperienceYears": resumeData?.totalExperienceYears
                }
            }
        });

        return NextResponse.json({
            success: true,
            application: application
        });

    } catch (error: any) {
        console.error('Error creating application:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
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

        const applications = await prisma.jobApplication.findMany({
            where: { userId: dbUser.id },
            orderBy: { createdAt: 'desc' },
            include: {
                job: true,
                resume: {
                    select: {
                        id: true,
                        isPrimary: true,
                        createdAt: true
                    }
                }
            }
        });

        return NextResponse.json({
            success: true,
            applications
        });

    } catch (error: any) {
        console.error('Error fetching applications:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}