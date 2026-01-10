import 'dotenv/config';
import { GoogleGenAI, Modality } from "@google/genai";
import { NextResponse } from "next/server";

/**
 * Lightweight config endpoint for the realtime interview UI.
 * In production, replace this with an ephemeral token service so the raw API key
 * is never exposed to the browser. For now, we fall back to the server-side
 * Gemini key to keep development simple.
 */
export async function GET() {
  const apiKey =
    process.env.GEMINI_LIVE_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Missing Gemini API key. Set GEMINI_LIVE_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY.",
      },
      { status: 500 },
    );
  }

  const client = new GoogleGenAI({
    apiKey:process.env.GOOGLE_GENERATIVE_AI_API_KEY
  });

  const expireTime = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    const token = await client.authTokens.create({
        config: {
            expireTime: expireTime,
            httpOptions: {
                apiVersion: 'v1alpha'
            }
        }
    });

  return NextResponse.json({
    success: true,
    token: token,
    model: 'gemini-2.5-flash-native-audio-preview-12-2025'
  });
}
