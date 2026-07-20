import { NextResponse } from "next/server";
import {
  extractBearerToken,
  verifyInterviewLlmProxyToken,
} from "@/lib/deepgram/llmProxyAuth";
import { DEEPGRAM_BYO_THINK } from "@/lib/deepgram/constants";

const OPENAI_CHAT_COMPLETIONS_URL =
  "https://api.openai.com/v1/chat/completions";

/**
 * OpenAI-compatible chat completions proxy for Deepgram BYO think.
 * Deepgram's cloud (not the browser) calls this endpoint.
 *
 * @see https://github.com/deepgram-devs/deepgram-voice-agent-client-llm-proxy
 */
export async function POST(req: Request) {
  const openAiKey = process.env.OPENAI_API_KEY?.trim();
  if (!openAiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured." },
      { status: 500 },
    );
  }

  const proxyToken = extractBearerToken(req.headers.get("authorization"));
  if (!proxyToken || !verifyInterviewLlmProxyToken(proxyToken)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let bodyText: string;
  try {
    bodyText = await req.text();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  let parsedBody: Record<string, unknown> & { model?: string; stream?: boolean };
  try {
    parsedBody = JSON.parse(bodyText) as Record<string, unknown> & {
      model?: string;
      stream?: boolean;
    };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const model = parsedBody.model?.trim() || DEEPGRAM_BYO_THINK.model;

  const openaiRes = await fetch(OPENAI_CHAT_COMPLETIONS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openAiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ...parsedBody, model }),
  });

  const contentType =
    openaiRes.headers.get("content-type") ?? "application/json";

  if (!openaiRes.ok) {
    const detail = await openaiRes.text();
    console.error("OpenAI chat/completions proxy error:", openaiRes.status);
    return new NextResponse(detail, {
      status: openaiRes.status,
      headers: { "Content-Type": contentType },
    });
  }

  if (parsedBody.stream || contentType.includes("text/event-stream")) {
    return new Response(openaiRes.body, {
      status: openaiRes.status,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  }

  return new NextResponse(await openaiRes.text(), {
    status: openaiRes.status,
    headers: { "Content-Type": contentType },
  });
}
