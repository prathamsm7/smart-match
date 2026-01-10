"use client";

import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { InterviewReport } from "@/components/candidate/interviews/types";
import {
  CandidateOverviewSection,
  ScoresSection,
  StrengthsAndImprovementsSection,
  TechnicalSkillsSection,
  ProblemSolvingSection,
  CommunicationSkillsSection,
} from "./shared/CommonSections";

interface CandidateReportViewProps {
  report: InterviewReport;
  interviewId: string | null;
}

export function CandidateReportView({ report, interviewId }: CandidateReportViewProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-6 border border-white/10 backdrop-blur-sm">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="space-y-2">
              <button
                onClick={() => router.push("/dashboard")}
                className="inline-flex items-center gap-2 text-sm text-gray-300 hover:text-white transition group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Back to dashboard
              </button>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  Interview Report
                </h1>
                {interviewId && (
                  <p className="text-sm text-gray-400 mt-1 font-mono">
                    Interview ID: {interviewId.slice(0, 8)}...
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-400/30 rounded-xl px-4 py-2">
              <Sparkles className="w-5 h-5 text-blue-300" />
              <span className="text-sm text-blue-200 font-medium">
                Your Performance Insights
              </span>
            </div>
          </div>
        </div>

        {/* Common Sections - Using shared components */}
        <CandidateOverviewSection report={report} variant="candidate" />
        <ScoresSection report={report} variant="candidate" />
        <StrengthsAndImprovementsSection report={report} variant="candidate" />
        <TechnicalSkillsSection report={report} />
        
        {/* Detailed Assessments */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ProblemSolvingSection report={report} />
          <CommunicationSkillsSection report={report} />
        </div>
      </div>
    </div>
  );
}

