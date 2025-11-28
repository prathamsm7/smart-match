interface FetchJobsOptions {
    myJobs?: boolean;
}

interface CreateJobData {
    title: string;
    employerName?: string;
    description?: string;
    location?: string;
    salary?: string;
    employmentType?: string;
    requirements?: any;
    responsibilities?: any;
}

export const jobsService = {
    async fetchJobs(options: FetchJobsOptions = {}) {
        const params = new URLSearchParams();
        if (options.myJobs) {
            params.append('myJobs', 'true');
        }

        const url = `/api/jobs${params.toString() ? `?${params.toString()}` : ''}`;
        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch jobs');
        }

        return data;
    },

    async fetchJobById(id: string) {
        const response = await fetch(`/api/jobs/${id}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch job');
        }

        return data;
    },

    async createJob(jobData: CreateJobData) {
        const response = await fetch('/api/jobs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(jobData),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to create job');
        }

        return data;
    },

    async updateJob(id: string, jobData: Partial<CreateJobData>) {
        const response = await fetch(`/api/jobs/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(jobData),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to update job');
        }

        return data;
    },

    async deleteJob(id: string) {
        const response = await fetch(`/api/jobs/${id}`, {
            method: 'DELETE',
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to delete job');
        }

        return data;
    },

    async fetchJobMatches(options?: { cache?: RequestCache; revalidate?: number }) {
        const response = await fetch('/api/jobs/matches', {
            cache: options?.cache || 'force-cache',
            next: {
                revalidate: options?.revalidate || 300,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch job matches');
        }

        return data;
    },
};
