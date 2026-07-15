"use client";

import { useMemo, type ReactNode } from "react";
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
 * @see https://developers.deepgram.com/docs/browser-agent-react
 */
export function DeepgramAgentProvider({
  interviewId,
  candidateProfile,
  jobProfile,
  children,
}: DeepgramAgentProviderProps) {
  const config = useMemo(
    () =>
      buildDeepgramSessionConfig(interviewId, candidateProfile, jobProfile),
    [interviewId, candidateProfile, jobProfile],
  );

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
