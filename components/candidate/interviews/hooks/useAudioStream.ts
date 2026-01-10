/**
 * Hook for managing microphone audio stream
 */

import { useRef, useCallback } from "react";
import { ensureAudioWorklet } from "../utils/audioWorklet";
import {
  TARGET_SAMPLE_RATE,
  downsampleTo16k,
  toBase64,
  isFrameAudible,
} from "../utils/audioProcessing";

const TARGET_BUFFER_SIZE = 800; // ~50ms at 16kHz

interface UseAudioStreamParams {
  sessionRef: React.MutableRefObject<any>;
  status: "idle" | "connecting" | "connected" | "error";
  onError?: (error: string) => void;
}

export function useAudioStream({
  sessionRef,
  status,
  onError,
}: UseAudioStreamParams) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | AudioWorkletNode | null>(
    null,
  );
  const audioBufferRef = useRef<Float32Array[]>([]);
  const audioBufferSizeRef = useRef(0);
  const lastAudioSendTimeRef = useRef(0);
  const hasSentAudioThisTurnRef = useRef(false);

  const sendAudioChunk = useCallback(
    (audioData: Float32Array, sampleRate: number) => {
      // Check if session exists and is valid before sending
      if (!sessionRef.current || !isFrameAudible(audioData)) return;

      // Check if session is in a valid state (not closing/closed)
      // The session object should have a readyState or we can check if it's null
      try {
        const pcm16 = downsampleTo16k(audioData, sampleRate);
        const pcmBytes = new Uint8Array(pcm16.buffer);
        const payload = toBase64(pcmBytes);

        if (payload.length > 0 && payload.length < 1000000) {
          // Double-check session is still valid before sending
          if (!sessionRef.current) {
            return; // Session was closed, skip this chunk
          }
          
          sessionRef.current.sendRealtimeInput({
            audio: {
              data: payload,
              mimeType: `audio/pcm;rate=${TARGET_SAMPLE_RATE}`,
            },
          });
          hasSentAudioThisTurnRef.current = true;
          lastAudioSendTimeRef.current = Date.now();
        }
      } catch (error: any) {
        // Silently handle WebSocket closed errors during reconnection
        const errorMessage = error?.message || "";
        if (
          errorMessage.includes("closed") ||
          errorMessage.includes("disconnect") ||
          errorMessage.includes("CLOSING") ||
          errorMessage.includes("CLOSED")
        ) {
          // Don't log errors during normal reconnection flow
          // Only log if it's unexpected
          if (sessionRef.current) {
            console.warn("Audio send failed - session may be closing:", errorMessage);
          }
          return; // Silently skip this chunk
        }
        console.error("Error sending audio:", error);
        onError?.("Connection closed");
      }
    },
    [sessionRef, onError],
  );

  const processAudioBuffer = useCallback(
    (audioContext: AudioContext) => {
      const totalLength = audioBufferRef.current.reduce(
        (sum, arr) => sum + arr.length,
        0,
      );
      if (totalLength === 0) return;

      const combined = new Float32Array(totalLength);
      let offset = 0;
      for (const frame of audioBufferRef.current) {
        combined.set(frame, offset);
        offset += frame.length;
      }

      if (isFrameAudible(combined)) {
        sendAudioChunk(combined, audioContext.sampleRate);
      }

      audioBufferRef.current = [];
      audioBufferSizeRef.current = 0;
    },
    [sendAudioChunk],
  );

  const startMicStream = useCallback(async () => {
    if (status !== "connected" || !navigator?.mediaDevices?.getUserMedia) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext =
        audioContextRef.current ||
        new (window.AudioContext || (window as any).webkitAudioContext)();

      audioContextRef.current = audioContext;
      await audioContext.resume();

      lastAudioSendTimeRef.current = Date.now();
      hasSentAudioThisTurnRef.current = false;

      const source = audioContext.createMediaStreamSource(stream);
      const workletReady = await ensureAudioWorklet(audioContext);

      if (workletReady) {
        const node = new AudioWorkletNode(audioContext, "pcm-worklet");
        node.port.onmessage = (event: MessageEvent<Float32Array>) => {
          const input = event.data;
          // Check session is still valid before processing
          if (!input || !sessionRef.current) return;

          audioBufferRef.current.push(input);
          audioBufferSizeRef.current += input.length;

          const now = Date.now();
          const shouldSendByTime = now - lastAudioSendTimeRef.current >= 30;
          const shouldSendBySize = audioBufferSizeRef.current >= TARGET_BUFFER_SIZE;

          // Double-check session is still valid before sending
          if ((shouldSendBySize || shouldSendByTime) && sessionRef.current) {
            processAudioBuffer(audioContext);
          }
        };

        source.connect(node);
        processorRef.current = node;
      } else {
        const processor = audioContext.createScriptProcessor(4096, 1, 1);
        processor.onaudioprocess = (event) => {
          const input = event.inputBuffer.getChannelData(0);
          // Check session is still valid before processing
          if (sessionRef.current && isFrameAudible(input)) {
            sendAudioChunk(input, audioContext.sampleRate);
          }
        };

        source.connect(processor);
        processorRef.current = processor;
      }

      mediaStreamRef.current = stream;
      return true;
    } catch (error) {
      console.error("Error starting microphone stream:", error);
      onError?.("Could not access microphone. Please check permissions.");
      return false;
    }
  }, [status, sessionRef, processAudioBuffer, sendAudioChunk, onError]);

  const stopMicStream = useCallback(() => {
    // Stop processing audio immediately
    if (processorRef.current instanceof AudioWorkletNode) {
      processorRef.current.port.onmessage = null;
    }
    processorRef.current?.disconnect();
    processorRef.current = null;

    // Clear audio buffer
    audioBufferRef.current = [];
    audioBufferSizeRef.current = 0;

    // Try to send audioStreamEnd only if session is still valid
    if (sessionRef.current) {
      try {
        // Check if session is in a valid state before sending
        sessionRef.current.sendRealtimeInput({ audioStreamEnd: true });
      } catch (error: any) {
        // Silently ignore errors if session is closing/closed
        const errorMsg = error?.message || "";
        if (!errorMsg.includes("closed") && !errorMsg.includes("CLOSING") && !errorMsg.includes("CLOSED")) {
          console.warn("Error sending audioStreamEnd:", error);
        }
      }

      // Flush remaining audio and send turnComplete if needed
      if (hasSentAudioThisTurnRef.current && audioContextRef.current) {
        processAudioBuffer(audioContextRef.current);

        try {
          sessionRef.current.sendRealtimeInput({ turnComplete: true });
        } catch (error: any) {
          // Silently ignore errors if session is closing/closed
          const errorMsg = error?.message || "";
          if (!errorMsg.includes("closed") && !errorMsg.includes("CLOSING") && !errorMsg.includes("CLOSED")) {
            console.warn("Error sending turnComplete:", error);
          }
        }
      }
      hasSentAudioThisTurnRef.current = false;
    }

    // Media stream cleanup
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;
  }, [sessionRef, processAudioBuffer]);

  const resetAudioTurnFlag = useCallback(() => {
    hasSentAudioThisTurnRef.current = false;
  }, []);

  const getHasSentAudio = useCallback(() => {
    return hasSentAudioThisTurnRef.current;
  }, []);

  return {
    startMicStream,
    stopMicStream,
    resetAudioTurnFlag,
    getHasSentAudio,
    getAudioContext: () => audioContextRef.current,
  };
}

