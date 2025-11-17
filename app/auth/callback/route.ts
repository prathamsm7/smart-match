import { createServerSupabase } from "@/lib/superbase/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma.js";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/dashboard";

  if (code) {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Error exchanging code for session:", error);
      return NextResponse.redirect(new URL(`/signin?error=${encodeURIComponent(error.message)}`, requestUrl.origin));
    }

    // Ensure user exists in database
    if (data.user) {
      try {
        const existingUser = await prisma.user.findUnique({
          where: { email: data.user.email! },
        });

        if (!existingUser) {
          // Create user in database
          await prisma.user.create({
            data: {
              id: data.user.id,
              email: data.user.email!,
              name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || null,
            },
          });
        }
      } catch (dbError: any) {
        // Log error but don't block auth flow
        console.error("Error syncing user to database:", dbError);
      }
    }

    return NextResponse.redirect(new URL(next, requestUrl.origin));
  }

  return NextResponse.redirect(new URL("/signin", requestUrl.origin));
}

