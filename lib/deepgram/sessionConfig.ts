import type { AgentSessionConfig } from "@deepgram/react";
import { DEEPGRAM_AUDIO } from "./constants";
import { buildInterviewAgentSettings } from "./agentSettings";
import type {
  InterviewCandidateProfile,
  InterviewJobProfile,
} from "./types";

/** Mint a short-lived JWT from our API (never expose DEEPGRAM_API_KEY). */
export async function fetchDeepgramAccessToken(
  interviewId: string,
): Promise<string> {
  const res = await fetch("/api/interview/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ interviewId }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { error?: string }).error || "Failed to get Deepgram token",
    );
  }

  return res.text();
}

/**
 * Browser AgentSession config.
 * Auto-reconnect is off: SDK reconnect can send mic audio before Settings.
 */
export function buildDeepgramSessionConfig(
  interviewId: string,
  userData: InterviewCandidateProfile,
  jobData: InterviewJobProfile,
): AgentSessionConfig {
  return {
    auth: {
      tokenFactory: () => fetchDeepgramAccessToken(interviewId),
    },
    agent: buildInterviewAgentSettings(userData, jobData),
    audio: {
      input: {
        encoding: DEEPGRAM_AUDIO.encoding,
        sampleRate: DEEPGRAM_AUDIO.inputSampleRate,
      },
      output: {
        encoding: DEEPGRAM_AUDIO.encoding,
        sampleRate: DEEPGRAM_AUDIO.outputSampleRate,
      },
    },
    reconnect: { enabled: false },
  };
}
