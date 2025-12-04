"use client";

interface CoverLetterEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function CoverLetterEditor({ value, onChange }: CoverLetterEditorProps) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-64 p-4 bg-slate-900/50 border border-slate-700 rounded-lg text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
      placeholder="Edit your cover letter..."
    />
  );
}

