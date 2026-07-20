"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/superbase/client";

/**
 * Hook to require authentication for a page or layout.
 * Redirects to signin if user is not authenticated.
 * 
 * Can be used in:
 * - Layouts: For automatic protection of all child routes
 * - Pages: When you need direct access to user data
 * 
 * @returns {Object} { user, loading } - The authenticated user and loading state
 * 
 * @example
 * ```tsx
 * // In a layout (app/(protected)/layout.tsx)
 * export default function ProtectedLayout({ children }) {
 *   const { loading } = useRequireAuth();
 *   if (loading) return <LoadingSpinner />;
 *   return <>{children}</>;
 * }
 * 
 * // In a page (when you need user data)
 * export default function DashboardPage() {
 *   const { user, loading } = useRequireAuth();
 *   if (loading) return <LoadingSpinner />;
 *   return <div>Welcome {user.email}</div>;
 * }
 * ```
 */
export function useRequireAuth() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const hasVerifiedRef = useRef(false);

  useEffect(() => {
    async function checkAuth() {
      try {
        const supabase = createBrowserSupabase();
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
          const currentPath = window.location.pathname;
          router.push(`/signin?redirect=${encodeURIComponent(currentPath)}`);
          return;
        }

        setUser(user);
        hasVerifiedRef.current = true;
      } catch (error) {
        console.error("Error checking auth:", error);
        const currentPath = window.location.pathname;
        router.push(`/signin?redirect=${encodeURIComponent(currentPath)}`);
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, [router]);

  // After first successful auth, never block children again (avoids unmounting
  // mid-interview if the layout re-renders from auth events).
  const showLoading = loading && !hasVerifiedRef.current;

  return { user, loading: showLoading };
}

