/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect } from "react";
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Rocket,
  Github,
  Chrome,
  Briefcase,
} from "lucide-react";
import {
  signInWithEmail,
  signUpWithEmail,
  signInWithProvider,
} from "./actions";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/superbase/client";
import { useSupabaseAuthSync } from "@/hooks/useSupabaseAuth";

export default function AuthPage() {
  const [isSignIn, setIsSignIn] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  // Separate state for sign-in and sign-up so they don't share values
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [signUpFullName, setSignUpFullName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const router = useRouter();

  // Use the hook for cross-tab auth synchronization
  useSupabaseAuthSync();

  // Check if user is already authenticated on initial load
  useEffect(() => {
    async function checkAuth() {
      try {
        const supabase = createBrowserSupabase();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          router.push("/dashboard");
          router.refresh();
        }
      } catch (error) {
        // User is not authenticated, continue showing signin page
      } finally {
        setCheckingAuth(false);
      }
    }
    
    checkAuth();
  }, [router]);

  async function handleEmailPasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isSignIn) {
        await signInWithEmail(signInEmail, signInPassword);
        // The useSupabaseAuthSync hook will handle the redirect on SIGNED_IN event
        // No need to manually redirect - let the hook handle it
      } else {
        await signUpWithEmail(signUpEmail, signUpPassword, signUpFullName);
        // The useSupabaseAuthSync hook will handle the redirect on SIGNED_IN event
        // No need to manually redirect - let the hook handle it
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
      setLoading(false);
    }
    // Note: Don't set loading to false if redirect is happening (hook will handle it)
    // Only set it to false if there's an error or email confirmation is required
  }

  async function handleProviderLogin(provider: "google" | "github") {
    setError(null);
    setLoading(true);
    try {
      const url = await signInWithProvider(provider);
      if (url) {
        window.location.href = url;
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  // Show loading state while checking authentication
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center p-4">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center relative z-10">
        {/* Left Side - Branding */}
        <div className="hidden lg:block space-y-8">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
              <Rocket className="w-7 h-7" />
            </div>
            <span className="text-3xl font-bold bg-linear-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              SmartMatch
            </span>
          </div>

          <div className="space-y-4">
            <h1 className="text-5xl font-bold leading-tight">
              Your Dream Job
              <br />
              <span className="bg-linear-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Awaits You
              </span>
            </h1>
            <p className="text-gray-400 text-lg">
              Join thousands of professionals who found their perfect career
              match using AI-powered technology.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { icon: <Briefcase className="w-5 h-5" />, text: "50,000+ Job Matches" },
              { icon: <User className="w-5 h-5" />, text: "15,000+ Happy Users" },
              { icon: <Rocket className="w-5 h-5" />, text: "98% Success Rate" },
            ].map((item, index) => (
              <div
                key={index}
                className="flex items-center space-x-3 text-gray-300"
              >
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center text-blue-400">
                  {item.icon}
                </div>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side - Auth Form */}
        <div className="w-full">
          <div className="bg-linear-to-br from-slate-800/50 to-slate-900/50 rounded-3xl p-8 border border-white/10 backdrop-blur-xl shadow-2xl">
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center justify-center space-x-2 mb-8">
              <Rocket className="w-8 h-8 text-blue-400" />
              <span className="text-2xl font-bold bg-linear-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                SmartMatch
              </span>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-8 bg-slate-800/50 rounded-xl p-1">
              <button
                type="button"
                onClick={() => setIsSignIn(true)}
                className={`flex-1 py-3 rounded-lg font-semibold transition ${
                  isSignIn
                    ? "bg-linear-to-r from-blue-600 to-cyan-600 text-white shadow-lg"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setIsSignIn(false)}
                className={`flex-1 py-3 rounded-lg font-semibold transition ${
                  !isSignIn
                    ? "bg-linear-to-r from-blue-600 to-cyan-600 text-white shadow-lg"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Form Header */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-2">
                {isSignIn ? "Welcome Back!" : "Create Account"}
              </h2>
              <p className="text-gray-400">
                {isSignIn
                  ? "Sign in to continue your job search journey"
                  : "Start your journey to find your dream job"}
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            )}

            {/* Social Login */}
            <div className="space-y-3 mb-6">
              <button
                type="button"
                onClick={() => handleProviderLogin("google")}
                className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-semibold transition flex items-center justify-center space-x-3"
                disabled={loading}
              >
                <Chrome className="w-5 h-5" />
                <span>Continue with Google</span>
              </button>
              <button
                type="button"
                onClick={() => handleProviderLogin("github")}
                className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-semibold transition flex items-center justify-center space-x-3"
                disabled={loading}
              >
                <Github className="w-5 h-5" />
                <span>Continue with GitHub</span>
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-gray-400 text-sm">or</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Form */}
            <form className="space-y-4" onSubmit={handleEmailPasswordSubmit}>
              {!isSignIn && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="John Doe"
                      value={signUpFullName}
                      onChange={(e) => setSignUpFullName(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="email"
                    placeholder="you@example.com"
                    value={isSignIn ? signInEmail : signUpEmail}
                    onChange={(e) =>
                      isSignIn
                        ? setSignInEmail(e.target.value)
                        : setSignUpEmail(e.target.value)
                    }
                    className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl focus:outline-none focus:border-blue-500 transition"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={isSignIn ? signInPassword : signUpPassword}
                    onChange={(e) =>
                      isSignIn
                        ? setSignInPassword(e.target.value)
                        : setSignUpPassword(e.target.value)
                    }
                    className="w-full pl-12 pr-12 py-3 bg-slate-800/50 border border-white/10 rounded-xl focus:outline-none focus:border-blue-500 transition"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {isSignIn && (
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded bg-slate-800 border-white/10"
                    />
                    <span className="text-gray-400">Remember me</span>
                  </label>
                  <button
                    type="button"
                    className="text-blue-400 hover:text-blue-300 transition"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {!isSignIn && (
                <label className="flex items-start space-x-2 cursor-pointer text-sm">
        <input
                    type="checkbox"
                    className="w-4 h-4 rounded bg-slate-800 border-white/10 mt-0.5"
                  />
                  <span className="text-gray-400">
                    I agree to the{" "}
                    <button
                      type="button"
                      className="text-blue-400 hover:text-blue-300"
                    >
                      Terms of Service
                    </button>{" "}
                    and{" "}
                    <button
                      type="button"
                      className="text-blue-400 hover:text-blue-300"
                    >
                      Privacy Policy
                    </button>
                  </span>
                </label>
              )}

        <button
          type="submit"
                disabled={loading}
                className="w-full py-3 bg-linear-to-r from-blue-600 to-cyan-600 rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition transform hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading
                  ? isSignIn
                    ? "Signing In..."
                    : "Creating Account..."
                  : isSignIn
                  ? "Sign In"
                  : "Create Account"}
        </button>
      </form>

            {/* Footer */}
            <p className="text-center text-gray-400 text-sm mt-6">
              {isSignIn ? "Don't have an account? " : "Already have an account? "}
              <button
                type="button"
                onClick={() => setIsSignIn(!isSignIn)}
                className="text-blue-400 hover:text-blue-300 font-semibold transition"
              >
                {isSignIn ? "Sign Up" : "Sign In"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
