"use client";

import { FileText, RefreshCw } from "lucide-react";

interface ResumesHeaderProps {
  resumeCount: number;
  onRefresh: () => void;
  loading: boolean;
}

export function ResumesHeader({ resumeCount, onRefresh, loading }: ResumesHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold flex items-center">
          My Resumes
          <FileText className="w-6 h-6 ml-2 text-blue-400" />
        </h1>
        <p className="text-gray-400 text-sm mt-0.5">Manage your resumes • {resumeCount} of 5 slots used</p>
      </div>
      <button
        onClick={onRefresh}
        disabled={loading}
        className="p-2.5 bg-slate-700 hover:bg-slate-600 rounded-xl transition disabled:opacity-60 disabled:cursor-not-allowed"
        title="Refresh"
      >
        <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
      </button>
    </div>
  );
}
