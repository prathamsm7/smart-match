"use client";

import { Check } from "lucide-react";

interface ResumeLimitBannerProps {
  visible: boolean;
}

export function ResumeLimitBanner({ visible }: ResumeLimitBannerProps) {
  if (!visible) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-8 border border-white/10 backdrop-blur-sm text-center">
      <div className="w-16 h-16 bg-gradient-to-br from-gray-500 to-gray-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Check className="w-8 h-8" />
      </div>
      <h3 className="text-xl font-bold mb-2">Maximum Resumes Reached</h3>
      <p className="text-gray-400">
        You've reached the maximum limit of 5 resumes. Delete an existing resume to upload a new one.
      </p>
    </div>
  );
}
