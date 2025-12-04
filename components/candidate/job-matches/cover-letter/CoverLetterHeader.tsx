"use client";

import { FileText } from "lucide-react";
import { CoverLetterActions } from "./CoverLetterActions";

interface CoverLetterHeaderProps {
  regenerationCount: number;
  canRegenerate: boolean;
  isEditing: boolean;
  isRegenerating: boolean;
  onEdit: () => void;
  onRegenerate: () => void;
  onSave: () => void;
  onCancel: () => void;
}

export function CoverLetterHeader({
  regenerationCount,
  canRegenerate,
  isEditing,
  isRegenerating,
  onEdit,
  onRegenerate,
  onSave,
  onCancel,
}: CoverLetterHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <FileText className="w-5 h-5 text-blue-400" />
        <h3 className="text-lg font-semibold">Cover Letter</h3>
        {regenerationCount > 0 && (
          <span className="text-xs text-gray-400">
            (Regenerated {regenerationCount} time{regenerationCount > 1 ? 's' : ''})
          </span>
        )}
      </div>
      <CoverLetterActions
        canRegenerate={canRegenerate}
        isEditing={isEditing}
        isRegenerating={isRegenerating}
        onEdit={onEdit}
        onRegenerate={onRegenerate}
        onSave={onSave}
        onCancel={onCancel}
      />
    </div>
  );
}

