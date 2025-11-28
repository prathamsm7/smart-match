"use client";

import ReactMarkdown from "react-markdown";
import {
  Building2,
  MapPin,
  DollarSign,
  Clock,
  Award,
  CheckCircle,
  ArrowRight,
  Star,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import { MatchScoreDial } from "./MatchScoreDial";
import { SkillAnalysisSection } from "./SkillAnalysisSection";
import type { JobMatch, JobMatchAnalysis } from "./types";

interface JobDetailsPanelProps {
  job: JobMatch | null;
  analysis?: JobMatchAnalysis;
  loadingAnalysis: boolean;
  applying: boolean;
  applySuccess: boolean;
  applyError: string | null;
  onApply: () => void;
}

export function JobDetailsPanel({
  job,
  analysis,
  loadingAnalysis,
  applying,
  applySuccess,
  applyError,
  onApply,
}: JobDetailsPanelProps) {
  if (!job) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="h-full flex items-center justify-center text-gray-500">
          Select a job from the list to see details
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl space-y-6">
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-8 border border-white/10 backdrop-blur-sm">
          <div className="flex items-start gap-6 mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center font-bold text-3xl shadow-lg shadow-blue-500/50">
              {job.logo}
            </div>
            <div className="flex-1">
              <h2 className="text-3xl font-bold mb-2">{job.title}</h2>
              <div className="flex items-center gap-2 text-gray-400 mb-4">
                <Building2 className="w-5 h-5" />
                <span className="text-lg">{job.company}</span>
              </div>
              <div className="flex flex-wrap gap-4 text-sm">
                <span className="flex items-center text-gray-300">
                  <MapPin className="w-4 h-4 mr-1 text-blue-400" />
                  {job.location}
                </span>
                <span className="flex items-center text-gray-300">
                  <DollarSign className="w-4 h-4 mr-1 text-green-400" />
                  {job.salary}
                </span>
                <span className="flex items-center text-gray-300">
                  <Clock className="w-4 h-4 mr-1 text-cyan-400" />
                  {job.type}
                </span>
                <span className="flex items-center text-gray-300">
                  <Award className="w-4 h-4 mr-1 text-purple-400" />
                  {job.experience}
                </span>
              </div>
            </div>
            <MatchScoreDial value={job.matchScore} loading={loadingAnalysis} hasAnalysis={Boolean(analysis)} />
          </div>

          {applyError && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              <p className="text-red-400 text-sm">{applyError}</p>
            </div>
          )}

          {applySuccess && (
            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
              <p className="text-green-400 text-sm">Application submitted successfully!</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onApply}
              disabled={applying || applySuccess}
              className={`flex-1 px-6 py-3 rounded-lg font-semibold transition transform hover:scale-[1.02] flex items-center justify-center space-x-2 ${
                applying || applySuccess
                  ? "bg-green-600 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-cyan-600 hover:shadow-lg hover:shadow-blue-500/50"
              }`}
            >
              {applying ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Applying...</span>
                </>
              ) : applySuccess ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span>Applied!</span>
                </>
              ) : (
                <>
                  <span>Apply Now</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
            <button className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-semibold transition flex items-center space-x-2">
              <Star className="w-5 h-5" />
              <span>Save</span>
            </button>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-8 border border-white/10 backdrop-blur-sm">
          <h3 className="text-xl font-bold mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-blue-400" />
            Job Description
          </h3>
          <div className="text-gray-300 leading-relaxed">
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-4 text-gray-300 leading-relaxed">{children}</p>,
                ul: ({ children }) => <ul className="list-disc list-inside mb-4 space-y-2 text-gray-300 ml-4">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-inside mb-4 space-y-2 text-gray-300 ml-4">{children}</ol>,
                li: ({ children }) => <li className="text-gray-300 mb-1">{children}</li>,
                strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                em: ({ children }) => <em className="italic text-gray-200">{children}</em>,
                h1: ({ children }) => <h1 className="text-2xl font-bold mb-3 mt-4 text-white">{children}</h1>,
                h2: ({ children }) => <h2 className="text-xl font-bold mb-2 mt-3 text-white">{children}</h2>,
                h3: ({ children }) => <h3 className="text-lg font-bold mb-2 mt-3 text-white">{children}</h3>,
                br: () => <br />,
                hr: () => <hr className="my-4 border-white/10" />,
              }}
            >
              {job.description}
            </ReactMarkdown>
          </div>
        </div>

        <SkillAnalysisSection analysis={analysis} loading={loadingAnalysis} />
      </div>
    </div>
  );
}
