"use client";

import { AlertCircle } from "lucide-react";
import { SearchBar } from "./SearchBar";
import { ResultsPanel } from "./ResultsPanel";
import { ShimmerResults } from "./Shimmer";
import { useCandidateSearch } from "@/hooks/useCandidateSearch";

export function SmartSearchView() {
  const {
    query,
    setQuery,
    loading,
    error,
    results,
    allResults,
    visibleCount,
    analyzingId,
    recentQueries,
    hasSearched,
    searchCandidates,
    analyzeCandidate,
    loadMore,
  } = useCandidateSearch();

  const handleSearch = (e?: React.FormEvent, overrideQuery?: string) => {
    e?.preventDefault();
    searchCandidates(overrideQuery);
  };

  return (
    <div className="min-h-screen bg-[#0f1117] text-white p-6 md:p-10 space-y-8">
      <SearchBar
        query={query}
        loading={loading}
        recentQueries={recentQueries}
        onChange={setQuery}
        onSubmit={handleSearch}
        onRecentClick={(q) => {
          setQuery(q);
          handleSearch(undefined, q);
        }}
      />

      {error && (
        <div className="max-w-4xl mx-auto bg-red-500/10 border border-red-500/20 text-red-300 px-5 py-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {loading && <ShimmerResults />}

      <ResultsPanel
        results={results}
        allResults={allResults}
        visibleCount={visibleCount}
        loading={loading}
        analyzingId={analyzingId}
        hasSearched={hasSearched}
        onAnalyze={analyzeCandidate}
        onLoadMore={loadMore}
      />
    </div>
  );
}
