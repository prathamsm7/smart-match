import { NextResponse } from "next/server";
import redisClient from "@/lib/redisClient";
import { prisma } from "@/lib/prisma";

const TTL_SECONDS = 6 * 60 * 60; // 6 hours

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // Support both old (chat/stage) and new (messages/type) parameter names
    const interviewId = body.interviewId;
    const chat = body.chat || body.messages;
    const stage = body.stage || body.type;

    if (!interviewId || !Array.isArray(chat)) {
      console.error("Invalid request body:", { interviewId, chat: Array.isArray(chat), body });
      return NextResponse.json(
        { success: false, error: "Missing interviewId or chat transcript." },
        { status: 400 },
      );
    }

    // Store in Redis first
    await redisClient.set(
      `interview:${interviewId}:chat`,
      JSON.stringify({
        chat,
        stage: stage || "snapshot",
        updatedAt: Date.now(),
      }),
      { ex: TTL_SECONDS },
    );

    // If stage is "final", store in database and delete from Redis
    if (stage === "final") {
      // Verify user is authenticated
      const { authenticateRequest } = await import("@/lib/auth");
      const { user: dbUser, error } = await authenticateRequest();
      
      if (error) {
        return NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 401 },
        );
      }

      // Verify interview exists and belongs to user
      const interview = await prisma.interview.findUnique({
        where: { id: interviewId },
      });

      if (!interview) {
        return NextResponse.json(
          { success: false, error: "Interview not found" },
          { status: 404 },
        );
      }

      if (interview.userId !== dbUser.id) {
        return NextResponse.json(
          { success: false, error: "Unauthorized to update this interview" },
          { status: 403 },
        );
      }

      // Store transcript in database
      await prisma.interview.update({
        where: { id: interviewId },
        data: {
          transcript: chat as any,
        },
      });

      // Delete from Redis cache after storing in DB
      try {
        await redisClient.del(`interview:${interviewId}:chat`);
      } catch (redisError) {
        console.warn("Failed to delete from Redis cache:", redisError);
        // Non-critical error, continue
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to persist interview conversation:", error);
    return NextResponse.json(
      { success: false, error: "Failed to persist conversation." },
      { status: 500 },
    );
  }
}

