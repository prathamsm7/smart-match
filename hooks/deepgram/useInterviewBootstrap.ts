"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Client-only mic permission gate. Profiles are loaded on the server and
 * passed as props — no browser fetch of user/job PII.
 */
export function useInterviewBootstrap() {
  const router = useRouter();
  const [warning, setWarning] = useState<string | null>(null);
  const [micAllowed, setMicAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    async function requestMicAccess() {
      if (!navigator?.mediaDevices?.getUserMedia) {
        setMicAllowed(false);
        setWarning("Microphone access is not supported in this browser.");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        setMicAllowed(true);
        stream.getTracks().forEach((t) => t.stop());
      } catch (err) {
        console.error("Microphone permission denied:", err);
        setMicAllowed(false);
        setWarning("Microphone permission denied.");
      }
    }
    void requestMicAccess();
  }, []);

  return {
    warning,
    setWarning,
    micAllowed,
    goToDashboard: () => router.push("/dashboard"),
  };
}
