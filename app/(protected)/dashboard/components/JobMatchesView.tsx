"use client";

import React, { useState, useEffect } from 'react';
import { 
  Briefcase, MapPin, DollarSign, Clock, Award, CheckCircle, XCircle, 
  Lightbulb, ArrowRight, Search, Star, Building2, Sparkles, Target,
  SlidersHorizontal, AlertCircle, RefreshCw, TrendingUp
} from 'lucide-react';
import ReactMarkdown from "react-markdown"

interface JobMatch {
  id: string;
  title: string;
  company: string;
  logo?: string;
  location: string;
  salary: string;
  type: string;
  experience: string;
  matchScore: number;
  description: string;
  matchedSkills: string[];
  missingSkills: string[];
  suggestions: string[];
  posted: string;
  applicants: number;
  skills: string[];
  requirements?: any;
  jobApplyLink?: string;
}

interface JobMatchesViewProps {
  userId: string;
}

export function JobMatchesView({ userId }: JobMatchesViewProps) {
  const [jobs, setJobs] = useState<JobMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState(0);
  const [filterOpen, setFilterOpen] = useState(false);
  const [primaryResumeId, setPrimaryResumeId] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [applySuccess, setApplySuccess] = useState(false);

  // Fetch primary resume and then job matches
  useEffect(() => {
    fetchJobMatches();
  }, []);

  async function fetchJobMatches() {
    try {
      setLoading(true);
      setError(null);

      // First, get the primary resume
      const resumesResponse = await fetch('/api/resumes');
      const resumesData = await resumesResponse.json();

      if (!resumesResponse.ok) {
        throw new Error(resumesData.error || 'Failed to fetch resumes');
      }

      const primaryResume = resumesData.resumes.find((r: any) => r.isPrimary);
      
      if (!primaryResume || !primaryResume.vectorId) {
        setError('No primary resume found. Please set a primary resume first.');
        setLoading(false);
        return;
      }

      setPrimaryResumeId(primaryResume.vectorId);

      // Fetch job matches using the primary resume's vectorId
      const matchesResponse = await fetch(`/api/resume/${primaryResume.vectorId}/matches`);
      const matchesData = await matchesResponse.json();

      if (!matchesResponse.ok) {
        throw new Error(matchesData.error || 'Failed to fetch job matches');
      }

      // Transform API response to component format
      const transformedJobs = matchesData.matches.map((job: any, index: number) => {
        // Extract company name from employerName or use a default
        const companyName = job.employerName || 'Company';
        const companyInitial = companyName.charAt(0).toUpperCase();

        // Calculate match score - finalScore is now 0-100 (normalized in backend)
        const matchScore = job?.finalScore ?? "NA";
        
        // Matched skills (from the match analysis)
        const matchedSkills = job.matchedSkills || []

        // Missing skills (from the match analysis)
        const missingSkills = job.missingSkills || [];

        // Suggestions (from the match analysis)
        const suggestions = job.improvementSuggestions || 
                           [
                             `Focus on developing ${missingSkills[0] || 'additional'} skills to improve your match.`,
                             `Gain more experience with ${job.type || 'relevant'} technologies.`,
                             `Consider certifications or courses in key areas.`
                           ];

        // Format description - convert \n to proper line breaks
        let description = job.jobDescription || ""
        
        // Convert \n to markdown line breaks
        if (typeof description === 'string') {
          // First, handle literal \n strings (escaped newlines) - both single and double backslashes
          description = description.replace(/\\n/g, '\n');
          description = description.replace(/\\\\n/g, '\n');
          
          // Convert bullet points with • to markdown list format
          description = description.replace(/•\s*/g, '- ');
          
          // Handle section headers (lines ending with : followed by newline)
          // Add extra spacing after section headers for better readability
          description = description.replace(/([^:\n]):\s*\n/g, '$1:\n\n');
          
          // Convert lines starting with • or - to proper markdown list items
          description = description.replace(/^(\s*)([-•])\s+/gm, '$1- ');
          
          // Clean up multiple consecutive newlines (more than 2) but preserve double newlines for paragraphs
          description = description.replace(/\n{3,}/g, '\n\n');
          
          // Trim leading/trailing whitespace
          description = description.trim();
        }

        return {
          id: job.id || `job-${index}`,
          title: job.jobTitle || 'Job Title',
          company: companyName,
          logo: companyInitial,
          location: job.jobLocation || 'Remote',
          salary: job.jobSalary || '$100k - $150k',
          type: job.jobEmploymentType || 'Full-time',
          experience: job.jobExperience || '3-5 Years',
          matchScore: matchScore,
          description: description,
          matchedSkills: matchedSkills,
          missingSkills: missingSkills,
          suggestions: suggestions,
          posted: job.posted || 'Recently',
          applicants: job.applicants || 0,
          requirements: job.jobRequirements || null,
          jobApplyLink: job.jobApplyLink || undefined,
        };
      });

      setJobs(transformedJobs);
      if (transformedJobs.length > 0) {
        setSelectedJob(0);
      }
    } catch (err: any) {
      console.error('Error fetching job matches:', err);
      setError(err.message || 'Failed to load job matches');
    } finally {
      setLoading(false);
    }
  }

  async function handleApplyNow(job: JobMatch) {
    try {
      setApplying(true);
      setApplyError(null);
      setApplySuccess(false);

      if (!primaryResumeId) {
        setApplyError('No primary resume found. Please set a primary resume first.');
        return;
      }

      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobId: job.id,
          resumeId: primaryResumeId,
          jobTitle: job.title,
          employerName: job.company,
          jobDescription: job.description,
          jobRequirements: job.requirements || null,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to apply for job');
      }

      // Success!
      setApplySuccess(true);
      
      // If job has external link, open it after a short delay
      if (job.jobApplyLink) {
        setTimeout(() => {
          window.open(job.jobApplyLink, '_blank', 'noopener,noreferrer');
        }, 500);
      }

      // Clear success message after 3 seconds
      setTimeout(() => {
        setApplySuccess(false);
      }, 3000);

    } catch (error: any) {
      console.error('Error applying for job:', error);
      setApplyError(error.message || 'Failed to apply for job');
      
      // Clear error after 5 seconds
      setTimeout(() => {
        setApplyError(null);
      }, 5000);
    } finally {
      setApplying(false);
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading job matches...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 flex items-start space-x-3">
        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-red-400 mb-1">Error Loading Job Matches</h3>
          <p className="text-gray-300 text-sm mb-3">{error}</p>
          <button
            onClick={fetchJobMatches}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-semibold transition flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (jobs.length === 0) {
    return (
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-12 border border-white/10 backdrop-blur-sm text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Briefcase className="w-8 h-8 text-blue-400" />
        </div>
        <h3 className="text-xl font-bold mb-2">No Job Matches Found</h3>
        <p className="text-gray-400 mb-6">
          We couldn't find any matching jobs for your primary resume. Try updating your resume or check back later.
        </p>
        <button
          onClick={fetchJobMatches}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition flex items-center space-x-2 mx-auto"
        >
          <RefreshCw className="w-5 h-5" />
          <span>Refresh Matches</span>
        </button>
      </div>
    );
  }

  const currentJob = jobs[selectedJob];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center">
            Top Job Matches
            <Sparkles className="w-5 h-5 ml-2 text-yellow-400" />
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Found {jobs.length} positions matching your profile
          </p>
        </div>

        <div className="flex items-center">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search jobs..."
              className="pl-10 pr-4 py-2.5 bg-slate-800/50 border border-white/10 rounded-xl focus:outline-none focus:border-blue-500 transition w-64 text-sm"
            />
          </div>
          
          <button 
            onClick={() => setFilterOpen(!filterOpen)}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl transition flex items-center space-x-2"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filters</span>
          </button>

          <button
            onClick={fetchJobMatches}
            className="p-2.5 bg-slate-700 hover:bg-slate-600 rounded-xl transition"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex h-[calc(100vh-150px)] gap-6">
        {/* Job List */}
        <div className="w-2/5 border-r border-white/10 overflow-y-auto space-y-4 pr-4">
          {jobs.map((job, index) => (
            <div
              key={job.id}
              onClick={() => setSelectedJob(index)}
              className={`p-5 rounded-xl border cursor-pointer transition-all ${
                selectedJob === index
                  ? 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-500/50 shadow-lg'
                  : 'bg-slate-800/30 border-white/10 hover:bg-slate-800/50 hover:border-white/20'
              }`}
            >
              <div className="flex items-start gap-4 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center font-bold text-lg flex-shrink-0 shadow-lg">
                  {job.logo}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg mb-1 truncate">{job.title}</h3>
                  <p className="text-gray-400 text-sm flex items-center">
                    <Building2 className="w-3 h-3 mr-1" />
                    {job.company}
                  </p>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${
                    job.matchScore >= 90 ? 'text-green-400' : 
                    job.matchScore >= 80 ? 'text-yellow-400' : 
                    'text-orange-400'
                  }`}>
                    {job.matchScore}%
                  </div>
                  <span className="text-xs text-gray-400">Match</span>
                </div>
              </div>


              <div className="flex items-center justify-between text-xs text-gray-400">
                <span className="flex items-center">
                  <MapPin className="w-3 h-3 mr-1" />
                  {job.location}
                </span>
                <span className="text-green-400 font-semibold">{job.salary}</span>
                <span className="flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {job.posted}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Job Details */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl space-y-6">
            {/* Header Card */}
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-8 border border-white/10 backdrop-blur-sm">
              <div className="flex items-start gap-6 mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center font-bold text-3xl shadow-lg shadow-blue-500/50">
                  {currentJob.logo}
                </div>
                <div className="flex-1">
                  <h2 className="text-3xl font-bold mb-2">{currentJob.title}</h2>
                  <div className="flex items-center gap-2 text-gray-400 mb-4">
                    <Building2 className="w-5 h-5" />
                    <span className="text-lg">{currentJob.company}</span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <span className="flex items-center text-gray-300">
                      <MapPin className="w-4 h-4 mr-1 text-blue-400" />
                      {currentJob.location}
                    </span>
                    <span className="flex items-center text-gray-300">
                      <DollarSign className="w-4 h-4 mr-1 text-green-400" />
                      {currentJob.salary}
                    </span>
                    <span className="flex items-center text-gray-300">
                      <Clock className="w-4 h-4 mr-1 text-cyan-400" />
                      {currentJob.type}
                    </span>
                    <span className="flex items-center text-gray-300">
                      <Award className="w-4 h-4 mr-1 text-purple-400" />
                      {currentJob.experience}
                    </span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="relative w-32 h-32">
                    <svg className="transform -rotate-90 w-32 h-32">
                      <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-slate-700" />
                      <circle
                        cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="10" fill="transparent"
                        strokeDasharray={`${2 * Math.PI * 56}`}
                        strokeDashoffset={`${2 * Math.PI * 56 * (1 - currentJob.matchScore / 100)}`}
                        className={`${
                          currentJob.matchScore >= 90 ? 'text-green-400' : 
                          currentJob.matchScore >= 80 ? 'text-yellow-400' : 
                          'text-orange-400'
                        } transition-all duration-1000`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className={`text-4xl font-bold ${
                          currentJob.matchScore >= 90 ? 'text-green-400' : 
                          currentJob.matchScore >= 80 ? 'text-yellow-400' : 
                          'text-orange-400'
                        }`}>
                          {currentJob.matchScore}%
                        </div>
                        <div className="text-xs text-gray-400 mt-1">Match</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Application Status Messages */}
              {applyError && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <p className="text-red-400 text-sm">{applyError}</p>
                </div>
              )}

              {applySuccess && (
                <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <p className="text-green-400 text-sm">Application submitted successfully!</p>
                </div>
              )}

              <div className="flex gap-3">
                <button 
                  onClick={() => handleApplyNow(currentJob)}
                  disabled={applying || applySuccess}
                  className={`flex-1 px-6 py-3 rounded-lg font-semibold transition transform hover:scale-[1.02] flex items-center justify-center space-x-2 ${
                    applying || applySuccess
                      ? 'bg-green-600 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:shadow-lg hover:shadow-blue-500/50'
                  }`}
                >
                  {applying ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Applying...</span>
                    </>
                  ) : applySuccess ? (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      <span>Applied!</span>
                    </>
                  ) : (
                    <>
                      <span>Apply Now</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
                <button className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-semibold transition flex items-center space-x-2">
                  <Star className="w-5 h-5" />
                  <span>Save</span>
                </button>
              </div>
            </div>

            {/* Description */}
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-8 border border-white/10 backdrop-blur-sm">
              <h3 className="text-xl font-bold mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-blue-400" />
                Job Description
              </h3>
              <div className="text-gray-300 leading-relaxed">
                <ReactMarkdown
                  components={{
                    p: ({ children }) => <p className="mb-4 text-gray-300 leading-relaxed">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc list-inside mb-4 space-y-2 text-gray-300 ml-4">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal list-inside mb-4 space-y-2 text-gray-300 ml-4">{children}</ol>,
                    li: ({ children }) => <li className="text-gray-300 mb-1">{children}</li>,
                    strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                    em: ({ children }) => <em className="italic text-gray-200">{children}</em>,
                    h1: ({ children }) => <h1 className="text-2xl font-bold mb-3 mt-4 text-white">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-xl font-bold mb-2 mt-3 text-white">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-lg font-bold mb-2 mt-3 text-white">{children}</h3>,
                    br: () => <br />,
                    hr: () => <hr className="my-4 border-white/10" />,
                  }}
                >
                  {currentJob.description}
                </ReactMarkdown>
              </div>
            </div>

            {/* Matched Skills */}
            {currentJob.matchedSkills.length > 0 && (
              <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl p-8 border border-green-500/20 backdrop-blur-sm">
                <h3 className="text-xl font-bold mb-5 flex items-center text-green-400">
                  <CheckCircle className="w-6 h-6 mr-2" />
                  Matched Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {currentJob.matchedSkills.map((skill, index) => (
                    <span key={index} className="px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-lg text-sm font-medium hover:bg-green-500/30 transition">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Missing Skills */}
            {currentJob.missingSkills.length > 0 && (
              <div className="bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-2xl p-8 border border-red-500/20 backdrop-blur-sm">
                <h3 className="text-xl font-bold mb-5 flex items-center text-red-400">
                  <XCircle className="w-6 h-6 mr-2" />
                  Missing Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {currentJob.missingSkills.map((skill, index) => (
                    <span key={index} className="px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-lg text-sm font-medium hover:bg-red-500/30 transition">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Improvement Suggestions */}
            {currentJob.suggestions.length > 0 && (
              <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl p-8 border border-blue-500/20 backdrop-blur-sm">
                <h3 className="text-xl font-bold mb-6 flex items-center text-blue-400">
                  <Lightbulb className="w-6 h-6 mr-2" />
                  Improvement Suggestions
                </h3>
                <div className="space-y-4">
                  {currentJob.suggestions.map((suggestion, index) => (
                    <div key={index} className="flex items-start space-x-4 p-4 bg-white/5 rounded-lg hover:bg-white/10 transition">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-sm font-bold">{index + 1}</span>
                      </div>
                      <p className="text-gray-300 leading-relaxed flex-1">{suggestion}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

