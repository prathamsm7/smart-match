/** Client tool the agent calls when the candidate confirms ending. */
export const END_INTERVIEW_FUNCTION_NAME = "end_interview";

/** Technical interviewing window before timed wrap-up (seconds). */
export const WRAP_UP_AFTER_SEC = 17 * 60;

/** Deepgram-managed LLM fallback (25k prompt cap; no context_length). */
export const DEEPGRAM_MANAGED_THINK_MODEL = "gpt-5.4";

/**
 * BYO OpenAI via server-side LLM proxy.
 * Auto-enabled when OPENAI_API_KEY is set and the app URL is publicly reachable.
 * @see lib/deepgram/byoThink.ts
 */
export const DEEPGRAM_BYO_THINK = {
  model: "gpt-4o-mini",
  temperature: 0.6,
  contextLength: "max" as const,
} as const;

/** Proxy token TTL — slightly longer than max interview + Deepgram JWT TTL. */
export const LLM_PROXY_TOKEN_TTL_SEC = 25 * 60;

/** Dev-only HMAC secret when INTERVIEW_LLM_PROXY_SECRET is unset locally. */
export const DEV_LLM_PROXY_SECRET =
  "dev-interview-llm-proxy-secret-change-me";

/**
 * Public URL for the LLM proxy when developing on localhost.
 * Set to your ngrok URL (e.g. "https://abc123.ngrok-free.app").
 * Must tunnel to this same dev server — do not point at production.
 * Leave null when testing on Vercel or when browsing via ngrok directly.
 */
export const DEEPGRAM_LLM_PROXY_PUBLIC_BASE_URL: string | null = "https://left-carat-overvalue.ngrok-free.dev";

export const DEEPGRAM_AUDIO = {
  inputSampleRate: 16_000,
  outputSampleRate: 24_000,
  encoding: "linear16" as const,
} as const;

export const SESSION_ERROR_WINDOW_MS = 15_000;
export const SESSION_ERROR_LOG_DEBOUNCE_MS = 3_000;

/** Abort immediately for these mid-session socket failures. */
export const FATAL_SESSION_ERROR_PATTERNS = [
  /binary message before settings/i,
  /socket is not open/i,
  /waited too long for a websocket message/i,
] as const;
