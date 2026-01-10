import { NextResponse } from "next/server";
import redisClient from "@/lib/redisClient";
import { prisma } from "@/lib/prisma";
import { createServerSupabase } from "@/lib/superbase/server";

const TTL_SECONDS = 6 * 60 * 60; // 6 hours

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { interviewId, chat, stage } = body || {};

    if (!interviewId || !Array.isArray(chat)) {
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
      const supabase = await createServerSupabase();
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        return NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 401 },
        );
      }

      const dbUser = await prisma.user.findUnique({
        where: { email: user.email! },
      });

      if (!dbUser) {
        return NextResponse.json(
          { success: false, error: "User not found" },
          { status: 404 },
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

