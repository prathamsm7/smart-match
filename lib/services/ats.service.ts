import type { ATSAnalysis } from "@/types";

export interface ATSAnalyzeResponse {
    draftId: string;
    analysis: ATSAnalysis;
    resumeData: any;
    fileName: string;
}

export const atsService = {
    async analyzeResume(file: File): Promise<ATSAnalyzeResponse> {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/ats/analyze", {
            method: "POST",
            body: formData,
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data?.error || "Failed to analyze resume");
        }
        return data;
    },

    async moveToDashboard(draftId: string): Promise<{ success: boolean; resumeId: string }> {
        const response = await fetch("/api/ats/move-to-dashboard", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ draftId }),
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data?.error || "Failed to move resume to dashboard");
        }
        return data;
    },

    async getATSAnalysis(resumeId: string): Promise<ATSAnalysis> {
        const response = await fetch(`/api/resumes/${resumeId}/ats-analysis`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data?.error || "Failed to fetch ATS analysis");
        }
        return data;
    },

    async getJobTargetedATS(resumeId: string, jobId: string): Promise<any> {
        const response = await fetch(`/api/resumes/${resumeId}/ats-analysis/${jobId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data?.error || "Failed to fetch job targeted ATS analysis");
        }
        return data;
    },
};
