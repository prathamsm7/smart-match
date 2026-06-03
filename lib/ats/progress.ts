export type ATSStepStatus = "pending" | "running" | "done";

export interface ATSScanStep {
    label: string;
    status: ATSStepStatus;
}

export const ATS_SCAN_LABELS = [
    "Document parsing",
    "ATS compatibility",
    "Keyword analysis",
    "Section scoring",
    "AI recommendations",
] as const;

export type ATSProgressEvent =
    | { type: "progress"; status: ATSStepStatus; label: string }
    | { type: "complete"; draftId: string; analysis: unknown; resumeData: unknown; fileName: string }
    | { type: "error"; message: string };

export function initialScanSteps(): ATSScanStep[] {
    return ATS_SCAN_LABELS.map((label) => ({ label, status: "pending" }));
}

export function progressEvent(
    label: string,
    status: ATSStepStatus
): Extract<ATSProgressEvent, { type: "progress" }> {
    return { type: "progress", status, label };
}

/** Labels to mark done when a graph node finishes */
export const NODE_DONE_LABELS: Record<string, string[]> = {
    parseDocument: ["Document parsing", "ATS compatibility"],
    analyzeResume: ["Keyword analysis", "Section scoring"],
    recommendations: ["AI recommendations"],
};
