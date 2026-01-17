"use client";

import { useState, useEffect } from "react";
import {
  UserCheck,
  Briefcase,
  MapPin,
  Mail,
  Phone,
  Calendar,
  Award,
  FileText,
  ExternalLink,
  Loader2,
  AlertCircle,
  Search,
  Filter,
  TrendingUp,
  Clock,
  CheckCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";

interface ShortlistedCandidate {
  id: string;
  applicationId: string;
  userId: string;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  jobId: string;
  company: string | null;
  location: string | null;
  appliedDate: string;
  shortlistedDate: string;
  matchScore: number | null;
  status: string;
  candidate: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    location: string | null;
    experience: any[];
    education: any[];
    skills: string[];
    summary: string | null;
  };
  coverLetter: {
    id: string;
    text: string;
    isEdited: boolean;
  } | null;
  interview: {
    id: string;
    status: string;
    startedAt: string | null;
    completedAt: string | null;
    hasReport: boolean;
  } | null;
}

export function ShortlistedCandidatesView() {
  const router = useRouter();
  const [candidates, setCandidates] = useState<ShortlistedCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState<ShortlistedCandidate | null>(null);

  useEffect(() => {
    fetchShortlistedCandidates();
  }, []);

  async function fetchShortlistedCandidates() {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/recruiter/shortlisted");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch shortlisted candidates");
      }

      setCandidates(data.candidates || []);
    } catch (err: any) {
      console.error("Error fetching shortlisted candidates:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const filteredCandidates = candidates.filter((candidate) => {
    const search = searchTerm.toLowerCase();
    return (
      candidate.candidateName.toLowerCase().includes(search) ||
      candidate.jobTitle.toLowerCase().includes(search) ||
      candidate.candidateEmail.toLowerCase().includes(search) ||
      (candidate.company && candidate.company.toLowerCase().includes(search))
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
          <p className="text-gray-400">Loading shortlisted candidates...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-500/10 mb-4">
          <AlertCircle className="w-6 h-6 text-red-500" />
        </div>
        <h3 className="text-lg font-medium text-white mb-2">Failed to load candidates</h3>
        <p className="text-gray-400 mb-6">{error}</p>
        <button
          onClick={fetchShortlistedCandidates}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 rounded-2xl p-6 border border-green-500/20">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
              <UserCheck className="w-7 h-7 text-green-400" />
              Shortlisted Candidates
            </h1>
            <p className="text-gray-400">
              Review and manage candidates you've shortlisted for your job openings
            </p>
          </div>
          <div className="flex items-center gap-3 bg-green-500/10 border border-green-400/30 rounded-xl px-4 py-2">
            <CheckCircle className="w-5 h-5 text-green-300" />
            <span className="text-sm text-green-200 font-medium">
              {candidates.length} Shortlisted
            </span>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name, job title, email, or company..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl focus:outline-none focus:border-blue-500 transition"
        />
      </div>

      {/* Candidates Grid */}
      {filteredCandidates.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/50 border border-slate-800 rounded-xl">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800 mb-4">
            <UserCheck className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">
            {searchTerm ? "No candidates match your search" : "No shortlisted candidates yet"}
          </h3>
          <p className="text-gray-400 max-w-md mx-auto">
            {searchTerm
              ? "Try adjusting your search terms"
              : "Shortlist candidates from your job applications to see them here"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredCandidates.map((candidate) => (
            <div
              key={candidate.id}
              className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-6 border border-white/10 hover:border-blue-500/30 transition cursor-pointer group"
              onClick={() => setSelectedCandidate(candidate)}
            >
              {/* Candidate Header */}
              <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-lg">
                  {candidate.candidateName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold mb-1 group-hover:text-blue-400 transition">
                    {candidate.candidateName}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{candidate.candidateEmail}</span>
                  </div>
                  {candidate.candidate.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Phone className="w-4 h-4" />
                      <span>{candidate.candidate.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Job Info */}
              <div className="bg-white/5 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Briefcase className="w-4 h-4 text-blue-400" />
                  <span className="font-semibold">{candidate.jobTitle}</span>
                </div>
                {candidate.company && (
                  <p className="text-sm text-gray-400 mb-1">{candidate.company}</p>
                )}
                {candidate.location && (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <MapPin className="w-4 h-4" />
                    <span>{candidate.location}</span>
                  </div>
                )}
              </div>

              {/* Match Score */}
              {candidate.matchScore && (
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-400">Match Score</span>
                      <span className="text-sm font-semibold text-blue-400">
                        {candidate.matchScore}%
                      </span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all"
                        style={{ width: `${candidate.matchScore}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Skills Preview */}
              {candidate.candidate.skills && candidate.candidate.skills.length > 0 && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    {candidate.candidate.skills.slice(0, 5).map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs text-blue-300"
                      >
                        {skill}
                      </span>
                    ))}
                    {candidate.candidate.skills.length > 5 && (
                      <span className="px-2 py-1 bg-slate-700 rounded-lg text-xs text-gray-400">
                        +{candidate.candidate.skills.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Interview Status */}
              {candidate.interview && (
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-purple-400" />
                      <span className="text-sm font-medium text-purple-300">
                        Interview {candidate.interview.status}
                      </span>
                    </div>
                    {candidate.interview.hasReport && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`/interview/report?interviewId=${candidate.interview!.id}`, '_blank');
                        }}
                        className="text-xs px-3 py-1 bg-purple-600 hover:bg-purple-500 rounded-lg transition flex items-center gap-1"
                      >
                        <FileText className="w-3 h-3" />
                        View Report
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-white/5">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>
                    Shortlisted {formatDistanceToNow(new Date(candidate.shortlistedDate), { addSuffix: true })}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedCandidate(candidate);
                  }}
                  className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  View Details
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Candidate Detail Modal */}
      {selectedCandidate && (
        <CandidateDetailModal
          candidate={selectedCandidate}
          onClose={() => setSelectedCandidate(null)}
        />
      )}
    </div>
  );
}

// Candidate Detail Modal Component
function CandidateDetailModal({
  candidate,
  onClose,
}: {
  candidate: ShortlistedCandidate;
  onClose: () => void;
}) {
  const router = useRouter();

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-white/10 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-slate-800 to-slate-900 border-b border-white/10 p-6 z-10">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center font-bold text-xl">
                {candidate.candidateName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)}
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-1">{candidate.candidateName}</h2>
                <p className="text-gray-400">{candidate.candidateEmail}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition"
            >
              Close
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Job Application Info */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-400" />
              Applied Position
            </h3>
            <div className="space-y-2">
              <p className="text-lg font-medium">{candidate.jobTitle}</p>
              {candidate.company && <p className="text-gray-400">{candidate.company}</p>}
              {candidate.location && (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <MapPin className="w-4 h-4" />
                  {candidate.location}
                </div>
              )}
              {candidate.matchScore && (
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm">Match Score: {candidate.matchScore}%</span>
                </div>
              )}
            </div>
          </div>

          {/* Summary */}
          {candidate.candidate.summary && (
            <div>
              <h3 className="font-semibold mb-2">Professional Summary</h3>
              <p className="text-gray-300 leading-relaxed">{candidate.candidate.summary}</p>
            </div>
          )}

          {/* Skills */}
          {candidate.candidate.skills && candidate.candidate.skills.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {candidate.candidate.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-sm text-blue-300"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Experience */}
          {candidate.candidate.experience && candidate.candidate.experience.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Experience</h3>
              <div className="space-y-4">
                {candidate.candidate.experience.map((exp: any, idx: number) => (
                  <div key={idx} className="bg-white/5 rounded-xl p-4">
                    <h4 className="font-medium">{exp.title || exp.position}</h4>
                    <p className="text-gray-400 text-sm">{exp.company}</p>
                    <p className="text-gray-500 text-xs mt-1">
                      {exp.startDate} - {exp.endDate || "Present"}
                    </p>
                    {exp.description && (
                      <p className="text-gray-300 text-sm mt-2">{exp.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {candidate.candidate.education && candidate.candidate.education.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Education</h3>
              <div className="space-y-3">
                {candidate.candidate.education.map((edu: any, idx: number) => (
                  <div key={idx} className="bg-white/5 rounded-xl p-4">
                    <h4 className="font-medium">{edu.degree}</h4>
                    <p className="text-gray-400 text-sm">{edu.institution || edu.school}</p>
                    <p className="text-gray-500 text-xs mt-1">
                      {edu.startDate} - {edu.endDate || "Present"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cover Letter */}
          {candidate.coverLetter && (
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-400" />
                Cover Letter
                {candidate.coverLetter.isEdited && (
                  <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded">
                    Edited
                  </span>
                )}
              </h3>
              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {candidate.coverLetter.text}
                </p>
              </div>
            </div>
          )}

          {/* Interview Status */}
          {candidate.interview && (
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-400" />
                Interview Status
              </h3>
              <div className="space-y-2">
                <p>
                  Status: <span className="font-medium text-purple-300">{candidate.interview.status}</span>
                </p>
                {candidate.interview.completedAt && (
                  <p className="text-sm text-gray-400">
                    Completed {formatDistanceToNow(new Date(candidate.interview.completedAt), { addSuffix: true })}
                  </p>
                )}
                {candidate.interview.hasReport && (
                  <button
                    onClick={() => {
                      window.open(`/interview/report?interviewId=${candidate.interview!.id}`, '_blank');
                      onClose();
                    }}
                    className="mt-3 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg transition flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    View Interview Report
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
