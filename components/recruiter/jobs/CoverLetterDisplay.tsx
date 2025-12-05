"use client";

import { FileText, Sparkles, Edit2 } from "lucide-react";

interface CoverLetterDisplayProps {
  coverLetter: {
    id: string;
    text: string;
    isEdited: boolean;
  };
}

export function CoverLetterDisplay({ coverLetter }: CoverLetterDisplayProps) {
  return (
    <div className="bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-2xl p-8 border border-blue-500/20 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-32 -mt-32" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl -ml-24 -mb-24" />
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                Cover Letter
                <Sparkles className="w-5 h-5 text-yellow-400" />
              </h3>
              {coverLetter.isEdited && (
                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                  <Edit2 className="w-3 h-3" />
                  Customized by candidate
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Cover Letter Content */}
        <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <div className="prose prose-invert max-w-none">
            <pre className="text-gray-200 whitespace-pre-wrap font-sans leading-relaxed text-[15px]">
              {coverLetter.text}
            </pre>
          </div>
        </div>

        {/* Footer decoration */}
        <div className="mt-6 flex items-center gap-2 text-xs text-gray-500">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
          <span>AI-Generated Cover Letter</span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
        </div>
      </div>
    </div>
  );
}

