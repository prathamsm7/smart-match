interface CreateApplicationData {
    jobId: string;
    resumeId: string;
    jobTitle?: string;
    employerName?: string;
    jobDescription?: string;
    jobRequirements?: any;
    matchScore?: number;
}

export const applicationsService = {
    async fetchApplications(options?: { cache?: RequestCache; revalidate?: number }) {
        const response = await fetch('/api/applications', {
            next: { revalidate: options?.revalidate || 900 },
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch applications');
        }

        return data;
    },

    async createApplication(applicationData: CreateApplicationData) {
        const response = await fetch('/api/applications', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(applicationData),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to apply for job');
        }

        return data;
    },

    async fetchJobApplications(jobId: string) {
        const response = await fetch(`/api/jobs/${jobId}/applications`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch applications');
        }

        return data;
    },
};
