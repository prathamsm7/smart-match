import {
  buildDeepgramLlmProxyUrl,
  getAppBaseUrl,
  isPubliclyReachableBaseUrl,
  resolveByoProxyBaseUrl,
} from "./appUrl";

export type ByoThinkDisabledReason =
  | "missing_openai_key"
  | "localhost_no_public_url";

export type ByoThinkStatus = {
  enabled: boolean;
  reason?: ByoThinkDisabledReason;
  proxyBaseUrl?: string;
};

const BYO_DISABLED_MESSAGES: Record<ByoThinkDisabledReason, string> = {
  missing_openai_key:
    "Set OPENAI_API_KEY in .env (server-only, never NEXT_PUBLIC_*).",
  localhost_no_public_url:
    "Deepgram cannot reach localhost. Open the app via your ngrok URL, set DEEPGRAM_LLM_PROXY_PUBLIC_BASE_URL in lib/deepgram/constants.ts to that ngrok URL, or test on your Vercel deploy.",
};

export function formatByoThinkDisabledMessage(
  reason: ByoThinkDisabledReason,
): string {
  return BYO_DISABLED_MESSAGES[reason];
}

export function getByoThinkStatus(req?: Request): ByoThinkStatus {
  if (!process.env.OPENAI_API_KEY?.trim()) {
    return { enabled: false, reason: "missing_openai_key" };
  }

  const proxyBaseUrl = resolveByoProxyBaseUrl(req);
  if (!isPubliclyReachableBaseUrl(proxyBaseUrl)) {
    return { enabled: false, reason: "localhost_no_public_url" };
  }

  return { enabled: true, proxyBaseUrl };
}

/** @deprecated Use getByoThinkStatus(req).enabled */
export function isByoThinkEnabled(req?: Request): boolean {
  return getByoThinkStatus(req).enabled;
}

export function resolveByoThinkProxy(baseUrl: string): {
  proxyUrl: string;
} {
  return { proxyUrl: buildDeepgramLlmProxyUrl(baseUrl) };
}
