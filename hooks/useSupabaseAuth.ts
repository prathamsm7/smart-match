"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/superbase/client";

/**
 * Hook for cross-tab authentication synchronization.
 * Handles:
 * - SIGNED_IN: Redirects to dashboard (works for both sign-in and sign-up)
 * - SIGNED_OUT: Redirects to signin page
 * - TOKEN_REFRESHED: Also redirects to dashboard if user is authenticated
 */
export function useSupabaseAuthSync() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createBrowserSupabase();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("🔄 Auth event received:", event);

      // Handle sign-in and sign-up (both trigger SIGNED_IN event)
      if (event === "SIGNED_IN") {
        router.refresh(); // refresh server components
        // Use window.location for immediate redirect
        if (window.location.pathname !== "/dashboard") {
          window.location.href = "/dashboard";
        }
      }

      // Handle sign-out
      if (event === "SIGNED_OUT") {
        router.refresh();
        // Use window.location for immediate redirect
        if (window.location.pathname !== "/signin") {
          window.location.href = "/signin";
        }
      }

      // Handle token refresh (user is still authenticated)
      if (event === "TOKEN_REFRESHED" && session?.user) {
        // If on signin page and token is refreshed, redirect to dashboard
        if (window.location.pathname === "/signin") {
          router.refresh();
          window.location.href = "/dashboard";
        }
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);
}

