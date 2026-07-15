"use client";

import { Bot, User, Send, AlertCircle } from "lucide-react";
import type {
  ChatMessage,
  ConnectionStatus,
} from "@/components/candidate/interviews/types";

type TranscriptPanelProps = {
  status: ConnectionStatus;
  chat: ChatMessage[];
  isAIPlaying: boolean;
  hearingUser: boolean;
  warning: string | null;
  micAllowed: boolean | null;
  textInput: string;
  isEnding: boolean;
  onTextInputChange: (value: string) => void;
  onSendText: () => void;
};

export function TranscriptPanel({
  status,
  chat,
  isAIPlaying,
  hearingUser,
  warning,
  micAllowed,
  textInput,
  isEnding,
  onTextInputChange,
  onSendText,
}: TranscriptPanelProps) {
  const inputDisabled = status !== "connected" || isEnding;
  return (
    <div className="flex-1 flex flex-col bg-gradient-to-br from-slate-900/30 to-slate-950/30">
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {chat.length === 0 && status === "connected" && (
          <div className="flex justify-center">
            <div className="px-4 py-2 bg-slate-800/50 border border-white/10 rounded-full text-sm text-gray-400">
              Connected to the AI interviewer. You can speak or type to start.
            </div>
          </div>
        )}

        {chat.map((msg, idx) => {
          if (msg.role === "system") {
            return (
              <div key={`system-${idx}-${msg.timestamp ?? idx}`} className="flex justify-center">
                <div className="px-4 py-2 bg-slate-800/50 border border-white/10 rounded-full text-sm text-gray-400">
                  {msg.text}
                </div>
              </div>
            );
          }

          const isLast = idx === chat.length - 1;
          const showLive =
            isLast &&
            ((msg.role === "assistant" && isAIPlaying) ||
              (msg.role === "user" && hearingUser));

          return (
            <div
              key={`${msg.role}-${idx}-${msg.timestamp || 0}`}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`flex items-start max-w-[75%] ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                style={{ gap: "6px" }}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    msg.role === "assistant"
                      ? "bg-gradient-to-br from-blue-500 to-cyan-500"
                      : "bg-gradient-to-br from-emerald-500 to-teal-500"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <Bot className="w-5 h-5" />
                  ) : (
                    <User className="w-5 h-5" />
                  )}
                </div>
                <div className="flex flex-col" style={{ gap: "8px" }}>
                        <div
                          className={`px-5 py-2.5 rounded-2xl ${
                            msg.role === "assistant"
                              ? "bg-slate-800/80 backdrop-blur-sm border border-white/10"
                              : "bg-gradient-to-br from-emerald-600 to-teal-600"
                          } ${
                            showLive || msg.isStreaming
                              ? msg.role === "assistant"
                                ? "ring-1 ring-blue-400/40"
                                : "ring-1 ring-emerald-300/50"
                              : ""
                          }`}
                        >
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            {msg.text ||
                              (msg.isStreaming ? (
                                <span className="text-gray-400 italic">
                                  Speaking…
                                </span>
                              ) : (
                                ""
                              ))}
                            {msg.isStreaming && msg.text ? (
                              <span className="inline-block w-1.5 h-4 ml-0.5 align-middle bg-current animate-pulse rounded-sm opacity-70" />
                            ) : null}
                          </p>
                        </div>
                  <div className="flex items-end justify-end space-x-2 mb-1 w-full">
                    <span className="text-xs font-semibold text-gray-400">
                      {msg.role === "assistant" ? "AI Interviewer" : "You"}
                    </span>
                    {showLive && (
                      <span
                        className={`text-[10px] font-medium uppercase tracking-wide ${
                          msg.role === "assistant"
                            ? "text-blue-400"
                            : "text-emerald-400"
                        }`}
                      >
                        live
                      </span>
                    )}
                    <span className="text-xs text-gray-500">
                      {msg.timestamp
                        ? new Date(msg.timestamp).toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                          })
                        : ""}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {isAIPlaying &&
          chat[chat.length - 1]?.role !== "assistant" &&
          !chat[chat.length - 1]?.isStreaming && (
          <TypingIndicator role="assistant" />
        )}
        {hearingUser && chat[chat.length - 1]?.role !== "user" && (
          <TypingIndicator role="user" />
        )}
      </div>

      {warning && !isEnding && (
        <div className="mx-6 mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <div className="flex items-center space-x-2 text-yellow-400 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{warning}</span>
          </div>
        </div>
      )}
      {micAllowed === false && !isEnding && (
        <div className="mx-6 mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <div className="flex items-center space-x-2 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>
              Microphone access is blocked. Please allow mic permissions and
              reload.
            </span>
          </div>
        </div>
      )}

      <div className="p-6 border-t border-white/10 bg-slate-900/50">
        <div className="flex items-center space-x-3">
          <input
            type="text"
            value={textInput}
            onChange={(e) => onTextInputChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSendText()}
            placeholder={
              isEnding
                ? "Interview is ending…"
                : status === "connected"
                  ? "Type if your mic is unavailable..."
                  : "Connect to start chatting..."
            }
            disabled={inputDisabled}
            className="flex-1 px-5 py-3 bg-slate-800/50 border border-white/10 rounded-xl focus:outline-none focus:border-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            onClick={onSendText}
            disabled={inputDisabled || !textInput.trim()}
            className="p-3 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl hover:shadow-lg hover:shadow-blue-500/50 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function TypingIndicator({ role }: { role: "assistant" | "user" }) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`flex items-start max-w-[75%] ${
          isUser ? "flex-row-reverse space-x-reverse space-x-3" : "space-x-3"
        }`}
      >
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center ${
            isUser
              ? "bg-gradient-to-br from-emerald-500 to-teal-500"
              : "bg-gradient-to-br from-blue-500 to-cyan-500"
          }`}
        >
          {isUser ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
        </div>
        <div
          className={`px-5 py-4 rounded-2xl ${
            isUser
              ? "bg-emerald-600/40 border border-emerald-400/30"
              : "bg-slate-800/80 border border-blue-400/30 ring-1 ring-blue-400/20"
          }`}
        >
          <div className="flex space-x-2">
            {[0, 0.15, 0.3].map((delay) => (
              <div
                key={delay}
                className={`w-2 h-2 rounded-full animate-bounce ${
                  isUser ? "bg-emerald-300" : "bg-blue-400"
                }`}
                style={{ animationDelay: `${delay}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
