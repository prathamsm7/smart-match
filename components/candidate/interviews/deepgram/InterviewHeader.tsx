"use client";

import { Sparkles } from "lucide-react";
import type { ConnectionStatus } from "@/components/candidate/interviews/types";

function formatElapsed(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

type InterviewHeaderProps = {
  status: ConnectionStatus;
  startTime: number | null;
  elapsedSeconds: number;
  requestId?: string | null;
  isLoading: boolean;
  isEnding?: boolean;
  /** Shown under the title when not ending. */
  providerLabel?: string;
  onConnect: () => void;
  onRequestEnd: () => void;
};

export function InterviewHeader({
  status,
  startTime,
  elapsedSeconds,
  requestId = null,
  isLoading,
  isEnding = false,
  providerLabel = "Voice interviewer",
  onConnect,
  onRequestEnd,
}: InterviewHeaderProps) {
  const controlsDisabled = isLoading || isEnding;

  return (
    <header className="px-6 py-4 border-b border-white/10 bg-slate-900/80 backdrop-blur-xl shrink-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Realtime AI Interview</h1>
              <p className="text-xs text-gray-400">
                {isEnding
                  ? "Ending interview and saving transcript…"
                  : providerLabel}
              </p>
              {requestId && (
                <p
                  className="text-[10px] text-gray-500 font-mono mt-0.5 truncate max-w-[280px]"
                  title={`Session id (for support): ${requestId}`}
                >
                  request_id: {requestId}
                </p>
              )}
            </div>
          </div>
          {(status === "connected" || status === "disconnected") &&
            startTime &&
            !isEnding && (
              <div className="flex items-center space-x-2 px-3 py-1.5 bg-green-500/20 border border-green-500/30 rounded-full">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-xs font-medium text-green-400">
                  {status === "connected" ? "Connected" : "Disconnected"} •{" "}
                  {formatElapsed(elapsedSeconds)}
                </span>
              </div>
            )}
          {isEnding && (
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-amber-500/20 border border-amber-500/30 rounded-full">
              <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
              <span className="text-xs font-medium text-amber-300">
                Saving…
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {status === "connected" || isEnding ? (
            <button
              onClick={onRequestEnd}
              disabled={controlsDisabled}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isEnding ? "Ending…" : "Disconnect"}
            </button>
          ) : (
            <button
              onClick={onConnect}
              disabled={status === "connecting" || controlsDisabled}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {status === "connecting" || isLoading ? "Loading..." : "Connect"}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
