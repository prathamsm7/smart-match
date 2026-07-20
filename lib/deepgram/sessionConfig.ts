import type { AgentSessionConfig, AgentSettingsObject } from "@deepgram/react";
import { DEEPGRAM_AUDIO } from "./constants";
import type { InterviewThinkMode } from "./agentSettings";
import type { ByoThinkDisabledReason } from "./byoThink";
import { formatByoThinkDisabledMessage } from "./byoThink";

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

export type DeepgramSessionAgentResponse = {
  agent: AgentSettingsObject;
  thinkMode: InterviewThinkMode;
  thinkModeReason?: ByoThinkDisabledReason;
};

/** Load agent settings from the server (BYO proxy token, no OpenAI key). */
export async function fetchDeepgramSessionAgent(
  interviewId: string,
): Promise<DeepgramSessionAgentResponse> {
  const res = await fetch("/api/interview/deepgram/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ interviewId }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { error?: string }).error ||
        "Failed to load Deepgram session settings",
    );
  }

  return res.json() as Promise<DeepgramSessionAgentResponse>;
}

/**
 * Browser AgentSession config.
 * Auto-reconnect is off: SDK reconnect can send mic audio before Settings.
 */
export async function buildDeepgramSessionConfig(
  interviewId: string,
): Promise<AgentSessionConfig> {
  const { agent, thinkMode, thinkModeReason } =
    await fetchDeepgramSessionAgent(interviewId);

  if (thinkMode === "byo_proxy") {
    console.info(
      "[Deepgram] think mode: byo_proxy (OpenAI via secure server proxy, context_length: max)",
    );
  } else {
    console.info(
      "[Deepgram] think mode: managed (Deepgram OpenAI, 25k prompt cap)",
    );
    if (thinkModeReason) {
      console.info(
        `[Deepgram] BYO unavailable: ${formatByoThinkDisabledMessage(thinkModeReason)}`,
      );
    }
  }

  return {
    auth: {
      tokenFactory: () => fetchDeepgramAccessToken(interviewId),
    },
    agent,
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
