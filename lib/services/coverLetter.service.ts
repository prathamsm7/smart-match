interface CoverLetterData {
  id: string;
  generatedText: string;
  finalText: string | null;
  isEdited: boolean;
  regenerationCount: number;
  canRegenerate: boolean;
}

interface GenerateCoverLetterParams {
  resumeId: string;
  jobId: string;
  jobTitle: string;
  company: string;
  description: string;
  requirements?: string;
}

interface RegenerateCoverLetterParams {
  resumeId: string;
  jobTitle: string;
  company: string;
  description: string;
  requirements?: string;
}

export const coverLetterService = {
  async fetchByJobId(jobId: string): Promise<CoverLetterData | null> {
    const response = await fetch(`/api/cover-letters?jobId=${jobId}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch cover letter');
    }

    return data.coverLetter || null;
  },

  async generate(params: GenerateCoverLetterParams): Promise<CoverLetterData> {
    const response = await fetch('/api/cover-letters', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...params,
        requirements: params.requirements || null,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to generate cover letter');
    }

    return data.coverLetter;
  },

  async regenerate(
    coverLetterId: string,
    params: RegenerateCoverLetterParams
  ): Promise<CoverLetterData> {
    const response = await fetch(`/api/cover-letters/${coverLetterId}/regenerate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Maximum regeneration limit reached (5 total attempts)');
      }
      throw new Error(data.error || 'Failed to regenerate cover letter');
    }

    return data.coverLetter;
  },

  async update(coverLetterId: string, finalText: string): Promise<void> {
    const response = await fetch(`/api/cover-letters/${coverLetterId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ finalText }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to save cover letter');
    }
  },
};

// Export types for use in other files
export type { CoverLetterData, GenerateCoverLetterParams, RegenerateCoverLetterParams };
