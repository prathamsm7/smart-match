import { FATAL_SESSION_ERROR_PATTERNS } from "./constants";

export function describeDeepgramError(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "string" && err.trim()) return err;
  if (err && typeof err === "object") {
    const o = err as Record<string, unknown>;
    if (typeof o.message === "string" && o.message.trim()) return o.message;
    if (typeof o.description === "string" && o.description.trim()) {
      return o.description;
    }
    if (typeof o.error === "string" && o.error.trim()) return o.error;
    try {
      const json = JSON.stringify(err);
      if (json && json !== "{}") return json;
    } catch {
      // ignore
    }
  }
  return "Unknown connection error";
}

export function isFatalSessionError(message: string): boolean {
  return FATAL_SESSION_ERROR_PATTERNS.some((re) => re.test(message));
}

/** Disconnect reasons from our own stop() — never treat as faults. */
export function isBenignDisconnect(message: string): boolean {
  return /user requested disconnect/i.test(message);
}
