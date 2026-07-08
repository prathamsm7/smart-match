import { Annotation, StateGraph, START, END } from "@langchain/langgraph";
import type { GraphNode } from "@langchain/langgraph";
import type { ATSAnalysis, JobTargetedATSAnalysis, Resume } from "@/types";
import { extractResume, analyzeResume } from "./llm";
import { buildFinalAnalysis, buildFinalJobAnalysis } from "./normalize";
import type { LLMAnalysis } from "./types";
import {
    ATS_SCAN_LABELS,
    NODE_DONE_LABELS,
    progressEvent,
    type ATSProgressEvent,
} from "./progress";
import { extractResumeWithLlama } from "@/lib/llama";

export type ATSWorkflowResult = {
    resumeText: string;
    resumeData: Resume;
    analysis: ATSAnalysis | JobTargetedATSAnalysis;
};

export type ATSWorkflowInput = {
    resumeText?: string;
    fileBuffer?: Buffer;
    jobDescription?: string;
};

const ATSState = Annotation.Root({
    resumeText: Annotation<string | undefined>,
    fileBuffer: Annotation<Buffer | undefined>,
    jobDescription: Annotation<string | undefined>,
    resumeData: Annotation<Resume | undefined>,
    rawAnalysis: Annotation<LLMAnalysis | undefined>,
    analysis: Annotation<ATSAnalysis | JobTargetedATSAnalysis | undefined>,
    error: Annotation<string | undefined>,
});

/** PDF bytes or pasted text → plain resume text */
const extractTextNode: GraphNode<typeof ATSState> = async (state) => {
    try {
        if (state.fileBuffer) {
            const extracted = await extractResumeWithLlama(state.fileBuffer);
            return {
                resumeText: extracted.resumeData.summary || "PDF resume",
                resumeData: extracted.resumeData,
                error: undefined,
            };
        }
        const text = state.resumeText?.trim() ?? "";
        if (!text) {
            return { error: "Resume text is empty" };
        }
        return { resumeText: text, error: undefined };
    } catch (err) {
        return {
            error: err instanceof Error ? err.message : "Resume text extraction failed",
        };
    }
};

/** Resume text → structured JSON */
const parseDocumentNode: GraphNode<typeof ATSState> = async (state) => {
    if (state.error || !state.resumeText || state.resumeData) return {};
    try {
        const resumeData = await extractResume(state.resumeText);
        return { resumeData, error: undefined };
    } catch (err) {
        return { error: err instanceof Error ? err.message : "Resume data extraction failed" };
    }
};

const analyzeResumeNode: GraphNode<typeof ATSState> = async (state) => {
    if (state.error || !state.resumeData) return {};
    try {
        const rawAnalysis = await analyzeResume(state.resumeData, state.jobDescription);
        return { rawAnalysis, error: undefined };
    } catch (err) {
        return { error: err instanceof Error ? err.message : "Analysis failed" };
    }
};

const recommendationsNode: GraphNode<typeof ATSState> = async (state) => {
    if (state.error || !state.rawAnalysis) return {};
    try {
        const analysis = state.jobDescription?.trim()
            ? buildFinalJobAnalysis(state.rawAnalysis)
            : buildFinalAnalysis(state.rawAnalysis);
        return { analysis, error: undefined };
    } catch (err) {
        return { error: err instanceof Error ? err.message : "Recommendations failed" };
    }
};

const compiledGraph = new StateGraph(ATSState)
    .addNode("extractText", extractTextNode)
    .addNode("parseDocument", parseDocumentNode)
    .addNode("analyzeResume", analyzeResumeNode)
    .addNode("recommendations", recommendationsNode)
    .addEdge(START, "extractText")
    .addEdge("extractText", "parseDocument")
    .addEdge("parseDocument", "analyzeResume")
    .addEdge("analyzeResume", "recommendations")
    .addEdge("recommendations", END)
    .compile();

const NODE_ORDER = ["extractText", "parseDocument", "analyzeResume", "recommendations"] as const;

function graphInput(input: ATSWorkflowInput) {
    const jd = input.jobDescription?.trim();
    return {
        resumeText: input.resumeText?.trim() || undefined,
        fileBuffer: input.fileBuffer,
        jobDescription: jd || undefined,
    };
}

function assertWorkflowInput(input: ATSWorkflowInput) {
    if (!input.fileBuffer && !input.resumeText?.trim()) {
        throw new Error("Either file or resume text is required");
    }
}

async function invokeGraph(input: ATSWorkflowInput) {
    assertWorkflowInput(input);
    return compiledGraph.invoke(graphInput(input));
}

export async function* streamATSAgent(
    input: ATSWorkflowInput
): AsyncGenerator<ATSProgressEvent, ATSWorkflowResult> {
    assertWorkflowInput(input);

    yield progressEvent(ATS_SCAN_LABELS[0], "running");

    const initial = graphInput(input);
    const stream = await compiledGraph.stream(initial, { streamMode: "updates" });

    type GraphState = Awaited<ReturnType<typeof invokeGraph>>;
    let merged: Partial<GraphState> = { ...initial };

    for await (const update of stream) {
        const updateRecord = update as Record<string, Partial<GraphState>>;
        const nodeName = Object.keys(updateRecord)[0];
        if (!nodeName || !NODE_ORDER.includes(nodeName as (typeof NODE_ORDER)[number])) {
            continue;
        }

        merged = { ...merged, ...updateRecord[nodeName] };

        for (const label of NODE_DONE_LABELS[nodeName] ?? []) {
            yield progressEvent(label, "done");
        }

        const nextIndex = NODE_ORDER.indexOf(nodeName as (typeof NODE_ORDER)[number]) + 1;
        const nextNode = NODE_ORDER[nextIndex];
        const nextLabel = nextNode ? NODE_DONE_LABELS[nextNode]?.[0] : undefined;
        if (nextLabel) {
            yield progressEvent(nextLabel, "running");
        }
    }

    const finalState = merged as GraphState;
    if (finalState.error) throw new Error(finalState.error);
    if (!finalState.resumeText || !finalState.resumeData || !finalState.analysis) {
        throw new Error("ATS workflow returned incomplete result");
    }

    return {
        resumeText: finalState.resumeText,
        resumeData: finalState.resumeData,
        analysis: finalState.analysis,
    };
}

export async function runATSAgent(input: ATSWorkflowInput): Promise<ATSWorkflowResult> {
    const state = await invokeGraph(input);
    if (state.error) throw new Error(state.error);
    if (!state.resumeText || !state.resumeData || !state.analysis) {
        throw new Error("ATS workflow returned incomplete result");
    }
    return {
        resumeText: state.resumeText,
        resumeData: state.resumeData,
        analysis: state.analysis,
    };
}
