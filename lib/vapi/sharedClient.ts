import Vapi from "@vapi-ai/web";

/** Survives React remounts (auth refresh, layout) so an active call is not orphaned. */
let sharedVapi: Vapi | null = null;
let listenersAttached = false;

export type VapiHandlerRefs = {
  onCallStart: () => void;
  onCallEnd: () => void;
  onSpeechStart: () => void;
  onSpeechEnd: () => void;
  onVolumeLevel: (volume: number) => void;
  onMessage: (message: Record<string, unknown>) => void;
  onError: (error: { message?: string }) => void;
};

export const vapiHandlerRefs: { current: Partial<VapiHandlerRefs> } = {
  current: {},
};

export function getSharedVapiClient(apiKey: string): Vapi {
  if (!sharedVapi) {
    sharedVapi = new Vapi(apiKey);
  }

  if (!listenersAttached) {
    listenersAttached = true;

    sharedVapi.on("call-start", () => vapiHandlerRefs.current.onCallStart?.());
    sharedVapi.on("call-end", () => vapiHandlerRefs.current.onCallEnd?.());
    sharedVapi.on("speech-start", () => vapiHandlerRefs.current.onSpeechStart?.());
    sharedVapi.on("speech-end", () => vapiHandlerRefs.current.onSpeechEnd?.());
    sharedVapi.on("volume-level", (volume: number) =>
      vapiHandlerRefs.current.onVolumeLevel?.(volume),
    );
    sharedVapi.on("message", (message: Record<string, unknown>) =>
      vapiHandlerRefs.current.onMessage?.(message),
    );
    sharedVapi.on("error", (error: { message?: string }) =>
      vapiHandlerRefs.current.onError?.(error),
    );
  }

  return sharedVapi;
}

export function getSharedVapiIfExists(): Vapi | null {
  return sharedVapi;
}
