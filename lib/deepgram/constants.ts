/** Client tool the agent calls when the candidate confirms ending. */
export const END_INTERVIEW_FUNCTION_NAME = "end_interview";

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
