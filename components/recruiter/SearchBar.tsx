"use client";

import { Search, Loader2 } from "lucide-react";

interface SearchBarProps {
  query: string;
  loading: boolean;
  recentQueries: string[];
  onChange: (value: string) => void;
  onSubmit: (e?: React.FormEvent) => void;
  onRecentClick: (q: string) => void;
}

export function SearchBar({
  query,
  loading,
  recentQueries,
  onChange,
  onSubmit,
  onRecentClick,
}: SearchBarProps) {
  return (
    <div className="bg-[#161b27] rounded-2xl border border-white/5 p-6 shadow-xl max-w-4xl mx-auto">
      <form onSubmit={onSubmit} className="flex items-center gap-3 max-w-3xl mx-auto">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            value={query}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-[#0f1117] border border-[#2a2f3e] rounded-xl pl-11 pr-4 py-3.5 text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-600/60 transition"
            placeholder="Search candidates..."
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3.5 rounded-xl transition flex items-center gap-2 disabled:opacity-50 shrink-0"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
          <span>Search</span>
        </button>
      </form>

      {/* Recent Searches */}
      {recentQueries.length > 0 && (
        <div className="flex items-center gap-3 mt-5 max-w-3xl mx-auto">
          <span className="text-xs text-gray-500 font-semibold shrink-0">Recent:</span>
          <div className="flex flex-wrap gap-2">
            {recentQueries.map((q, i) => (
              <button
                key={i}
                onClick={() => onRecentClick(q)}
                className="px-3.5 py-1.5 bg-[#1e2433] hover:bg-[#252c3d] border border-[#2a2f3e] rounded-lg text-xs text-gray-300 transition"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
