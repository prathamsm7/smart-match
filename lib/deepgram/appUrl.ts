import { DEEPGRAM_LLM_PROXY_PUBLIC_BASE_URL } from "./constants";

/**
 * Public base URL for Deepgram to reach our OpenAI-compatible LLM proxy.
 * Deepgram's cloud calls this URL — localhost will not work without a tunnel.
 */
export function getAppBaseUrl(req?: Request): string {
  if (req) {
    const host =
      req.headers.get("x-forwarded-host") ?? req.headers.get("host");
    if (host) {
      const isLocal =
        host.startsWith("localhost") || host.startsWith("127.0.0.1");
      const proto =
        req.headers.get("x-forwarded-proto") ?? (isLocal ? "http" : "https");
      return `${proto}://${host}`;
    }
  }

  const vercel = process.env.VERCEL_URL?.replace(/\/$/, "");
  if (vercel) return `https://${vercel}`;

  return "http://localhost:3000";
}

export function isPubliclyReachableBaseUrl(baseUrl: string): boolean {
  try {
    const { hostname } = new URL(baseUrl);
    return hostname !== "localhost" && hostname !== "127.0.0.1";
  } catch {
    return false;
  }
}

/**
 * Base URL Deepgram uses for the LLM proxy.
 * When developing on localhost, set DEEPGRAM_LLM_PROXY_PUBLIC_BASE_URL to your
 * ngrok URL (must tunnel to this same dev server so proxy tokens match).
 */
export function resolveByoProxyBaseUrl(req?: Request): string {
  const requestBase = getAppBaseUrl(req);
  if (
    !isPubliclyReachableBaseUrl(requestBase) &&
    DEEPGRAM_LLM_PROXY_PUBLIC_BASE_URL
  ) {
    return DEEPGRAM_LLM_PROXY_PUBLIC_BASE_URL.replace(/\/$/, "");
  }
  return requestBase;
}

export function buildDeepgramLlmProxyUrl(baseUrl: string): string {
  return `${baseUrl.replace(/\/$/, "")}/api/interview/deepgram/llm/v1/chat/completions`;
}
