"use client";

import { useSupabaseAuthSync } from "@/hooks/useSupabaseAuth";
import { useRequireAuth } from "@/hooks/useRequireAuth";

/**
 * Protected Layout - Automatically handles authentication for all child routes
 * 
 * This layout wraps all protected routes and ensures users are authenticated.
 * If a user is not authenticated, they are automatically redirected to signin.
 * 
 * Pages inside this layout can still use useRequireAuth() if they need direct
 * access to the user object.
 */
export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Cross-tab auth synchronization
  useSupabaseAuthSync();
  
  // Require authentication - redirects to signin if not authenticated
  const { loading } = useRequireAuth();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-300">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // User is authenticated, render children
  return <>{children}</>;
}

