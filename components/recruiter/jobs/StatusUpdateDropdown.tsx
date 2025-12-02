"use client";

import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Calendar, Trophy, ChevronDown } from "lucide-react";
import type { ApplicationStatus } from "@/components/shared/StatusBadge";

interface StatusUpdateDropdownProps {
  currentStatus: ApplicationStatus | string;
  applicationId: string;
  onStatusUpdate: (applicationId: string, newStatus: string) => Promise<void>;
  disabled?: boolean;
}

export function StatusUpdateDropdown({
  currentStatus,
  applicationId,
  onStatusUpdate,
  disabled = false,
}: StatusUpdateDropdownProps) {
  const [showDropdown, setShowDropdown] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (showDropdown && !target.closest('.status-update-dropdown')) {
        setShowDropdown(false);
      }
    }
    if (showDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showDropdown]);

  async function handleStatusChange(newStatus: string) {
    await onStatusUpdate(applicationId, newStatus);
    setShowDropdown(false);
  }

  const canUpdateStatus = 
    currentStatus !== 'HIRED' && 
    currentStatus !== 'WITHDRAWN' && 
    currentStatus !== 'REJECTED';

  if (!canUpdateStatus || disabled) {
    return null;
  }

  return (
    <div className="relative status-update-dropdown flex-1">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowDropdown(!showDropdown);
        }}
        disabled={disabled}
        className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-lg font-semibold transition flex items-center justify-center gap-2 shadow-lg hover:shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span>Update Status</span>
        <ChevronDown 
          className={`w-5 h-5 transition-transform ${showDropdown ? 'rotate-180' : ''}`} 
        />
      </button>
      {showDropdown && (
        <div className="absolute left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-10 overflow-hidden">
          <div className="py-1">
            {currentStatus !== 'SHORTLISTED' && 
             currentStatus !== 'INTERVIEW' && 
             currentStatus !== 'HIRED' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleStatusChange('SHORTLISTED');
                }}
                className="w-full text-left px-4 py-3 text-sm hover:bg-slate-700 text-gray-300 transition flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>Shortlist</span>
              </button>
            )}
            {currentStatus !== 'INTERVIEW' && currentStatus !== 'HIRED' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleStatusChange('INTERVIEW');
                }}
                className="w-full text-left px-4 py-3 text-sm hover:bg-slate-700 text-gray-300 transition flex items-center gap-2"
              >
                <Calendar className="w-4 h-4 text-purple-400" />
                <span>Schedule Interview</span>
              </button>
            )}
            {currentStatus !== 'HIRED' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleStatusChange('HIRED');
                }}
                className="w-full text-left px-4 py-3 text-sm hover:bg-slate-700 text-gray-300 transition flex items-center gap-2"
              >
                <Trophy className="w-4 h-4 text-emerald-400" />
                <span>Hire</span>
              </button>
            )}
            <div className="border-t border-slate-700 my-1"></div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleStatusChange('REJECTED');
              }}
              className="w-full text-left px-4 py-3 text-sm hover:bg-slate-700 text-red-400 transition flex items-center gap-2"
            >
              <XCircle className="w-4 h-4" />
              <span>Reject</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

