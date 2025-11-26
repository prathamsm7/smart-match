import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createServerSupabase } from '@/lib/superbase/server';

// GET applications for a specific job
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // 3. Check if user is a recruiter
    if (dbUser.role !== 'recruiter') {
      return NextResponse.json(
        { error: 'Only recruiters can view job applications' },
        { status: 403 }
      );
    }

    // 4. Get job ID
    const { id } = await params;

    // 5. Check if job exists and belongs to user
    const job = await prisma.job.findUnique({
      where: { id },
    });

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    if (job.postedBy !== dbUser.id) {
      return NextResponse.json(
        { error: 'You can only view applications for your own jobs' },
        { status: 403 }
      );
    }

    // 6. Fetch applications for this job
    const applications = await prisma.jobApplication.findMany({
      where: { jobId: id },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        resume: {
          select: {
            id: true,
            json: true,
            vectorId: true,
          },
        },
      },
    });

    // Helper function to calculate match score
    function calculateMatchScore(candidateSkills: string[], jobRequirements: any, jobDescription: string | null): number {
      if (!candidateSkills || candidateSkills.length === 0) return 0;

      // Normalize skills to lowercase for comparison
      const normalizedCandidateSkills = candidateSkills.map(s => s.toLowerCase().trim());

      // Extract keywords from job requirements and description
      let jobKeywords: string[] = [];
      
      // From requirements (can be array or object)
      if (jobRequirements) {
        if (Array.isArray(jobRequirements)) {
          jobKeywords = jobRequirements.flatMap(req => 
            typeof req === 'string' ? req.toLowerCase().split(/[\s,]+/) : []
          );
        } else if (typeof jobRequirements === 'object') {
          jobKeywords = Object.values(jobRequirements).flatMap(val => 
            typeof val === 'string' ? val.toLowerCase().split(/[\s,]+/) : []
          );
        }
      }

      // From description
      if (jobDescription) {
        const descWords = jobDescription.toLowerCase().split(/[\s,.\-;:()]+/);
        jobKeywords = [...jobKeywords, ...descWords];
      }

      // Common tech keywords to look for
      const techKeywords = [
        'react', 'node', 'javascript', 'typescript', 'python', 'java', 'aws', 'docker',
        'kubernetes', 'mongodb', 'postgresql', 'mysql', 'redis', 'graphql', 'rest',
        'html', 'css', 'tailwind', 'next', 'vue', 'angular', 'express', 'django',
        'flask', 'spring', 'git', 'agile', 'scrum', 'ci/cd', 'devops', 'linux',
        'sql', 'nosql', 'api', 'microservices', 'cloud', 'azure', 'gcp'
      ];

      // Filter job keywords to tech-related ones
      const relevantJobKeywords = [...new Set(jobKeywords.filter(kw => 
        techKeywords.some(tk => kw.includes(tk) || tk.includes(kw))
      ))];

      if (relevantJobKeywords.length === 0) {
        // If no tech keywords found in job, base score on having skills at all
        return Math.min(50 + (candidateSkills.length * 5), 85);
      }

      // Calculate match
      let matchedCount = 0;
      for (const skill of normalizedCandidateSkills) {
        if (relevantJobKeywords.some(kw => skill.includes(kw) || kw.includes(skill))) {
          matchedCount++;
        }
      }

      // Base score calculation
      const matchRatio = matchedCount / Math.max(relevantJobKeywords.length, 1);
      const skillBonus = Math.min(candidateSkills.length * 2, 20); // Bonus for having more skills
      
      // Score between 40-98
      const score = Math.round(40 + (matchRatio * 40) + skillBonus);
      return Math.min(score, 98);
    }

    // 7. Format applications with snapshot data and match scores
    const formattedApplications = applications.map((app: typeof applications[0]) => {
      const snapshot = app.snapshot as any || {};
      const resumeJson = app.resume?.json as any || {};
      const candidateSkills = snapshot.applicantSkills || resumeJson.skills || [];
      
      // Calculate match score based on skills vs job requirements
      const matchScore = calculateMatchScore(
        candidateSkills,
        job.requirements,
        job.description
      );

      return {
        id: app.id,
        appliedDate: app.createdAt,
        matchScore,
        user: {
          id: app.user.id,
          name: snapshot.applicantName || app.user.name || 'Unknown',
          email: snapshot.applicantEmail || app.user.email,
        },
        candidate: {
          name: snapshot.applicantName || app.user.name || 'Unknown',
          email: snapshot.applicantEmail || app.user.email,
          phone: resumeJson.phone || snapshot.phone || null,
          city: snapshot.applicantCity || resumeJson.location || null,
          experience: snapshot.applicantTotalExperienceYears || resumeJson.totalExperienceYears || 0,
          skills: snapshot.applicantSkills || resumeJson.skills || [],
          summary: snapshot.applicantSummary || resumeJson.summary || '',
          languages: snapshot.applicantLanguages || resumeJson.languages || [],
          education: resumeJson.education || [],
          experience_details: snapshot.applicantExperience || resumeJson.experience || [],
          socialLinks: resumeJson.socialLinks || [],
          softSkills: resumeJson.softSkills || [],
          categorizedSkills: resumeJson.categorizedSkills || {},
        },
      };
    });

    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        title: job.title,
        employerName: job.employerName,
        location: job.location,
        salary: job.salary,
        description: job.description,
        employmentType: job.employmentType,
        createdAt: job.createdAt,
      },
      applications: formattedApplications,
      total: formattedApplications.length,
    });
  } catch (error: any) {
    console.error('Error fetching job applications:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

