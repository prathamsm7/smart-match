import { prisma } from "@/lib/prisma";
import { createServerSupabase } from "@/lib/superbase/server";
import type {
  InterviewCandidateProfile,
  InterviewJobProfile,
} from "@/lib/deepgram";

export type InterviewSessionProfiles = {
  candidateProfile: InterviewCandidateProfile;
  jobProfile: InterviewJobProfile;
  /** Full Prisma interview graph when callers need it (API). */
  interview: NonNullable<Awaited<ReturnType<typeof fetchInterviewRecord>>>;
};

export type LoadInterviewSessionResult =
  | { ok: true; data: InterviewSessionProfiles }
  | { ok: false; error: string; status: number };

type SessionAccess = "view" | "start";

async function fetchInterviewRecord(id: string) {
  return prisma.interview.findUnique({
    where: { id },
    include: {
      application: {
        include: {
          job: true,
          resume: {
            select: {
              id: true,
              json: true,
            },
          },
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

function buildProfiles(
  interview: NonNullable<Awaited<ReturnType<typeof fetchInterviewRecord>>>,
): Pick<InterviewSessionProfiles, "candidateProfile" | "jobProfile"> {
  const snapshot = interview.application.snapshot as Record<
    string,
    unknown
  > | null;
  const resumeData = interview.application.resume?.json as Record<
    string,
    unknown
  > | null;

  const candidateProfile: InterviewCandidateProfile = {
    name:
      (snapshot?.applicantName as string | undefined) ||
      interview.user.name ||
      (resumeData?.name as string | undefined) ||
      "Unknown",
    skills: snapshot?.applicantSkills || resumeData?.skills || [],
    experience: snapshot?.applicantExperience || resumeData?.experience || [],
    projects: resumeData?.projects || [],
    summary:
      (snapshot?.applicantSummary as string | undefined) ||
      (resumeData?.summary as string | undefined) ||
      "",
    totalExperienceYears:
      (snapshot?.applicantTotalExperienceYears as number | undefined) ||
      (resumeData?.totalExperienceYears as number | undefined) ||
      0,
  };

  const jobProfile: InterviewJobProfile = {
    title: interview.application.job.title,
    employerName: interview.application.job.employerName,
    description: interview.application.job.description,
    requirements: interview.application.job.requirements,
    responsibilities: interview.application.job.responsibilities,
  };

  return { candidateProfile, jobProfile };
}

/**
 * Load interview profiles on the server (RSC or API).
 * `access: "start"` enforces candidate ownership + startable statuses.
 */
export async function loadInterviewSession(
  interviewId: string,
  access: SessionAccess = "view",
): Promise<LoadInterviewSessionResult> {
  const supabase = await createServerSupabase();
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !authUser?.email) {
    return { ok: false, error: "Unauthorized", status: 401 };
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: authUser.email },
  });
  if (!dbUser) {
    return { ok: false, error: "User not found in database", status: 404 };
  }

  const interview = await fetchInterviewRecord(interviewId);
  if (!interview) {
    return { ok: false, error: "Interview not found", status: 404 };
  }

  const isOwner = interview.userId === dbUser.id;
  const isRecruiter =
    dbUser.role === "recruiter" &&
    interview.application.job.postedBy === dbUser.id;

  if (!isOwner && !isRecruiter) {
    return {
      ok: false,
      error: "Unauthorized to view this interview",
      status: 403,
    };
  }

  if (access === "start") {
    if (!isOwner) {
      return {
        ok: false,
        error: "Only the candidate can start this interview session",
        status: 403,
      };
    }
    if (interview.status !== "PENDING" && interview.status !== "IN_PROGRESS") {
      return {
        ok: false,
        error: `Interview cannot be started. Current status: ${interview.status}`,
        status: 409,
      };
    }
    if (
      interview.application.status !== "INTERVIEW" &&
      interview.application.status !== "HIRED"
    ) {
      return {
        ok: false,
        error: `Application status must be INTERVIEW or HIRED. Current status: ${interview.application.status}`,
        status: 409,
      };
    }
  }

  const { candidateProfile, jobProfile } = buildProfiles(interview);

  return {
    ok: true,
    data: {
      interview,
      candidateProfile,
      jobProfile,
    },
  };
}
