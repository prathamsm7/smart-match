"use client";

import { Building2, MapPin, Clock, MoreVertical } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { ApplicationItem } from "./types";

interface ApplicationCardProps {
  application: ApplicationItem;
}

export function ApplicationCard({ application }: ApplicationCardProps) {
  const title = application.snapshot.jobTitle || application.job.title || "Unknown Role";
  const company = application.snapshot.employerName || application.job.employerName || "Unknown Company";
  const location = application.snapshot.applicantCity || "Remote";
  const appliedAt = formatDistanceToNow(new Date(application.createdAt), { addSuffix: true });

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
          <div className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
            Applied
          </div>
          <button className="p-2 text-gray-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
