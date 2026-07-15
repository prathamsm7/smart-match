import Link from "next/link";
import { DeepgramLiveInterviewUI } from "@/components/candidate/interviews/deepgram";
import { LiveInterviewUI } from "@/components/candidate/interviews/LiveInterviewUI";
import { getInterviewVoiceProvider } from "@/lib/interview/provider";
import { loadInterviewSession } from "@/lib/interview/loadSession";

function InterviewBlocked({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center">
      <div className="text-center max-w-md px-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 mb-4">
          <span className="text-red-500 text-2xl">✕</span>
        </div>
        <h3 className="text-lg font-medium text-white mb-2">
          Cannot Start Interview
        </h3>
        <p className="text-gray-400 mb-6">{message}</p>
        <Link
          href="/dashboard"
          className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}

export default async function InterviewPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id: interviewId } = await searchParams;

  if (!interviewId) {
    return <InterviewBlocked message="Interview ID is required" />;
  }

  const result = await loadInterviewSession(interviewId, "start");
  if (!result.ok) {
    return <InterviewBlocked message={result.error} />;
  }

  const { candidateProfile, jobProfile } = result.data;
  const voiceProvider = getInterviewVoiceProvider();

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-950 text-white">
      {voiceProvider === "deepgram" ? (
        <DeepgramLiveInterviewUI
          interviewId={interviewId}
          candidateProfile={candidateProfile}
          jobProfile={jobProfile}
        />
      ) : (
        <LiveInterviewUI
          interviewId={interviewId}
          initialUserData={candidateProfile}
          initialJobData={jobProfile}
        />
      )}
    </div>
  );
}
