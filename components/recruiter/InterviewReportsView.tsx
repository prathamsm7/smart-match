"use client";

import { useState, useEffect } from "react";
import {
  FileCheck,
  Briefcase,
  MapPin,
  Mail,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  ExternalLink,
  Loader2,
  AlertCircle,
  Search,
  Award,
  Target,
  MessageSquare,
  Lightbulb,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle as AlertTriangleIcon,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { useRouter } from "next/navigation";

interface InterviewReport {
  id: string;
  interviewId: string;
  applicationId: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  jobId: string;
  company: string | null;
  location: string | null;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  overallScore: number | null;
  technicalScore: number | null;
  communicationScore: number | null;
  problemSolvingScore: number | null;
  hiringDecision: string | null;
  hasReport: boolean;
}

export function InterviewReportsView() {
  const router = useRouter();
  const [reports, setReports] = useState<InterviewReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDecision, setFilterDecision] = useState<string>("all");

  useEffect(() => {
    fetchInterviewReports();
  }, []);

  async function fetchInterviewReports() {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/recruiter/interview-reports");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch interview reports");
      }

      setReports(data.reports || []);
    } catch (err: any) {
      console.error("Error fetching interview reports:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const filteredReports = reports.filter((report) => {
    const search = searchTerm.toLowerCase();
    const matchesSearch =
      report.candidateName.toLowerCase().includes(search) ||
      report.jobTitle.toLowerCase().includes(search) ||
      report.candidateEmail.toLowerCase().includes(search) ||
      (report.company && report.company.toLowerCase().includes(search));

    const matchesFilter =
      filterDecision === "all" || report.hiringDecision === filterDecision;

    return matchesSearch && matchesFilter;
  });

  function getDecisionBadge(decision: string | null) {
    if (!decision) return null;

    const badges = {
      strong_hire: {
        icon: <CheckCircle className="w-4 h-4" />,
        label: "Strong Hire",
        className: "bg-green-500/20 text-green-300 border-green-500/30",
      },
      hire: {
        icon: <CheckCircle className="w-4 h-4" />,
        label: "Hire",
        className: "bg-blue-500/20 text-blue-300 border-blue-500/30",
      },
      borderline: {
        icon: <Minus className="w-4 h-4" />,
        label: "Borderline",
        className: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
      },
      no_hire: {
        icon: <XCircle className="w-4 h-4" />,
        label: "No Hire",
        className: "bg-red-500/20 text-red-300 border-red-500/30",
      },
    };

    const badge = badges[decision as keyof typeof badges];
    if (!badge) return null;

    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${badge.className}`}>
        {badge.icon}
        <span className="text-sm font-medium">{badge.label}</span>
      </div>
    );
  }

  function getScoreColor(score: number | null) {
    if (!score) return "text-gray-400";
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-blue-400";
    if (score >= 40) return "text-yellow-400";
    return "text-red-400";
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
          <p className="text-gray-400">Loading interview reports...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-500/10 mb-4">
          <AlertCircle className="w-6 h-6 text-red-500" />
        </div>
        <h3 className="text-lg font-medium text-white mb-2">Failed to load reports</h3>
        <p className="text-gray-400 mb-6">{error}</p>
        <button
          onClick={fetchInterviewReports}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-linear-to-r from-purple-600/20 to-pink-600/20 rounded-2xl p-6 border border-purple-500/20">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
              <FileCheck className="w-7 h-7 text-purple-400" />
              Interview Reports
            </h1>
            <p className="text-gray-400">
              Review interview performance and hiring recommendations for your candidates
            </p>
          </div>
          <div className="flex items-center gap-3 bg-purple-500/10 border border-purple-400/30 rounded-xl px-4 py-2">
            <Award className="w-5 h-5 text-purple-300" />
            <span className="text-sm text-purple-200 font-medium">
              {reports.length} Completed
            </span>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, job title, email, or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl focus:outline-none focus:border-blue-500 transition"
          />
        </div>
        <select
          value={filterDecision}
          onChange={(e) => setFilterDecision(e.target.value)}
          className="px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl focus:outline-none focus:border-blue-500 transition"
        >
          <option value="all">All Decisions</option>
          <option value="strong_hire">Strong Hire</option>
          <option value="hire">Hire</option>
          <option value="borderline">Borderline</option>
          <option value="no_hire">No Hire</option>
        </select>
      </div>

      {/* Reports List */}
      {filteredReports.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/50 border border-slate-800 rounded-xl">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800 mb-4">
            <FileCheck className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">
            {searchTerm || filterDecision !== "all"
              ? "No reports match your criteria"
              : "No interview reports yet"}
          </h3>
          <p className="text-gray-400 max-w-md mx-auto">
            {searchTerm || filterDecision !== "all"
              ? "Try adjusting your search or filter"
              : "Interview reports will appear here once candidates complete their interviews"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReports.map((report) => (
            <div
              key={report.id}
              className="bg-linear-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-6 border border-white/10 hover:border-purple-500/30 transition cursor-pointer group"
              onClick={() => window.open(`/interview/report?interviewId=${report.interviewId}`, '_blank')}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Left Section - Candidate Info */}
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-14 h-14 bg-linear-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shrink-0 font-bold text-lg">
                    {report.candidateName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold mb-1 group-hover:text-purple-400 transition">
                      {report.candidateName}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                      <Mail className="w-4 h-4" />
                      <span className="truncate">{report.candidateEmail}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Briefcase className="w-4 h-4 text-blue-400" />
                      <span className="font-medium">{report.jobTitle}</span>
                    </div>
                    {report.company && (
                      <p className="text-sm text-gray-500 mt-1">{report.company}</p>
                    )}
                  </div>
                </div>

                {/* Middle Section - Scores */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 lg:gap-6">
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">Overall</p>
                    <p className={`text-2xl font-bold ${getScoreColor(report.overallScore)}`}>
                      {report.overallScore || "N/A"}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">Technical</p>
                    <p className={`text-2xl font-bold ${getScoreColor(report.technicalScore)}`}>
                      {report.technicalScore || "N/A"}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">Communication</p>
                    <p className={`text-2xl font-bold ${getScoreColor(report.communicationScore)}`}>
                      {report.communicationScore || "N/A"}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">Problem Solving</p>
                    <p className={`text-2xl font-bold ${getScoreColor(report.problemSolvingScore)}`}>
                      {report.problemSolvingScore || "N/A"}
                    </p>
                  </div>
                </div>

                {/* Right Section - Decision & Action */}
                <div className="flex flex-col items-end gap-3 lg:min-w-[180px]">
                  {getDecisionBadge(report.hiringDecision)}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(`/interview/report?interviewId=${report.interviewId}`, '_blank');
                    }}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg transition flex items-center gap-2 text-sm"
                  >
                    View Full Report
                    <ExternalLink className="w-4 h-4"  />
                  </button>
                </div>
              </div>

              {/* Footer - Timestamp */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>
                      Completed{" "}
                      {report.completedAt
                        ? formatDistanceToNow(new Date(report.completedAt), { addSuffix: true })
                        : "recently"}
                    </span>
                  </div>
                  {report.completedAt && (
                    <span>
                      {format(new Date(report.completedAt), "MMM d, yyyy 'at' h:mm a")}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats Summary */}
      {reports.length > 0 && (
        <div className="bg-linear-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-6 border border-white/10">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            Quick Stats
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
              <p className="text-2xl font-bold text-green-400">
                {reports.filter((r) => r.hiringDecision === "strong_hire" || r.hiringDecision === "hire").length}
              </p>
              <p className="text-sm text-gray-400 mt-1">Recommended</p>
            </div>
            <div className="text-center p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
              <p className="text-2xl font-bold text-yellow-400">
                {reports.filter((r) => r.hiringDecision === "borderline").length}
              </p>
              <p className="text-sm text-gray-400 mt-1">Borderline</p>
            </div>
            <div className="text-center p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
              <p className="text-2xl font-bold text-red-400">
                {reports.filter((r) => r.hiringDecision === "no_hire").length}
              </p>
              <p className="text-sm text-gray-400 mt-1">Not Recommended</p>
            </div>
            <div className="text-center p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <p className="text-2xl font-bold text-blue-400">
                {reports.length > 0
                  ? Math.round(
                      reports.reduce((sum, r) => sum + (r.overallScore || 0), 0) / reports.length
                    )
                  : 0}
              </p>
              <p className="text-sm text-gray-400 mt-1">Avg Score</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
