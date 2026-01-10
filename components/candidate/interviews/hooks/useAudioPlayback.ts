/**
 * Hook for managing audio playback queue
 */

import { useRef, useCallback } from "react";
import { PLAYBACK_SAMPLE_RATE } from "../utils/audioProcessing";

export function useAudioPlayback() {
  const playbackQueueRef = useRef<ArrayBufferLike[]>([]);
  const isPlayingRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const onPlaybackStateChangeRef = useRef<((isPlaying: boolean) => void) | null>(null);

  const setPlayingState = (playing: boolean) => {
    isPlayingRef.current = playing;
    if (onPlaybackStateChangeRef.current) {
      onPlaybackStateChangeRef.current(playing);
    }
  };

  const enqueuePlayback = (buffer: ArrayBufferLike) => {
    if (!buffer || buffer.byteLength === 0) return;
    playbackQueueRef.current.push(buffer);
    if (!isPlayingRef.current) {
      playNextInQueue();
    }
  };

  const playNextInQueue = async () => {
    const audioContext =
      audioContextRef.current ||
      new (window.AudioContext || (window as any).webkitAudioContext)();
    audioContextRef.current = audioContext;
    await audioContext.resume();

    const next = playbackQueueRef.current.shift();
    const isShared =
      typeof SharedArrayBuffer !== "undefined" && next instanceof SharedArrayBuffer;
    if (!(next instanceof ArrayBuffer) && !isShared) {
      setPlayingState(false);
      return;
    }

    setPlayingState(true);
    const pcm = new Int16Array(
      next instanceof ArrayBuffer ? next : (next as SharedArrayBuffer),
    );

    if (pcm.length === 0) {
      playNextInQueue();
      return;
    }

    const buffer = audioContext.createBuffer(1, pcm.length, PLAYBACK_SAMPLE_RATE);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < pcm.length; i++) {
      channelData[i] = pcm[i] / 0x7fff;
    }

    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);

    source.onended = () => {
      playNextInQueue();
    };

    try {
      source.start(audioContext.currentTime);
    } catch (error) {
      console.error("Error playing audio:", error);
      setPlayingState(false);
      playNextInQueue();
    }
  };

  const clearPlaybackQueue = () => {
    playbackQueueRef.current = [];
  };

  const getAudioContext = () => audioContextRef.current;

  const getIsPlaying = () => isPlayingRef.current;

  const setOnPlaybackStateChange = useCallback((callback: (isPlaying: boolean) => void) => {
    onPlaybackStateChangeRef.current = callback;
  }, []);

  return {
    enqueuePlayback,
    clearPlaybackQueue,
    getAudioContext,
    getIsPlaying,
    setOnPlaybackStateChange,
  };
}
