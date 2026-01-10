"use client";

import { Calendar } from "lucide-react";

interface InterviewsEmptyStateProps {
  hasSearch: boolean;
}

export function InterviewsEmptyState({ hasSearch }: InterviewsEmptyStateProps) {
  if (hasSearch) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-500/10 mb-4">
          <Calendar className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-white mb-2">No interviews found</h3>
        <p className="text-gray-400">Try adjusting your search terms</p>
      </div>
    );
  }

  return (
    <div className="text-center py-12">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/10 mb-4">
        <Calendar className="w-8 h-8 text-blue-500" />
      </div>
      <h3 className="text-lg font-medium text-white mb-2">No interviews scheduled</h3>
      <p className="text-gray-400 mb-6">
        Interviews will appear here once your applications are accepted or moved to interview stage.
      </p>
    </div>
  );
}


