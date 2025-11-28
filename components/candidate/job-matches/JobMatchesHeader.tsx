"use client";

import { Sparkles, Search, SlidersHorizontal, RefreshCw } from "lucide-react";

interface JobMatchesHeaderProps {
  jobCount: number;
  filterOpen: boolean;
  onToggleFilters: () => void;
  onRefresh: () => void;
}

export function JobMatchesHeader({ jobCount, filterOpen, onToggleFilters, onRefresh }: JobMatchesHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold flex items-center">
          Top Job Matches
          <Sparkles className="w-5 h-5 ml-2 text-yellow-400" />
        </h1>
        <p className="text-gray-400 text-sm mt-0.5">Found {jobCount} positions matching your profile</p>
      </div>

      <div className="flex items-center">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search jobs..."
            className="pl-10 pr-4 py-2.5 bg-slate-800/50 border border-white/10 rounded-xl focus:outline-none focus:border-blue-500 transition w-64 text-sm"
          />
        </div>

        <button
          onClick={onToggleFilters}
          className={`px-4 py-2.5 rounded-xl transition flex items-center space-x-2 ml-3 ${
            filterOpen ? "bg-slate-700 border border-blue-500/40" : "bg-slate-800 hover:bg-slate-700"
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Filters</span>
        </button>

        <button
          onClick={onRefresh}
          className="p-2.5 bg-slate-700 hover:bg-slate-600 rounded-xl transition ml-3"
          title="Refresh"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
