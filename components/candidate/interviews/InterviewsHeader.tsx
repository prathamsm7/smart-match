"use client";

import { Calendar, Search } from "lucide-react";

interface InterviewsHeaderProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

export function InterviewsHeader({ searchTerm, onSearchChange }: InterviewsHeaderProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Calendar className="w-8 h-8 text-blue-500" />
            Interviews
          </h1>
          <p className="text-gray-400 mt-1">Manage and track your interview schedule</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search by job title or company..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
    </div>
  );
}


