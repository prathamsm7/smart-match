import { NextResponse } from "next/server";
import {
  buildInterviewAgentSettings,
  type InterviewThinkMode,
} from "@/lib/deepgram/agentSettings";
import { getAppBaseUrl } from "@/lib/deepgram/appUrl";
import { DEEPGRAM_BYO_THINK } from "@/lib/deepgram/constants";
import {
  formatByoThinkDisabledMessage,
  getByoThinkStatus,
  resolveByoThinkProxy,
} from "@/lib/deepgram/byoThink";
import { mintInterviewLlmProxyToken } from "@/lib/deepgram/llmProxyAuth";
import { loadInterviewSession } from "@/lib/interview/loadSession";

/**
 * Returns Deepgram agent settings for an authenticated interview session.
 *
 * BYO OpenAI uses a server-side LLM proxy — only a short-lived interview token
 * is sent to the browser, never OPENAI_API_KEY.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const interviewId =
      typeof body?.interviewId === "string" ? body.interviewId : undefined;

    if (!interviewId) {
      return NextResponse.json(
        { error: "interviewId is required" },
        { status: 400 },
      );
    }

    const session = await loadInterviewSession(interviewId, "start");
    if (!session.ok) {
      return NextResponse.json(
        { error: session.error },
        { status: session.status },
      );
    }

    const byoStatus = getByoThinkStatus(req);
    const baseUrl = byoStatus.proxyBaseUrl ?? getAppBaseUrl(req);
    let thinkMode: InterviewThinkMode = "managed";

    const agent = buildInterviewAgentSettings(
      session.data.candidateProfile,
      session.data.jobProfile,
      byoStatus.enabled
        ? {
            byoProxy: {
              ...resolveByoThinkProxy(baseUrl),
              proxyToken: mintInterviewLlmProxyToken(
                interviewId,
                session.data.interview.userId,
              ),
              model: DEEPGRAM_BYO_THINK.model,
            },
          }
        : undefined,
    );

    if (byoStatus.enabled) {
      thinkMode = "byo_proxy";
    } else if (byoStatus.reason) {
      console.info(
        `[Deepgram] BYO disabled (${byoStatus.reason}): ${formatByoThinkDisabledMessage(byoStatus.reason)}`,
      );
    }

    return NextResponse.json({
      agent,
      thinkMode,
      thinkModeReason: byoStatus.reason,
    });
  } catch (err) {
    console.error("Deepgram session config error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
