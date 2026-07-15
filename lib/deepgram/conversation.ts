import type { ChatMessage } from "@/components/candidate/interviews/types";
import type { ConnectionStatus } from "@/components/candidate/interviews/types";
import type { ConversationUtterance, DeepgramAgentState } from "./types";

export function mapAgentStateToConnectionStatus(
  state: DeepgramAgentState,
): ConnectionStatus {
  if (state === "reconnecting") return "connecting";
  return state;
}

function joinUtteranceParts(left: string, right: string): string {
  const a = left.trimEnd();
  const b = right.trimStart();
  if (!a) return b;
  if (!b) return a;
  // Streaming updates sometimes resend the full growing transcript.
  if (b.startsWith(a)) return b;
  if (a.endsWith(b)) return a;
  const needsSpace = !/[\s\n]$/.test(a) && !/^[,.;:!?]/.test(b);
  return needsSpace ? `${a} ${b}` : `${a}${b}`;
}

/**
 * Deepgram may emit multiple ConversationText events per turn.
 * Merge consecutive same-role fragments into one chat bubble.
 */
export function conversationToChatMessages(
  conversation: ConversationUtterance[],
): ChatMessage[] {
  const merged: ChatMessage[] = [];

  for (const entry of conversation) {
    const last = merged[merged.length - 1];
    if (last && last.role === entry.role) {
      last.text = joinUtteranceParts(last.text, entry.content);
      last.timestamp = entry.timestamp;
      last.isStreaming = true;
      continue;
    }
    merged.push({
      role: entry.role,
      text: entry.content,
      via: "audio",
      timestamp: entry.timestamp,
      isStreaming: true,
    });
  }

  // Only the last bubble is still "streaming" if roles alternate; clear older flags.
  return merged.map((msg, i) =>
    i === merged.length - 1 ? msg : { ...msg, isStreaming: false },
  );
}

/** Apply one ConversationText fragment into live chat (grows last same-role bubble). */
export function appendConversationFragment(
  chat: ChatMessage[],
  role: "user" | "assistant",
  content: string,
  via: "audio" | "text" = "audio",
): ChatMessage[] {
  if (!content.trim()) return chat;

  const next = chat.map((m) => ({ ...m, isStreaming: false }));
  const last = next[next.length - 1];

  if (last && last.role === role) {
    last.text = joinUtteranceParts(last.text, content);
    last.timestamp = Date.now();
    last.isStreaming = true;
    last.via = via;
    return [...next.slice(0, -1), last];
  }

  return [
    ...next,
    {
      role,
      text: content.trim(),
      via,
      timestamp: Date.now(),
      isStreaming: true,
    },
  ];
}

/** Ensure a streaming assistant bubble exists as soon as audio starts. */
export function ensureStreamingAssistantBubble(
  chat: ChatMessage[],
): ChatMessage[] {
  const last = chat[chat.length - 1];
  if (last?.role === "assistant" && last.isStreaming) return chat;

  const cleared = chat.map((m) => ({ ...m, isStreaming: false }));
  if (last?.role === "assistant" && !last.text.trim()) {
    return [
      ...cleared.slice(0, -1),
      { ...last, isStreaming: true, text: last.text },
    ];
  }

  return [
    ...cleared,
    {
      role: "assistant",
      text: "",
      via: "audio",
      timestamp: Date.now(),
      isStreaming: true,
    },
  ];
}

export function markChatSettled(chat: ChatMessage[]): ChatMessage[] {
  return chat.map((m) => ({ ...m, isStreaming: false }));
}

/** Keep confirmation / ending turns in the transcript if Deepgram dropped them. */
export function ensureEndingTurnsInChat(
  chat: ChatMessage[],
  confirmed: boolean,
): ChatMessage[] {
  if (!confirmed) return markChatSettled(chat);

  let next = markChatSettled(chat);
  const last = next[next.length - 1];
  const lastText = (last?.text || "").toLowerCase();

  const userConfirmed =
    last?.role === "user" &&
    /\b(yes|yeah|yep|sure|okay|ok|confirm|end)\b/.test(lastText);

  if (!userConfirmed) {
    next = [
      ...next,
      {
        role: "user",
        text: "Yes, please end the interview.",
        via: "audio",
        timestamp: Date.now(),
      },
    ];
  }

  return next;
}

export function parseEndInterviewConfirmation(fn: {
  arguments?: unknown;
  input?: string;
}): boolean {
  try {
    const raw =
      "arguments" in fn && fn.arguments != null ? fn.arguments : fn.input;
    const args =
      typeof raw === "string" ? JSON.parse(raw || "{}") : raw || {};
    return Boolean((args as { confirmed?: boolean }).confirmed);
  } catch {
    return false;
  }
}
