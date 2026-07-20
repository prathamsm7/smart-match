import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Vapi from "@vapi-ai/web";
import { interviewsService } from "@/lib/services";
import { ChatMessage, ConnectionStatus } from "@/components/candidate/interviews/types";
import { buildVapiInterviewAssistant } from "@/lib/vapi/assistantConfig";
import {
  getSharedVapiClient,
  vapiHandlerRefs,
} from "@/lib/vapi/sharedClient";

const VAPI_API_KEY = process.env.NEXT_PUBLIC_VAPI_API_KEY ?? "";
/** Match interviewTurn.ts — mic level above this counts as user speaking. */
const MIC_ACTIVE_LEVEL = 0.04;
const MIC_SILENT_LEVEL = 0.02;


type UseLiveInterviewOptions = {
  initialUserData?: unknown;
  initialJobData?: unknown;
};

export function useLiveInterview(
  interviewId?: string,
  options: UseLiveInterviewOptions = {},
) {
  const { initialUserData, initialJobData } = options;

  // Connection & Status
  const [status, setStatus] = useState<ConnectionStatus>("idle");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [chatUpdateTrigger, setChatUpdateTrigger] = useState(0); // Trigger for re-renders
  const [warning, setWarning] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [micAllowed, setMicAllowed] = useState<boolean | null>(null);
  const [textInput, setTextInput] = useState("");
  const [micMuted, setMicMuted] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  
  // Data — prefer server-provided profiles (no client PII fetch)
  const [userData, setUserData] = useState<any>(initialUserData ?? null);
  const [jobData, setJobData] = useState<any>(initialJobData ?? null);
  const [isLoadingData, setIsLoadingData] = useState(
    !(initialUserData && initialJobData),
  );
  
  const vapiRef = useRef<Vapi | null>(null);
  const chatRef = useRef<ChatMessage[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isFinalizingRef = useRef(false);
  /** Only finalize when the user clicks Disconnect in the UI. */
  const userRequestedEndRef = useRef(false);
  /** True between call-start and call-end — used to avoid cleanup stop() races. */
  const isCallActiveRef = useRef(false);
  const finalizeRef = useRef<() => Promise<void>>(async () => {});
  const lastEndedReasonRef = useRef<string | null>(null);
  const detachLocalMicRef = useRef<(() => void) | null>(null);
  const startLocalMicMonitorRef = useRef<(vapi: Vapi) => void>(() => {});
  const stopLocalMicMonitorRef = useRef<() => void>(() => {});
  const isSpeakingRef = useRef(false);
  const micMutedRef = useRef(false);

  isSpeakingRef.current = isSpeaking;
  micMutedRef.current = micMuted;

  const syncUserSpeakingFromMic = useCallback((level: number) => {
    if (micMutedRef.current || isSpeakingRef.current) {
      setIsUserSpeaking(false);
      return;
    }
    if (level > MIC_ACTIVE_LEVEL) {
      setIsUserSpeaking(true);
    } else if (level < MIC_SILENT_LEVEL) {
      setIsUserSpeaking(false);
    }
  }, []);

  const stopLocalMicMonitor = useCallback(() => {
    detachLocalMicRef.current?.();
    detachLocalMicRef.current = null;
    setMicLevel(0);
    setIsUserSpeaking(false);
  }, []);

  const startLocalMicMonitor = useCallback(
    (vapiInstance: Vapi) => {
      stopLocalMicMonitor();

      const daily = vapiInstance.getDailyCallObject() as {
        startLocalAudioLevelObserver?: (interval?: number) => Promise<void>;
        stopLocalAudioLevelObserver?: () => void;
        getLocalAudioLevel?: () => number;
        on?: (
          event: string,
          handler: (event: { audioLevel?: number }) => void,
        ) => void;
        off?: (
          event: string,
          handler: (event: { audioLevel?: number }) => void,
        ) => void;
      } | null;

      if (!daily?.getLocalAudioLevel) {
        window.setTimeout(() => startLocalMicMonitor(vapiInstance), 100);
        return;
      }

      void daily.startLocalAudioLevelObserver?.(100);

      const onLocalAudioLevel = (event: { audioLevel?: number }) => {
        const level = event.audioLevel ?? daily.getLocalAudioLevel?.() ?? 0;
        setMicLevel(level);
        syncUserSpeakingFromMic(level);
      };

      daily.on?.("local-audio-level", onLocalAudioLevel);

      const pollId = window.setInterval(() => {
        const level = daily.getLocalAudioLevel?.() ?? 0;
        setMicLevel(level);
        syncUserSpeakingFromMic(level);
      }, 150);

      detachLocalMicRef.current = () => {
        daily.off?.("local-audio-level", onLocalAudioLevel);
        window.clearInterval(pollId);
        try {
          daily.stopLocalAudioLevelObserver?.();
        } catch {
          // ignore
        }
      };
    },
    [stopLocalMicMonitor, syncUserSpeakingFromMic],
  );

  startLocalMicMonitorRef.current = startLocalMicMonitor;
  stopLocalMicMonitorRef.current = stopLocalMicMonitor;
  
  const isAIPlaying = isSpeaking;
  const chat = chatRef.current; // Use ref for chat, state only for triggering re-renders
  const isMicOn = !micMuted;

  useEffect(() => {
    if (initialUserData && initialJobData) {
      setUserData(initialUserData);
      setJobData(initialJobData);
      setIsLoadingData(false);
      return;
    }

    if (!interviewId) {
      setIsLoadingData(false);
      return;
    }

    let isActive = true;

    const loadInterviewData = async () => {
      try {
        const data = await interviewsService.fetchInterviewData(interviewId);
        if (!isActive) return;
        
        console.log("Interview data loaded:", data);
        
        if (!data.userData || !data.jobData) {
          console.error("Missing userData or jobData:", data);
          setWarning("Interview data is incomplete. Please try again.");
          return;
        }
        
        setUserData(data.userData);
        setJobData(data.jobData);
      } catch (error) {
        console.error("Error fetching interview data:", error);
        if (isActive) {
          setWarning(
            error instanceof Error
              ? error.message
              : "Failed to load interview data. Please refresh the page.",
          );
        }
      } finally {
        if (isActive) {
          setIsLoadingData(false);
        }
      }
    };

    loadInterviewData();

    return () => {
      isActive = false;
    };
  }, [interviewId, initialUserData, initialJobData]);

  useEffect(() => {
    async function requestMicAccess() {
    if (!navigator?.mediaDevices?.getUserMedia) {
      setMicAllowed(false);
      setWarning("Microphone access is not supported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicAllowed(true);
      stream.getTracks().forEach((t) => t.stop());
    } catch (error) {
      console.error("Microphone permission denied:", error);
      setMicAllowed(false);
      setWarning("Microphone permission denied.");
    }
    }
    requestMicAccess();
  }, []);

  const router = useRouter();
  
  const finalizeInterview = useCallback(async () => {
    if (!interviewId || isFinalizingRef.current) return;
    isFinalizingRef.current = true;

    try {
      await interviewsService.persistConversation(
        interviewId,
        chatRef.current,
        "final",
      );
      await interviewsService.updateInterviewStatus(interviewId, "COMPLETED");
      router.push(`/interview/report?interviewId=${interviewId}`);
    } catch (error) {
      console.error("Failed to finalize interview:", error);
    }
  }, [interviewId, router]);

  finalizeRef.current = finalizeInterview;

  // Create the Vapi client once when data is ready.
  // Daily left-meeting is always reported as endedReason: customer-ended-call, so
  // never recreate / stop() this client while a call can still be live (dep churn).
  const dataReady = !isLoadingData && !!userData && !!jobData;

  useEffect(() => {
    if (!dataReady) return;
    if (!VAPI_API_KEY) {
      setWarning("Missing Vapi config. Set NEXT_PUBLIC_VAPI_API_KEY.");
      return;
    }

    const vapiInstance = getSharedVapiClient(VAPI_API_KEY);
    vapiRef.current = vapiInstance;

    vapiHandlerRefs.current = {
      onCallStart: () => {
        console.log("Call started");
        isCallActiveRef.current = true;
        userRequestedEndRef.current = false;
        lastEndedReasonRef.current = null;
        setStatus("connected");
        setWarning(null);
        try {
          vapiInstance.setMuted(false);
        } catch {
          // ignore
        }
        setMicMuted(false);
        const now = Date.now();
        setStartTime(now);
        setElapsedSeconds(0);

        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
        }
        timerIntervalRef.current = setInterval(() => {
          setElapsedSeconds(Math.floor((Date.now() - now) / 1000));
        }, 1000);

        startLocalMicMonitorRef.current(vapiInstance);
      },

      onCallEnd: () => {
        console.log("Call ended", {
          userRequestedEnd: userRequestedEndRef.current,
          endedReason: lastEndedReasonRef.current,
        });
        isCallActiveRef.current = false;
        setStatus("disconnected");
        setIsSpeaking(false);
        setIsUserSpeaking(false);
        setMicLevel(0);
        stopLocalMicMonitorRef.current();

        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }

        if (userRequestedEndRef.current) {
          void finalizeRef.current();
        } else {
          setWarning(
            lastEndedReasonRef.current
              ? `Call ended (${lastEndedReasonRef.current}). Click Connect to continue your interview.`
              : "Call disconnected unexpectedly. Click Connect to continue your interview.",
          );
        }
      },

      onVolumeLevel: (volume: number) => {
        if (volume > 0.01) {
          setIsSpeaking(true);
          setIsUserSpeaking(false);
        }
      },

      onSpeechStart: () => {
        setIsSpeaking(true);
        setIsUserSpeaking(false);
      },

      onSpeechEnd: () => {
        setIsSpeaking(false);
      },

      onMessage: (message: Record<string, unknown>) => {
        if (
          message.type === "status-update" &&
          typeof message.endedReason === "string"
        ) {
          lastEndedReasonRef.current = message.endedReason;
          console.warn("[Vapi] endedReason:", message.endedReason);
        }

        if (
          message.type === "transcript" &&
          message.role === "user" &&
          message.transcriptType === "partial"
        ) {
          setIsUserSpeaking(true);
        }

        if (message.type === "transcript" && message.transcriptType === "final") {
          const role = message.role === "user" ? "user" : "assistant";
          const transcript = String(message.transcript ?? "");
          const newMessage: ChatMessage = {
            role,
            text: transcript,
            via: "audio",
            timestamp: Date.now(),
          };

          const lastMsg = chatRef.current[chatRef.current.length - 1];
          if (lastMsg && lastMsg.role === role) {
            chatRef.current = [
              ...chatRef.current.slice(0, -1),
              {
                ...lastMsg,
                text: `${lastMsg.text} ${transcript}`.trim(),
                timestamp: Date.now(),
              },
            ];
          } else {
            chatRef.current = [...chatRef.current, newMessage];
          }
          setChatUpdateTrigger((prev) => prev + 1);
        }

        const toolCalls = (message.toolCallList ?? message.toolCalls) as
          | Array<{ function?: { name?: string; arguments?: unknown } }>
          | undefined;
        if (!Array.isArray(toolCalls) || toolCalls.length === 0) return;

        toolCalls.forEach((toolCall) => {
          const functionName = toolCall.function?.name;
          if (functionName === "requestEndInterview") {
            console.info("[Vapi] requestEndInterview tool called");
          } else if (functionName === "handleConfirmation") {
            console.info("[Vapi] handleConfirmation tool called");
          }
        });
      },

      onError: (error: { message?: string }) => {
        console.error("Vapi error:", error);
        setWarning(error.message || "An error occurred");
        setStatus("disconnected");
      },
    };

    return () => {
      if (!isCallActiveRef.current) {
        vapiHandlerRefs.current = {};
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- bind handlers once data ready
  }, [dataReady]);

  const startVapiCall = useCallback(() => {
    console.log("startVapiCall - userData:", userData);
    console.log("startVapiCall - jobData:", jobData);
    console.log("startVapiCall - vapiRef.current:", vapiRef.current);
    
    if (!vapiRef.current) {
      if (!VAPI_API_KEY) {
        setWarning("Missing Vapi API key.");
        return;
      }
      vapiRef.current = getSharedVapiClient(VAPI_API_KEY);
    }
    
    if (!userData || !jobData) {
      setWarning("Interview data not loaded yet. Please wait or refresh the page.");
      console.error("Missing data - userData:", userData, "jobData:", jobData);
      return;
    }
    if (!VAPI_API_KEY) {
      setWarning("Missing Vapi API key.");
      return;
    }

    setStatus("connecting");
    userRequestedEndRef.current = false;
    isFinalizingRef.current = false;

    const user = userData;
    const job = jobData;

    vapiRef.current.start(buildVapiInterviewAssistant(user, job));
  }, [userData, jobData]);

  const endVapiCall = useCallback(() => {
    userRequestedEndRef.current = true;
    if (vapiRef.current) {
      vapiRef.current.end();
    }
  }, []);

  const connectSession = useCallback(() => {
    // Connect only — never toggle-end from this handler (that caused accidental hangups).
    if (status === "connected" || status === "connecting") return;
    startVapiCall();
  }, [status, startVapiCall]);

  const toggleMic = useCallback(() => {
    if (!vapiRef.current) return;
    const nextMuted = !vapiRef.current.isMuted();
    vapiRef.current.setMuted(nextMuted);
    setMicMuted(nextMuted);
  }, []);

  const sendTextMessage = useCallback(() => {
    if (!textInput.trim() || status !== "connected") return;

    vapiRef.current?.send({
      type: 'add-message',
      message: {
        role: 'user',
        content: textInput
      },
      triggerResponseEnabled: true,
    })
    
    // Add user message to chat ref
    const userMessage: ChatMessage = {
      role: "user",
      text: textInput,
      via: "text",
      timestamp: Date.now(),
    };
    chatRef.current = [...chatRef.current, userMessage];
    setTextInput("");
    // Trigger re-render
    setChatUpdateTrigger(prev => prev + 1);
    
    // Note: Vapi handles voice, text input would need to be sent via Vapi's text message API
    // For now, we just add it to the chat UI
    
  }, [textInput, status]);


  return {
    // State
    status,
    isSpeaking,
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
    isListening: status === "connected" && !isSpeaking && isMicOn,
    userData,
    jobData,
    isLoadingData,
    // Actions
    connectSession,
    endVapiCall,
    toggleMic,
    sendTextMessage,
  };
}
