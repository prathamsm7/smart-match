"use client";

interface CoverLetterViewerProps {
  text: string;
}

export function CoverLetterViewer({ text }: CoverLetterViewerProps) {
  return (
    <div className="p-4 bg-slate-900/50 border border-slate-700 rounded-lg">
      <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">{text}</p>
    </div>
  );
}

