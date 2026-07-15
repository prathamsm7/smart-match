"use client";

import { Mic, MicOff, Volume2, VolumeX, Phone, Bot, User } from "lucide-react";
import type { ConnectionStatus } from "@/components/candidate/interviews/types";

type InterviewerPanelProps = {
  status: ConnectionStatus;
  isAIPlaying: boolean;
  hearingUser: boolean;
  turnLabel: string;
  isMicOn: boolean;
  isSpeakerOn: boolean;
  micAllowed: boolean | null;
  isLoading: boolean;
  isEnding: boolean;
  onToggleMic: () => void;
  onToggleSpeaker: () => void;
  onConnectOrEnd: () => void;
};

export function InterviewerPanel({
  status,
  isAIPlaying,
  hearingUser,
  turnLabel,
  isMicOn,
  isSpeakerOn,
  micAllowed,
  isLoading,
  isEnding,
  onToggleMic,
  onToggleSpeaker,
  onConnectOrEnd,
}: InterviewerPanelProps) {
  const controlsDisabled = isLoading || isEnding;
  return (
    <div className="w-2/5 border-r border-white/10 bg-gradient-to-br from-slate-900/50 to-slate-950/50 flex flex-col">
      <div className="flex-1 flex items-center justify-center p-8 relative">
        <div className="relative">
          <div className="relative">
            <div
              className={`w-64 h-64 rounded-full flex items-center justify-center transition-all duration-300 ${
                isAIPlaying
                  ? "bg-gradient-to-br from-blue-500 via-cyan-500 to-sky-400 scale-110 shadow-2xl shadow-blue-500/50"
                  : hearingUser
                    ? "bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-400 scale-110 shadow-2xl shadow-emerald-500/40"
                    : "bg-gradient-to-br from-slate-600 via-slate-500 to-slate-400 scale-100"
              }`}
            >
              <div className="w-60 h-60 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                {hearingUser ? (
                  <Mic className="w-24 h-24 text-emerald-400" />
                ) : (
                  <Bot
                    className={`w-24 h-24 ${
                      isAIPlaying ? "text-blue-400" : "text-slate-400"
                    }`}
                  />
                )}
              </div>
            </div>
            {(isAIPlaying || hearingUser) && (
              <>
                <div
                  className={`absolute inset-0 rounded-full animate-ping opacity-20 ${
                    isAIPlaying ? "bg-blue-500" : "bg-emerald-500"
                  }`}
                />
                <div
                  className={`absolute inset-0 rounded-full animate-pulse opacity-30 ${
                    isAIPlaying ? "bg-cyan-500" : "bg-teal-500"
                  }`}
                />
              </>
            )}
          </div>
          <div
            className={`absolute -bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 border rounded-full whitespace-nowrap ${
              isAIPlaying
                ? "bg-blue-950/90 border-blue-400/40 text-blue-200"
                : hearingUser
                  ? "bg-emerald-950/90 border-emerald-400/40 text-emerald-200"
                  : "bg-slate-800 border-white/10 text-gray-200"
            }`}
          >
            <span className="text-sm font-medium flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  isAIPlaying
                    ? "bg-blue-400 animate-pulse"
                    : hearingUser
                      ? "bg-emerald-400 animate-pulse"
                      : status === "connected"
                        ? "bg-slate-400"
                        : "bg-slate-600"
                }`}
              />
              {turnLabel}
            </span>
          </div>
        </div>
      </div>

      <div className="px-6 pt-2 pb-4 shrink-0">
        <div
          className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
            isAIPlaying
              ? "border-blue-500/30 bg-blue-500/10"
              : hearingUser
                ? "border-emerald-500/30 bg-emerald-500/10"
                : "border-white/10 bg-slate-800/40"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center ${
                isAIPlaying
                  ? "bg-blue-500/30"
                  : hearingUser
                    ? "bg-emerald-500/30"
                    : "bg-slate-700"
              }`}
            >
              {isAIPlaying ? (
                <Bot className="w-4 h-4 text-blue-300" />
              ) : (
                <User
                  className={`w-4 h-4 ${
                    hearingUser ? "text-emerald-300" : "text-slate-400"
                  }`}
                />
              )}
            </div>
            <div>
              <p className="text-sm font-semibold">
                {isAIPlaying
                  ? "Agent turn"
                  : hearingUser
                    ? "Your turn"
                    : "Waiting for speech"}
              </p>
              <p className="text-xs text-gray-400">
                {isAIPlaying
                  ? "Agent will finish, then listen"
                  : hearingUser
                    ? "Speak freely — agent waits for a pause"
                    : "Ask or answer when ready"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 bg-slate-900/50 border-t border-white/10 shrink-0">
        <div className="flex justify-center space-x-4">
          <button
            onClick={onToggleMic}
            disabled={
              status !== "connected" || micAllowed === false || controlsDisabled
            }
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
              !isMicOn
                ? "bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/50"
                : "bg-slate-700 hover:bg-slate-600"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            title={isMicOn ? "Mute" : "Unmute"}
          >
            {isMicOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
          </button>

          <button
            onClick={onConnectOrEnd}
            disabled={status === "connecting" || controlsDisabled}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
              status === "connected"
                ? "bg-gradient-to-br from-red-600 to-orange-600 hover:shadow-lg hover:shadow-red-500/50"
                : "bg-gradient-to-br from-blue-600 to-cyan-600 hover:shadow-lg hover:shadow-blue-500/50"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            title={status === "connected" ? "Disconnect" : "Connect"}
          >
            <Phone className="w-7 h-7" />
          </button>

          <button
            onClick={onToggleSpeaker}
            disabled={controlsDisabled}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
              !isSpeakerOn
                ? "bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/50"
                : "bg-slate-700 hover:bg-slate-600"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            title={isSpeakerOn ? "Mute speaker" : "Unmute speaker"}
          >
            {isSpeakerOn ? (
              <Volume2 className="w-6 h-6" />
            ) : (
              <VolumeX className="w-6 h-6" />
            )}
          </button>
        </div>
        <p className="text-center text-xs text-gray-400 mt-4">
          Voice input streams automatically. Text chat always available.
        </p>
      </div>
    </div>
  );
}
