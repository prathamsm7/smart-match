import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import redisClient from "@/lib/redisClient";
import { qdrantClient } from "@/lib/clients";
import { checkUsageLimit, incrementUsage } from "@/lib/usageHelper";
import { resolveApplicationSkillGap, skillGapToSnapshotFields } from "@/lib/applicationSkillGap";

export async function POST(request: NextRequest) {
    try {
        // 1. Authenticate user
        const { user: dbUser, error } = await authenticateRequest();
        if (error) return error;

        // 2. Check usage limit
        const { allowed, limit, used } = await checkUsageLimit(dbUser.id, 'application');
        if (!allowed) {
            return NextResponse.json({ 
                error: "Monthly application limit reached", 
                limit, 
                used,
                upgradeRequired: true 
            }, { status: 403 });
        }

        // 3. Get request body (matchScore is pre-computed from job search)
        const {
            jobId,
            resumeId,
            jobTitle,
            employerName,
            jobDescription,
            jobRequirements,
            matchScore,
            matchedSkills,
            missingSkills,
            matchReason,
            coverLetterId,
        } = await request.json();

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

        // 7. Resolve skill gap (from client, match cache, or skip LLM on apply)
        const skillGap = await resolveApplicationSkillGap(
            {
                matchedSkills: matchedSkills ?? [],
                missingSkills: missingSkills ?? [],
                matchReason: matchReason ?? '',
            },
            resumeData as Record<string, unknown>,
            {
                title: job.title,
                description: job.description,
                requirements: job.requirements,
                responsibilities: job.responsibilities,
                employerName: job.employerName,
            },
            resumeId as string,
            jobId,
            { allowLlm: false }
        );

        // 8. Verify cover letter exists and belongs to user if provided
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

        // 9. Create JobApplication with pre-computed match score + skill gap
        const application = await prisma.jobApplication.create({
            data: {
                userId: dbUser.id,
                resumeId: resumeDbData.id,
                jobId: jobId,
                matchScore: matchScore ? Math.round(matchScore) : null,
                coverLetterId: coverLetterId || null,
                snapshot: {
                    jobTitle: jobTitle,
                    employerName: employerName,
                    jobDescription: jobDescription,
                    applicantCity: (resumeData as any)?.location,
                    applicantName: (resumeData as any)?.name,
                    applicantEmail: (resumeData as any)?.email,
                    applicantSkills: (resumeData as any)?.skills,
                    applicantSummary: (resumeData as any)?.summary,
                    applicantLanguages: (resumeData as any)?.languages,
                    applicantExperience: (resumeData as any)?.experience,
                    applicantTotalExperienceYears: (resumeData as any)?.totalExperienceYears,
                    ...skillGapToSnapshotFields(skillGap),
                },
            },
        });

        // 10. Update cover letter with application ID if cover letter was provided
        if (coverLetterId) {
            await prisma.coverLetter.update({
                where: { id: coverLetterId },
                data: { applicationId: application.id },
            });
        }

        // 11. Increment usage
        await incrementUsage(dbUser.id, 'application');

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

export async function GET(_request: NextRequest) {
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