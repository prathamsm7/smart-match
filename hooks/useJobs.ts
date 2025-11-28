import { useState, useEffect, useCallback } from "react";
import { Job } from "@/types";
import { jobsService } from "@/lib/services";

export function useJobs(userId: string) {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchJobs = useCallback(async () => {
        try {
            setLoading(true);
            const data = await jobsService.fetchJobs({ myJobs: true });
            setJobs(data.jobs || []);
        } catch (err: any) {
            console.error("Error fetching jobs:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchJobs();
    }, [fetchJobs]);

    const deleteJob = async (jobId: string) => {
        try {
            await jobsService.deleteJob(jobId);
            setJobs((prev) => prev.filter((job) => job.id !== jobId));
            return true;
        } catch (err: any) {
            console.error("Error deleting job:", err);
            throw err;
        }
    };

    return { jobs, loading, error, fetchJobs, deleteJob };
}
