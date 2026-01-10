"use client";

import { useState } from "react";
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, Play, FileText, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import type { InterviewItem } from "./types";

interface InterviewCardProps {
  interview: InterviewItem;
  onUpdate?: () => void;
}

const statusConfig = {
  PENDING: {
    label: "Pending",
    color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    icon: AlertCircle,
  },
  IN_PROGRESS: {
    label: "In Progress",
    color: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    icon: Clock,
  },
  COMPLETED: {
    label: "Completed",
    color: "bg-green-500/10 text-green-400 border-green-500/20",
    icon: CheckCircle,
  },
  FAILED: {
    label: "Failed",
    color: "bg-red-500/10 text-red-400 border-red-500/20",
    icon: XCircle,
  },
  CANCELLED: {
    label: "Cancelled",
    color: "bg-gray-500/10 text-gray-400 border-gray-500/20",
    icon: XCircle,
  },
};

export function InterviewCard({ interview, onUpdate }: InterviewCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const statusInfo = statusConfig[interview.status];
  const StatusIcon = statusInfo.icon;

  const jobTitle = interview.application?.job?.title || "Unknown Job";
  const companyName = interview.application?.job?.employerName || "Unknown Company";
  const location = interview.application?.job?.location;

  const handleStartInterview = async () => {
    if (interview.status !== "PENDING") {
      alert("Interview can only be started if it is in PENDING status");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/interview/${interview.id}/start`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to start interview");
      }

      // Navigate to interview page
      router.push(`/interview?id=${interview.id}`);
    } catch (error) {
      console.error("Error starting interview:", error);
      alert(error instanceof Error ? error.message : "Failed to start interview");
    } finally {
      setLoading(false);
    }
  };

  const handleViewReport = () => {
    router.push(`/interview/report?interviewId=${interview.id}`);
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-white mb-1">{jobTitle}</h3>
          <p className="text-gray-400 mb-2">{companyName}</p>
          {location && (
            <p className="text-sm text-gray-500 flex items-center gap-1">
              <span>{location}</span>
            </p>
          )}
        </div>
        <div className={`px-3 py-1 rounded-full border flex items-center gap-2 ${statusInfo.color}`}>
          <StatusIcon className="w-4 h-4" />
          <span className="text-sm font-medium">{statusInfo.label}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div className="flex items-center gap-2 text-gray-400">
          <Calendar className="w-4 h-4" />
          <span>Created: {formatDate(interview.createdAt)}</span>
        </div>
        {interview.startedAt && (
          <div className="flex items-center gap-2 text-gray-400">
            <Clock className="w-4 h-4" />
            <span>Started: {formatDate(interview.startedAt)}</span>
          </div>
        )}
        {interview.completedAt && (
          <div className="flex items-center gap-2 text-gray-400">
            <CheckCircle className="w-4 h-4" />
            <span>Completed: {formatDate(interview.completedAt)}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {interview.status === "PENDING" && (
          <button
            onClick={handleStartInterview}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="w-4 h-4" />
            {loading ? "Starting..." : "Start Interview"}
          </button>
        )}
        {interview.status === "IN_PROGRESS" && (
          <button
            onClick={() => router.push(`/interview?id=${interview.id}`)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
          >
            <Play className="w-4 h-4" />
            Continue Interview
          </button>
        )}
        {(interview.status === "COMPLETED" || interview.report) && (
          <button
            onClick={handleViewReport}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors"
          >
            <FileText className="w-4 h-4" />
            View Report
          </button>
        )}
        {interview.status === "FAILED" && (
          <span className="text-red-400 text-sm">Interview failed</span>
        )}
        {interview.status === "CANCELLED" && (
          <span className="text-gray-400 text-sm">Interview cancelled</span>
        )}
      </div>
    </div>
  );
}


