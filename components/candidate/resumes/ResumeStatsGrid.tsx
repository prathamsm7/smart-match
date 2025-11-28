"use client";

import type { ResumeStat } from "./types";

interface ResumeStatsGridProps {
  stats: ResumeStat[];
}

export function ResumeStatsGrid({ stats }: ResumeStatsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-6 border border-white/10 backdrop-blur-sm hover:border-white/20 transition"
        >
          <div className="flex items-start justify-between mb-4">
            <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center text-white shadow-lg`}>
              {stat.icon}
            </div>
            {stat.max && (
              <span className="text-xs text-gray-400">
                {stat.value}/{stat.max}
              </span>
            )}
          </div>
          <h3 className="text-3xl font-bold mb-1">{stat.value}</h3>
          <p className="text-gray-400 text-sm">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
