import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Mint a short-lived Deepgram JWT for browser Voice Agent sessions.
 * Never expose DEEPGRAM_API_KEY to the client.
 */
export async function POST(req: Request) {
  try {
    const { user: dbUser, error } = await authenticateRequest();
    if (error) return error;

    const apiKey = process.env.DEEPGRAM_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "DEEPGRAM_API_KEY is not configured." },
        { status: 500 },
      );
    }

    let interviewId: string | undefined;
    try {
      const body = await req.json();
      interviewId = body?.interviewId;
    } catch {
      // Body is optional
    }

    if (interviewId) {
      const interview = await prisma.interview.findUnique({
        where: { id: interviewId },
        select: { userId: true },
      });

      if (!interview) {
        return NextResponse.json(
          { error: "Interview not found" },
          { status: 404 },
        );
      }

      if (interview.userId !== dbUser.id) {
        return NextResponse.json(
          { error: "Unauthorized to start this interview session" },
          { status: 403 },
        );
      }
    }

    // Browser Voice Agent auth: mint a short-lived JWT via /v1/auth/grant.
    // Docs: https://developers.deepgram.com/guides/fundamentals/token-based-authentication
    const grantRes = await fetch("https://api.deepgram.com/v1/auth/grant", {
      method: "POST",
      headers: {
        Authorization: `Token ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ttl_seconds: 600 }),
    });

    if (!grantRes.ok) {
      const detail = await grantRes.text();
      console.error("Deepgram auth/grant failed:", grantRes.status, detail);

      let deepgramMessage = "Failed to mint Deepgram token.";
      try {
        const parsed = JSON.parse(detail) as {
          err_msg?: string;
          err_code?: string;
        };
        if (parsed.err_code === "FORBIDDEN" || grantRes.status === 403) {
          deepgramMessage =
            "Deepgram API key lacks permission for /v1/auth/grant. " +
            "Create a new key in the Deepgram Console with Member (or higher) role " +
            "(Create Key → Advanced → Permissions → Member), then set DEEPGRAM_API_KEY.";
        } else if (parsed.err_msg) {
          deepgramMessage = parsed.err_msg;
        }
      } catch {
        // keep default
      }

      return NextResponse.json(
        { error: deepgramMessage },
        { status: grantRes.status === 403 ? 403 : 502 },
      );
    }

    const data = (await grantRes.json()) as {
      access_token?: string;
      accessToken?: string;
    };
    const accessToken = data.access_token ?? data.accessToken;

    if (!accessToken) {
      return NextResponse.json(
        { error: "Deepgram grant response missing access_token." },
        { status: 502 },
      );
    }

    return new NextResponse(accessToken, {
      status: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (err) {
    console.error("Interview Deepgram token error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
