"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { LiveInterviewUI } from "@/components/candidate/interviews/LiveInterviewUI";

function InterviewPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [interviewId, setInterviewId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = searchParams.get("id");
    if (!id) {
      setError("Interview ID is required");
      setLoading(false);
      return;
    }

    // Validate interview before allowing access
    async function validateInterview() {
      try {
        const response = await fetch(`/api/interview/${id}`);
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to fetch interview");
        }

        const data = await response.json();
        const interview = data.interview;

        // Check if interview belongs to user
        // Check if interview is in correct status
        if (interview.status !== "PENDING" && interview.status !== "IN_PROGRESS") {
          throw new Error(`Interview cannot be started. Current status: ${interview.status}`);
        }

        // Check if application status is correct
        if (interview.application.status !== "INTERVIEW" && interview.application.status !== "HIRED") {
          throw new Error(`Application status must be INTERVIEW or HIRED. Current status: ${interview.application.status}`);
        }

        setInterviewId(id);
      } catch (err) {
        console.error("Error validating interview:", err);
        setError(err instanceof Error ? err.message : "Failed to validate interview");
      } finally {
        setLoading(false);
      }
    }

    validateInterview();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Validating interview...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 mb-4">
            <span className="text-red-500 text-2xl">✕</span>
          </div>
          <h3 className="text-lg font-medium text-white mb-2">Cannot Start Interview</h3>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!interviewId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <LiveInterviewUI interviewId={interviewId} />
    </div>
  );
}

export default function InterviewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading...</p>
        </div>
      </div>
    }>
      <InterviewPageContent />
    </Suspense>
  );
}

