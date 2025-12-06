"use client";

import { Target } from "lucide-react";

interface MatchScoreDialProps {
  value: number;
  loading: boolean;
  hasAnalysis: boolean;
}

export function MatchScoreDial({ value, loading, hasAnalysis }: MatchScoreDialProps) {
  if (loading) {
    return (
      <div className="relative w-32 h-32">
        <svg className="transform -rotate-90 w-32 h-32 animate-pulse">
          <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-slate-700" />
          <circle
            cx="64"
            cy="64"
            r="56"
            stroke="currentColor"
            strokeWidth="10"
            fill="transparent"
            strokeDasharray={`${2 * Math.PI * 56}`}
            strokeDashoffset={`${2 * Math.PI * 56 * 0.5}`}
            className="text-orange-400/50 animate-spin"
            style={{ transformOrigin: "center", animation: "spin 2s linear infinite" }}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-4xl font-bold text-orange-400/70 animate-pulse">--</div>
          <div className="text-xs text-gray-400 mt-1">Analyzing</div>
        </div>
      </div>
    );
  }

  if (!hasAnalysis) {
    return (
      <div className="w-32 h-32 flex items-center justify-center border-4 border-dashed border-slate-600 rounded-full">
        <div className="text-center">
          <Target className="w-8 h-8 text-slate-500 mx-auto mb-1" />
          <div className="text-xs text-gray-500">Analyzing...</div>
        </div>
      </div>
    );
  }

  const color =
    value >= 90 ? "text-green-400" : value >= 80 ? "text-yellow-400" : "text-orange-400";

  return (
    <div className="relative w-32 h-32">
      <svg className="transform -rotate-90 w-32 h-32">
        <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-slate-700" />
        <circle
          cx="64"
          cy="64"
          r="56"
          stroke="currentColor"
          strokeWidth="10"
          fill="transparent"
          strokeDasharray={`${2 * Math.PI * 56}`}
          strokeDashoffset={`${2 * Math.PI * 56 * (1 - value / 100)}`}
          className={`${color} transition-all duration-1000`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className={`text-4xl font-bold ${color}`}>{value ? value + "%" : "N/A" }</div>
          <div className="text-xs text-gray-400 mt-1">Match</div>
        </div>
      </div>
    </div>
  );
}
