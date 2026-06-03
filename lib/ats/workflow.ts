import { Annotation, StateGraph, START, END } from "@langchain/langgraph";
import type { GraphNode } from "@langchain/langgraph";
import type { ATSAnalysis, Resume } from "@/types";
import { extractResume, analyzeResume } from "./llm";
import { buildFinalAnalysis } from "./normalize";
import type { LLMAnalysis } from "./types";
import {
    ATS_SCAN_LABELS,
    NODE_DONE_LABELS,
    progressEvent,
    type ATSProgressEvent,
} from "./progress";

const ATSState = Annotation.Root({
    resumeText: Annotation<string>,
    resumeData: Annotation<Resume | undefined>,
    rawAnalysis: Annotation<LLMAnalysis | undefined>,
    analysis: Annotation<ATSAnalysis | undefined>,
    error: Annotation<string | undefined>,
});

const parseDocumentNode: GraphNode<typeof ATSState> = async (state) => {
    try {
        const resumeData = await extractResume(state.resumeText);
        return { resumeData, error: undefined };
    } catch (err) {
        return { error: err instanceof Error ? err.message : "Document parsing failed" };
    }
};

const analyzeResumeNode: GraphNode<typeof ATSState> = async (state) => {
    if (state.error || !state.resumeData) return {};
    try {
        const rawAnalysis = await analyzeResume(state.resumeData);
        return { rawAnalysis, error: undefined };
    } catch (err) {
        return { error: err instanceof Error ? err.message : "Analysis failed" };
    }
};

const recommendationsNode: GraphNode<typeof ATSState> = async (state) => {
    if (state.error || !state.rawAnalysis) return {};
    try {
        const analysis = buildFinalAnalysis(state.rawAnalysis);
        return { analysis, error: undefined };
    } catch (err) {
        return { error: err instanceof Error ? err.message : "Recommendations failed" };
    }
};

const compiledGraph = new StateGraph(ATSState)
    .addNode("parseDocument", parseDocumentNode)
    .addNode("analyzeResume", analyzeResumeNode)
    .addNode("recommendations", recommendationsNode)
    .addEdge(START, "parseDocument")
    .addEdge("parseDocument", "analyzeResume")
    .addEdge("analyzeResume", "recommendations")
    .addEdge("recommendations", END)
    .compile();

const NODE_ORDER = ["parseDocument", "analyzeResume", "recommendations"] as const;

async function invokeGraph(resumeText: string) {
    const text = resumeText.trim();
    if (!text) throw new Error("Resume text is empty");
    return compiledGraph.invoke({ resumeText: text });
}

export async function* streamATSAgent(
    resumeText: string
): AsyncGenerator<ATSProgressEvent, { resumeData: Resume; analysis: ATSAnalysis }> {
    const text = resumeText.trim();
    if (!text) throw new Error("Resume text is empty");

    yield progressEvent(ATS_SCAN_LABELS[0], "running");

    const stream = await compiledGraph.stream(
        { resumeText: text },
        { streamMode: "updates" }
    );

    type GraphState = Awaited<ReturnType<typeof invokeGraph>>;
    let merged: Partial<GraphState> = { resumeText: text };

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
    if (!finalState.resumeData || !finalState.analysis) {
        throw new Error("ATS workflow returned incomplete result");
    }

    return { resumeData: finalState.resumeData, analysis: finalState.analysis };
}

export async function runATSAgent(resumeText: string): Promise<{
    resumeData: Resume;
    analysis: ATSAnalysis;
}> {
    const state = await invokeGraph(resumeText);
    if (state.error) throw new Error(state.error);
    if (!state.resumeData || !state.analysis) {
        throw new Error("ATS workflow returned incomplete result");
    }
    return { resumeData: state.resumeData, analysis: state.analysis };
}
