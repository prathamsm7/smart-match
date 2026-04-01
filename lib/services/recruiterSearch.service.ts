export const recruiterSearchService = {
  async searchCandidates(query: string) {
    const response = await fetch("/api/recruiters/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Search failed. Please try again.");
    }

    return response.json();
  },

  async analyzeCandidate(resumeId: string, query: string) {
    const response = await fetch("/api/recruiters/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resumeId, query }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Analysis failed. Please try again later.");
    }

    return response.json();
  },
};
