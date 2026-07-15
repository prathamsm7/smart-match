import type { AgentSettingsObject } from "@deepgram/react";
import { END_INTERVIEW_FUNCTION_NAME } from "./constants";
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

export function buildInterviewAgentSettings(
  user: InterviewCandidateProfile,
  job: InterviewJobProfile,
): AgentSettingsObject {

  const prompt = buildInterviewerPrompt(user, job);
  console.log("🚀 ~ buildInterviewAgentSettings ~ prompt:", prompt)

  return {
    listen: {
      // SDK types lag Flux EOT fields; see https://developers.deepgram.com/docs/flux/configuration
      provider: INTERVIEW_LISTEN_PROVIDER as any,
    },
    think: {
      provider: { type: "open_ai", model: "gpt-4o-mini" },
      prompt: prompt,
      functions: [
        {
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
        },
      ],
    },
    speak: {
      provider: { type: "deepgram", model: "aura-2-thalia-en" },
    },
    greeting: buildInterviewGreeting(user, job),
  };
}
