"use client";

import { Target, FileText, Briefcase, ArrowRight, TrendingUp } from "lucide-react";

interface QuickActionsProps {
  onNavigate: (view: string) => void;
}

const actions = [
  {
    label: "Browse Job Matches",
    icon: <Target className="w-5 h-5 mr-3 text-blue-400" />,
    gradient: "from-blue-600/20 to-cyan-600/20",
    border: "border-blue-500/20",
    hover: "hover:border-blue-500/50",
    target: "job-matches",
  },
  {
    label: "Manage Resumes",
    icon: <FileText className="w-5 h-5 mr-3 text-green-400" />,
    gradient: "from-green-600/20 to-emerald-600/20",
    border: "border-green-500/20",
    hover: "hover:border-green-500/50",
    target: "resumes",
  },
  {
    label: "Track Applications",
    icon: <Briefcase className="w-5 h-5 mr-3 text-purple-400" />,
    gradient: "from-purple-600/20 to-pink-600/20",
    border: "border-purple-500/20",
    hover: "hover:border-purple-500/50",
    target: "applications",
  },
];

export function QuickActions({ onNavigate }: QuickActionsProps) {
  return (
    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-6 border border-white/10">
      <h2 className="text-xl font-bold mb-4 flex items-center">
        <TrendingUp className="w-5 h-5 mr-2 text-green-400" />
        Quick Actions
      </h2>
      <div className="space-y-3">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={() => onNavigate(action.target)}
            className={`w-full p-4 bg-gradient-to-r ${action.gradient} rounded-xl border ${action.border} ${action.hover} transition flex items-center justify-between`}
          >
            <div className="flex items-center">
              {action.icon}
              <span>{action.label}</span>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400" />
          </button>
        ))}
      </div>
    </div>
  );
}
