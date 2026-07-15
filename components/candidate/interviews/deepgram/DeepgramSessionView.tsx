"use client";

import { useState } from "react";
import { useDeepgramSession } from "@/hooks/deepgram";
import { InterviewHeader } from "./InterviewHeader";
import { InterviewerPanel } from "./InterviewerPanel";
import { TranscriptPanel } from "./TranscriptPanel";
import { EndInterviewDialog } from "./EndInterviewDialog";
import { resolveInterviewTurn } from "./interviewTurn";

type DeepgramSessionViewProps = {
  interviewId: string;
  bootstrapWarning: string | null;
  setBootstrapWarning: (warning: string | null) => void;
  micAllowed: boolean | null;
};

export function DeepgramSessionView({
  interviewId,
  bootstrapWarning,
  setBootstrapWarning,
  micAllowed,
}: DeepgramSessionViewProps) {
  const {
    status,
    chat,
    warning,
    startTime,
    elapsedSeconds,
    textInput,
    setTextInput,
    isAIPlaying,
    isUserSpeaking,
    isListening,
    isMicOn,
    isSpeakerOn,
    isLoadingData,
    isEnding,
    requestId,
    micLevel,
    connectSession,
    endCall,
    toggleMic,
    toggleSpeaker,
    sendTextMessage,
  } = useDeepgramSession({
    interviewId,
    bootstrapWarning,
    setBootstrapWarning,
    micAllowed,
  });

  const [showEndConfirm, setShowEndConfirm] = useState(false);

  const turn = resolveInterviewTurn({
    isEnding,
    status,
    isAIPlaying,
    isUserSpeaking,
    isListening,
    isMicOn,
    micLevel,
  });

  return (
    <div className="relative h-screen w-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden">
      <div
        className={`flex flex-col h-full ${isEnding ? "pointer-events-none select-none" : ""}`}
      >
        <InterviewHeader
          status={status}
          startTime={startTime}
          elapsedSeconds={elapsedSeconds}
          requestId={requestId}
          isLoading={isLoadingData}
          isEnding={isEnding}
          onConnect={() => void connectSession()}
          onRequestEnd={() => {
            if (!isEnding) setShowEndConfirm(true);
          }}
        />

        <div className="flex-1 flex overflow-hidden">
          <InterviewerPanel
            status={status}
            isAIPlaying={turn.isAgentSpeaking}
            hearingUser={turn.isUserSpeaking}
            turnLabel={turn.label}
            isMicOn={isMicOn}
            isSpeakerOn={isSpeakerOn}
            micAllowed={micAllowed}
            isLoading={isLoadingData}
            isEnding={isEnding}
            onToggleMic={toggleMic}
            onToggleSpeaker={toggleSpeaker}
            onConnectOrEnd={() => {
              if (isEnding) return;
              if (status === "connected") setShowEndConfirm(true);
              else void connectSession();
            }}
          />

          <TranscriptPanel
            status={status}
            chat={chat}
            isAIPlaying={turn.isAgentSpeaking}
            hearingUser={turn.isUserSpeaking}
            warning={warning}
            micAllowed={micAllowed}
            textInput={textInput}
            isEnding={isEnding}
            onTextInputChange={setTextInput}
            onSendText={sendTextMessage}
          />
        </div>
      </div>

      {isEnding && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-2xl px-8 py-6 shadow-2xl text-center max-w-sm mx-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold">Ending interview</h3>
            <p className="text-sm text-gray-400 mt-2">
              Saving your conversation and preparing the report. Please wait…
            </p>
          </div>
        </div>
      )}

      {showEndConfirm && !isEnding && (
        <EndInterviewDialog
          onCancel={() => setShowEndConfirm(false)}
          onConfirm={() => {
            setShowEndConfirm(false);
            void endCall();
          }}
        />
      )}
    </div>
  );
}
