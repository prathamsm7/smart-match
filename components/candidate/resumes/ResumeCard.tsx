"use client";

import {
  FileText,
  Crown,
  Star,
  Eye,
  Edit,
  Download,
  Copy,
  Share2,
  Trash2,
  Briefcase,
  Clock,
} from "lucide-react";
import type { ResumeData } from "./types";

interface ResumeCardProps {
  resume: ResumeData;
  onSetPrimary: (resumeId: string) => void;
  settingPrimaryId: string | null;
}

export function ResumeCard({ resume, onSetPrimary, settingPrimaryId }: ResumeCardProps) {
  const matchScore = resume.matchScore || 0;
  const matchColor =
    matchScore >= 90 ? "text-green-400" : matchScore >= 80 ? "text-yellow-400" : "text-orange-400";

  return (
    <div
      className={`bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-6 border transition-all ${resume.isPrimary ? "border-blue-500/50 shadow-lg shadow-blue-500/20" : "border-white/10 hover:border-white/20"
        }`}
    >
      <div className="flex items-start gap-6">
        <div className="w-20 h-24 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl border border-blue-500/30 flex items-center justify-center shrink-0 relative">
          <FileText className="w-10 h-10 text-blue-400" />
          {resume.isPrimary && (
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
              <Crown className="w-4 h-4" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-bold truncate">{resume.name || "Untitled Resume"}</h3>
                {resume.isPrimary && (
                  <span className="px-3 py-1 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-lg text-xs font-semibold text-yellow-400 flex items-center">
                    <Star className="w-3 h-3 mr-1 fill-current" />
                    Primary
                  </span>
                )}
              </div>
              <p className="text-gray-400 text-sm mb-2 truncate">{resume.fileName}</p>
              <div className="flex flex-wrap gap-2">
                {resume.tags?.map((tag) => (
                  <span key={tag} className="px-2 py-1 bg-blue-500/20 border border-blue-500/30 rounded-lg text-xs">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="text-center ml-4">
              <div className={`text-3xl font-bold ${matchColor}`}>{matchScore}%</div>
              <span className="text-xs text-gray-400">Avg Match</span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 p-4 bg-white/5 rounded-xl text-center">
            <div>
              <p className="text-blue-400 flex items-center justify-center gap-1 mb-1">
                <Eye className="w-4 h-4" />
                <span className="font-bold">{resume.views}</span>
              </p>
              <span className="text-xs text-gray-400">Views</span>
            </div>
            <div>
              <p className="text-green-400 flex items-center justify-center gap-1 mb-1">
                <Download className="w-4 h-4" />
                <span className="font-bold">{resume.downloads}</span>
              </p>
              <span className="text-xs text-gray-400">Downloads</span>
            </div>
            <div>
              <p className="text-purple-400 flex items-center justify-center gap-1 mb-1">
                <Briefcase className="w-4 h-4" />
                <span className="font-bold">{resume.applications}</span>
              </p>
              <span className="text-xs text-gray-400">Applications</span>
            </div>
            <div>
              <p className="text-gray-400 flex items-center justify-center gap-1 mb-1">
                <Clock className="w-4 h-4" />
                <span className="font-bold text-xs">{resume.lastModified}</span>
              </p>
              <span className="text-xs text-gray-400">Modified</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {!resume.isPrimary && (
              <button
                onClick={() => onSetPrimary(resume.id)}
                disabled={settingPrimaryId === resume.id}
                className="px-4 py-2 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 rounded-lg text-sm font-semibold transition flex items-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Star className={`w-4 h-4 ${settingPrimaryId === resume.id ? "animate-spin" : ""}`} />
                <span>{settingPrimaryId === resume.id ? "Setting..." : "Set as Primary"}</span>
              </button>
            )}
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-semibold transition flex items-center space-x-2">
              <Eye className="w-4 h-4" />
              <span>Preview</span>
            </button>
            <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-semibold transition flex items-center space-x-2">
              <Edit className="w-4 h-4" />
              <span>Edit</span>
            </button>
            <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-semibold transition flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>
            <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-semibold transition flex items-center space-x-2">
              <Copy className="w-4 h-4" />
              <span>Duplicate</span>
            </button>
            <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-semibold transition flex items-center space-x-2">
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </button>
            <button className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm font-semibold transition flex items-center space-x-2">
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
