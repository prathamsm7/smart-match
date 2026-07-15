"use client";

import type { ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { useInterviewBootstrap } from "@/hooks/deepgram";
import type {
  InterviewCandidateProfile,
  InterviewJobProfile,
} from "@/lib/deepgram";
import { DeepgramAgentProvider } from "./DeepgramAgentProvider";
import { DeepgramSessionView } from "./DeepgramSessionView";

type DeepgramLiveInterviewUIProps = {
  interviewId: string;
  candidateProfile: InterviewCandidateProfile;
  jobProfile: InterviewJobProfile;
};

function FullScreenShell({ children }: { children: ReactNode }) {
  return (
    <div className="h-screen w-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden flex items-center justify-center">
      {children}
    </div>
  );
}

/**
 * Entry point for Deepgram voice interviews.
 * Profiles come from the Server Component page — only mic gating runs client-side.
 */
export function DeepgramLiveInterviewUI({
  interviewId,
  candidateProfile,
  jobProfile,
}: DeepgramLiveInterviewUIProps) {
  const bootstrap = useInterviewBootstrap();

  if (bootstrap.micAllowed === false) {
    return (
      <FullScreenShell>
        <div className="text-center max-w-md px-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 mb-4">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">
            Cannot Start Interview
          </h3>
          <p className="text-gray-300 mb-6">
            {bootstrap.warning || "Microphone permission is required."}
          </p>
          <button
            onClick={bootstrap.goToDashboard}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </FullScreenShell>
    );
  }

  return (
    <DeepgramAgentProvider
      interviewId={interviewId}
      candidateProfile={candidateProfile}
      jobProfile={jobProfile}
    >
      <DeepgramSessionView
        interviewId={interviewId}
        bootstrapWarning={bootstrap.warning}
        setBootstrapWarning={bootstrap.setWarning}
        micAllowed={bootstrap.micAllowed}
      />
    </DeepgramAgentProvider>
  );
}
