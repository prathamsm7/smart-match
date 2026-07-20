"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AgentProvider } from "@deepgram/react";
import {
  DEEPGRAM_AUDIO,
  buildDeepgramSessionConfig,
  type InterviewCandidateProfile,
  type InterviewJobProfile,
} from "@/lib/deepgram";

type DeepgramAgentProviderProps = {
  interviewId: string;
  candidateProfile: InterviewCandidateProfile;
  jobProfile: InterviewJobProfile;
  children: ReactNode;
};

/**
 * Owns AgentSession + mic + TTS for the interview page.
 * Agent settings (incl. BYO proxy token) are loaded from the server first.
 * @see https://developers.deepgram.com/docs/browser-agent-react
 */
export function DeepgramAgentProvider({
  interviewId,
  candidateProfile: _candidateProfile,
  jobProfile: _jobProfile,
  children,
}: DeepgramAgentProviderProps) {
  const [config, setConfig] = useState<Awaited<
    ReturnType<typeof buildDeepgramSessionConfig>
  > | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    buildDeepgramSessionConfig(interviewId)
      .then((sessionConfig) => {
        if (!cancelled) setConfig(sessionConfig);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to prepare Deepgram session",
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [interviewId]);

  if (error) {
    return (
      <div className="h-screen w-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <h3 className="text-lg font-medium mb-2">Cannot Start Interview</h3>
          <p className="text-gray-300">{error}</p>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="h-screen w-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center">
        <p className="text-gray-300">Preparing voice agent…</p>
      </div>
    );
  }

  return (
    <AgentProvider
      config={config}
      microphone
      microphoneOptions={{
        sampleRate: DEEPGRAM_AUDIO.inputSampleRate,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      }}
      tts
      playerSampleRate={DEEPGRAM_AUDIO.outputSampleRate}
    >
      {children}
    </AgentProvider>
  );
}
