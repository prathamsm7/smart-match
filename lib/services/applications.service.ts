interface CreateApplicationData {
    jobId: string;
    resumeId: string;
    jobTitle?: string;
    employerName?: string;
    jobDescription?: string;
    jobRequirements?: any;
    matchScore?: number;
    coverLetterId?: string;
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

    async updateApplicationStatus(applicationId: string, status: string) {
        const response = await fetch(`/api/applications/${applicationId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to update application status');
        }

        return data;
    },

    async markAsViewed(applicationId: string) {
        // This is a convenience method that updates status to VIEWED
        // Only works if current status is SUBMITTED
        const response = await fetch(`/api/applications/${applicationId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: 'VIEWED' }),
        });

        const data = await response.json();

        if (!response.ok) {
            // Silently fail - don't show error if already viewed or other status
            return null;
        }

        return data;
    },

    async withdrawApplication(applicationId: string) {
        const response = await fetch(`/api/applications/${applicationId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action: 'WITHDRAWN' }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to withdraw application');
        }

        return data;
    },
};
