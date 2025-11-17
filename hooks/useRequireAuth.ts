"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/superbase/client";

/**
 * Hook to require authentication for a page.
 * Redirects to signin if user is not authenticated.
 * 
 * @returns {Object} { user, loading } - The authenticated user and loading state
 * 
 * @example
 * ```tsx
 * export default function ProtectedPage() {
 *   const { user, loading } = useRequireAuth();
 *   
 *   if (loading) return <LoadingSpinner />;
 *   
 *   return <div>Protected content for {user.email}</div>;
 * }
 * ```
 */
export function useRequireAuth() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const supabase = createBrowserSupabase();
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
          // User is not authenticated, redirect to signin
          // Preserve the current path for redirect after login
          const currentPath = window.location.pathname;
          router.push(`/signin?redirect=${encodeURIComponent(currentPath)}`);
          return;
        }

        setUser(user);
      } catch (error) {
        console.error("Error checking auth:", error);
        // On error, redirect to signin
        const currentPath = window.location.pathname;
        router.push(`/signin?redirect=${encodeURIComponent(currentPath)}`);
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, [router]);

  return { user, loading };
}

