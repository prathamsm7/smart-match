/**
 * Chat message utilities
 */

import { ChatMessage } from "../types";

/**
 * Add or merge chat message
 */
export function addChatMessage(
  chat: ChatMessage[],
  sender: ChatMessage["sender"],
  text: string,
  via: ChatMessage["via"],
  options?: { merge?: boolean },
): ChatMessage[] {
  const trimmed = text.trim();
  console.log("🚀 ~ addChatMessage ~ trimmed:", trimmed)
  if (!trimmed) return chat;

  if (options?.merge && chat.length > 0) {
    const last = chat[chat.length - 1];
    if (last.sender === sender && last.via === via) {
      return [
        ...chat.slice(0, -1),
        {
          ...last,
          text: last.text
            ? `${last.text}${last.text.endsWith(" ") ? "" : " "}${trimmed}`
            : trimmed,
          ts: Date.now(),
        },
      ];
    }
  }

  return [
    ...chat,
    { id: crypto.randomUUID(), sender, text: trimmed, via, ts: Date.now() },
  ];
}
