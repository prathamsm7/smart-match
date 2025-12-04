"use client";

import { useCoverLetter } from "./cover-letter/useCoverLetter";
import { CoverLetterCheckbox } from "./cover-letter/CoverLetterCheckbox";
import { CoverLetterHeader } from "./cover-letter/CoverLetterHeader";
import { CoverLetterViewer } from "./cover-letter/CoverLetterViewer";
import { CoverLetterEditor } from "./cover-letter/CoverLetterEditor";
import { LoadingState } from "./cover-letter/LoadingState";
import { ErrorDisplay } from "./cover-letter/ErrorDisplay";

interface CoverLetterSectionProps {
  jobId: string;
  resumeId: string;
  jobTitle: string;
  company: string;
  description: string;
  requirements?: any;
  onCoverLetterGenerated: (coverLetterId: string, finalText: string) => void;
}

export function CoverLetterSection({
  jobId,
  resumeId,
  jobTitle,
  company,
  description,
  requirements,
  onCoverLetterGenerated,
}: CoverLetterSectionProps) {
  const {
    includeCoverLetter,
    loading,
    generating,
    regenerating,
    editing,
    coverLetter,
    editedText,
    error,
    setEditing,
    setEditedText,
    handleCheckboxChange,
    handleRegenerate,
    handleSaveEdit,
    handleCancelEdit,
  } = useCoverLetter({
    jobId,
    resumeId,
    jobTitle,
    company,
    description,
    requirements,
    onCoverLetterGenerated,
  });

  if (!includeCoverLetter) {
    return (
      <CoverLetterCheckbox
        checked={includeCoverLetter}
        loading={loading}
        onChange={handleCheckboxChange}
      />
    );
  }

  return (
    <div className="mb-6 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-6 border border-white/10">
      <CoverLetterHeader
        regenerationCount={coverLetter?.regenerationCount || 0}
        canRegenerate={coverLetter?.canRegenerate ?? true}
        isEditing={editing}
        isRegenerating={regenerating}
        onEdit={() => setEditing(true)}
        onRegenerate={handleRegenerate}
        onSave={handleSaveEdit}
        onCancel={handleCancelEdit}
      />

      {error && <ErrorDisplay message={error} />}

      {loading && !coverLetter && (
        <LoadingState message="Checking for existing cover letter..." />
      )}

      {generating && !coverLetter && (
        <LoadingState message="Generating personalized cover letter..." />
      )}

      {coverLetter && (
        <div className="space-y-4">
          {editing ? (
            <CoverLetterEditor value={editedText} onChange={setEditedText} />
          ) : (
            <CoverLetterViewer text={editedText || coverLetter.generatedText} />
          )}

          {!coverLetter.canRegenerate && (
            <p className="text-xs text-gray-500 text-center">
              Maximum regeneration limit reached (5 total attempts)
            </p>
          )}
        </div>
      )}

      <label className="flex items-center gap-2 mt-4 cursor-pointer">
        <input
          type="checkbox"
          checked={includeCoverLetter}
          onChange={(e) => handleCheckboxChange(e.target.checked)}
          className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500"
        />
        <span className="text-sm text-gray-400">Include this cover letter with application</span>
      </label>
    </div>
  );
}
