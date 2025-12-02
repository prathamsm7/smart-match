interface UploadResumeOptions {
    skipJobSearch?: boolean;
}

export const resumesService = {
    async fetchResumes(options?: { cache?: RequestCache; revalidate?: number }) {
        const response = await fetch('/api/resumes', {
            next: { revalidate: options?.revalidate || 900 },
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch resumes');
        }

        return data;
    },

    async uploadResume(file: File, options: UploadResumeOptions = {}) {
        const formData = new FormData();
        formData.append('file', file);

        if (options.skipJobSearch) {
            formData.append('skipJobSearch', 'true');
        }

        const response = await fetch('/api/resumes/upload', {
            method: 'POST',
            body: formData,
        });

        // Check if response has content before parsing
        if (!response.ok) {
            let errorMessage = 'Failed to upload resume';
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorMessage;
            } catch (e) {
                // If JSON parsing fails, check if it's a timeout
                if (response.status === 504 || response.status === 408) {
                    errorMessage = 'Resume processing timed out. Please try again or contact support.';
                } else {
                    errorMessage = `Server error (${response.status}): ${response.statusText}`;
                }
            }
            throw new Error(errorMessage);
        }

        try {
            const data = await response.json();
            return data;
        } catch (e) {
            throw new Error('Invalid response from server. Please try again.');
        }
    },

    async setPrimaryResume(resumeId: string) {
        const response = await fetch('/api/resumes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ resumeId }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to set primary resume');
        }

        return data;
    },

    async deleteResume(id: string) {
        const response = await fetch(`/api/resumes/${id}`, {
            method: 'DELETE',
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to delete resume');
        }

        return data;
    },

    async fetchResumeById(id: string) {
        const response = await fetch(`/api/resumes/${id}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch resume');
        }

        return data;
    },

    async fetchResumeMatches(resumeId: string, jobId: string, vectorScore: number) {
        const response = await fetch(`/api/resumes/${resumeId}/matches/${jobId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ vectorScore }),
        });

        // Check if response has content before parsing
        if (!response.ok) {
            let errorMessage = 'Failed to fetch job details';
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorMessage;
            } catch (e) {
                // If JSON parsing fails, check if it's a timeout
                if (response.status === 504 || response.status === 408) {
                    errorMessage = 'Match calculation timed out. Please try again or contact support.';
                } else {
                    errorMessage = `Server error (${response.status}): ${response.statusText}`;
                }
            }
            throw new Error(errorMessage);
        }

        try {
            const data = await response.json();
            return data;
        } catch (e) {
            throw new Error('Invalid response from server. Please try again.');
        }
    },
};
