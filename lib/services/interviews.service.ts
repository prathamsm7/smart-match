/**
 * Interviews Service
 * Handles all interview-related API calls
 */

type InterviewSessionPayload = {
  interview: unknown;
  userData: any;
  jobData: any;
};

/** Dedupes concurrent identical GETs (e.g. React Strict Mode double-mount). */
const inflightSessionFetches = new Map<
  string,
  Promise<InterviewSessionPayload>
>();

export const interviewsService = {
  /**
   * Request an interview report
   */
  async requestInterviewReport(interviewId: string) {
    const response = await fetch("/api/interview/report", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ interviewId }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch interview report");
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
      throw new Error(data.error || "Failed to fetch interviews");
    }

    return data.interviews || [];
  },

  /**
   * Update interview status
   */
  async updateInterviewStatus(interviewId: string, status: string) {
    const response = await fetch(`/api/interview/${interviewId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to update interview status");
    }

    return data.interview;
  },

  /**
   * Single fetch for live session bootstrap (profiles + server-side eligibility).
   * Concurrent callers for the same id share one in-flight request.
   */
  async fetchInterviewData(interviewId: string) {
    const existing = inflightSessionFetches.get(interviewId);
    if (existing) return existing;

    const request = (async (): Promise<InterviewSessionPayload> => {
      const response = await fetch(`/api/interview/${interviewId}?ready=1`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch interview data");
      }

      return {
        interview: data.interview,
        userData: data.userData,
        jobData: data.jobData,
      };
    })().finally(() => {
      inflightSessionFetches.delete(interviewId);
    });

    inflightSessionFetches.set(interviewId, request);
    return request;
  },

  /**
   * Persist conversation to the backend
   */
  async persistConversation(
    interviewId: string,
    messages: any[],
    type: string,
  ) {
    const response = await fetch("/api/interview/conversation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        interviewId,
        chat: messages,
        stage: type,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to persist conversation");
    }

    return data;
  },
};
