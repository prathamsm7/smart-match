"use client";

import { Users, SlidersHorizontal, ChevronDown, Search } from "lucide-react";
import { Candidate } from "./types";
import { CandidateCard } from "./CandidateCard";

const PAGE_SIZE = 10;

interface ResultsPanelProps {
  results: Candidate[];
  allResults: Candidate[];
  visibleCount: number;
  loading: boolean;
  analyzingId: string | null;
  hasSearched: boolean;
  onAnalyze: (id: string) => void;
  onLoadMore: () => void;
}

export function ResultsPanel({
  results,
  allResults,
  visibleCount,
  loading,
  analyzingId,
  hasSearched,
  onAnalyze,
  onLoadMore,
}: ResultsPanelProps) {
  // Empty state — before any search
  if (!loading && !hasSearched) {
    return (
      <div className="text-center py-32">
        <div className="w-16 h-16 bg-[#161b27] border border-white/5 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <Search className="w-8 h-8 text-gray-700" />
        </div>
        <h3 className="text-xl font-bold text-gray-600">Ready to find top talent?</h3>
        <p className="text-gray-700 mt-1 max-w-xs mx-auto text-sm">
          Enter a natural language query above to start discovering candidates.
        </p>
      </div>
    );
  }

  if (loading || results.length === 0) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Results Header */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Users className="w-5 h-5 text-gray-400" />
          Search Results
          <span className="text-sm font-normal text-gray-500">
            ({results.length} of {allResults.length} shown)
          </span>
        </h2>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-[#161b27] border border-white/5 rounded-xl text-sm text-gray-400 hover:text-white transition">
            <SlidersHorizontal className="w-4 h-4" />
            Filter
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#161b27] border border-white/5 rounded-xl text-sm text-gray-400 hover:text-white transition">
            Sort by Match Score
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Candidate Cards */}
      {results.map((candidate) => (
        <CandidateCard
          key={candidate.id}
          data={candidate}
          onAnalyze={onAnalyze}
          analyzingId={analyzingId}
        />
      ))}

      {/* Load More */}
      {visibleCount < allResults.length && (
        <div className="flex flex-col items-center gap-2 pt-2 pb-4">
          <p className="text-xs text-gray-600">
            Showing {results.length} of {allResults.length} candidates
          </p>
          <button
            onClick={onLoadMore}
            className="flex items-center gap-2 px-6 py-3 bg-[#161b27] hover:bg-[#1e2433] border border-white/10 hover:border-white/20 text-gray-300 hover:text-white font-semibold rounded-xl text-sm transition active:scale-95"
          >
            <ChevronDown className="w-4 h-4" />
            Load More ({allResults.length - visibleCount} remaining)
          </button>
        </div>
      )}

      {/* All loaded indicator */}
      {visibleCount >= allResults.length && allResults.length > PAGE_SIZE && (
        <p className="text-center text-xs text-gray-700 pb-4">
          All {allResults.length} candidates loaded
        </p>
      )}
    </div>
  );
}
