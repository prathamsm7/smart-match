interface InterviewDataResult {
    userData: any | null;
    jobData: any | null;
}

export const interviewsService = {
    async updateInterviewStatus(interviewId: string, status: string) {
        const response = await fetch(`/api/interview/${interviewId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data?.error || "Failed to update interview status");
        }

        return data;
    },

    async persistConversation(
        interviewId: string,
        chat: Array<{ role: string; text: string; via: string; timestamp?: number }>,
        stage: "snapshot" | "final",
    ): Promise<void> {
        const response = await fetch("/api/interview/conversation", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                interviewId,
                chat,
                stage,
            }),
        });

        if (!response.ok) {
            const data = await response.json().catch(() => null);
            throw new Error(data?.error || "Failed to persist conversation");
        }
    },
    async fetchInterviewData(interviewId: string): Promise<InterviewDataResult> {
        const response = await fetch(`/api/interview/${interviewId}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data?.error || "Failed to fetch interview data");
        }

        const interview = data.interview;
        let userData: any | null = null;
        let jobData: any | null = null;

        if (interview?.application?.snapshot) {
            const snapshot = interview.application.snapshot as any;
            userData = {
                name: snapshot.applicantName || "Unknown",
                email: snapshot.applicantEmail || "",
                phone: snapshot.applicantPhone || "",
                skills: snapshot.applicantSkills || [],
                summary: snapshot.applicantSummary || "",
                location: snapshot.applicantCity || "",
                languages: snapshot.applicantLanguages || [],
                experience: snapshot.applicantExperience || [],
                totalExperienceYears: snapshot.applicantTotalExperienceYears || 0,
                projects: snapshot.applicantProjects || [],
                softSkills: snapshot.applicantSoftSkills || [],
            };
        } else if (interview?.application?.resumeId) {
            try {
                const resumeResponse = await fetch(
                    `/api/resumes/${interview.application.resumeId}`,
                );
                if (resumeResponse.ok) {
                    userData = await resumeResponse.json();
                }
            } catch (resumeError) {
                console.error("Error fetching resume:", resumeError);
            }
        }

        if (interview?.application?.job) {
            const job = interview.application.job;
            jobData = {
                title: job.title || "",
                employerName: job.employerName || "",
                description: job.description || "",
                requirements: job.requirements || "",
                responsibilities: job.responsibilities || "",
                location: job.location || "",
            };
        }

        return { userData, jobData };
    },

    async requestInterviewReport(interviewId: string) {
        const response = await fetch("/api/interview/report", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ interviewId }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data?.error || "Report generation failed");
        }

        const payload = data?.report;
        const role = data?.role || "candidate";

        if (!payload) {
            throw new Error("Report payload is missing.");
        }

        if (typeof payload === "string") {
            try {
                return { report: JSON.parse(payload), role };
            } catch {
                throw new Error("Received malformed report payload.");
            }
        }

        if (typeof payload === "object") {
            return { report: payload, role };
        }

        throw new Error("Unexpected report payload format.");
    },
};
