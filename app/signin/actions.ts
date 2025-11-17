"use server";

import { createServerSupabase } from "@/lib/superbase/server";
import { prisma } from "@/lib/prisma.js";

export async function signInWithEmail(email: string, password: string) {
  try {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      throw new Error(error.message);
    }

    // Ensure user exists in database (in case they signed up via OAuth)
    if (data.user) {
      await ensureUserInDatabase(data.user);
    }
    
    // Return success - client will handle redirect
    return { success: true };
  } catch (error: any) {
    throw new Error(error.message || "Failed to sign in");
  }
}

export async function signUpWithEmail(email: string, password: string, fullName?: string) {
  try {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/auth/callback`,
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    // Create user in database if signup was successful
    // Email confirmation is disabled, so user is immediately signed in
    if (data.user) {
      await ensureUserInDatabase(data.user, fullName);
    }

    // Return success - client will handle redirect via useSupabaseAuthSync hook
    return { success: true };
  } catch (error: any) {
    throw new Error(error.message || "Failed to sign up");
  }
}

// Helper function to ensure user exists in database
async function ensureUserInDatabase(supabaseUser: any, fullName?: string) {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: supabaseUser.email },
    });

    if (!existingUser) {
      // Create user in database
      await prisma.user.create({
        data: {
          id: supabaseUser.id,
          email: supabaseUser.email,
          name: fullName || supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || null,
        },
      });
    } else {
      // Update name if provided and not already set
      if (fullName && !existingUser.name) {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { name: fullName },
        });
      }
    }
  } catch (error: any) {
    // Log error but don't throw - auth is more important than DB sync
    console.error("Error syncing user to database:", error);
  }
}

export async function signInWithProvider(provider: "google" | "github") {
  try {
    const supabase = await createServerSupabase();

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/auth/callback`,
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data?.url) {
      throw new Error("Failed to get OAuth URL");
    }

    return data.url;
  } catch (error: any) {
    throw new Error(error.message || "Failed to sign in with provider");
  }
}
