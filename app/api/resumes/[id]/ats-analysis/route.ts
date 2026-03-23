import { NextRequest, NextResponse } from "next/server";
import redisClient from "@/lib/redisClient";
import { qdrantClient } from "@/lib/clients";
import { runATSAnalysis } from "@/lib/atsHelper";
import type { Resume } from "@/types";

const CACHE_TTL_SECONDS = 24 * 60 * 60; // 24h

export async function POST(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: resumeId } = await params;

        if (!resumeId) {
            return NextResponse.json({ error: "Resume ID is required" }, { status: 400 });
        }

        // Basic rate limit: 5 analyses per resume per hour
        const rateKey = `ats:rate:${resumeId}`;
        const current = await redisClient.incr(rateKey);
        if (current === 1) {
            await redisClient.expire(rateKey, 60 * 60); // 1h
        }
        if (current > 5) {
            return NextResponse.json({ error: "Too many ATS analyses. Please try again in a bit." }, { status: 429 });
        }

        // 1) Check cached ATS analysis
        const cacheKey = `ats:general:${resumeId}`;
        const cached = await redisClient.get(cacheKey);
        if (cached) {
            const parsed = typeof cached === "string" ? JSON.parse(cached) : cached;
            return NextResponse.json(parsed);
        }

        // 2) Fetch resume data (Redis fast path, Qdrant fallback)
        let resumeData: Resume | null = null;
        try {
            const resumeCache = await redisClient.get(`resumeData:${resumeId}`);
            if (resumeCache) {
                if (typeof resumeCache === "string") {
                    const parsed = JSON.parse(resumeCache);
                    resumeData = parsed.resumeData ?? parsed;
                } else if (typeof resumeCache === "object" && resumeCache) {
                    resumeData = (resumeCache as any).resumeData ?? (resumeCache as any);
                }
            }
        } catch (err) {
            console.warn("Redis cache miss for resume, falling back to Qdrant", err);
        }

        if (!resumeData) {
            const result = await qdrantClient.retrieve("resumes", {
                ids: [resumeId],
                with_payload: true,
            });
            if (!result || result.length === 0) {
                return NextResponse.json({ error: "Resume not found" }, { status: 404 });
            }
            resumeData = result[0].payload as Resume;
        }

        // 3) Run ATS analysis (single LLM call) and post-process
        const analysis = await runATSAnalysis(resumeData);

        // 4) Cache the result for 24h
        await redisClient.set(cacheKey, JSON.stringify(analysis), { ex: CACHE_TTL_SECONDS });

        return NextResponse.json(analysis);
    } catch (error: any) {
        console.error("Error in ATS analysis:", error);
        return NextResponse.json(
            { error: error?.message || "Internal server error" },
            { status: 500 }
        );
    }
}
