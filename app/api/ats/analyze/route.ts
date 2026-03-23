import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import redisClient from "@/lib/redisClient";
import { extractTextFromPDFBuffer } from "@/lib/resumeHelper";
import { extractResumeDataForATS, runATSAnalysis } from "@/lib/atsHelper";

const DRAFT_TTL_SECONDS = 24 * 60 * 60; // 24h

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File | null;
        const resumeTextInput = formData.get("resumeText") as string | null;

        if (!file && !resumeTextInput) {
            return NextResponse.json({ error: "Either file or resume text is required" }, { status: 400 });
        }

        let resumeText = resumeTextInput || "";
        let fileName = "resume.txt";
        if (file) {
            fileName = file.name;
            const buffer = Buffer.from(await file.arrayBuffer());
            resumeText = await extractTextFromPDFBuffer(buffer);
        }

        const resumeData = await extractResumeDataForATS(resumeText);
        const analysis = await runATSAnalysis(resumeData);

        const draftId = crypto.randomUUID();
        await redisClient.set(
            `ats:draft:${draftId}`,
            JSON.stringify({ resumeText, resumeData, analysis, fileName }),
            { ex: DRAFT_TTL_SECONDS }
        );

        return NextResponse.json({ draftId, analysis, resumeData, fileName });
    } catch (error: any) {
        console.error("ATS analyze error:", error);
        return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
    }
}
