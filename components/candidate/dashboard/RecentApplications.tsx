"use client";

import { Building2, Clock, Send, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export interface RecentApplication {
  id: string;
  jobTitle: string;
  company: string;
  appliedAt: string;
}

interface RecentApplicationsProps {
  applications: RecentApplication[];
  onNavigate: (view: string) => void;
}

export function RecentApplications({ applications, onNavigate }: RecentApplicationsProps) {
  return (
    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-6 border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold flex items-center">
          <Clock className="w-5 h-5 mr-2 text-blue-400" />
          Recent Applications
        </h2>
        <button onClick={() => onNavigate("applications")} className="text-blue-400 hover:text-blue-300 text-sm flex items-center">
          View All <ArrowRight className="w-4 h-4 ml-1" />
        </button>
      </div>

      {applications.length === 0 ? (
        <div className="text-center py-8">
          <Send className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 mb-4">No applications yet</p>
          <button
            onClick={() => onNavigate("job-matches")}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm"
          >
            Find Jobs
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map((app) => (
            <div key={app.id} className="p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold truncate">{app.jobTitle}</h4>
                  <p className="text-sm text-gray-400">{app.company}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Applied {formatDistanceToNow(new Date(app.appliedAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
