import { NextRequest, NextResponse } from "next/server";
import redisClient from "@/lib/redisClient";
import { qdrantClient } from "@/lib/clients";
import { prisma } from "@/lib/prisma";
import { runJobTargetedATSAnalysis } from "@/lib/atsHelper";
import type { Resume } from "@/types";

const CACHE_TTL_SECONDS = 60 * 60; // 1h

export async function POST(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string; jobId: string }> }
) {
    try {
        const { id: resumeId, jobId } = await params;

        if (!resumeId || !jobId) {
            return NextResponse.json({ error: "Resume ID and Job ID are required" }, { status: 400 });
        }

        // Basic rate limit: 5 job-targeted analyses per resume per hour
        const rateKey = `ats:rate-job:${resumeId}`;
        const current = await redisClient.incr(rateKey);
        if (current === 1) {
            await redisClient.expire(rateKey, 60 * 60); // 1h
        }
        if (current > 5) {
            return NextResponse.json({ error: "Too many optimization requests. Please try again in a bit." }, { status: 429 });
        }

        // 1) Cache check
        const cacheKey = `ats:job:${resumeId}:${jobId}`;
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
            resumeData = result[0].payload as unknown as Resume;
        }

        // 3) Fetch job data from Postgres
        const job = await prisma.job.findUnique({
            where: { id: jobId },
        });

        if (!job) {
            return NextResponse.json({ error: "Job not found" }, { status: 404 });
        }

        // 4) Run job-targeted ATS analysis
        const analysis = await runJobTargetedATSAnalysis(resumeData, job);

        // 5) Cache result for 1 hour
        await redisClient.set(cacheKey, JSON.stringify(analysis), { ex: CACHE_TTL_SECONDS });

        return NextResponse.json(analysis);
    } catch (error: any) {
        console.error("Error in job-targeted ATS analysis:", error);
        return NextResponse.json(
            { error: error?.message || "Internal server error" },
            { status: 500 }
        );
    }
}
