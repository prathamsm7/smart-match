/**
 * Interviews Service
 * Handles all interview-related API calls
 */

export const interviewsService = {
  /**
   * Request an interview report
   */
  async requestInterviewReport(interviewId: string) {
    const response = await fetch('/api/interview/report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ interviewId }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch interview report');
    }

    return {
      report: data.report,
      role: data.role,
    };
  },

  /**
   * Fetch all interviews for a user
   */
  async fetchInterviews(userId: string) {
    const response = await fetch(`/api/interview?userId=${userId}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch interviews');
    }

    return data.interviews || [];
  },

  /**
   * Update interview status
   */
  async updateInterviewStatus(interviewId: string, status: string) {
    const response = await fetch(`/api/interview/${interviewId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to update interview status');
    }

    return data.interview;
  },

  /**
   * Fetch interview data (user and job details)
   */
  async fetchInterviewData(interviewId: string) {
    const response = await fetch(`/api/interview/${interviewId}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch interview data');
    }

    return {
      userData: data.userData,
      jobData: data.jobData,
    };
  },

  /**
   * Persist conversation to the backend
   */
  async persistConversation(interviewId: string, messages: any[], type: string) {
    const response = await fetch('/api/interview/conversation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        interviewId,
        messages,
        type,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to persist conversation');
    }

    return data;
  },
};
