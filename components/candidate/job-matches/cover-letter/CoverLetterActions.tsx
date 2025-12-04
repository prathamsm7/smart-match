"use client";

import { RefreshCw, Edit2, Check, X } from "lucide-react";

interface CoverLetterActionsProps {
  canRegenerate: boolean;
  isEditing: boolean;
  isRegenerating: boolean;
  onEdit: () => void;
  onRegenerate: () => void;
  onSave: () => void;
  onCancel: () => void;
}

export function CoverLetterActions({
  canRegenerate,
  isEditing,
  isRegenerating,
  onEdit,
  onRegenerate,
  onSave,
  onCancel,
}: CoverLetterActionsProps) {
  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={onSave}
          className="px-3 py-1.5 text-sm bg-green-600 hover:bg-green-700 rounded-lg transition flex items-center gap-2"
        >
          <Check className="w-4 h-4" />
          <span>Save</span>
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 rounded-lg transition flex items-center gap-2"
        >
          <X className="w-4 h-4" />
          <span>Cancel</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {canRegenerate && (
        <button
          onClick={onRegenerate}
          disabled={isRegenerating}
          className="px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 rounded-lg transition flex items-center gap-2 disabled:opacity-50"
        >
          {isRegenerating ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Regenerating...</span>
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              <span>Regenerate</span>
            </>
          )}
        </button>
      )}
      <button
        onClick={onEdit}
        className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 rounded-lg transition flex items-center gap-2"
      >
        <Edit2 className="w-4 h-4" />
        <span>Edit</span>
      </button>
    </div>
  );
}

