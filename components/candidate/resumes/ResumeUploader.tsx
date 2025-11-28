"use client";

import { Upload } from "lucide-react";
import type { ChangeEvent, DragEvent, FormEvent } from "react";

interface ResumeUploaderProps {
  file: File | null;
  uploading: boolean;
  uploadError: string | null;
  isDragging: boolean;
  canUpload: boolean;
  onSubmit: () => void;
  onFileSelect: (file: File) => void;
  onDragOver: (event: DragEvent) => void;
  onDragLeave: (event: DragEvent) => void;
  onDrop: (event: DragEvent) => void;
}

export function ResumeUploader({
  file,
  uploading,
  uploadError,
  isDragging,
  canUpload,
  onSubmit,
  onFileSelect,
  onDragOver,
  onDragLeave,
  onDrop,
}: ResumeUploaderProps) {
  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSubmit();
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      onFileSelect(selectedFile);
    }
  }

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-2xl p-8 border-2 border-dashed transition group ${
        isDragging ? "border-blue-500 border-solid bg-blue-500/20" : "border-blue-500/30 hover:border-blue-500/50"
      }`}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="text-center">
          <div
            className={`w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition shadow-lg shadow-blue-500/50 ${
              uploading ? "animate-pulse" : ""
            }`}
          >
            {uploading ? (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            ) : (
              <Upload className="w-8 h-8" />
            )}
          </div>
          <h3 className="text-xl font-bold mb-2">{uploading ? "Uploading Resume..." : "Upload a New Resume"}</h3>
          <p className="text-gray-400 mb-4">Drag and drop your resume here or click to browse • Max 5 resumes</p>

          <div className="mb-4">
            <label className="relative cursor-pointer">
              <input type="file" accept="application/pdf" className="sr-only" onChange={handleFileChange} disabled={!canUpload || uploading} />
              <span className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed">
                {file ? "Change File" : "Select PDF File"}
              </span>
            </label>
            {file && (
              <p className="mt-2 text-sm text-blue-400">
                Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          <div className="flex items-center justify-center gap-4 text-sm text-gray-400">
            <span>Supported formats: PDF</span>
            <span>•</span>
            <span>Max size: 10MB</span>
          </div>
        </div>

        {uploadError && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
            <p className="text-sm text-red-200">{uploadError}</p>
          </div>
        )}

        <div className="flex justify-center">
          <button
            type="submit"
            disabled={!file || uploading || !canUpload}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all transform hover:scale-105 hover:shadow-lg hover:shadow-blue-500/50 disabled:transform-none"
          >
            {uploading ? "Processing..." : "Upload Resume"}
          </button>
        </div>
      </form>
    </div>
  );
}
