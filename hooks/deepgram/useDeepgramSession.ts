"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  useAgentState,
  useAgentConversation,
  useAgentPlayer,
  useAgentMode,
  useAgentMicrophone,
  useAgentSession,
  useAgentClientTool,
} from "@deepgram/react";
import { interviewsService } from "@/lib/services";
import type { ChatMessage } from "@/components/candidate/interviews/types";
import {
  END_INTERVIEW_FUNCTION_NAME,
  SESSION_ERROR_WINDOW_MS,
  SESSION_ERROR_LOG_DEBOUNCE_MS,
  describeDeepgramError,
  isFatalSessionError,
  isBenignDisconnect,
  mapAgentStateToConnectionStatus,
  appendConversationFragment,
  ensureStreamingAssistantBubble,
  markChatSettled,
  ensureEndingTurnsInChat,
  parseEndInterviewConfirmation,
  type SessionErrorSource,
} from "@/lib/deepgram";

const TRANSCRIPT_SETTLE_MS = 600;

export type DeepgramSessionArgs = {
  interviewId: string;
  bootstrapWarning: string | null;
  setBootstrapWarning: (warning: string | null) => void;
  micAllowed: boolean | null;
};

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Deepgram Voice Agent session — must run under DeepgramAgentProvider.
 * @see https://developers.deepgram.com/docs/browser-agent-react
 */
export function useDeepgramSession({
  interviewId,
  bootstrapWarning,
  setBootstrapWarning,
  micAllowed,
}: DeepgramSessionArgs) {
  const router = useRouter();
  const [textInput, setTextInput] = useState("");
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [sessionWarning, setSessionWarning] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [micLevel, setMicLevel] = useState(0);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [liveChat, setLiveChat] = useState<ChatMessage[]>([]);
  const [isEnding, setIsEnding] = useState(false);

  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const micLevelIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const isFinalizingRef = useRef(false);
  const hasConnectedRef = useRef(false);
  const intentionalEndRef = useRef(false);
  const faultedRef = useRef(false);
  const settingsReadyRef = useRef(false);
  const isConnectingRef = useRef(false);
  const suppressSocketErrorsRef = useRef(false);
  const lastLoggedErrorRef = useRef<string | null>(null);
  const lastLoggedAtRef = useRef(0);
  const errorTimestampsRef = useRef<number[]>([]);
  const chatSnapshotRef = useRef<ChatMessage[]>([]);
  const requestIdRef = useRef<string | null>(null);
  const stopAgentRef = useRef<() => void>(() => {});

  const { state, start, stop } = useAgentState();
  const { sendUserMessage } = useAgentConversation();
  const { outputMuted, setOutputMuted } = useAgentPlayer();
  const { micMuted, setMicMuted, getInputVolume, micActive } =
    useAgentMicrophone();
  const { isSpeaking, isListening, mode } = useAgentMode();
  const session = useAgentSession();

  const clearTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  const updateLiveChat = useCallback(
    (updater: (prev: ChatMessage[]) => ChatMessage[]) => {
      setLiveChat((prev) => {
        const next = updater(prev);
        chatSnapshotRef.current = next;
        return next;
      });
    },
    [],
  );

  /**
   * Persist transcript + complete interview. Call AFTER snapshot is ready.
   * Does not call stop() — caller owns disconnect timing.
   */
  const finalizeInterview = useCallback(
    async (messages: ChatMessage[]) => {
      if (!interviewId || isFinalizingRef.current) return;
      isFinalizingRef.current = true;
      setIsEnding(true);

      const settled = markChatSettled(messages);
      chatSnapshotRef.current = settled;
      setLiveChat(settled);

      try {
        console.info("[Deepgram] Finalizing interview", {
          interviewId,
          messages: settled.length,
          request_id: requestIdRef.current,
        });
        await interviewsService.persistConversation(
          interviewId,
          settled,
          "final",
        );
        await interviewsService.updateInterviewStatus(interviewId, "COMPLETED");
        router.push(`/interview/report?interviewId=${interviewId}`);
      } catch (error) {
        console.error("Failed to finalize interview:", {
          error,
          interviewId,
          request_id: requestIdRef.current,
        });
        isFinalizingRef.current = false;
        setIsEnding(false);
        intentionalEndRef.current = false;
        setSessionWarning(
          requestIdRef.current
            ? `Failed to save interview (Deepgram request_id: ${requestIdRef.current}). Please try again.`
            : "Failed to save interview. Please try again.",
        );
      }
    },
    [interviewId, router],
  );

  const finalizeRef = useRef(finalizeInterview);
  finalizeRef.current = finalizeInterview;

  const pauseSessionOnFault = useCallback(
    async (reason: string) => {
      if (
        faultedRef.current ||
        intentionalEndRef.current ||
        isFinalizingRef.current
      ) {
        return;
      }
      faultedRef.current = true;
      errorTimestampsRef.current = [];

      console.warn("[Deepgram] Pausing session after errors", {
        reason,
        interviewId,
        request_id: requestIdRef.current,
      });

      try {
        stop();
      } catch (error) {
        console.error("[Deepgram] stop() failed during pause:", error);
      }

      clearTimer();
      hasConnectedRef.current = false;
      settingsReadyRef.current = false;
      isConnectingRef.current = false;

      if (chatSnapshotRef.current.length > 0) {
        try {
          await interviewsService.persistConversation(
            interviewId,
            markChatSettled(chatSnapshotRef.current),
            "checkpoint",
          );
        } catch (error) {
          console.error("[Deepgram] Failed to checkpoint conversation:", error);
        }
      }

      const requestPart = requestIdRef.current
        ? ` (request_id: ${requestIdRef.current})`
        : "";
      setSessionWarning(
        `Interview paused due to connection problems${requestPart}: ${reason}. Your progress was saved and the interview remains in progress — click Connect to continue.`,
      );
    },
    [clearTimer, interviewId, stop],
  );

  const pauseRef = useRef(pauseSessionOnFault);
  pauseRef.current = pauseSessionOnFault;

  const recordSessionError = useCallback(
    (raw: unknown, source: SessionErrorSource) => {
      if (
        faultedRef.current ||
        intentionalEndRef.current ||
        suppressSocketErrorsRef.current ||
        isFinalizingRef.current
      ) {
        return;
      }

      const message = describeDeepgramError(raw);
      if (isBenignDisconnect(message)) return;

      const now = Date.now();

      if (
        message !== lastLoggedErrorRef.current ||
        now - lastLoggedAtRef.current > SESSION_ERROR_LOG_DEBOUNCE_MS
      ) {
        lastLoggedErrorRef.current = message;
        lastLoggedAtRef.current = now;
        console.warn(`[Deepgram] ${source}:`, message, {
          request_id: requestIdRef.current,
          interviewId,
        });
      }

      if (hasConnectedRef.current && isFatalSessionError(message)) {
        void pauseRef.current(message);
        return;
      }

      if (!hasConnectedRef.current) {
        setSessionWarning(
          `Could not connect to the interviewer: ${message}. Click Connect to try again.`,
        );
        return;
      }

      errorTimestampsRef.current = errorTimestampsRef.current.filter(
        (t) => now - t < SESSION_ERROR_WINDOW_MS,
      );
      errorTimestampsRef.current.push(now);

      const requestPart = requestIdRef.current
        ? ` (request_id: ${requestIdRef.current})`
        : "";

      if (errorTimestampsRef.current.length >= 2) {
        void pauseRef.current(message);
        return;
      }

      setSessionWarning(
        `Connection issue${requestPart}: ${message}. Click Connect to try again.`,
      );
    },
    [interviewId],
  );

  /** User-confirmed end from UI: lock UI, settle transcript, persist, then disconnect. */
  const endCall = useCallback(async () => {
    if (isFinalizingRef.current || intentionalEndRef.current) return;

    setIsEnding(true);
    intentionalEndRef.current = true;
    faultedRef.current = false;
    errorTimestampsRef.current = [];

    await delay(TRANSCRIPT_SETTLE_MS);
    const messages = ensureEndingTurnsInChat(chatSnapshotRef.current, true);
    await finalizeRef.current(messages);

    try {
      stop();
    } catch {
      // ignore — already finalized
    }
  }, [stop]);

  stopAgentRef.current = () => {
    try {
      stop();
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const onWelcome = (msg: {
      request_id?: string;
      session_id?: string;
    }) => {
      const id = msg?.request_id ?? msg?.session_id ?? null;
      if (id) {
        requestIdRef.current = id;
        setRequestId(id);
      }
      settingsReadyRef.current = false;
      setMicMuted(true);
    };

    const onSettingsApplied = () => {
      settingsReadyRef.current = true;
      errorTimestampsRef.current = [];
      lastLoggedErrorRef.current = null;
      if (!faultedRef.current && !intentionalEndRef.current) {
        setMicMuted(false);
      }
    };

    const onAgentError = (msg: unknown) => recordSessionError(msg, "agent");
    const onSdkError = (err: Error) => recordSessionError(err, "sdk");

    const onDisconnected = (reason: string) => {
      settingsReadyRef.current = false;
      if (
        intentionalEndRef.current ||
        faultedRef.current ||
        suppressSocketErrorsRef.current ||
        isConnectingRef.current ||
        isFinalizingRef.current
      ) {
        return;
      }
      const message = reason || "Connection lost";
      if (isBenignDisconnect(message)) return;
      if (!hasConnectedRef.current) return;
      recordSessionError(message, "disconnect");
    };

    /** Progressive transcript: grow bubbles as ConversationText arrives. */
    const onConversationText = (msg: {
      role?: string;
      content?: string;
    }) => {
      const role = msg?.role === "user" ? "user" : "assistant";
      const content = typeof msg?.content === "string" ? msg.content : "";
      if (!content) return;

      if (role === "user") setIsUserSpeaking(false);

      updateLiveChat((prev) =>
        appendConversationFragment(prev, role, content, "audio"),
      );
    };

    const onUserStartedSpeaking = () => {
      setIsUserSpeaking(true);
      updateLiveChat((prev) => markChatSettled(prev));
    };

    const onAgentStartedSpeaking = () => {
      setIsUserSpeaking(false);
      // Show assistant bubble immediately — fills as ConversationText streams in.
      updateLiveChat((prev) => ensureStreamingAssistantBubble(prev));
    };

    const onAgentAudioDone = () => {
      updateLiveChat((prev) => markChatSettled(prev));
    };

    session.on("welcome", onWelcome);
    session.on("settings-applied", onSettingsApplied);
    session.on("error", onAgentError);
    session.on("sdk-error", onSdkError);
    session.on("disconnected", onDisconnected);
    session.on("user-started-speaking", onUserStartedSpeaking);
    session.on("agent-started-speaking", onAgentStartedSpeaking);
    session.on("agent-audio-done", onAgentAudioDone);
    session.on("conversation-text", onConversationText);

    return () => {
      session.off("welcome", onWelcome);
      session.off("settings-applied", onSettingsApplied);
      session.off("error", onAgentError);
      session.off("sdk-error", onSdkError);
      session.off("disconnected", onDisconnected);
      session.off("user-started-speaking", onUserStartedSpeaking);
      session.off("agent-started-speaking", onAgentStartedSpeaking);
      session.off("agent-audio-done", onAgentAudioDone);
      session.off("conversation-text", onConversationText);
    };
  }, [session, interviewId, recordSessionError, setMicMuted, updateLiveChat]);

  useAgentClientTool(END_INTERVIEW_FUNCTION_NAME, async (fn) => {
    const confirmed = parseEndInterviewConfirmation(fn);

    if (!confirmed) {
      return JSON.stringify({
        ok: true,
        ended: false,
        request_id: requestIdRef.current,
      });
    }

    setIsEnding(true);
    intentionalEndRef.current = true;
    faultedRef.current = false;

    // Wait for trailing ConversationText (user "yes" / agent wrap-up) before persist.
    await delay(TRANSCRIPT_SETTLE_MS);
    const messages = ensureEndingTurnsInChat(chatSnapshotRef.current, true);
    await finalizeRef.current(messages);

    try {
      stopAgentRef.current();
    } catch {
      // ignore
    }

    return JSON.stringify({
      ok: true,
      ended: true,
      request_id: requestIdRef.current,
    });
  });

  chatSnapshotRef.current = liveChat;

  const status = mapAgentStateToConnectionStatus(state);
  const warning = sessionWarning || bootstrapWarning;

  useEffect(() => {
    if (state !== "connected") {
      if (micLevelIntervalRef.current) {
        clearInterval(micLevelIntervalRef.current);
        micLevelIntervalRef.current = null;
      }
      setMicLevel(0);
      return;
    }

    let silentTicks = 0;
    micLevelIntervalRef.current = setInterval(() => {
      const level = getInputVolume();
      setMicLevel(level);
      if (!micMuted && level < 0.01) {
        silentTicks += 1;
        if (silentTicks === 8) {
          setSessionWarning(
            "No microphone signal detected. Check the correct input device and that the mic is not muted in the OS/browser.",
          );
        }
      } else {
        silentTicks = 0;
        setSessionWarning((prev) =>
          prev?.startsWith("No microphone signal") ? null : prev,
        );
      }
    }, 500);

    return () => {
      if (micLevelIntervalRef.current) {
        clearInterval(micLevelIntervalRef.current);
        micLevelIntervalRef.current = null;
      }
    };
  }, [state, getInputVolume, micMuted]);

  useEffect(() => {
    if (state === "connected") {
      if (!hasConnectedRef.current) {
        hasConnectedRef.current = true;
        faultedRef.current = false;
        setMicMuted(true);
        const now = Date.now();
        setStartTime(now);
        setElapsedSeconds(0);
        clearTimer();
        timerIntervalRef.current = setInterval(() => {
          setElapsedSeconds(Math.floor((Date.now() - now) / 1000));
        }, 1000);
      }
      return;
    }

    if (state === "disconnected" && hasConnectedRef.current) {
      hasConnectedRef.current = false;
      settingsReadyRef.current = false;
      isConnectingRef.current = false;
      clearTimer();

      // Intentional end finalizes in endCall / client tool — avoid double-finalize.
      if (intentionalEndRef.current || isFinalizingRef.current) {
        return;
      }

      if (!faultedRef.current) {
        void pauseRef.current("Connection lost. Interview was not completed.");
      }
    }
  }, [state, setMicMuted, clearTimer]);

  useEffect(() => {
    return () => {
      clearTimer();
      intentionalEndRef.current = false;
      faultedRef.current = true;
      try {
        stop();
      } catch {
        // ignore
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- cleanup on unmount only
  }, []);

  const connectSession = useCallback(async () => {
    if (isConnectingRef.current || isEnding || isFinalizingRef.current) return;

    if (status === "connected") {
      void endCall();
      return;
    }

    setSessionWarning(null);
    setBootstrapWarning(null);
    setRequestId(null);
    requestIdRef.current = null;
    intentionalEndRef.current = false;
    faultedRef.current = false;
    settingsReadyRef.current = false;
    isFinalizingRef.current = false;
    setIsEnding(false);
    setLiveChat([]);
    chatSnapshotRef.current = [];
    errorTimestampsRef.current = [];
    lastLoggedErrorRef.current = null;
    lastLoggedAtRef.current = 0;
    isConnectingRef.current = true;
    suppressSocketErrorsRef.current = true;

    try {
      if (status === "connecting" || status === "disconnected") {
        stop();
        await delay(300);
      }
      setMicMuted(true);
      await start();
    } catch (error) {
      const message = describeDeepgramError(error);
      console.warn("[Deepgram] connect failed:", message);
      try {
        stop();
      } catch {
        // ignore
      }
      setSessionWarning(
        `Failed to connect: ${message}. Interview remains in progress — try Connect again.`,
      );
    } finally {
      suppressSocketErrorsRef.current = false;
      isConnectingRef.current = false;
    }
  }, [
    status,
    endCall,
    start,
    stop,
    setBootstrapWarning,
    setMicMuted,
    isEnding,
  ]);

  const toggleMic = useCallback(() => {
    if (isEnding) return;
    setMicMuted(!micMuted);
  }, [micMuted, setMicMuted, isEnding]);

  const toggleSpeaker = useCallback(() => {
    if (isEnding) return;
    setOutputMuted(!outputMuted);
  }, [outputMuted, setOutputMuted, isEnding]);

  const sendTextMessage = useCallback(() => {
    if (!textInput.trim() || status !== "connected" || isEnding) return;
    const text = textInput.trim();
    updateLiveChat((prev) =>
      appendConversationFragment(prev, "user", text, "text"),
    );
    sendUserMessage(text);
    setTextInput("");
  }, [textInput, status, sendUserMessage, isEnding, updateLiveChat]);

  return {
    status,
    isSpeaking,
    isListening,
    mode,
    isUserSpeaking,
    chat: liveChat,
    warning,
    startTime,
    elapsedSeconds,
    micAllowed,
    textInput,
    setTextInput,
    isAIPlaying: isSpeaking,
    isMicOn: !micMuted,
    isSpeakerOn: !outputMuted,
    micLevel,
    micActive,
    isLoadingData: false,
    isEnding,
    requestId,
    connectSession,
    endCall,
    toggleMic,
    toggleSpeaker,
    sendTextMessage,
  };
}
