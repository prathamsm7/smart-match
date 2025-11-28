"use client";

import { Briefcase } from "lucide-react";

interface ApplicationsEmptyStateProps {
  hasSearch: boolean;
}

export function ApplicationsEmptyState({ hasSearch }: ApplicationsEmptyStateProps) {
  return (
    <div className="text-center py-16 bg-slate-900/50 border border-slate-800 rounded-xl">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800 mb-4">
        <Briefcase className="w-8 h-8 text-slate-400" />
      </div>
      <h3 className="text-lg font-medium text-white mb-2">No applications found</h3>
      <p className="text-gray-400 max-w-md mx-auto">
        {hasSearch ? "No applications match your search." : "You haven't applied to any jobs yet. Start searching for jobs to apply!"}
      </p>
    </div>
  );
}
