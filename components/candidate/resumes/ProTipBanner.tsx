"use client";

import { Sparkles } from "lucide-react";

export function ProTipBanner() {
  return (
    <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-xl p-4 border border-yellow-500/20 flex items-start space-x-3">
      <Sparkles className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
      <p className="text-sm text-gray-300">
        <span className="font-semibold text-yellow-400">Pro Tip:</span> Set a primary resume that will be used by default for job applications. You can customize resumes for specific job types!
      </p>
    </div>
  );
}
