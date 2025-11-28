"use client";

import { CheckCircle, XCircle, Lightbulb, Target } from "lucide-react";
import type { JobMatchAnalysis } from "./types";

interface SkillAnalysisSectionProps {
  analysis?: JobMatchAnalysis;
  loading: boolean;
}

export function SkillAnalysisSection({ analysis, loading }: SkillAnalysisSectionProps) {
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="bg-gradient-to-br from-cyan-500/5 to-blue-500/5 rounded-2xl p-8 border border-cyan-500/10">
          <div className="h-7 w-48 bg-slate-700/50 rounded-lg mb-4"></div>
          <div className="space-y-2">
            <div className="h-4 w-full bg-slate-700/50 rounded"></div>
            <div className="h-4 w-4/5 bg-slate-700/50 rounded"></div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-500/5 to-emerald-500/5 rounded-2xl p-8 border border-green-500/10">
          <div className="h-7 w-40 bg-slate-700/50 rounded-lg mb-5"></div>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-9 bg-slate-700/50 rounded-lg" style={{ width: `${60 + i * 15}px` }}></div>
            ))}
          </div>
        </div>
        <div className="bg-gradient-to-br from-red-500/5 to-orange-500/5 rounded-2xl p-8 border border-red-500/10">
          <div className="h-7 w-44 bg-slate-700/50 rounded-lg mb-5"></div>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-9 bg-slate-700/50 rounded-lg" style={{ width: `${70 + i * 10}px` }}></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-8 border border-white/10 backdrop-blur-sm text-center">
        <Target className="w-10 h-10 text-blue-400 mx-auto mb-3" />
        <p className="text-gray-400">Skill analysis will appear here when loaded.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {analysis.matchReason && (
        <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-2xl p-8 border border-cyan-500/20 backdrop-blur-sm">
          <h3 className="text-xl font-bold mb-4 flex items-center text-cyan-400">
            <Target className="w-6 h-6 mr-2" />
            Why You're a Great Fit
          </h3>
          <p className="text-gray-200 leading-relaxed text-lg">{analysis.matchReason}</p>
        </div>
      )}

      {analysis.matchedSkills.length > 0 && (
        <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl p-8 border border-green-500/20 backdrop-blur-sm">
          <h3 className="text-xl font-bold mb-5 flex items-center text-green-400">
            <CheckCircle className="w-6 h-6 mr-2" />
            Matched Skills ({analysis.matchedSkills.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {analysis.matchedSkills.map((skill, index) => (
              <span key={skill + index} className="px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-lg text-sm font-medium hover:bg-green-500/30 transition">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {analysis.missingSkills.length > 0 && (
        <div className="bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-2xl p-8 border border-red-500/20 backdrop-blur-sm">
          <h3 className="text-xl font-bold mb-5 flex items-center text-red-400">
            <XCircle className="w-6 h-6 mr-2" />
            Skills to Develop ({analysis.missingSkills.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {analysis.missingSkills.map((skill, index) => (
              <span key={skill + index} className="px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-lg text-sm font-medium hover:bg-red-500/30 transition">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {analysis.improvementSuggestions.length > 0 && (
        <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl p-8 border border-blue-500/20 backdrop-blur-sm">
          <h3 className="text-xl font-bold mb-6 flex items-center text-blue-400">
            <Lightbulb className="w-6 h-6 mr-2" />
            Improvement Suggestions
          </h3>
          <div className="space-y-4">
            {analysis.improvementSuggestions.map((suggestion, index) => (
              <div key={suggestion + index} className="flex items-start space-x-4 p-4 bg-white/5 rounded-lg hover:bg-white/10 transition">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-sm font-bold">{index + 1}</span>
                </div>
                <p className="text-gray-300 leading-relaxed flex-1">{suggestion}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
