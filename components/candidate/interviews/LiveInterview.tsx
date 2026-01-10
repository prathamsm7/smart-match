"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLiveInterview } from "./hooks/useLiveInterview";
import { LiveInterviewUI } from "./LiveInterviewUI";

interface LiveInterviewProps {
  interviewId?: string;
}

export function LiveInterview({ interviewId }: LiveInterviewProps) {
  const router = useRouter();
  const [pendingReportId, setPendingReportId] = useState<string | null>(null);
  const [navigatedReportId, setNavigatedReportId] = useState<string | null>(null);
  const {
    status,
    micAllowed,
    isMicOn,
    textInput,
    setTextInput,
    chat,
    warning,
    busy,
    isAIPlaying,
    elapsedSeconds,
    report,
    reportStatus,
    reportError,
    lastInterviewId,
    connectSession,
    finalizeInterview,
    toggleMic,
    sendTextMessage,
  } = useLiveInterview(interviewId);

  const handleDisconnect = async () => {
    const id = await finalizeInterview("manual");
    if (id) setPendingReportId(id);
  };

  useEffect(() => {
    // Redirect when interview is finalized (either manual or system)
    // Use pendingReportId for manual disconnects, or check lastInterviewId for system finalizations
    const id = pendingReportId || (status === "idle" && lastInterviewId && !pendingReportId ? lastInterviewId : null);
    if (!id || navigatedReportId === id) return;
    if (status === "idle") {
      router.push(`/interview/report?interviewId=${id}`);
      setNavigatedReportId(id);
      // Also set as pending to prevent duplicate checks
      if (!pendingReportId) {
        setPendingReportId(id);
      }
    }
  }, [pendingReportId, lastInterviewId, status, router, navigatedReportId]);

  return (
    <LiveInterviewUI
      status={status}
      micAllowed={micAllowed}
      isMicOn={isMicOn}
      textInput={textInput}
      setTextInput={setTextInput}
      chat={chat}
      warning={warning}
      busy={busy}
      isAIPlaying={isAIPlaying}
      elapsedSeconds={elapsedSeconds}
      report={report}
      reportStatus={reportStatus}
      reportError={reportError}
      onConnect={connectSession}
      onDisconnect={handleDisconnect}
      onToggleMic={toggleMic}
      onSendText={sendTextMessage}
    />
  );
}
