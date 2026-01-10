/**
 * Main hook for Live Interview functionality
 * Combines session management, audio streaming, and chat
 */

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { GoogleGenAI, Modality, StartSensitivity, EndSensitivity, MediaResolution, TurnCoverage, Type } from "@google/genai";
import {
  ChatMessage,
  LiveConfig,
  ConnectionStatus,
  InterviewReport,
} from "../types";
import { useAudioStream } from "./useAudioStream";
import { useAudioPlayback } from "./useAudioPlayback";
import { addChatMessage } from "../utils/chatHelpers";
import { persistConversationApi } from "../utils/interviewApi";
import { base64ToArrayBuffer } from "../utils/audioProcessing";
import { candidateProfileDetails, jobDescription } from "../config/candidateProfile";

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_MODEL = "gemini-2.0-flash-exp";
const MIN_API_KEY_LENGTH = 10;
const RECONNECT_DELAY_BEFORE_CLOSE_MS = 10000;
const MIN_RECONNECT_DELAY_MS = 1000;
const DEFAULT_TIME_LEFT_MS = 5000;
const MIC_START_DELAY_MS = 200;
const MIC_RESTORE_DELAY_MS = 300;
const SESSION_CLOSE_DELAY_MS = 500;
const RECONNECT_CHECK_DELAY_MS = 100;
const DEADLINE_EXPIRED_CODE = 1011;
const MAX_GOAWAY_COUNT = 2;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Build conversation context from chat history
 */
function buildConversationContext(chatHistory: ChatMessage[]) {
  return chatHistory
    .filter((msg) => msg.sender !== "system")
    .map((msg) => ({
      role: msg.sender === "user" ? "user" : "assistant",
      parts: [{ text: msg.text }],
    }));
}

/**
 * Build system instruction text with optional conversation context
 */
function buildSystemInstruction(hasContext: boolean, conversationContext: ReturnType<typeof buildConversationContext>) {
  let instruction = `
                                  ROLE: You are a professional technical interviewer conducting a structured job interview.

                                  CONTEXT:
                                  You are provided with:
                                  - Candidate Profile Details : ${JSON.stringify(candidateProfileDetails)}
                                  - Job Description : ${JSON.stringify(jobDescription)}

                                  Your sole responsibility is to ASK interview questions.

                                  INTERVIEWER BEHAVIOR RULES:
                                  - Ask ONLY questions. Do NOT explain concepts or provide answers.
                                  - Maintain a friendly, professional, and encouraging tone.
                                  - Keep questions concise, clear, and conversational.
                                  - Do not go off-topic or ask unrelated questions.
                                  - If a question is not relevant to the job or candidate background, DO NOT ask it.

                                  QUESTION STRATEGY:
                                  - Start with a brief self-introduction and a warm-up question.
                                  - Ask questions strictly related to:
                                    - Technical skills mentioned in the profile and job description **Priority** - highest priority
                                    - Previous work experience **Priority** - second highest priority
                                    - Tools, frameworks, and technologies relevant to the job description **Priority** - second highest priority
                                    - Projects the candidate has worked on
                                  - Progress from:
                                    - General → Specific
                                    - Simple → Moderate → Challenging

                                  FOLLOW-UP LOGIC:
                                  - Actively listen to the candidate's previous response.
                                  - Ask follow-up questions when:
                                    - An answer lacks clarity
                                    - More depth is needed
                                    - A claim or experience requires validation
                                  - Follow-up questions must reference the candidate's previous answer directly.

                                  QUESTION CONSTRAINTS:
                                  - Ask ONE question at a time which unique than previous questions.
                                  - Avoid hypothetical answers unless role-relevant.
                                  - Never evaluate, judge, or comment on answers.

                                  INTERVIEW FLOW:
                                  1. Introduction + "Tell me about yourself"
                                  2. Skill-specific questions aligned with the job role
                                  3. Experience-based questions
                                  4. Project deep-dives
                                  5. Problem-solving and decision-making questions
                                  6. Wrap-up question

                                  ENDING THE INTERVIEW:
                                  - After asking the wrap-up question and receiving the candidate's response, use the end_interview function to conclude the interview session.
                                  - Only call end_interview when the interview is truly complete and you've finished asking all questions.
                                  - If the candidate explicitly requests to end, stop, or finish the interview (e.g., "I want to end this", "Can we stop?", "Let's finish", "I'm done", "No more questions"), first ask them for confirmation: "Are you sure you'd like to end the interview now?" Only call end_interview if they confirm (e.g., "yes", "confirm", "yes end it", "yes stop"). If they say no or want to continue, proceed with the interview.

                                  START THE INTERVIEW BY:
                                  - Briefly introducing yourself as the interviewer. Your name is Despina.
                                  - Asking the candidate to introduce themselves
                                  `;

  if (hasContext && conversationContext.length > 0) {
    instruction += `\n\nPREVIOUS CONVERSATION CONTEXT (continue from here):\n${conversationContext.map((msg) => `${msg.role}: ${msg.parts[0].text}`).join("\n")}\n\nContinue the interview naturally from where it left off.`;
  }

  return instruction;
}

/**
 * Build session configuration for Gemini Live API
 */
function buildSessionConfig(
  systemInstruction: string,
  sessionHandle: string | null,
) {
  return {
    responseModalities: [Modality.AUDIO],
    systemInstruction,
    sessionResumption: sessionHandle ? { handle: sessionHandle } : {},
    contextWindowCompression: {
      slidingWindow: {},
    },
    outputAudioTranscription: {},
    inputAudioTranscription: {},
    realtimeInputConfig: {
      automaticActivityDetection: {
        disabled: false,
        startOfSpeechSensitivity: StartSensitivity.START_SENSITIVITY_LOW,
        endOfSpeechSensitivity: EndSensitivity.END_SENSITIVITY_LOW,
        prefixPaddingMs: 20,
        silenceDurationMs: 3000,
      },
      turnCoverage: TurnCoverage.TURN_INCLUDES_ALL_INPUT,
    },
    speechConfig: {
      voiceConfig: {
        prebuiltVoiceConfig: {
          voiceName: "Zephyr",
        },
      },
    },
    thinkingConfig: {
      includeThoughts: false,
    },
    tools: [
      {
        functionDeclarations: [
          {
            name: "end_interview",
            description: "End the interview session when the interview is complete or the candidate requests to end it.",
            parameters: {
              type: Type.OBJECT,
              properties: {},
            },
          },
        ],
      },
    ],
  };
}

/**
 * Parse time left string to milliseconds
 */
function parseTimeLeft(timeStr: string): number {
  let totalMs = 0;
  const minutes = timeStr.match(/(\d+)m/);
  const seconds = timeStr.match(/(\d+)s/);
  if (minutes) totalMs += parseInt(minutes[1], 10) * 60 * 1000;
  if (seconds) totalMs += parseInt(seconds[1], 10) * 1000;
  return totalMs || DEFAULT_TIME_LEFT_MS;
}

/**
 * Check if connection closure was due to deadline expiration
 */
function isDeadlineExpired(closeCode: number, closeReason: string): boolean {
  return closeCode === DEADLINE_EXPIRED_CODE || closeReason.includes("Deadline expired");
}

// ============================================================================
// Main Hook
// ============================================================================

export function useLiveInterview(interviewId?: string) {
  // ========================================================================
  // State Management
  // ========================================================================
  
  // Connection & Configuration
  const [config, setConfig] = useState<LiveConfig | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("idle");
  const [isReconnecting, setIsReconnecting] = useState(false);
  
  // Microphone
  const [micAllowed, setMicAllowed] = useState<boolean | null>(null);
  const [isMicOn, setIsMicOn] = useState(false);
  
  // Chat & UI
  const [textInput, setTextInput] = useState("");
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [warning, setWarning] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [isAIPlaying, setIsAIPlaying] = useState(false);
  
  // Timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [timerAnchor, setTimerAnchor] = useState<number | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  
  // Interview Tracking
  const [sessionHandle, setSessionHandle] = useState<string | null>(null);
  const [lastInterviewId, setLastInterviewId] = useState<string | null>(null);

  // Report (currently unused but kept for future use)
  const [report] = useState<InterviewReport | null>(null);
  const [reportStatus] = useState<"idle" | "loading" | "error" | "ready">("idle");
  const [reportError] = useState<string | null>(null);

  // ========================================================================
  // Refs
  // ========================================================================
  
  const aiClientRef = useRef<GoogleGenAI | null>(null);
  const sessionRef = useRef<any>(null);
  const oldSessionRef = useRef<any>(null);
  const conversationHistoryRef = useRef<ChatMessage[]>([]);
  const initialKickoffSentRef = useRef<boolean>(false);
  const goAwayReceivedRef = useRef<boolean>(false);
  const sessionHandleRef = useRef<string | null>(null);
  const goAwayCountRef = useRef<number>(0);
  const interviewIdRef = useRef<string | null>(interviewId || null);
  const isFinalizingRef = useRef<boolean>(false);

  // ========================================================================
  // Hooks
  // ========================================================================
  
  const audioStream = useAudioStream({
    sessionRef,
    status: (status === "idle" || status === "connecting" || status === "connected" || status === "error")
      ? status
      : "idle",
    onError: setWarning,
  });
  
  const audioPlayback = useAudioPlayback();

  // Set up audio playback state listener
  useEffect(() => {
    audioPlayback.setOnPlaybackStateChange((isPlaying) => {
      setIsAIPlaying(isPlaying);
    });
  }, [audioPlayback]);

  const sortedChat = useMemo(
    () => [...chat].sort((a, b) => ((a as any).ts || 0) - ((b as any).ts || 0)),
    [chat],
  );

  // ========================================================================
  // Initialization Effects
  // ========================================================================
  
  // Update interviewIdRef when interviewId prop changes
  useEffect(() => {
    if (interviewId) {
      interviewIdRef.current = interviewId;
    }
  }, [interviewId]);

  // Initialize on mount
  useEffect(() => {
    requestMicAccess();
    fetchConfig();

    return () => {
      audioStream.stopMicStream();
      closeSession();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Timer: run from first connect until manual close/final end
  useEffect(() => {
    if (!isTimerRunning || timerAnchor === null) return;

    const tick = () => {
      setElapsedSeconds(Math.floor((Date.now() - timerAnchor) / 1000));
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [isTimerRunning, timerAnchor]);

  // ========================================================================
  // Utility Functions
  // ========================================================================

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/interview/live-config");
      const data = await res.json();
      if (data?.success) {
        setConfig({ apiKey: data.token.name, model: data.model });
      } else {
        setWarning(
          data?.error ||
            "Unable to load Gemini Live API config. Check your environment variables.",
        );
      }
    } catch (error) {
      console.error("Failed to fetch live config:", error);
      setWarning("Unable to reach live config endpoint.");
    }
  };

  const requestMicAccess = async () => {
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
  };

  const handleAddChatMessage = useCallback(
    (
      sender: ChatMessage["sender"],
      text: string,
      via: ChatMessage["via"],
      options?: { merge?: boolean },
    ) => {
      setChat((prev) => {
        const updated = addChatMessage(prev, sender, text, via, options);
        conversationHistoryRef.current = updated;
        return updated;
      });
    },
    [],
  );

  const updateSessionHandle = useCallback((handle: string | null) => {
    sessionHandleRef.current = handle;
    setSessionHandle(handle);
  }, []);

  const persistConversation = useCallback(
    async (stage: "snapshot" | "final") => {
      if (!interviewIdRef.current) return;
      try {
        await persistConversationApi(
          interviewIdRef.current,
          conversationHistoryRef.current,
          stage,
        );
      } catch (error) {
        console.error("Failed to persist conversation:", error);
      }
    },
    [],
  );

  // ========================================================================
  // Session Management - Finalization & Cleanup
  // ========================================================================
  
  const resetSessionState = useCallback(() => {
    setStatus("idle");
    setIsMicOn(false);
    setIsTimerRunning(false);
    setTimerAnchor(null);
    setIsReconnecting(false);
    updateSessionHandle(null);
    goAwayReceivedRef.current = false;
    goAwayCountRef.current = 0;
    initialKickoffSentRef.current = false;
    isFinalizingRef.current = false;
  }, [updateSessionHandle]);

  const closeSessions = useCallback(() => {
    try {
      if (sessionRef.current) {
        sessionRef.current.close();
        sessionRef.current = null;
      }
      if (oldSessionRef.current) {
        oldSessionRef.current.close();
        oldSessionRef.current = null;
      }
    } catch (error) {
      console.error("Error closing session:", error);
    }
  }, []);

  const finalizeInterview = useCallback(
    async (reason: "manual" | "system") => {
      if (isFinalizingRef.current) return interviewIdRef.current;
      isFinalizingRef.current = true;

      const currentId = interviewIdRef.current;

      try {
        await persistConversation("final");
        
        if (currentId) {
          try {
            await fetch(`/api/interview/${currentId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: "COMPLETED" }),
            });
          } catch (error) {
            console.error("Failed to update interview status:", error);
          }
        }
        
        setLastInterviewId(currentId);
        if (reason === "system") {
          setWarning("Session ended. Redirecting to report...");
        }
      } catch (error) {
        console.error("Failed to finalize interview:", error);
      } finally {
        closeSessions();
        audioStream.stopMicStream();
        resetSessionState();
        aiClientRef.current = null;
        interviewIdRef.current = null;
        conversationHistoryRef.current = [];
      }

      return currentId;
    },
    [audioStream, persistConversation, closeSessions, resetSessionState],
  );

  const closeSession = useCallback(() => {
    closeSessions();
    aiClientRef.current = null;
    updateSessionHandle(null);
    resetSessionState();
    interviewIdRef.current = null;
    setElapsedSeconds(0);
    setIsMicOn(false);
    audioStream.stopMicStream();
    conversationHistoryRef.current = [];
  }, [audioStream, updateSessionHandle, closeSessions, resetSessionState]);

  // ========================================================================
  // Server Message Handler
  // ========================================================================

  // Reconnect session ref for use in message handlers
  const reconnectSessionRef = useRef<(() => Promise<void>) | null>(null);

  const handleServerMessage = useCallback(
    async (message: any) => {
      const currentHandle = sessionHandleRef.current;
      // console.log("🚀 ~ handleServerMessage ~ message:", message);

      // Handle setup completion - trigger initial kickoff
      if (message?.setupComplete && !initialKickoffSentRef.current) {
        console.log("🚀 ~ handleServerMessage ~ message:", "setup complete");
        if (sessionRef.current) {
          try {
            sessionRef.current.sendClientContent({
              turns: "Please start the interview now with your introduction and first question.",
              turnComplete: true,
            });
            initialKickoffSentRef.current = true;
          } catch (error) {
            console.error("Failed to trigger interviewer start:", error);
          }
        }
      }

      // Handle GoAway message - connection will close soon
      if (message?.goAway) {
        goAwayCountRef.current += 1;
        const goAwayCount = goAwayCountRef.current;
        const timeLeft = message.goAway.timeLeft || "50s";
        
        console.warn("⚠️ GoAway received. Time left:", timeLeft);
        setWarning(`Connection will refresh in ${timeLeft}...`);
        goAwayReceivedRef.current = true;
        await persistConversation(goAwayCount === 1 ? "snapshot" : "final");
        
        // Stop audio stream immediately
        if (isMicOn) {
          console.log("🔇 Stopping audio stream immediately due to GoAway...");
          audioStream.stopMicStream();
          setIsMicOn(false);
        }

        // If second GoAway, finalize interview
        if (goAwayCount >= MAX_GOAWAY_COUNT) {
          console.log("⏹️ Second GoAway received. Finalizing session and redirecting to report...");
          await finalizeInterview("system");
          return;
        }

        // Reconnect if we have a handle
        if (currentHandle && !isReconnecting && sessionRef.current && status === "connected") {
          console.log("🔄 Reconnecting immediately with existing session handle...");
          setTimeout(() => {
            if (!isReconnecting && reconnectSessionRef.current) {
              reconnectSessionRef.current();
            }
          }, RECONNECT_CHECK_DELAY_MS);
        } else {
          // Parse time and reconnect proactively
          const timeLeftMs = parseTimeLeft(timeLeft);
          const reconnectDelay = Math.max(timeLeftMs - RECONNECT_DELAY_BEFORE_CLOSE_MS, MIN_RECONNECT_DELAY_MS);
          
          if (!isReconnecting && sessionRef.current && status === "connected") {
            console.log(`🔄 Will reconnect in ${reconnectDelay}ms (before connection closes)...`);
            setTimeout(() => {
              if (
                sessionRef.current &&
                status === "connected" &&
                !isReconnecting &&
                sessionHandleRef.current &&
                reconnectSessionRef.current
              ) {
                console.log("🔄 Proactively reconnecting before connection closes...");
                reconnectSessionRef.current();
              }
            }, reconnectDelay);
          }
        }
        return;
      }

      // Handle session resumption updates
      if (message?.sessionResumptionUpdate) {
        const update = message.sessionResumptionUpdate;
        console.log("📝 Session resumption update:", update);
        
        if (update.resumable && update.newHandle) {
          console.log("✅ New session handle received:", update.newHandle);
          updateSessionHandle(update.newHandle);
          
          // If we received GoAway earlier and now have a handle, reconnect immediately
          if (goAwayReceivedRef.current && !isReconnecting && sessionRef.current && status === "connected") {
            console.log("🔄 GoAway was received earlier, reconnecting immediately with new handle...");
            setTimeout(() => {
              if (!isReconnecting && sessionHandleRef.current && reconnectSessionRef.current) {
                reconnectSessionRef.current();
              }
            }, RECONNECT_CHECK_DELAY_MS);
          }
        }
      }

      // Handle user transcription
      if (message?.serverContent?.inputTranscription?.text) {
        const transcriptionText = message.serverContent.inputTranscription.text;
        console.info("outputTranscription?",message?.serverContent)
        if (transcriptionText) {
          handleAddChatMessage("user", transcriptionText, "audio", { merge: true });
        }
      }

      // Handle AI transcription
      if (message?.serverContent?.outputTranscription?.text) {
        handleAddChatMessage(
          "assistant",
          message.serverContent.outputTranscription.text,
          "audio",
          { merge: true },
        );
      }

      // Handle model turn
      if (message?.serverContent?.modelTurn?.parts) {
        audioStream.resetAudioTurnFlag();

        for (const part of message.serverContent.modelTurn.parts) {
          if (part.text) {
            handleAddChatMessage("assistant", part.text, "text", { merge: true });
          }
          if (part.inlineData?.data) {
            const audioBuffer = base64ToArrayBuffer(part.inlineData.data);
            audioPlayback.enqueuePlayback(audioBuffer);
          }
        }
      }

      // Handle interruption
      if (message?.serverContent?.interrupted) {
        audioPlayback.clearPlaybackQueue();
        if (!audioStream.getHasSentAudio()) {
          setWarning("AI playback interrupted.");
          setTimeout(() => setWarning(null), 3000);
        }
      }

      // Handle tool calls (e.g., end_interview)
      if (message?.toolCall?.functionCalls) {
        for (const functionCall of message.toolCall.functionCalls) {
          console.log(`🔧 Tool call received: ${functionCall.name}`, functionCall.args);
          
          if (functionCall.name === "end_interview") {
            // End the interview when user requests it via tool call
            console.log("✅ Ending interview as requested by user via tool call");
            handleAddChatMessage(
              "system",
              "Interview ending as requested. Thank you for your time!",
              "text",
            );
            
            // Send tool response before finalizing
            if (sessionRef.current) {
              try {
                sessionRef.current.sendToolResponse({
                  functionResponses: [
                    {
                      id: functionCall.id,
                      name: functionCall.name,
                      response: { success: true, message: "Interview ended successfully." },
                    },
                  ],
                });
              } catch (error) {
                console.error("Failed to send tool response:", error);
              }
            }
            
            // Finalize interview after a short delay to ensure response is sent
            setTimeout(() => {
              finalizeInterview("system");
            }, 500);
            return;
          }
          
          // Handle other tool calls if needed in the future
          // Send a default response for unknown tool calls
          if (sessionRef.current) {
            try {
              sessionRef.current.sendToolResponse({
                functionResponses: [
                  {
                    id: functionCall.id,
                    name: functionCall.name,
                    response: { error: "Unknown function call" },
                  },
                ],
              });
            } catch (error) {
              console.error("Failed to send tool response:", error);
            }
          }
        }
      }
    },
    [
      handleAddChatMessage,
      audioStream,
      audioPlayback,
      isMicOn,
      isReconnecting,
      status,
      updateSessionHandle,
      persistConversation,
      finalizeInterview,
    ],
  );

  // ========================================================================
  // Session Callback Factory
  // ========================================================================
  
  const createSessionCallbacks = useCallback(
    (isReconnection = false) => ({
      onopen: () => {
        console.log(isReconnection ? "✅ New session opened successfully" : "Live API connection opened");
        setStatus("connected");
        setWarning(null);
        
        // Only set timer anchor on first connection, preserve it during reconnections
        setTimerAnchor((prev) => {
          if (prev === null) {
            return Date.now();
          }
          return prev; // Keep existing anchor during reconnection to preserve elapsed time
        });
        setIsTimerRunning(true);
        
        if (!isReconnection) {
          handleAddChatMessage(
            "system",
            "Connected to the AI interviewer. You can speak or type to start.",
            "text",
          );
        } else {
          goAwayReceivedRef.current = false;
          
          // Close old session now that new one is ready
          if (oldSessionRef.current) {
            try {
              console.log("🔒 Closing old session...");
              oldSessionRef.current.close();
            } catch (e) {
              console.error("Error closing old session:", e);
            }
            oldSessionRef.current = null;
          }
          
        handleAddChatMessage(
            "system",
            "Connection refreshed successfully. Interview continues...",
            "text",
          );
        }

        setTimeout(() => {
          if (sessionRef.current) {
            audioStream.startMicStream().then((success) => {
              if (success) setIsMicOn(true);
            });
          }
        }, isReconnection ? MIC_RESTORE_DELAY_MS : MIC_START_DELAY_MS);
      },
      onclose: (event: any) => {
        console.log(isReconnection ? "New session closed" : "Live API connection closed", event);
        
        if (isReconnection && !isReconnecting) {
          setStatus("error");
          setIsMicOn(false);
          audioStream.stopMicStream();
          return;
        }

        const closeCode = event?.code;
        const closeReason = event?.reason || "";
        const deadlineExpired = isDeadlineExpired(closeCode, closeReason);
        
        // Only try to reconnect if conditions are met
        if (
          sessionHandleRef.current &&
          !isReconnecting &&
          !oldSessionRef.current &&
          goAwayCountRef.current < MAX_GOAWAY_COUNT
        ) {
          if (deadlineExpired || goAwayReceivedRef.current) {
            console.log("🔄 Connection closed due to deadline/GoAway, attempting to reconnect...");
          } else {
            console.log("🔄 Connection closed unexpectedly, attempting to reconnect...");
          }
          
          setTimeout(() => {
            if (sessionHandleRef.current && !isReconnecting && goAwayCountRef.current < MAX_GOAWAY_COUNT) {
              reconnectSession();
            }
          }, RECONNECT_CHECK_DELAY_MS);
        } else {
          finalizeInterview("system");
        }
      },
      onerror: (e: any) => {
        console.error(isReconnection ? "New session error:" : "Live API error:", e);
        
        if (!isReconnection || !isReconnecting) {
          setStatus("error");
          setWarning(
            e?.message ||
              e?.error?.message ||
              "An error occurred with the live interview.",
          );
          audioStream.stopMicStream();
        }
      },
      onmessage: handleServerMessage,
    }),
    [
      timerAnchor,
      handleAddChatMessage,
      audioStream,
      isReconnecting,
      handleServerMessage,
      finalizeInterview,
    ],
  );

  // ========================================================================
  // Session Connection & Reconnection
  // ========================================================================

  const connectSession = useCallback(async () => {
    if (!config?.apiKey) {
      setWarning("Gemini API key is missing. Configure it to continue.");
      return;
    }

    // Initialize interview ID
    if (!interviewIdRef.current) {
      interviewIdRef.current = interviewId || crypto.randomUUID();
    }
    setLastInterviewId(interviewIdRef.current);
    goAwayCountRef.current = 0;

    // Handle existing connection
    if (status === "connecting" || status === "connected") {
      if (status === "connected") {
        closeSession();
        await new Promise((resolve) => setTimeout(resolve, SESSION_CLOSE_DELAY_MS));
      } else {
        return;
      }
    }

    setStatus("connecting");
    setIsTimerRunning(false);
    setWarning(null);

    // Close any existing session
    if (sessionRef.current) {
      try {
        sessionRef.current.close();
      } catch (e) {
        // Ignore
      }
      sessionRef.current = null;
    }

    try {
      if (!config.apiKey || config.apiKey.length < MIN_API_KEY_LENGTH) {
        throw new Error("Invalid API key format");
      }

      // Initialize AI client
      aiClientRef.current = new GoogleGenAI({ apiKey: config.apiKey, apiVersion: 'v1alpha' });
      const modelName = config.model || DEFAULT_MODEL;
      console.log("Connecting to Gemini Live with model:", modelName);

      // Build conversation context and system instruction
      const conversationContext = buildConversationContext(conversationHistoryRef.current);
      const hasContext = !!sessionHandleRef.current && conversationContext.length > 0;
      const systemInstruction = buildSystemInstruction(hasContext, conversationContext);

      // Create session
      sessionRef.current = await aiClientRef.current.live.connect({
        model: modelName,
        config: buildSessionConfig(systemInstruction, sessionHandleRef.current),
        callbacks: createSessionCallbacks(false),
      });
    } catch (error: any) {
      console.error("Failed to connect Live API:", error);
      setStatus("error");
      setWarning(error?.message || "Failed to connect to Live API.");
    }
  }, [
    config,
    status,
    interviewId,
    closeSession,
    createSessionCallbacks,
  ]);

  // Create reconnect function and store in ref
  const reconnectSession = useCallback(async () => {
    if (isReconnecting) {
      console.log("Already reconnecting, skipping...");
      return;
    }

    if (goAwayCountRef.current >= MAX_GOAWAY_COUNT) {
      console.log("Reconnection skipped because maximum GoAway attempts reached.");
      return;
    }

    const handle = sessionHandleRef.current;
    if (!handle) {
      console.warn("⚠️ No session handle available for reconnection");
      return;
    }

    console.log("🔄 Seamlessly reconnecting session with handle:", handle);
    setIsReconnecting(true);
    
    // Store current state - preserve timer state during reconnection
    const wasMicOn = isMicOn;
    // Note: timer continues running during reconnection, timerAnchor is preserved in onopen callback
    const oldSession = sessionRef.current;
    
    // Stop mic stream temporarily
    if (wasMicOn) {
      audioStream.stopMicStream();
      setIsMicOn(false);
    }

    // Store old session reference
    oldSessionRef.current = oldSession;
    sessionRef.current = null;

    try {
      console.log("📡 Creating new session...");
      
      if (!config?.apiKey) {
        throw new Error("API key is missing");
      }

      if (!aiClientRef.current) {
        aiClientRef.current = new GoogleGenAI({ apiKey: config.apiKey, apiVersion: 'v1alpha' });
      }

      const modelName = config.model || DEFAULT_MODEL;
      
      // Build conversation context and system instruction
      const conversationContext = buildConversationContext(conversationHistoryRef.current);
      const systemInstruction = buildSystemInstruction(
        conversationContext.length > 0,
        conversationContext,
      );

      // Create new session with resumption handle
      const newSession = await aiClientRef.current.live.connect({
        model: modelName,
        config: buildSessionConfig(systemInstruction, handle),
        callbacks: createSessionCallbacks(true),
      });

      // Set new session as current
      sessionRef.current = newSession;
      
    } catch (error) {
      console.error("Failed to reconnect:", error);
      setWarning("Failed to refresh connection. Please reconnect manually.");
      
      // Restore old session if reconnection failed
      if (oldSessionRef.current) {
        sessionRef.current = oldSessionRef.current;
        oldSessionRef.current = null;
      }
      
      // Restore mic if it was on
      if (wasMicOn) {
        setTimeout(async () => {
          const success = await audioStream.startMicStream();
          if (success) setIsMicOn(true);
        }, MIC_RESTORE_DELAY_MS);
      }
    } finally {
      setIsReconnecting(false);
    }
  }, [isMicOn, audioStream, config, createSessionCallbacks, isReconnecting]);

  // Update reconnect ref whenever reconnectSession changes
  useEffect(() => {
    reconnectSessionRef.current = reconnectSession;
  }, [reconnectSession]);

  // ========================================================================
  // User Actions
  // ========================================================================

  const toggleMic = useCallback(async () => {
    if (isMicOn) {
      audioStream.stopMicStream();
      setIsMicOn(false);
    } else {
      const success = await audioStream.startMicStream();
      if (success) setIsMicOn(true);
    }
  }, [isMicOn, audioStream]);

  const sendTextMessage = useCallback(async () => {
    if (!textInput.trim() || !sessionRef.current) return;
    const msg = textInput.trim();
    setTextInput("");
    handleAddChatMessage("user", msg, "text");

    try {
      setBusy(true);
      await sessionRef.current.sendClientContent({
        turns: msg,
        turnComplete: true,
      });
    } catch (error) {
      console.error("Failed to send text message:", error);
      setWarning("Failed to send message. Try reconnecting.");
    } finally {
      setBusy(false);
    }
  }, [textInput, handleAddChatMessage]);

  // ========================================================================
  // Return API
  // ========================================================================

  return {
    // State
    status,
    micAllowed,
    isMicOn,
    textInput,
    setTextInput,
    chat: sortedChat,
    warning,
    busy,
    isAIPlaying,
    isReconnecting,
    elapsedSeconds,
    report,
    reportStatus,
    reportError,
    lastInterviewId,
    // Actions
    connectSession,
    closeSession,
    toggleMic,
    sendTextMessage,
    reconnectSession,
    finalizeInterview,
  };
}
