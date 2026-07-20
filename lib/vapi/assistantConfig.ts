import type {
  CallHookCustomerSpeechTimeout,
  CreateAssistantDTO,
  CustomerSpeechTimeoutOptions,
} from "@vapi-ai/web/dist/api";
import { buildVapiInterviewerPrompt } from "@/lib/vapi/prompt";

type InterviewUser = {
  name?: string | null;
  totalExperienceYears?: number | string | null;
  skills?: unknown;
  projects?: unknown;
  summary?: string | null;
  experience?: unknown;
};

type InterviewJob = {
  title?: string | null;
  employerName?: string | null;
  description?: string | null;
  requirements?: string | null;
  responsibilities?: string | null;
};

/** Transient assistant passed to `vapi.start()` — full SDK typing + API-only fields. */
export type VapiInterviewAssistantConfig = CreateAssistantDTO & {
  /**
   * Seconds of silence before the call ends.
   * Accepted by the Vapi API on web calls; omitted from generated `CreateAssistantDTO`.
   */
  silenceTimeoutSeconds?: number;
};

const idleSpeechTimeoutHook = {
  on: "customer.speech.timeout",
  options: {
    timeoutSeconds: 45,
    triggerMaxCount: 3,
    // SDK types triggerResetMode as object; API accepts "onUserSpeech" | "never".
    triggerResetMode: "onUserSpeech",
  } as unknown as CustomerSpeechTimeoutOptions,
  do: [
    {
      type: "say",
      prompt:
        "Ask briefly whether the candidate is still there, and that you are listening.",
    },
  ],
} satisfies CallHookCustomerSpeechTimeout;

/**
 * Transient assistant for web interviews — avoids dashboard assistant defaults
 * (endCall tool, silence timeout, hooks) that can end calls within seconds.
 */
export function buildVapiInterviewAssistant(
  user: InterviewUser,
  job: InterviewJob,
): VapiInterviewAssistantConfig {
  return {
    name: "Despina Interview",
    silenceTimeoutSeconds: 3600,
    maxDurationSeconds: 20 * 60,
    endCallPhrases: [],
    endCallMessage: "",
    artifactPlan: {
      recordingEnabled: true,
      loggingEnabled: true,
      transcriptPlan: {
        enabled: true,
      },
    },
    monitorPlan: {
      listenEnabled: true,
      controlEnabled: true,
    },
    model: {
      provider: "openai",
      model: "gpt-4o-mini",
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content: buildVapiInterviewerPrompt(user, job),
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "requestEndInterview",
            description:
              "Call only when the candidate clearly asks to stop. Do not call for normal answers.",
            parameters: {
              type: "object",
              properties: {
                reason: { type: "string" },
              },
            },
          },
        },
        {
          type: "function",
          function: {
            name: "handleConfirmation",
            description:
              "Call after yes/no confirmation when ending. Never ends the call — client handles disconnect.",
            parameters: {
              type: "object",
              properties: {
                confirmed: { type: "boolean" },
                userResponse: { type: "string" },
              },
              required: ["confirmed"],
            },
          },
        },
      ],
    },
    firstMessage: `Hello ${user.name || "there"}! I'm Despina, your AI interviewer for the ${job.title || "position"} at ${job.employerName || "the company"}. Let's begin — please introduce yourself.`,
    firstMessageMode: "assistant-speaks-first",
    transcriber: {
      provider: "deepgram",
      model: "nova-3",
      language: "en",
      endpointing: 250,
    },
    voice: {
      model: "aura-2",
      voiceId: "thalia",
      provider: "deepgram",
      mipOptOut: true,
      fallbackPlan: {
        voices: [
          {
            model: "aura",
            voiceId: "luna",
            provider: "deepgram",
          },
        ],
      },
    },
    startSpeakingPlan: {
      waitSeconds: 0.5,
      smartEndpointingEnabled: true,
    },
    stopSpeakingPlan: {
      numWords: 1,
      voiceSeconds: 0.2,
      backoffSeconds: 0.4,
    },
    hooks: [idleSpeechTimeoutHook],
  } satisfies VapiInterviewAssistantConfig;
}
