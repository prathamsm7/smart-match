"use client";

import { AlertCircle } from "lucide-react";

type EndInterviewDialogProps = {
  onCancel: () => void;
  onConfirm: () => void;
};

export function EndInterviewDialog({
  onCancel,
  onConfirm,
}: EndInterviewDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl shadow-2xl">
        <div className="p-6 space-y-4">
          <div className="flex items-start space-x-3">
            <div className="mt-1">
              <AlertCircle className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">End interview?</h3>
              <p className="text-sm text-gray-300">
                Ending now will stop the session and generate your report.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-end space-x-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-lg border border-white/10 text-sm font-semibold hover:bg-white/5 transition"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-sm font-semibold transition"
            >
              End Interview
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
