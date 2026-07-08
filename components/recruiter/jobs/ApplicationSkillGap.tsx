"use client";

import { CheckCircle, XCircle, Target, Loader2 } from "lucide-react";

interface ApplicationSkillGapProps {
  matchedSkills: string[];
  missingSkills: string[];
  matchReason?: string;
  loading?: boolean;
}

export function ApplicationSkillGap({
  matchedSkills,
  missingSkills,
  matchReason,
  loading = false,
}: ApplicationSkillGapProps) {
  if (loading) {
    return (
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-8 border border-white/10 flex items-center justify-center gap-3">
        <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
        <span className="text-gray-400 text-sm">Analyzing skill match…</span>
      </div>
    );
  }

  const hasContent =
    matchReason ||
    matchedSkills.length > 0 ||
    missingSkills.length > 0;

  if (!hasContent) return null;

  return (
    <div className="space-y-4">
      {matchReason && (
        <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-2xl p-6 border border-cyan-500/20">
          <h3 className="text-lg font-bold mb-3 flex items-center text-cyan-400">
            <Target className="w-5 h-5 mr-2" />
            Match Summary
          </h3>
          <p className="text-gray-300 leading-relaxed">{matchReason}</p>
        </div>
      )}

      {matchedSkills.length > 0 && (
        <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl p-6 border border-green-500/20">
          <h3 className="text-lg font-bold mb-4 flex items-center text-green-400">
            <CheckCircle className="w-5 h-5 mr-2" />
            Matched Skills ({matchedSkills.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {matchedSkills.map((skill) => (
              <span
                key={skill}
                className="px-3 py-1.5 bg-green-500/20 border border-green-500/30 rounded-lg text-sm font-medium"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {missingSkills.length > 0 && (
        <div className="bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-2xl p-6 border border-red-500/20">
          <h3 className="text-lg font-bold mb-4 flex items-center text-red-400">
            <XCircle className="w-5 h-5 mr-2" />
            Missing Skills ({missingSkills.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {missingSkills.map((skill) => (
              <span
                key={skill}
                className="px-3 py-1.5 bg-red-500/20 border border-red-500/30 rounded-lg text-sm font-medium"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
