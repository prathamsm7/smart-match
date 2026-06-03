import type { ATSAnalysis, Resume } from "@/types";
import { extractResume, analyzeResume } from "./llm";
import { buildFinalAnalysis } from "./normalize";
import { ATS_SCAN_LABELS, progressEvent, type ATSProgressEvent } from "./progress";

export async function* streamLegacyATS(
    resumeText: string
): AsyncGenerator<ATSProgressEvent, { resumeData: Resume; analysis: ATSAnalysis }> {
    yield progressEvent(ATS_SCAN_LABELS[0], "running");
    const resumeData = await extractResume(resumeText);
    yield progressEvent(ATS_SCAN_LABELS[0], "done");
    yield progressEvent(ATS_SCAN_LABELS[1], "done");

    yield progressEvent(ATS_SCAN_LABELS[2], "running");
    yield progressEvent(ATS_SCAN_LABELS[3], "running");
    const raw = await analyzeResume(resumeData);
    yield progressEvent(ATS_SCAN_LABELS[2], "done");
    yield progressEvent(ATS_SCAN_LABELS[3], "done");

    yield progressEvent(ATS_SCAN_LABELS[4], "running");
    const analysis = buildFinalAnalysis(raw);
    yield progressEvent(ATS_SCAN_LABELS[4], "done");

    return { resumeData, analysis };
}
