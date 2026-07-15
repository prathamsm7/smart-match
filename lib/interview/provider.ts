export type InterviewVoiceProvider = "vapi" | "deepgram";

/**
 * Client-safe voice provider for live interviews.
 * Set NEXT_PUBLIC_INTERVIEW_PROVIDER=deepgram to use Deepgram; default is vapi.
 */
export function getInterviewVoiceProvider(): InterviewVoiceProvider {
  const value = (process.env.NEXT_PUBLIC_INTERVIEW_PROVIDER ?? "vapi")
    .trim()
    .toLowerCase();
  return value === "deepgram" ? "deepgram" : "vapi";
}
