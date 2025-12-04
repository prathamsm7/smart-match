"use client";

import { Sparkles } from "lucide-react";

interface LoadingStateProps {
  message: string;
}

export function LoadingState({ message }: LoadingStateProps) {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="text-center">
        <Sparkles className="w-8 h-8 text-blue-400 animate-pulse mx-auto mb-2" />
        <p className="text-gray-400">{message}</p>
      </div>
    </div>
  );
}

