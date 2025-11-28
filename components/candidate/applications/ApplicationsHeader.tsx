"use client";

import { Search, Filter } from "lucide-react";

interface ApplicationsHeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export function ApplicationsHeader({ searchTerm, onSearchChange }: ApplicationsHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 className="text-2xl font-bold text-white">My Applications</h2>
        <p className="text-gray-400 mt-1">Track and manage your job applications</p>
      </div>
      <div className="flex gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search applications..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 w-full sm:w-64"
          />
        </div>
        <button className="p-2 bg-slate-800/50 border border-slate-700 rounded-lg text-gray-400 hover:text-white hover:bg-slate-800 transition-colors">
          <Filter className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
