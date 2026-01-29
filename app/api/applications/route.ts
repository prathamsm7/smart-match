import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import redisClient from "@/lib/redisClient";
import { qdrantClient } from "@/lib/clients";


export async function POST(request: NextRequest) {
    try {
        // 1. Authenticate user
        const { user: dbUser, error } = await authenticateRequest();
        if (error) return error;

        // 2. Get request body (matchScore is pre-computed from job search)
        const { jobId, resumeId, jobTitle, employerName, jobDescription, jobRequirements, matchScore, coverLetterId } = await request.json();

        if (!jobId || !resumeId) {
            return NextResponse.json(
                { error: 'Job ID and resume ID are required' },
                { status: 400 }
            );
        }

        // 3. Find Resume by vectorId
        const resumeDbData = await prisma.resume.findFirst({
            where: {
                vectorId: resumeId as string,
                userId: dbUser.id
            }
        });

        // 4. Validate resume exists
        if (!resumeDbData) {
            return NextResponse.json(
                { error: 'Resume not found or does not belong to user' },
                { status: 404 }
            );
        }

        // 5. Get resume data (prefer database, fallback to cache/Qdrant)
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

        // 6. Ensure Job exists (create if it doesn't exist - lazy creation)
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

        // 7. Verify cover letter exists and belongs to user if provided
        if (coverLetterId) {
            const coverLetter = await prisma.coverLetter.findUnique({
                where: { id: coverLetterId },
            });

            if (!coverLetter || coverLetter.userId !== dbUser.id) {
                return NextResponse.json(
                    { error: 'Cover letter not found or does not belong to user' },
                    { status: 404 }
                );
            }
        }

        // 8. Create JobApplication with pre-computed match score
        const application = await prisma.jobApplication.create({
            data: {
                userId: dbUser.id,           // Database user ID
                resumeId: resumeDbData.id,   // Database resume ID (validated above)
                jobId: jobId,                // Job ID (already a string)
                matchScore: matchScore ? Math.round(matchScore) : null,  // Pre-computed from job search
                coverLetterId: coverLetterId || null,  // Link cover letter if provided
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

        // 9. Update cover letter with application ID if cover letter was provided
        if (coverLetterId) {
            await prisma.coverLetter.update({
                where: { id: coverLetterId },
                data: { applicationId: application.id },
            });
        }

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
        // Authenticate user
        const { user: dbUser, error } = await authenticateRequest();
        if (error) return error;

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
                },
                interview: {
                    select: {
                        id: true,
                        status: true,
                        startedAt: true,
                        completedAt: true,
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