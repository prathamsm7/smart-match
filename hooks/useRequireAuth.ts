"use client";

import { useEffect, useState } from "react";
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

