import type { AgentSettingsObject } from "@deepgram/react";
import {
  DEEPGRAM_BYO_THINK,
  DEEPGRAM_MANAGED_THINK_MODEL,
  END_INTERVIEW_FUNCTION_NAME,
} from "./constants";
import { buildInterviewGreeting, buildInterviewerPrompt } from "./prompt";
import type {
  InterviewCandidateProfile,
  InterviewJobProfile,
} from "./types";

/**
 * Flux end-of-turn for interviews (High-Reliability style).
 * Docs: https://developers.deepgram.com/docs/flux/configuration
 */
const INTERVIEW_LISTEN_PROVIDER = {
  type: "deepgram" as const,
  model: "flux-general-en",
  version: "v2" as const,
  eot_threshold: 0.85,
  eot_timeout_ms: 8000,
};

const END_INTERVIEW_FUNCTION = {
  name: END_INTERVIEW_FUNCTION_NAME,
  description:
    "End or continue the interview after the candidate responds to the end confirmation question.",
  parameters: {
    type: "object",
    properties: {
      confirmed: {
        type: "boolean",
        description:
          "True if the candidate confirmed ending; false if they want to continue.",
      },
      reason: {
        type: "string",
        description: "Optional reason the candidate gave for ending.",
      },
    },
    required: ["confirmed"],
  },
};

export type ByoProxyThinkConfig = {
  proxyUrl: string;
  proxyToken: string;
  model: string;
};

export type InterviewThinkMode = "managed" | "byo_proxy";

function buildManagedThink(prompt: string) {
  return {
    provider: {
      type: "open_ai" as const,
      model: DEEPGRAM_MANAGED_THINK_MODEL,
    },
    prompt,
    functions: [END_INTERVIEW_FUNCTION],
  };
}

function buildByoProxyThink(prompt: string, byo: ByoProxyThinkConfig) {
  return {
    provider: {
      type: "open_ai" as const,
      model: byo.model,
      temperature: DEEPGRAM_BYO_THINK.temperature,
    },
    // Deepgram cloud calls our proxy; OPENAI_API_KEY stays server-side only.
    // Docs: https://developers.deepgram.com/docs/voice-agent-llm-models
    endpoint: {
      url: byo.proxyUrl,
      headers: {
        authorization: `Bearer ${byo.proxyToken}`,
      },
    },
    context_length: DEEPGRAM_BYO_THINK.contextLength,
    prompt,
    functions: [END_INTERVIEW_FUNCTION],
  };
}

export function buildInterviewAgentSettings(
  user: InterviewCandidateProfile,
  job: InterviewJobProfile,
  options?: { byoProxy?: ByoProxyThinkConfig },
): AgentSettingsObject {
  const prompt = buildInterviewerPrompt(user, job);
  const think = options?.byoProxy
    ? buildByoProxyThink(prompt, options.byoProxy)
    : buildManagedThink(prompt);

  return {
    listen: {
      // SDK types lag Flux EOT fields; see https://developers.deepgram.com/docs/flux/configuration
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      provider: INTERVIEW_LISTEN_PROVIDER as any,
    },
    think,
    speak: {
      provider: { type: "deepgram", model: "aura-2-thalia-en" },
    },
    greeting: buildInterviewGreeting(user, job),
  };
}
