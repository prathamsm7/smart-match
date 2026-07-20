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

      // Ignore auth churn while on interview — prevents remount / accidental hangup.
      if (
        event === "SIGNED_IN" &&
        window.location.pathname.startsWith("/interview")
      ) {
        return;
      }

      // Handle sign-in and sign-up (both trigger SIGNED_IN event)
      if (event === "SIGNED_IN") {
        const currentPath = window.location.pathname;
        const searchParams = new URLSearchParams(window.location.search);
        const redirectTo = searchParams.get("redirect");

        // Only refresh server components when landing from sign-in — not on every
        // cross-tab SIGNED_IN while the user is mid-interview (that remounts the
        // client tree and hangs up Vapi as customer-ended-call).
        if (currentPath === "/signin") {
          router.refresh();
          const target = redirectTo || "/dashboard";
          if (target !== currentPath) {
            window.location.href = target;
          }
        } else if (redirectTo && redirectTo !== currentPath) {
          window.location.href = redirectTo;
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

