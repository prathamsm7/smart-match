"use client";

import { Building2, MapPin } from "lucide-react";
import type { JobMatch } from "./types";

interface JobMatchesListProps {
  jobs: JobMatch[];
  selectedJobIndex: number;
  onSelect: (index: number) => void;
}

export function JobMatchesList({ jobs, selectedJobIndex, onSelect }: JobMatchesListProps) {
  return (
    <div className="w-2/5 border-r border-white/10 overflow-y-auto space-y-4 pr-4">
      {jobs.map((job, index) => (
        <button
          key={job.id}
          onClick={() => onSelect(index)}
          className={`w-full text-left p-5 rounded-xl border cursor-pointer transition-all ${
            selectedJobIndex === index
              ? "bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-500/50 shadow-lg"
              : "bg-slate-800/30 border-white/10 hover:bg-slate-800/50 hover:border-white/20"
          }`}
        >
          <div className="flex items-start gap-4 mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center font-bold text-lg shrink-0 shadow-lg">
              {job.logo}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg mb-1 truncate">{job.title}</h3>
              <p className="text-gray-400 text-sm flex items-center">
                <Building2 className="w-3 h-3 mr-1" />
                {job.company}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className="flex items-center">
              <MapPin className="w-3 h-3 mr-1" />
              {job.location}
            </span>
            {job.salary && <span className="text-green-400 font-semibold">{job.salary}</span>}
          </div>
          {job.matchReason && (
            <p className="text-xs text-gray-500 mt-2 line-clamp-3">{job.matchReason}</p>
          )}
        </button>
      ))}
    </div>
  );
}
