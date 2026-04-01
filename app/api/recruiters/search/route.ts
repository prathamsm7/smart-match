import { NextRequest, NextResponse } from "next/server";
import { rewriteQuery, searchCandidates } from "@/lib/recruiterSearchHelper";

/**
 * POST /api/recruiters/search
 * Smart Candidate Search using Retrieve & Rank
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query } = body;

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Search query is required" },
        { status: 400 },
      );
    }

    console.log(`🚀 Recruiter Search Request: "${query}"`);

    const refineQuery = await rewriteQuery(query);

    // Perform the smart search — returns all results, frontend paginates
    const { results: candidates, total } = await searchCandidates(refineQuery);

    return NextResponse.json({
      success: true,
      count: candidates.length,
      total,
      candidates,
      rewrittenQuery: refineQuery,
    });
  } catch (error: any) {
    console.error("❌ Search Endpoint Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error during search" },
      { status: 500 },
    );
  }
}
