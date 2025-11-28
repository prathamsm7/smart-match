import { useState, useCallback } from "react";
import { Application } from "@/types";
import { applicationsService } from "@/lib/services";

export function useApplications() {
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchApplications = useCallback(async (jobId: string) => {
        try {
            setLoading(true);
            setError(null);
            const data = await applicationsService.fetchJobApplications(jobId);
            setApplications(data.applications || []);
        } catch (err: any) {
            console.error("Error fetching applications:", err);
            setError(err.message);
            setApplications([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const clearApplications = useCallback(() => {
        setApplications([]);
        setError(null);
    }, []);

    return { applications, loading, error, fetchApplications, clearApplications };
}
