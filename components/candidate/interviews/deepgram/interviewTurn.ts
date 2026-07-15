import type { ConnectionStatus } from "@/components/candidate/interviews/types";

export type InterviewTurnPhase =
  | "ending"
  | "waiting"
  | "agent_speaking"
  | "user_speaking"
  | "listening"
  | "ready";

const MIC_ACTIVE_LEVEL = 0.04;

const TURN_LABELS: Record<InterviewTurnPhase, string> = {
  ending: "Ending interview…",
  waiting: "Waiting to connect",
  agent_speaking: "AI is speaking",
  user_speaking: "You are speaking",
  listening: "Listening…",
  ready: "Ready",
};

type ResolveTurnInput = {
  isEnding: boolean;
  status: ConnectionStatus;
  isAIPlaying: boolean;
  isUserSpeaking: boolean;
  isListening: boolean;
  isMicOn: boolean;
  micLevel: number;
};

/**
 * Single source of truth for who "has the floor".
 * Priority is exclusive (first match wins) so labels/flags can't contradict.
 */
export function resolveInterviewTurn({
  isEnding,
  status,
  isAIPlaying,
  isUserSpeaking,
  isListening,
  isMicOn,
  micLevel,
}: ResolveTurnInput): {
  phase: InterviewTurnPhase;
  label: string;
  isAgentSpeaking: boolean;
  isUserSpeaking: boolean;
} {
  if (isEnding) {
    return phaseResult("ending");
  }

  if (status !== "connected") {
    return phaseResult("waiting");
  }

  // Agent outbound audio always wins over mic-level noise.
  if (isAIPlaying) {
    return phaseResult("agent_speaking");
  }

  const userHasFloor =
    isMicOn && (isUserSpeaking || micLevel > MIC_ACTIVE_LEVEL);

  if (userHasFloor) {
    return phaseResult("user_speaking");
  }

  if (isListening) {
    return phaseResult("listening");
  }

  return phaseResult("ready");
}

function phaseResult(phase: InterviewTurnPhase) {
  return {
    phase,
    label: TURN_LABELS[phase],
    isAgentSpeaking: phase === "agent_speaking",
    isUserSpeaking: phase === "user_speaking",
  };
}
