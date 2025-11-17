'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Briefcase, TrendingUp, MapPin, DollarSign, Clock, Award, CheckCircle, XCircle, Lightbulb, ArrowRight, Filter, Search, Star, Building2 } from 'lucide-react';
import { useSupabaseAuthSync } from '@/hooks/useSupabaseAuth';

interface JobMatch {
  jobTitle: string;
  employerName: string;
  jobLocation?: string;
  jobDescription?: string;
  jobApplyLink?: string;
  jobEmploymentType?: string;
  jobSalary?: string;
  jobRequirements?: any;
  jobResponsibilities?: string;
  overallMatchScore: number;
  matchReason?: string;
  matchedSkills?: string[];
  missingSkills?: string[];
  improvementSuggestions?: string[];
  finalScore?: number;
}

export default function JobMatchesPage() {
  const params = useParams();
  const router = useRouter();
  const resumeId = params.id as string;
  
  const [matches, setMatches] = useState<JobMatch[]>([]);
  const [selectedJob, setSelectedJob] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use the hook for cross-tab auth synchronization (handles SIGNED_OUT)
  // Note: Authentication is handled by the (protected) layout, so we don't need useRequireAuth here
  useSupabaseAuthSync();

  useEffect(() => {
    if (resumeId) {
      fetchMatches();
    }
  }, [resumeId]);

  async function fetchMatches() {
    try {
      setLoading(true);
      const res = await fetch(`/api/resume/${resumeId}/matches`,{
        next: { revalidate: 600 }, // 10 minutes cache
        cache: "force-cache",
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch job matches');
      }
      
      const jobMatches = data.matches || [];
      setMatches(jobMatches);
      
      // Select first job by default
      if (jobMatches.length > 0) {
        setSelectedJob(0);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Helper function to format date (e.g., "2 days ago")
  function getTimeAgo(): string {
    // Since we don't have actual posted dates, return a placeholder
    const days = [2, 7, 3];
    const day = days[selectedJob] || 2;
    if (day === 1) return '1 day ago';
    if (day < 7) return `${day} days ago`;
    if (day === 7) return '1 week ago';
    return `${Math.floor(day / 7)} weeks ago`;
  }

  // Helper function to get match score color
  function getMatchScoreColor(score: number): string {
    if (score >= 80) return 'text-green-400';
    if (score >= 70) return 'text-yellow-400';
    return 'text-orange-400';
  }

  // Show loading state while fetching matches
  // Note: Auth loading is handled by the (protected) layout
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-300">Loading job matches...</p>
        </div>
      </div>
    );
  }

  if (error || matches.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || 'No job matches found'}</p>
          <Link
            href={`/resume/${resumeId}`}
            className="text-blue-400 hover:text-blue-300 transition"
          >
            ← Back to Resume
          </Link>
        </div>
      </div>
    );
  }

  const currentJob = matches[selectedJob];
  const matchScore = currentJob.overallMatchScore || currentJob.finalScore || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Briefcase className="w-6 h-6 text-blue-400" />
                <h1 className="text-2xl font-bold">Top Job Matches</h1>
              </div>
              <p className="text-gray-400 text-sm">Found {matches.length} position{matches.length !== 1 ? 's' : ''} matching your profile</p>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition flex items-center space-x-2 text-sm">
                <Filter className="w-4 h-4" />
                <span>Filters</span>
              </button>
              <button className="px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition flex items-center space-x-2 text-sm">
                <Search className="w-4 h-4" />
                <span>Search</span>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Left Side - Job List */}
            <div className="md:col-span-1 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
          {matches.map((job, index) => {
            const jobMatchScore = job.overallMatchScore || job.finalScore || 0;
            return (
              <div
                key={index}
                onClick={() => setSelectedJob(index)}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  selectedJob === index
                    ? 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-500/50 shadow-lg'
                    : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">{job.jobTitle}</h3>
                    <p className="text-gray-400 flex items-center text-sm mb-2">
                      <Building2 className="w-3 h-3 mr-1.5" />
                      {job.employerName}
                    </p>
                  </div>
                  <div className="flex flex-col items-end ml-3">
                    <div className={`text-xl font-bold ${getMatchScoreColor(jobMatchScore)}`}>
                      {Math.round(jobMatchScore)}%
                    </div>
                    <span className="text-xs text-gray-400">Match</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                  {job.jobLocation && (
                    <span className="flex items-center">
                      <MapPin className="w-3 h-3 mr-1" />
                      {job.jobLocation}
                    </span>
                  )}
                  <span className="flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {getTimeAgo()}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  {job.jobSalary && (
                    <span className="text-xs font-semibold text-green-400">{job.jobSalary}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

            {/* Right Side - Job Details */}
            <div className="md:col-span-2 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
              {/* Header Card */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold mb-2">{currentJob.jobTitle}</h2>
                    <div className="flex items-center gap-2 text-gray-400 mb-3">
                      <Building2 className="w-4 h-4" />
                      <span className="text-base">{currentJob.employerName}</span>
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm">
                      {currentJob.jobLocation && (
                        <span className="flex items-center text-gray-300">
                          <MapPin className="w-3 h-3 mr-1 text-blue-400" />
                          {currentJob.jobLocation}
                        </span>
                      )}
                      {currentJob.jobSalary && (
                        <span className="flex items-center text-gray-300">
                          <DollarSign className="w-3 h-3 mr-1 text-green-400" />
                          {currentJob.jobSalary}
                        </span>
                      )}
                      {currentJob.jobEmploymentType && (
                        <span className="flex items-center text-gray-300">
                          <Clock className="w-3 h-3 mr-1 text-cyan-400" />
                          {currentJob.jobEmploymentType}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-center ml-6">
                    <div className="relative w-24 h-24">
                      <svg className="transform -rotate-90 w-24 h-24">
                        <circle
                          cx="48"
                          cy="48"
                          r="42"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="transparent"
                          className="text-slate-700"
                        />
                        <circle
                          cx="48"
                          cy="48"
                          r="42"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="transparent"
                          strokeDasharray={`${2 * Math.PI * 42}`}
                          strokeDashoffset={`${2 * Math.PI * 42 * (1 - matchScore / 100)}`}
                          className={`${getMatchScoreColor(matchScore)} transition-all duration-1000`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className={`text-2xl font-bold ${getMatchScoreColor(matchScore)}`}>
                            {Math.round(matchScore)}%
                          </div>
                          <div className="text-xs text-gray-400">Match</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  {currentJob.jobApplyLink ? (
                    <a
                      href={currentJob.jobApplyLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition transform hover:scale-105 flex items-center justify-center space-x-2 text-sm"
                    >
                      <span>Apply Now</span>
                      <ArrowRight className="w-4 h-4" />
                    </a>
                  ) : (
                    <button className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition transform hover:scale-105 flex items-center justify-center space-x-2 text-sm">
                      <span>Apply Now</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                  <button className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg font-semibold transition flex items-center space-x-2 text-sm">
                    <Star className="w-4 h-4" />
                    <span>Save</span>
                  </button>
                </div>
              </div>

              {/* Description */}
              {currentJob.matchReason && (
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-blue-400" />
                    Why You're a Great Match
                  </h3>
                  <p className="text-gray-300 leading-relaxed text-sm">{currentJob.matchReason}</p>
                </div>
              )}

              {/* Matched Skills */}
              {currentJob.matchedSkills && currentJob.matchedSkills.length > 0 && (
                <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg p-6 border border-green-500/20">
                  <h3 className="text-lg font-semibold mb-4 flex items-center text-green-400">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Matched Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {currentJob.matchedSkills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1.5 bg-green-500/20 border border-green-500/30 rounded-lg text-sm font-medium hover:bg-green-500/30 transition"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Missing Skills */}
              {currentJob.missingSkills && currentJob.missingSkills.length > 0 && (
                <div className="bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-lg p-6 border border-red-500/20">
                  <h3 className="text-lg font-semibold mb-4 flex items-center text-red-400">
                    <XCircle className="w-5 h-5 mr-2" />
                    Missing Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {currentJob.missingSkills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1.5 bg-red-500/20 border border-red-500/30 rounded-lg text-sm font-medium hover:bg-red-500/30 transition"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Improvement Suggestions */}
              {currentJob.improvementSuggestions && currentJob.improvementSuggestions.length > 0 && (
                <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-lg p-6 border border-blue-500/20">
                  <h3 className="text-lg font-semibold mb-4 flex items-center text-blue-400">
                    <Lightbulb className="w-5 h-5 mr-2" />
                    Improvement Suggestions
                  </h3>
                  <div className="space-y-3">
                    {currentJob.improvementSuggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className="flex items-start space-x-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition"
                      >
                        <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-xs font-bold">{index + 1}</span>
                        </div>
                        <p className="text-gray-300 leading-relaxed flex-1 text-sm">{suggestion}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Job Description */}
              {currentJob.jobDescription && (
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-3 text-white">Job Description</h3>
                  <p className="text-gray-300 leading-relaxed whitespace-pre-wrap text-sm">{currentJob.jobDescription}</p>
                </div>
              )}

              {/* Job Requirements */}
              {currentJob.jobRequirements && (
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-3 text-white">Requirements</h3>
                  <div className="text-gray-300 text-sm">
                    {Array.isArray(currentJob.jobRequirements) ? (
                      <ul className="list-disc list-inside space-y-1.5">
                        {currentJob.jobRequirements.map((req: any, idx: number) => (
                          <li key={idx}>
                            {typeof req === 'string' ? req : req.requirement || JSON.stringify(req)}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="leading-relaxed whitespace-pre-wrap">{JSON.stringify(currentJob.jobRequirements)}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
