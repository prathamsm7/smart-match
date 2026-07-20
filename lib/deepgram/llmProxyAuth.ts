import { createHmac, timingSafeEqual } from "crypto";
import {
  DEV_LLM_PROXY_SECRET,
  LLM_PROXY_TOKEN_TTL_SEC,
} from "./constants";

export { LLM_PROXY_TOKEN_TTL_SEC };

type ProxyTokenPayload = {
  i: string;
  u: string;
  exp: number;
};

function getProxySecret(): string {
  const secret = process.env.INTERVIEW_LLM_PROXY_SECRET?.trim();
  if (secret) return secret;

  if (process.env.NODE_ENV === "development") {
    return DEV_LLM_PROXY_SECRET;
  }

  throw new Error(
    "INTERVIEW_LLM_PROXY_SECRET is required for BYO Deepgram LLM proxy in production.",
  );
}

function signPayload(encodedPayload: string): string {
  return createHmac("sha256", getProxySecret())
    .update(encodedPayload)
    .digest("base64url");
}

function encodePayload(payload: ProxyTokenPayload): string {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function decodePayload(encoded: string): ProxyTokenPayload | null {
  try {
    const parsed = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8"),
    ) as ProxyTokenPayload;
    if (
      typeof parsed.i !== "string" ||
      typeof parsed.u !== "string" ||
      typeof parsed.exp !== "number"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function mintInterviewLlmProxyToken(
  interviewId: string,
  userId: string,
  ttlSec = LLM_PROXY_TOKEN_TTL_SEC,
): string {
  const payload: ProxyTokenPayload = {
    i: interviewId,
    u: userId,
    exp: Math.floor(Date.now() / 1000) + ttlSec,
  };
  const encoded = encodePayload(payload);
  return `${encoded}.${signPayload(encoded)}`;
}

export function verifyInterviewLlmProxyToken(
  token: string,
): { interviewId: string; userId: string } | null {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  const expected = signPayload(encoded);
  const sigBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expected);
  if (
    sigBuf.length !== expectedBuf.length ||
    !timingSafeEqual(sigBuf, expectedBuf)
  ) {
    return null;
  }

  const payload = decodePayload(encoded);
  if (!payload || payload.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }

  return { interviewId: payload.i, userId: payload.u };
}

export function extractBearerToken(
  authorizationHeader: string | null,
): string | null {
  if (!authorizationHeader) return null;
  const match = /^Bearer\s+(.+)$/i.exec(authorizationHeader.trim());
  return match?.[1]?.trim() || null;
}
