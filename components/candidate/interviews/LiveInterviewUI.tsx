"use client";

import { useState } from "react";
import { useLiveInterview } from "@/hooks/useLiveInterview";
import { InterviewHeader } from "@/components/candidate/interviews/deepgram/InterviewHeader";
import { InterviewerPanel } from "@/components/candidate/interviews/deepgram/InterviewerPanel";
import { TranscriptPanel } from "@/components/candidate/interviews/deepgram/TranscriptPanel";
import { EndInterviewDialog } from "@/components/candidate/interviews/deepgram/EndInterviewDialog";
import { resolveInterviewTurn } from "@/components/candidate/interviews/deepgram/interviewTurn";

interface LiveInterviewUIProps {
  interviewId?: string;
  initialUserData?: unknown;
  initialJobData?: unknown;
}

/**
 * Vapi live interview UI — same layout as Deepgram (header / interviewer / transcript).
 */
export function LiveInterviewUI({
  interviewId,
  initialUserData,
  initialJobData,
}: LiveInterviewUIProps) {
  const {
    status,
    chat,
    warning,
    startTime,
    elapsedSeconds,
    micAllowed,
    textInput,
    setTextInput,
    isAIPlaying,
    isMicOn,
    isUserSpeaking,
    micLevel,
    isLoadingData,
    connectSession,
    endVapiCall,
    toggleMic,
    sendTextMessage,
  } = useLiveInterview(interviewId, { initialUserData, initialJobData });

  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  const turn = resolveInterviewTurn({
    isEnding: false,
    status,
    isAIPlaying,
    isUserSpeaking,
    isListening: status === "connected" && !isAIPlaying && isMicOn,
    isMicOn,
    micLevel,
  });

  return (
    <div className="relative h-screen w-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden">
      <div className="flex flex-col h-full">
        <InterviewHeader
          status={status}
          startTime={startTime}
          elapsedSeconds={elapsedSeconds}
          isLoading={isLoadingData}
          providerLabel="Vapi-powered interviewer"
          onConnect={() => void connectSession()}
          onRequestEnd={() => setShowEndConfirm(true)}
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
            isEnding={false}
            onToggleMic={toggleMic}
            onToggleSpeaker={() => setIsSpeakerOn((prev) => !prev)}
            onConnectOrEnd={() => {
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
            isEnding={false}
            onTextInputChange={setTextInput}
            onSendText={sendTextMessage}
          />
        </div>
      </div>

      {showEndConfirm && (
        <EndInterviewDialog
          onCancel={() => setShowEndConfirm(false)}
          onConfirm={() => {
            setShowEndConfirm(false);
            endVapiCall();
          }}
        />
      )}
    </div>
  );
}
