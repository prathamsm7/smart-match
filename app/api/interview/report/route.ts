import { openaiClient } from "@/lib/clients";
import redisClient from "@/lib/redisClient";
import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const CHAT_KEY_PREFIX = "interview";
const REPORT_KEY_PREFIX = "interview:report";
const REPORT_CACHE_TTL = 7 * 24 * 60 * 60; // 7 days in seconds

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { interviewId } = body || {};

    if (!interviewId) {
      return NextResponse.json(
        { success: false, error: "Missing interviewId." },
        { status: 400 },
      );
    }

    // Get authenticated user and their role
    const { user: dbUser, error } = await authenticateRequest();
    if (error) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const userRole = dbUser.role || "candidate";

    // Verify interview exists and user has access (fetch once, reuse later)
    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        application: {
          include: {
            job: true,
          },
        },
      },
    });

    if (!interview) {
      return NextResponse.json(
        { success: false, error: "Interview not found" },
        { status: 404 },
      );
    }

    // Verify user has access to this interview
    const isOwner = interview.userId === dbUser.id;
    const isRecruiter = dbUser.role === "recruiter" && interview.application.job.postedBy === dbUser.id;

    if (!isOwner && !isRecruiter) {
      return NextResponse.json(
        { success: false, error: "Unauthorized to access this interview" },
        { status: 403 },
      );
    }

    // Check for existing report: Redis cache first (fastest), then database
    const reportCacheKey = `${REPORT_KEY_PREFIX}:${interviewId}`;
    let reportJson: any = null;
    
    // Step 1: Check Redis cache (fastest)
    try {
      const cached = await redisClient.get(reportCacheKey);
      if (cached) {
        // Parse cached report if it's a string
        reportJson = typeof cached === "string" ? JSON.parse(cached) : cached;
        console.log(`✅ Found cached report in Redis for interview ${interviewId}`);
      }
    } catch (error) {
      console.warn("Failed to read from Redis cache:", error);
    }

    // Step 2: If not in cache, check database
    if (!reportJson && interview.report) {
      try {
        const reportData = interview.report;
        // Handle different possible formats
        if (typeof reportData === 'object' && reportData !== null) {
          reportJson = reportData;
          console.log(`✅ Found report in database for interview ${interviewId}`);
          
          // Optionally re-cache in Redis for faster future access
          try {
            await redisClient.set(
              reportCacheKey,
              JSON.stringify(reportJson),
              { ex: REPORT_CACHE_TTL }
            );
            console.log(`✅ Re-cached report in Redis for interview ${interviewId}`);
          } catch (cacheError) {
            console.warn("Failed to re-cache report in Redis:", cacheError);
            // Non-critical, continue
          }
        }
      } catch (error) {
        console.error("Failed to parse report from database:", error);
      }
    }

    // Step 3: If not found in cache or database, generate new report
    if (!reportJson) {
      // Generate new report - try to get transcript from cache first, then from database
      let chat: any[] = [];
      let raw = await redisClient.get(`${CHAT_KEY_PREFIX}:${interviewId}:chat`);
      
      if (raw) {
        // Found in cache
        try {
          const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
          chat = Array.isArray(parsed?.chat)
            ? parsed.chat
            : Array.isArray(parsed)
            ? parsed
            : [];
        } catch (error) {
          console.error("Failed to parse transcript from cache:", error);
          chat = [];
        }
      } else {
        // Not in cache, fetch from database (we already have the interview object)
        if (interview.transcript) {
          // Transcript is stored as JSON in database
          const transcriptData = interview.transcript;
          // Handle different possible formats
          if (Array.isArray(transcriptData)) {
            chat = transcriptData;
          } else if (typeof transcriptData === 'object' && transcriptData !== null) {
            // If it's an object with a 'chat' property
            if (Array.isArray((transcriptData as any).chat)) {
              chat = (transcriptData as any).chat;
            } else {
              // Try to convert object to array format
              chat = [transcriptData];
            }
          }
          console.log(`✅ Fetched transcript from database for interview ${interviewId}`);
        }
      }

      // If still no transcript found, return error
      if (!chat || chat.length === 0) {
        return NextResponse.json(
          { success: false, error: "Transcript not found in cache or database." },
          { status: 404 },
        );
      }

      const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

      if (!apiKey) {
        return NextResponse.json(
          { success: false, error: "Missing Gemini API key for report generation." },
          { status: 500 },
        );
      }

      const transcript = chat
        .map((msg) => `${msg.sender || "system"}: ${msg.text || ""}`)
        .join("\n");

      // Extract candidate profile from application snapshot
      const snapshot = interview.application.snapshot as any;
      const candidateName = interview.user?.name || snapshot?.name || "Unknown";

      const candidateProfile = `
        Name: ${candidateName}
      `.trim();

      const prompt = `
                ROLE:
                You are a strict, objective interview evaluator used for hiring decisions. You are also a technical interviewer and interview report generator.

                TASK:
                Analyze the interview conversation and generate a structured interview report in JSON format.
                Evaluate answer correctness, relevance, technical skills, problem-solving, and communication.
                Do NOT invent information, infer intent, or inflate scores.

                INPUTS:
                - conversationTranscript: ${transcript}
                - candidateProfileDetails: ${candidateProfile}

                GLOBAL RULES:
                - Output valid JSON only (no markdown, no explanations)
                - Use null where data is missing
                - Base all judgments strictly on the transcript
                - Maintain key order exactly as defined
                - Be conservative: when uncertain, choose the lower rating

                ────────────────────────────────
                ANSWER CORRECTNESS & RELEVANCE
                ────────────────────────────────

                - Determine whether each answer directly addresses the question.
                - Off-topic, evasive, or mismatched answers are treated as incorrect.

                Answer classification (internal):
                - correct
                - partially_correct
                - incorrect
                - hallucinated (invented concepts, APIs, tools)
                - no_answer

                Enforcement:
                - Any incorrect or hallucinated answer must reduce related skill ratings, technical score, and overall score.
                - One fundamental error outweighs multiple correct statements.
                - Fluency or confidence never compensates for incorrectness.

                ────────────────────────────────
                TECHNICAL SKILLS ASSESSMENT
                ────────────────────────────────

                - Assess only skills explicitly demonstrated in the conversation.
                - Do not infer skills from title, resume, or experience.
                - Every skill must include transcript-based evidence.

                Proficiency levels:
                - poor: incorrect understanding or repeated errors
                - basic: surface-level understanding
                - intermediate: mostly correct with reasonable depth
                - advanced: deep understanding, trade-offs, edge cases, real-world usage

                Constraints:
                - Any incorrect answer caps the related skill at "basic".
                - Partial correctness caps proficiency at "intermediate".
                - "advanced" requires multiple correct answers with no inaccuracies.

                ────────────────────────────────
                PROBLEM-SOLVING & REASONING
                ────────────────────────────────

                Logical reasoning:
                - poor: incorrect or disorganized logic
                - basic: partial or incomplete reasoning
                - intermediate: mostly correct and structured
                - advanced: clear, step-by-step reasoning with validation

                Rules:
                - Correct reasoning with wrong conclusion → max "basic".
                - Guessing correctly with wrong reasoning → max "basic".
                - Reasoning must align with final answers.

                ────────────────────────────────
                COMMUNICATION EVALUATION
                ────────────────────────────────

                - Clarity: precision of explanation (not fluency)
                - Structure: logical flow (not verbosity)
                - Confidence: consistency and decisiveness (not tone or accent)
                - Clear but incorrect answers must still be penalized.

                ────────────────────────────────
                SCORING RULES
                ────────────────────────────────

                - Scores must be integers between 1 and 10.

                Bands:
                - 1–3: poor / insufficient evidence
                - 4–6: basic / acceptable
                - 7–8: strong
                - 9–10: exceptional (rare; requires overwhelming evidence)

                Constraints:
                - Technical score must align with skill assessments.
                - Overall score must not exceed technical score by more than 1.
                - Multiple incorrect answers on core skills cap:
                - Technical ≤ 5
                - Overall ≤ 6

                ────────────────────────────────
                HIRING RECOMMENDATION
                ────────────────────────────────

                Decision logic:
                - strong_hire: overall ≥ 8 and no critical weaknesses
                - hire: overall ≥ 7 with only minor weaknesses
                - borderline: overall 5–6 or mixed performance
                - no_hire: overall ≤ 4 or major technical gaps

                Automatic disqualifiers:
                - Repeated incorrect answers on fundamentals
                - Hallucinated technical concepts
                - Severe misunderstanding of core job requirements

                ────────────────────────────────
                OUTPUT JSON SCHEMA (STRICT)
                ────────────────────────────────

                {
                "candidateOverview": {
                    "name": string | null,
                    "roleInterviewedFor": string,
                    "experienceLevel": "junior" | "mid" | "senior" | null
                },
                "technicalSkillsAssessment": [
                    {
                    "skill": string,
                    "proficiency": "poor" | "basic" | "intermediate" | "advanced",
                    "evidence": string
                    }
                ],
                "problemSolving": {
                    "logicalReasoning": "poor" | "basic" | "intermediate" | "advanced" | null,
                    "approachToUnknownProblems": string | null,
                    "useOfExamples": "none" | "limited" | "adequate" | "strong" | null
                },
                "communicationSkills": {
                    "clarity": "poor" | "basic" | "intermediate" | "advanced",
                    "structure": "poor" | "basic" | "intermediate" | "advanced",
                    "confidence": "low" | "medium" | "high"
                },
                "strengths": [
                    { "description": string, "evidence": string }
                ],
                "areasForImprovement": [
                    { "description": string, "evidence": string }
                ],
                "scores": {
                    "technical": number,
                    "communication": number,
                    "overall": number
                },
                "hiringRecommendation": {
                    "decision": "strong_hire" | "hire" | "borderline" | "no_hire",
                    "justification": string
                },
                "recruiterSummary": string
                }

                FINAL CHECK:
                - JSON only
                - No trailing commas
                - No extra fields

                `;

      const response = await openaiClient.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: "system",
            content: "You are an expert interviwer and interview report generator. Always follow instructions with exact formatting."
          },
          {
            role: "user",
            content: prompt.trim()
          }
        ],
        temperature: 0.2,
        response_format: { type: "json_object" }
      });

      const report = response.choices[0]?.message?.content?.trim() || '';
      reportJson = JSON.parse(report);

      // Store the newly generated report in database and cache
      try {
        // Store in database first (persistent storage)
        await prisma.interview.update({
          where: { id: interviewId },
          data: {
            report: reportJson as any,
            // Mark interview as completed if it's in progress
            ...(interview.status === "IN_PROGRESS" && {
              status: "COMPLETED",
              completedAt: new Date(),
            }),
          },
        });
        console.log(`✅ Stored report in database for interview ${interviewId}`);

        // Also cache in Redis for faster future access
        try {
          await redisClient.set(
            reportCacheKey,
            JSON.stringify(reportJson),
            { ex: REPORT_CACHE_TTL }
          );
          console.log(`✅ Cached report in Redis for interview ${interviewId} (TTL: ${REPORT_CACHE_TTL}s)`);
        } catch (cacheError) {
          console.warn("Failed to cache report in Redis:", cacheError);
          // Non-critical, continue
        }
      } catch (dbError: any) {
        console.error("Failed to store report in database:", dbError);
        // Continue to return the report even if DB storage fails
      }
    } else {
      // Report was found in cache or database, but ensure interview status is updated if needed
      if (interview.status === "IN_PROGRESS") {
        try {
          await prisma.interview.update({
            where: { id: interviewId },
            data: {
              status: "COMPLETED",
              completedAt: new Date(),
            },
          });
          console.log(`✅ Updated interview status to COMPLETED for interview ${interviewId}`);
        } catch (error) {
          console.warn("Failed to update interview status:", error);
          // Non-critical, continue
        }
      }
    }

    // Filter report data based on user role
    if (userRole === "candidate") {
      // Remove hiring recommendation and recruiter summary for candidates
      const { hiringRecommendation, recruiterSummary, ...candidateReport } = reportJson;
      return NextResponse.json({ 
        success: true, 
        report: candidateReport,
        role: userRole 
      });
    }

    // Return full report for recruiters
    return NextResponse.json({ 
      success: true, 
      report: reportJson,
      role: userRole 
    });
  } catch (error: any) {
    console.error("Failed to generate interview report:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate report." },
      { status: 500 },
    );
  }
}