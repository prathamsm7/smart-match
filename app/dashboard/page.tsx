"use client";
import { createBrowserSupabase } from "@/lib/superbase/client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useSupabaseAuthSync } from "@/hooks/useSupabaseAuth";

export default function DashboardPage() {
  const supabase = createBrowserSupabase();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Use the hook for cross-tab auth synchronization (handles SIGNED_OUT)
  useSupabaseAuthSync();

  useEffect(() => {
    async function loadUser() {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error || !user) {
          // User is not authenticated, redirect to signin
          router.push("/signin");
          return;
        }

        setUser(user);
      } catch (error) {
        console.error("Error loading user:", error);
        router.push("/signin");
      } finally {
        setLoading(false);
      }
    }
    
    loadUser();
  }, [router, supabase]);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("Error signing out:", error);
        alert("Failed to sign out. Please try again.");
        setSigningOut(false);
        return;
      }

      // The useSupabaseAuthSync hook will handle the redirect on SIGNED_OUT event
      // The hook uses window.location.href for immediate redirect
    } catch (error) {
      console.error("Error signing out:", error);
      alert("Failed to sign out. Please try again.");
      setSigningOut(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen p-8 bg-linear-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto">
        {/* Header with Sign Out button */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
            <p className="text-gray-600">Welcome back, {user.email}!</p>
          </div>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <LogOut className="w-5 h-5" />
            <span>{signingOut ? "Signing Out..." : "Sign Out"}</span>
          </button>
        </div>

        {/* Dashboard content */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-gray-500">Your dashboard content goes here...</p>
        </div>
      </div>
    </div>
  );
}
