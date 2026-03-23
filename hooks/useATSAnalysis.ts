"use client";

import { useCallback, useEffect, useState } from "react";
import type { ATSAnalysis, JobTargetedATSAnalysis } from "@/types";
import { atsService } from "@/lib/services/ats.service";

type AsyncState<T> = {
    data: T | null;
    loading: boolean;
    error: string | null;
};

export function useATSAnalysis(resumeId: string | null, options?: { enabled?: boolean }) {
    const [state, setState] = useState<AsyncState<ATSAnalysis>>({
        data: null,
        loading: !!(resumeId && options?.enabled !== false),
        error: null,
    });

    const run = useCallback(async () => {
        if (!resumeId || options?.enabled === false) return;
        setState((s) => ({ ...s, loading: true, error: null }));
        try {
            const data = await atsService.getATSAnalysis(resumeId);
            setState({ data, loading: false, error: null });
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Failed to analyze resume";
            setState({ data: null, loading: false, error: errorMessage });
        }
    }, [resumeId, options?.enabled]);

    useEffect(() => {
        const timer = setTimeout(() => {
            run();
        }, 0);
        return () => clearTimeout(timer);
    }, [run]);

    return { ...state, refetch: run };
}

export function useJobTargetedATS(
    resumeId: string | null,
    jobId: string | null,
    options?: { enabled?: boolean }
) {
    const [state, setState] = useState<AsyncState<JobTargetedATSAnalysis>>({
        data: null,
        loading: !!(resumeId && jobId && options?.enabled !== false),
        error: null,
    });

    const run = useCallback(async () => {
        if (!resumeId || !jobId || options?.enabled === false) return;
        setState((s) => ({ ...s, loading: true, error: null }));
        try {
            const data = await atsService.getJobTargetedATS(resumeId, jobId);
            setState({ data, loading: false, error: null });
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Failed to analyze against job";
            setState({ data: null, loading: false, error: errorMessage });
        }
    }, [resumeId, jobId, options?.enabled]);

    useEffect(() => {
        const timer = setTimeout(() => {
            run();
        }, 0);
        return () => clearTimeout(timer);
    }, [run]);

    return { ...state, refetch: run };
}
