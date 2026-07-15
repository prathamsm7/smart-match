export type InterviewCandidateProfile = {
  name?: string | null;
  totalExperienceYears?: number | string | null;
  skills?: unknown;
  projects?: unknown;
  summary?: string | null;
  experience?: unknown;
};

export type InterviewJobProfile = {
  title?: string | null;
  employerName?: string | null;
  description?: string | null;
  requirements?: string | null;
  responsibilities?: string | null;
};

export type DeepgramAgentState =
  | "idle"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected";

export type SessionErrorSource = "agent" | "sdk" | "disconnect";

export type ConversationUtterance = {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
};
