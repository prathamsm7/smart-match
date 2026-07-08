import { NextRequest, NextResponse } from "next/server";
import redisClient from "@/lib/redisClient";
import { storeStructuredResume } from "@/lib/resumeHelper";
import { createServerSupabase } from "@/lib/superbase/server";
import { prisma } from "@/lib/prisma";
import { qdrantClient } from "@/lib/clients";

export const maxDuration = 300;

export async function POST(request: NextRequest) {
    try {
        const { draftId } = await request.json();
        if (!draftId) {
            return NextResponse.json({ error: "draftId is required" }, { status: 400 });
        }

        const cached = await redisClient.get(`ats:draft:${draftId}`);
        if (!cached) {
            return NextResponse.json(
                { error: "ATS draft expired. Please analyze again." },
                { status: 404 }
            );
        }
        const parsed = typeof cached === "string" ? JSON.parse(cached) : cached;
        const resumeData = parsed?.resumeData as Record<string, unknown> | undefined;

        if (!resumeData || typeof resumeData !== "object") {
            return NextResponse.json({ error: "Invalid ATS draft data." }, { status: 400 });
        }

        const { resumeId } = await storeStructuredResume(resumeData);
        if (!resumeId) {
            return NextResponse.json(
                { error: "Failed to move resume to dashboard." },
                { status: 500 }
            );
        }

        const supabase = await createServerSupabase();
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 });
        }

        const dbUser = await prisma.user.findUnique({ where: { email: user.email! } });
        if (!dbUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const qdrantResult = await qdrantClient.retrieve("resumes", {
            ids: [resumeId],
            with_payload: true,
        });
        if (!qdrantResult?.[0]) {
            return NextResponse.json(
                { error: "Stored resume payload not found" },
                { status: 404 }
            );
        }

        const payload = qdrantResult[0].payload as object;
        const resumeCount = await prisma.resume.count({ where: { userId: dbUser.id } });
        await prisma.resume.create({
            data: {
                id: resumeId,
                userId: dbUser.id,
                vectorId: resumeId,
                json: payload,
                isPrimary: resumeCount === 0,
            },
        });

        await qdrantClient.setPayload("resumes", {
            payload: {
                userId: dbUser.id,
                isPrimary: resumeCount === 0,
            },
            points: [resumeId],
        });

        await redisClient.del(`ats:draft:${draftId}`);

        return NextResponse.json({ success: true, resumeId });
    } catch (error: unknown) {
        console.error("ATS move-to-dashboard error:", error);
        const message = error instanceof Error ? error.message : "Internal server error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
