'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Upload, FileText, Sparkles } from 'lucide-react';
import { useSupabaseAuthSync } from '@/hooks/useSupabaseAuth';
import { useRequireAuth } from '@/hooks/useRequireAuth';

export default function UploadPage() {
  const [resumeText, setResumeText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Use the hook for cross-tab auth synchronization (handles SIGNED_OUT)
  useSupabaseAuthSync();
  
  // Require authentication - redirects to signin if not authenticated
  const { loading: authLoading } = useRequireAuth();

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-300">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let formData = new FormData();
      
      if (file) {
        formData.append('file', file);
      }
      if (resumeText) {
        formData.append('resumeText', resumeText);
      }

      const res = await fetch('/api/resume/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload resume');
      }

      // Redirect to resume view page
      router.push(`/resume/${data.resumeId}`);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/"
              className="inline-flex items-center space-x-2 text-gray-400 hover:text-blue-400 transition mb-6"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Home</span>
            </Link>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl mb-4">
                <Sparkles className="w-8 h-8" />
              </div>
              <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-white via-blue-200 to-cyan-200 bg-clip-text text-transparent">
                Upload Your Resume
              </h1>
              <p className="text-xl text-gray-300">
                Get AI-powered job matches in seconds
              </p>
            </div>
          </div>

          {/* Main Card */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl shadow-xl p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Resume Text Input */}
              <div>
                <label className="flex items-center space-x-2 text-sm font-semibold text-gray-300 mb-2">
                  <FileText className="w-4 h-4" />
                  <span>Paste Resume Text</span>
                </label>
                <textarea
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder="Paste your resume text here..."
                  rows={12}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-500 resize-none"
                />
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white/5 text-gray-400">
                    OR
                  </span>
                </div>
              </div>

              {/* File Upload */}
              <div>
                <label className="flex items-center space-x-2 text-sm font-semibold text-gray-300 mb-2">
                  <Upload className="w-4 h-4" />
                  <span>Upload PDF Resume</span>
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-white/10 border-dashed rounded-lg hover:border-blue-500/50 transition-colors bg-white/5">
                  <div className="space-y-1 text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-500"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                      aria-hidden="true"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-4h12m-6-4v12m0 0l-4-4m4 4l4-4"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div className="flex text-sm text-gray-400">
                      <label className="relative cursor-pointer rounded-md font-medium text-blue-400 hover:text-blue-300">
                        <span>Upload a file</span>
                        <input
                          type="file"
                          accept="application/pdf"
                          className="sr-only"
                          onChange={(e) => setFile(e.target.files?.[0] || null)}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">PDF up to 10MB</p>
                    {file && (
                      <p className="text-sm text-blue-400 mt-2">
                        Selected: {file.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
                  <p className="text-sm text-red-200">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading || (!resumeText && !file)}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-all transform hover:scale-105 hover:shadow-lg hover:shadow-blue-500/50"
                >
                  {loading ? 'Processing...' : 'Create Smart Resume'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    setResumeText('');
                    setError(null);
                  }}
                  className="px-6 py-3 border border-white/10 text-gray-300 font-semibold rounded-lg hover:bg-white/10 transition-colors"
                >
                  Clear
                </button>
              </div>
            </form>
          </div>

          {/* Features */}
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
              <div className="text-3xl mb-3">🤖</div>
              <h3 className="font-semibold text-white mb-2">AI-Powered Parsing</h3>
              <p className="text-sm text-gray-400">
                Automatically extract and structure your resume data
              </p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
              <div className="text-3xl mb-3">🎯</div>
              <h3 className="font-semibold text-white mb-2">Smart Job Matching</h3>
              <p className="text-sm text-gray-400">
                Find the best job matches based on your skills and experience
              </p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
              <div className="text-3xl mb-3">📊</div>
              <h3 className="font-semibold text-white mb-2">Match Analysis</h3>
              <p className="text-sm text-gray-400">
                Get detailed insights on why jobs match and how to improve
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

