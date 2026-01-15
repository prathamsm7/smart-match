"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, AlertTriangle } from "lucide-react";
import { InterviewReport } from "@/components/candidate/interviews/types";
import { interviewsService } from "@/lib/services";
import { CandidateReportView } from "@/components/interview/report/CandidateReportView";
import { RecruiterReportView } from "@/components/interview/report/RecruiterReportView";

export default function InterviewReportPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const interviewId = searchParams.get("interviewId");
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<InterviewReport | null>(null);
  const [userRole, setUserRole] = useState<string>("candidate");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!interviewId) {
        setError("Missing interview id.");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const { report: reportData, role } = await interviewsService.requestInterviewReport(interviewId);
        setReport(reportData);
        setUserRole(role);
      } catch (err: any) {
        setError(err?.message || "Failed to load report.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [interviewId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center">
        <div className="flex flex-col items-center justify-center gap-4 text-gray-300">
          <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
          <span className="text-lg">Generating comprehensive report...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center px-4">
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-6 border border-red-500/30 backdrop-blur-sm max-w-md w-full">
          <div className="flex items-start gap-3 text-red-200 bg-red-500/10 border border-red-500/30 rounded-xl p-4">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold mb-1">Could not load report</p>
              <p className="text-sm text-red-100/80">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!report) {
    return null;
  }

  // Render role-specific component
  if (userRole === "recruiter") {
    return <RecruiterReportView report={report} interviewId={interviewId} />;
  }

  return <CandidateReportView report={report} interviewId={interviewId} />;
}
