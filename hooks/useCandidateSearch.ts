import { useState, useCallback } from "react";
import { Candidate } from "@/components/recruiter/types";
import { recruiterSearchService } from "@/lib/services/recruiterSearch.service";

const PAGE_SIZE = 10;

export function useCandidateSearch() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invalidQueryReason, setInvalidQueryReason] = useState<string | null>(null);
  
  const [allResults, setAllResults] = useState<Candidate[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [activeQuery, setActiveQuery] = useState("");
  const [recentQueries, setRecentQueries] = useState<string[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const results = allResults.slice(0, visibleCount);

  const searchCandidates = useCallback(
    async (fallbackQuery?: string) => {
      const q = fallbackQuery ?? query;
      if (!q.trim()) return;

      setLoading(true);
      setError(null);
      setInvalidQueryReason(null);
      try {
        const data = await recruiterSearchService.searchCandidates(q);

        // Handle invalid query — show the contextual reason, don't populate results
        if (!data.success && data.inValidReason) {
          setInvalidQueryReason(data.inValidReason);
          setAllResults([]);
          setHasSearched(false);
          return;
        }

        const mappedCandidates: Candidate[] = (data.candidates || []).map(
          (c: any, idx: number) => ({
            id: c.id,
            name: c.name || "Candidate",
            title: c.experience?.[0]?.title || "Professional",
            location: c.location || "Remote",
            matchScore: c.matchScore || 0,
            summary: c.matchScore > 0 ? c.reason : c.summary || "No summary available",
            skills: c.skills?.slice(0, 6) || [],
            isTopMatch: idx === 0 && c.matchScore > 80,
            strengths: c.strengths || [],
            weaknesses: c.weaknesses || [],
          })
        );

        setAllResults(mappedCandidates);
        setVisibleCount(PAGE_SIZE);
        setActiveQuery(data.rewrittenQuery || q);
        setHasSearched(true);
        if (!recentQueries.includes(q)) {
          setRecentQueries((prev) => [q, ...prev].slice(0, 3));
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [query, recentQueries]
  );

  const analyzeCandidate = useCallback(
    async (resumeId: string) => {
      setAnalyzingId(resumeId);
      setError(null);
      try {
        const data = await recruiterSearchService.analyzeCandidate(
          resumeId,
          activeQuery || query
        );

        setAllResults((prev) =>
          prev.map((c) =>
            c.id === resumeId
              ? {
                  ...c,
                  matchScore: data.matchScore,
                  summary: data.reason,
                  strengths: data.strengths || [],
                  weaknesses: data.weaknesses || [],
                  skills: data.skills?.length > 0 ? data.skills.slice(0, 6) : c.skills,
                }
              : c
          )
        );
      } catch (err: any) {
        setError(err.message || "AI Analysis failed. Please try again later.");
      } finally {
        setAnalyzingId(null);
      }
    },
    [activeQuery, query]
  );

  const loadMore = useCallback(() => {
    setVisibleCount((prev) => prev + PAGE_SIZE);
  }, []);

  return {
    // State
    query,
    setQuery,
    loading,
    error,
    invalidQueryReason,
    results,
    allResults,
    visibleCount,
    analyzingId,
    recentQueries,
    hasSearched,
    
    // Actions
    searchCandidates,
    analyzeCandidate,
    loadMore,
  };
}
