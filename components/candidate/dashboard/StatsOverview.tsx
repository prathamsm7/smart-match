"use client";

import type { ReactNode } from "react";

interface DashboardStat {
  label: string;
  value: string | number;
  icon: ReactNode;
  color: string;
  onClick: () => void;
}

interface StatsOverviewProps {
  stats: DashboardStat[];
}

export function StatsOverview({ stats }: StatsOverviewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => (
        <button
          key={stat.label}
          onClick={stat.onClick}
          className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-6 border border-white/10 backdrop-blur-sm hover:border-blue-500/30 transition cursor-pointer group text-left"
        >
          <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center text-white shadow-lg mb-4`}>
            {stat.icon}
          </div>
          <h3 className="text-3xl font-bold mb-1">{stat.value}</h3>
          <p className="text-gray-400 text-sm group-hover:text-white transition">{stat.label}</p>
        </button>
      ))}
    </div>
  );
}
