"use client";

import { FileText, Sparkles } from "lucide-react";

interface CoverLetterCheckboxProps {
  checked: boolean;
  loading: boolean;
  onChange: (checked: boolean) => void;
}

export function CoverLetterCheckbox({ checked, loading, onChange }: CoverLetterCheckboxProps) {
  return (
    <div className="mb-6">
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={loading}
          className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
        />
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-400" />
          <span className="text-gray-300">Include AI-generated cover letter</span>
          <Sparkles className="w-4 h-4 text-yellow-400" />
        </div>
      </label>
      {loading && (
        <div className="mt-2 text-sm text-gray-400 flex items-center gap-2">
          <Sparkles className="w-4 h-4 animate-pulse" />
          <span>Loading...</span>
        </div>
      )}
    </div>
  );
}

