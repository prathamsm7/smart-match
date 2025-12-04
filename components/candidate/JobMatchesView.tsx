"use client";

import React, { useState, useEffect } from 'react';
import { Briefcase, AlertCircle, RefreshCw } from 'lucide-react';
import { JobMatchesShimmer } from "./job-matches/JobMatchesShimmer";
import { JobMatchesHeader } from "./job-matches/JobMatchesHeader";
import { JobMatchesList } from "./job-matches/JobMatchesList";
import { JobDetailsPanel } from "./job-matches/JobDetailsPanel";
import type { JobMatch, JobMatchAnalysis } from "./job-matches/types";
import { jobsService, applicationsService, resumesService } from "@/lib/services";

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
  const [coverLetterId, setCoverLetterId] = useState<string | null>(null);

  // Lazy loading state for job details
  const [jobDetails, setJobDetails] = useState<Record<string, JobMatchAnalysis | undefined>>({});
  const [loadingDetails, setLoadingDetails] = useState<string | null>(null);

  // Fetch primary resume and then job matches
  useEffect(() => {
    fetchJobMatches();
  }, []);

  async function fetchJobMatches() {
    try {
      setLoading(true);
      setError(null);

      // Fetch job matches - backend finds primary resume automatically
      const matchesData = await jobsService.fetchJobMatches({ cache: "force-cache", revalidate: 300 });

      // Set the resume ID from the response (needed for detail fetching)
      setPrimaryResumeId(matchesData.resumeId);

      // Transform API response to component format
      // Note: Initial load only has vectorScore, detailed analysis is lazy-loaded
      const transformedJobs = matchesData.matches.map((job: any, index: number) => {
        // Extract company name from employerName or use a default
        const companyName = job.employerName || 'Company';
        const companyInitial = companyName.charAt(0).toUpperCase();

        // Use vectorScore initially, finalScore will be updated when details are fetched
        const matchScore = job.vectorScore ?? 0;

        // These will be populated when details are lazy-loaded
        const matchedSkills: string[] = [];
        const missingSkills: string[] = [];
        const suggestions: string[] = [];

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

      const data = await applicationsService.createApplication({
        jobId: job.id,
        resumeId: primaryResumeId,
        jobTitle: job.title,
        employerName: job.company,
        jobDescription: job.description,
        jobRequirements: job.requirements || null,
        matchScore: job.matchScore || undefined,
        coverLetterId: coverLetterId || undefined,
      });

      // Reset cover letter after successful application
      setCoverLetterId(null);

      // Success!
      setApplySuccess(true);

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

  // Fetch detailed job analysis (lazy loading)
  async function fetchJobDetails(jobId: string, vectorScore: number) {
    // Skip if already fetched or currently loading
    if (jobDetails[jobId] || loadingDetails === jobId) {
      return;
    }

    if (!primaryResumeId) {
      console.error('No primary resume ID available');
      return;
    }

    try {
      setLoadingDetails(jobId);

      // Send vectorScore in POST body (already computed by Qdrant in initial search)
      const data = await resumesService.fetchResumeMatches(primaryResumeId, jobId, vectorScore);

      // Update job details cache (used for detail view only)
      setJobDetails(prev => ({ ...prev, [jobId]: data.match }));
    } catch (err: any) {
      console.error('Error fetching job details:', err);
    } finally {
      setLoadingDetails(null);
    }
  }

  // Fetch details when job is selected
  useEffect(() => {
    if (jobs.length > 0 && jobs[selectedJob]) {
      const currentJob = jobs[selectedJob];
      fetchJobDetails(currentJob.id, currentJob.matchScore);
    }
  }, [selectedJob, jobs.length, primaryResumeId]);

  // Loading state
  if (loading) {
    return <JobMatchesShimmer jobCount={5} />;
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

  const analysis = jobDetails[currentJob.id];
  const loadingAnalysis = loadingDetails === currentJob.id;

  return (
    <div className="space-y-6">
      <JobMatchesHeader
        jobCount={jobs.length}
        filterOpen={filterOpen}
        onToggleFilters={() => setFilterOpen(!filterOpen)}
        onRefresh={fetchJobMatches}
      />

      <div className="flex h-[calc(100vh-150px)] gap-6">
        <JobMatchesList jobs={jobs} selectedJobIndex={selectedJob} onSelect={setSelectedJob} />
        <JobDetailsPanel
          job={currentJob}
          analysis={analysis}
          loadingAnalysis={loadingAnalysis}
          applying={applying}
          applySuccess={applySuccess}
          applyError={applyError}
          onApply={() => handleApplyNow(currentJob)}
          primaryResumeId={primaryResumeId}
          onCoverLetterGenerated={(id, text) => setCoverLetterId(id)}
        />
      </div>
    </div>
  );
}

