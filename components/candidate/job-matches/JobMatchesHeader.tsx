"use client";

import { Sparkles, Search, RefreshCw } from "lucide-react";
import type { JobSearchMode } from "@/lib/jobSearch.types";

const MODES: { id: JobSearchMode; label: string; hint: string }[] = [
  { id: "profile", label: "Profile", hint: "Jobs matching your skills" },
  { id: "query", label: "Target", hint: "Search by role or natural language" },
  { id: "hybrid", label: "Hybrid", hint: "Blend profile + your query" },
];

interface JobMatchesHeaderProps {
  jobCount: number;
  mode: JobSearchMode;
  query: string;
  searching: boolean;
  onModeChange: (mode: JobSearchMode) => void;
  onQueryChange: (query: string) => void;
  onSearch: () => void;
  onRefresh: () => void;
}

export function JobMatchesHeader({
  jobCount,
  mode,
  query,
  searching,
  onModeChange,
  onQueryChange,
  onSearch,
  onRefresh,
}: JobMatchesHeaderProps) {
  const activeHint = MODES.find((m) => m.id === mode)?.hint;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center">
            Job Matches
            <Sparkles className="w-5 h-5 ml-2 text-yellow-400" />
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {jobCount} results · {activeHint}
          </p>
        </div>
        <button
          onClick={onRefresh}
          disabled={searching}
          className="p-2.5 bg-slate-700 hover:bg-slate-600 rounded-xl transition disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw className={`w-5 h-5 ${searching ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => onModeChange(m.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              mode === m.id
                ? "bg-blue-600 text-white"
                : "bg-slate-800 text-gray-400 hover:bg-slate-700"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {mode !== "profile" && (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSearch()}
              placeholder='Try "AI Engineer" or "entry-level sales jobs in healthcare"'
              className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            onClick={onSearch}
            disabled={searching || !query.trim()}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl text-sm font-semibold transition"
          >
            Search
          </button>
        </div>
      )}
    </div>
  );
}
