"use client";

import { Building2, MapPin, Clock, MoreVertical, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import type { ApplicationItem } from "./types";
import { applicationsService } from "@/lib/services/applications.service";
import { StatusBadge } from "@/components/shared/StatusBadge";

interface ApplicationCardProps {
  application: ApplicationItem;
  onWithdraw?: (applicationId: string) => void;
}


export function ApplicationCard({ application, onWithdraw }: ApplicationCardProps) {
  const [withdrawing, setWithdrawing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const title = application.snapshot.jobTitle || application.job.title || "Unknown Role";
  const company = application.snapshot.employerName || application.job.employerName || "Unknown Company";
  const location = application.snapshot.applicantCity || "Remote";
  const appliedAt = formatDistanceToNow(new Date(application.createdAt), { addSuffix: true });

  const canWithdraw = application.status !== 'WITHDRAWN' && 
                      application.status !== 'HIRED' && 
                      application.status !== 'REJECTED';

  async function handleWithdraw() {
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }

    try {
      setWithdrawing(true);
      await applicationsService.withdrawApplication(application.id);
      if (onWithdraw) {
        onWithdraw(application.id);
      }
      setShowConfirm(false);
    } catch (error: any) {
      alert(error.message || 'Failed to withdraw application');
      setShowConfirm(false);
    } finally {
      setWithdrawing(false);
    }
  }

  return (
    <div className="group relative bg-slate-900/50 border border-slate-800 hover:border-blue-500/50 rounded-xl p-5 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-slate-700 flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">{title}</h3>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-1 text-sm text-gray-400">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4" />
                {company}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                {location}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                Applied {appliedAt}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 sm:self-center">
          <StatusBadge status={application.status || 'SUBMITTED'} />
          {canWithdraw && (
            <div className="relative">
              {showConfirm ? (
                <div className="flex gap-2">
                  <button
                    onClick={handleWithdraw}
                    disabled={withdrawing}
                    className="px-3 py-1.5 text-xs bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1"
                  >
                    {withdrawing ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                        Withdrawing...
                      </>
                    ) : (
                      <>
                        <X className="w-3 h-3" />
                        Confirm
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleWithdraw}
                  className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  title="Withdraw application"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          )}
          {!canWithdraw && (
            <button className="p-2 text-gray-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
              <MoreVertical className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
