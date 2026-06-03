import type { ATSAnalysis } from "@/types";
import type { ATSProgressEvent } from "@/lib/ats/progress";

export interface ATSAnalyzeResponse {
    draftId: string;
    analysis: ATSAnalysis;
    resumeData: unknown;
    fileName: string;
}

function parseSSEChunk(buffer: string): { events: ATSProgressEvent[]; rest: string } {
    const events: ATSProgressEvent[] = [];
    const parts = buffer.split("\n\n");
    const rest = parts.pop() ?? "";

    for (const part of parts) {
        const line = part
            .split("\n")
            .find((l) => l.startsWith("data: "));
        if (!line) continue;
        try {
            events.push(JSON.parse(line.slice(6)) as ATSProgressEvent);
        } catch {
            /* ignore malformed chunks */
        }
    }

    return { events, rest };
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

    async analyzeResumeWithProgress(
        file: File,
        onProgress: (event: ATSProgressEvent) => void
    ): Promise<ATSAnalyzeResponse> {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/ats/analyze?stream=1", {
            method: "POST",
            body: formData,
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data?.error || "Failed to analyze resume");
        }

        if (!response.body) {
            throw new Error("No response stream from ATS analyze");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let result: ATSAnalyzeResponse | null = null;

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const { events, rest } = parseSSEChunk(buffer);
            buffer = rest;

            for (const event of events) {
                if (event.type === "error") {
                    throw new Error(event.message);
                }
                if (event.type === "complete") {
                    result = {
                        draftId: event.draftId,
                        analysis: event.analysis as ATSAnalysis,
                        resumeData: event.resumeData,
                        fileName: event.fileName,
                    };
                }
                onProgress(event);
            }
        }

        if (!result) {
            throw new Error("ATS analysis finished without a result");
        }

        return result;
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

    async getJobTargetedATS(resumeId: string, jobId: string): Promise<unknown> {
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
