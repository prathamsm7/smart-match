"use client";

import { AlertCircle } from "lucide-react";

interface ErrorDisplayProps {
  message: string;
}

export function ErrorDisplay({ message }: ErrorDisplayProps) {
  return (
    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2">
      <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
      <p className="text-red-400 text-sm">{message}</p>
    </div>
  );
}

