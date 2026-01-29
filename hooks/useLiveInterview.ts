import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Vapi from "@vapi-ai/web";
import { interviewsService } from "@/lib/services";
import { ChatMessage, ConnectionStatus } from "@/components/candidate/interviews/types";

const VAPI_API_KEY = process.env.NEXT_PUBLIC_VAPI_API_KEY ?? "";
const VAPI_ASSISTANT_ID = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID ?? "";


export function useLiveInterview(interviewId?: string) {

  // Connection & Status
  const [status, setStatus] = useState<ConnectionStatus>("idle");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [chatUpdateTrigger, setChatUpdateTrigger] = useState(0); // Trigger for re-renders
  const [warning, setWarning] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [micAllowed, setMicAllowed] = useState<boolean | null>(null);
  const [textInput, setTextInput] = useState("");
  
  // Data
  const [userData, setUserData] = useState<any>(null);
  const [jobData, setJobData] = useState<any>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  const vapiRef = useRef<Vapi | null>(null);
  const chatRef = useRef<ChatMessage[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isFinalizingRef = useRef(false);
  
  const isAIPlaying = isSpeaking;
  const chat = chatRef.current; // Use ref for chat, state only for triggering re-renders
  const isMicOn = vapiRef.current ? !vapiRef.current.isMuted() : false;

  useEffect(() => {
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
          setWarning("Failed to load interview data. Please refresh the page.");
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
  }, [interviewId]);

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

  useEffect(() => {
    if (isLoadingData || !userData || !jobData) return;
    if (!VAPI_API_KEY || !VAPI_ASSISTANT_ID) {
      setWarning("Missing Vapi config. Set NEXT_PUBLIC_VAPI_API_KEY and NEXT_PUBLIC_VAPI_ASSISTANT_ID.");
      return;
    }

    const vapiInstance = new Vapi(VAPI_API_KEY);
    vapiRef.current = vapiInstance;

    // Store assistantId for later use
    (vapiInstance as any).assistantId = VAPI_ASSISTANT_ID;

    // Event listeners
    vapiInstance.on("call-start", () => {
      console.log("Call started");
      setStatus("connected");
      const now = Date.now();
      setStartTime(now);
      setElapsedSeconds(0);
      
      // Start timer interval
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      timerIntervalRef.current = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - now) / 1000));
      }, 1000);
    });

    vapiInstance.on("call-end", () => {
      console.log("Call ended");
      setStatus("disconnected");
      setIsSpeaking(false);
      
      // Stop timer
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      
      // Log full conversation on session end using ref (always has latest)
      console.log("=== Full Interview Conversation ===");
      console.log(chatRef.current);
      console.log("=== End of Conversation ===");

      void finalizeInterview();
    });

    vapiInstance.on("speech-start", () => {
      console.log("Assistant started speaking");
      setIsSpeaking(true);
    });

    vapiInstance.on("speech-end", () => {
      console.log("Assistant stopped speaking");
      setIsSpeaking(false);
    });

    vapiInstance.on("message", (message: any) => {
      console.log(message);
      if (message.type === "transcript" && message.transcriptType === "final") {
        const role = message.role === "user" ? "user" : "assistant";
        const newMessage: ChatMessage = {
          role: role,
          text: message.transcript,
          via: "audio",
          timestamp: Date.now(),
        };

        // Update chat ref
        const lastMsg = chatRef.current[chatRef.current.length - 1];
        if (lastMsg && lastMsg.role === role) {
          // Append to last message if same role
          chatRef.current = [
            ...chatRef.current.slice(0, -1),
            {
              ...lastMsg,
              text: lastMsg.text + " " + message.transcript,
              timestamp: Date.now(),
            },
          ];
        } else {
          chatRef.current = [...chatRef.current, newMessage];
        }
        // Trigger re-render
        setChatUpdateTrigger(prev => prev + 1);
      }
    });

    vapiInstance.on("error", (error: any) => {
      console.error("Vapi error:", error);
      setWarning(error.message || "An error occurred");
      setStatus("disconnected");
    });

    // Cleanup on unmount
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (vapiRef.current) {
        vapiRef.current.stop();
      }
    };
  }, [userData, jobData, isLoadingData]);

  // ========================================================================
  // Vapi Actions
  // ========================================================================

  const startVapiCall = useCallback(() => {
    console.log("startVapiCall - userData:", userData);
    console.log("startVapiCall - jobData:", jobData);
    console.log("startVapiCall - vapiRef.current:", vapiRef.current);
    
    if (!vapiRef.current) {
      setWarning("Voice assistant not initialized. Please refresh the page.");
      return;
    }
    
    if (!userData || !jobData) {
      setWarning("Interview data not loaded yet. Please wait or refresh the page.");
      console.error("Missing data - userData:", userData, "jobData:", jobData);
      return;
    }
    if (!VAPI_ASSISTANT_ID) {
      setWarning("Missing Vapi assistant ID.");
      return;
    }

    setStatus("connecting");
    
    const user = userData;
    const job = jobData;
    const assistantId = (vapiRef.current as any).assistantId || VAPI_ASSISTANT_ID;

    vapiRef.current.start(assistantId, {
      artifactPlan: {
        recordingEnabled: true,
        loggingEnabled: true,
        transcriptPlan: {
          enabled: true,
        },
      },
      monitorPlan: {},
      model: {
        provider: "openai",
        model: "gpt-4o-mini",
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content: `
              ROLE:
              You are a professional technical interviewer with over 10 years of real-world interview experience.
              Your name is Despina.

              PRIMARY TASK:
              You are given candidate details and a job description.
              Your sole responsibility is to ASK interview questions to the candidate, one at a time.

              You must ask UNIQUE, job-relevant questions based strictly on:
              - The candidate's skills
              - Their projects
              - Their work experience
              - The job requirements

              You must NOT explain concepts, provide answers, evaluate responses, or give feedback. 
              Give response to candidate only if he asked question related to job description and ask for clarification of question.

              CANDIDATE DETAILS:
              - Name: ${user.name || "Unknown"}
              - Experience Level: ${user.totalExperienceYears || "NA"}
              - Skills: ${JSON.stringify(user.skills || [])}
              - Projects: ${JSON.stringify(user.projects || [])}
              - Summary: ${user.summary || ""}
              - Experience: ${JSON.stringify(user.experience || [])}

              JOB DETAILS:
              - Position: ${job.title || "Unknown"}
              - Company: ${job.employerName || "Unknown"}
              - Job Description: ${job.description || ""}
              - Job Requirements: ${job.requirements || ""}
              - Job Responsibilities: ${job.responsibilities || ""}

              INTERVIEW BEHAVIOR RULES:
              1. Ask ONLY questions.
              2. Ask ONE question at a time.
              3. Maintain a professional, friendly, helpful, and encouraging tone.
              4. Keep questions concise, clear, and role-relevant.
              5. Never repeat a question.
              6. Never go off-topic.
              7. Never judge, score, or comment on the candidate's answers.

              QUESTION PRIORITY (Highest → Lowest): High Priority for skills, ask as many as questions realated to the skiils mentioned
              1. Technical skills aligned with both the candidate profile and job description
              2. Previous relevant work experience
              3. Tools, frameworks, and technologies related to the role
              4. Projects the candidate has worked on

              FOLLOW-UP QUESTION LOGIC:
              Ask a follow-up question ONLY if:
              - The candidate's answer lacks clarity
              - More technical depth is required
              - A claim or experience needs validation

              Follow-up questions MUST directly reference the candidate's previous response.

              INTERVIEW FLOW:
              1. Introduction + request for candidate self-introduction
              2. Skill-specific technical questions
              3. Experience-based questions
              4. Project deep-dive questions
              5. Problem-solving and decision-making questions
              6. Wrap-up question

              START INSTRUCTIONS:
              Begin the interview now by:
              - Greeting the candidate by name
              - Introducing yourself as Despina
              - Mentioning the job role and company name
              - Asking the candidate to introduce themselves
            `,
          },
        ],
      },
      firstMessage: `Hello ${user.name || "there"}! I'm your AI interviewer for the ${job.title || "position"} at ${job.employerName || "the company"}. Let's begin!`,
      firstMessageMode: "assistant-speaks-first-with-model-generated-message",
      transcriber: {
        provider: "deepgram",
        model: "nova-2",
      },
      voice: {
        provider: "vapi",
        voiceId: "Neha",
      },
      backgroundSpeechDenoisingPlan: {},
      startSpeakingPlan: {
        smartEndpointingPlan: {
          provider: "livekit",
          waitFunction: "2000 / (1 + exp(-10 * (x - 0.5)))",
        },
        waitSeconds: 0.3,
      },
      stopSpeakingPlan: {
        numWords: 2,
        voiceSeconds: 0.3,
        backoffSeconds: 1.0,
        acknowledgementPhrases: [
          "mm-hmm",
          "yeah",
          "okay",
          "uh-huh",
          "right",
          "I see",
        ],
      },
      hooks: [
        {
          on: "customer.speech.timeout",
          options: {
            timeoutSeconds: 20,
            triggerMaxCount: 2,
            triggerResetMode: "onUserSpeech" as any,
          },
          do: [
            {
              type: "say",
              prompt:
                "Are you still there? Please let me know how I can help you.",
            },
          ],
        },
      ] as any,
    });
  }, [userData, jobData]);

  const endVapiCall = useCallback(() => {
    if (vapiRef.current) {
      vapiRef.current.end();
    }
  }, []);

  const connectSession = useCallback(() => {
    if (status === "connected") {
      endVapiCall();
    } else {
      startVapiCall();
    }
  }, [status, startVapiCall, endVapiCall]);

  const toggleMic = useCallback(() => {
    if (vapiRef.current) {
      const currentlyMuted = vapiRef.current.isMuted();
      vapiRef.current.setMuted(!currentlyMuted);
    }
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
