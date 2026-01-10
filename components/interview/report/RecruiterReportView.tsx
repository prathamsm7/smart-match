"use client";

import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Award,
  Briefcase,
  Sparkles,
  Target,
  User,
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

interface RecruiterReportViewProps {
  report: InterviewReport;
  interviewId: string | null;
}

const formatDecision = (decision?: string) =>
  (decision || "borderline")
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const getScoreColor = (value?: number) => {
  if (value === undefined || value === null) return "text-gray-400";
  if (value >= 8) return "text-green-400";
  if (value >= 6) return "text-yellow-400";
  return "text-orange-400";
};

const getDecisionBadgeColor = (decision?: string) => {
  const d = decision?.toLowerCase() || "borderline";
  if (d.includes("strong_hire") || d.includes("strong hire")) {
    return "bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-200 border-green-400/30";
  }
  if (d.includes("hire")) {
    return "bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-200 border-blue-400/30";
  }
  if (d.includes("borderline")) {
    return "bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-200 border-amber-400/30";
  }
  return "bg-gradient-to-r from-red-500/20 to-rose-500/20 text-red-200 border-red-400/30";
};

export function RecruiterReportView({ report, interviewId }: RecruiterReportViewProps) {
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
                AI-Evaluated Insights
              </span>
            </div>
          </div>
        </div>

        {/* Candidate Overview Card with Hiring Recommendation */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-8 border border-white/10 backdrop-blur-sm">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex items-start gap-4 flex-1">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/50">
                <User className="w-8 h-8 text-white" />
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-400 uppercase tracking-wide">Candidate</p>
                <h2 className="text-2xl font-bold">
                  {report.candidateOverview?.name || "Unknown candidate"}
                </h2>
                <div className="flex items-center gap-4 text-sm text-gray-300">
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-4 h-4 text-blue-400" />
                    {report.candidateOverview?.roleInterviewedFor || "Role N/A"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Award className="w-4 h-4 text-cyan-400" />
                    {report.candidateOverview?.experienceLevel || "Experience N/A"}
                  </span>
                </div>
              </div>
            </div>
            {/* Hiring Recommendation - Only for Recruiters */}
            {report.hiringRecommendation && (
              <div className={`rounded-xl border px-6 py-4 ${getDecisionBadgeColor(report.hiringRecommendation.decision)}`}>
                <div className="flex items-center gap-3">
                  <Target className="w-6 h-6" />
                  <div>
                    <p className="text-xs uppercase tracking-wide opacity-80 mb-1">Recommendation</p>
                    <p className="text-xl font-bold">
                      {formatDecision(report.hiringRecommendation.decision)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Common Sections - Using shared components */}
        <ScoresSection report={report} variant="recruiter" />
        <StrengthsAndImprovementsSection report={report} variant="recruiter" />
        <TechnicalSkillsSection report={report} />
        
        {/* Detailed Assessments */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ProblemSolvingSection report={report} />
          <CommunicationSkillsSection report={report} />
          
          {/* Hiring Recommendation - Only for Recruiters */}
          {report.hiringRecommendation && (
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-6 border border-blue-500/20 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-4">
                <Award className="w-5 h-5 text-blue-400" />
                <h4 className="font-semibold">Hiring Recommendation</h4>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">Decision</p>
                  <p className={`text-2xl font-bold ${getScoreColor(report.scores?.overall ? report.scores.overall * 10 : undefined)}`}>
                    {formatDecision(report.hiringRecommendation.decision)}
                  </p>
                </div>
                {report.hiringRecommendation.justification && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">Justification</p>
                    <p className="text-sm text-gray-300 leading-relaxed">
                      {report.hiringRecommendation.justification}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Recruiter Summary */}
        {report.recruiterSummary && (
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-8 border border-white/10 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-blue-400" />
              <h3 className="text-xl font-bold">Executive Summary</h3>
            </div>
            <p className="text-gray-300 leading-relaxed text-lg">
              {report.recruiterSummary}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

