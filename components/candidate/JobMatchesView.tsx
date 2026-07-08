"use client";

import React, { useState, useEffect } from 'react';
import { Briefcase, AlertCircle, RefreshCw } from 'lucide-react';
import { JobMatchesShimmer } from "./job-matches/JobMatchesShimmer";
import { JobMatchesHeader } from "./job-matches/JobMatchesHeader";
import { JobMatchesList } from "./job-matches/JobMatchesList";
import { JobDetailsPanel } from "./job-matches/JobDetailsPanel";
import type { JobMatch, JobMatchAnalysis } from "./job-matches/types";
import type { JobSearchMode } from "@/lib/jobSearch.types";
import { jobsService, applicationsService, resumesService } from "@/lib/services";

interface JobMatchesViewProps {
  userId: string;
}

function formatDescription(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/\\n/g, '\n')
    .replace(/•\s*/g, '- ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function toJobMatch(job: Record<string, unknown>, index: number): JobMatch {
  const company = (job.employerName as string) || 'Company';
  return {
    id: (job.id as string) || `job-${index}`,
    title: (job.jobTitle as string) || 'Job Title',
    company,
    logo: company.charAt(0).toUpperCase(),
    location: (job.jobLocation as string) || 'Not specified',
    salary: (job.jobSalary as string) || '',
    type: (job.jobEmploymentType as string) || 'Not specified',
    experience: 'Not specified',
    matchScore: (job.matchScore as number) ?? (job.vectorScore as number) ?? 0,
    vectorScore: job.vectorScore as number | undefined,
    matchReason: (job.matchReason as string) || '',
    dimensions: job.dimensions as JobMatch['dimensions'],
    description: formatDescription((job.jobDescription as string) || ''),
    matchedSkills: [],
    missingSkills: [],
    suggestions: [],
    posted: 'Recently',
    applicants: 0,
    skills: [],
    requirements: job.jobRequirements || null,
    jobApplyLink: job.jobApplyLink as string | undefined,
  };
}

export function JobMatchesView({ userId }: JobMatchesViewProps) {
  const [jobs, setJobs] = useState<JobMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState(0);
  const [mode, setMode] = useState<JobSearchMode>('profile');
  const [query, setQuery] = useState('');
  const [primaryResumeId, setPrimaryResumeId] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [applySuccess, setApplySuccess] = useState(false);
  const [coverLetterId, setCoverLetterId] = useState<string | null>(null);
  const [jobDetails, setJobDetails] = useState<Record<string, JobMatchAnalysis | undefined>>({});
  const [loadingDetails, setLoadingDetails] = useState<string | null>(null);

  async function runSearch(opts: { mode: JobSearchMode; query?: string; forceRefresh?: boolean; initial?: boolean }) {
    try {
      if (opts.initial) setLoading(true);
      else setSearching(true);
      setError(null);

      const data = await jobsService.fetchJobMatches({
        mode: opts.mode,
        query: opts.query,
        forceRefresh: opts.forceRefresh,
      });

      setPrimaryResumeId(data.resumeId);
      setJobs((data.matches || []).map(toJobMatch));
      setSelectedJob(0);
      if (!opts.initial) setJobDetails({});
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load job matches');
    } finally {
      setLoading(false);
      setSearching(false);
    }
  }

  useEffect(() => {
    runSearch({ mode: 'profile', initial: true });
  }, []);

  function handleModeChange(newMode: JobSearchMode) {
    setMode(newMode);
    if (newMode === 'profile') {
      runSearch({ mode: 'profile' });
    }
  }

  function handleSearch() {
    if (!query.trim()) return;
    runSearch({ mode, query: query.trim(), forceRefresh: true });
  }

  async function handleApplyNow(job: JobMatch) {
    try {
      setApplying(true);
      setApplyError(null);
      setApplySuccess(false);
      if (!primaryResumeId) {
        setApplyError('No primary resume found.');
        return;
      }
      const analysis = jobDetails[job.id];
      await applicationsService.createApplication({
        jobId: job.id,
        resumeId: primaryResumeId,
        jobTitle: job.title,
        employerName: job.company,
        jobDescription: job.description,
        jobRequirements: job.requirements || null,
        matchScore: job.matchScore || undefined,
        matchedSkills: analysis?.matchedSkills,
        missingSkills: analysis?.missingSkills,
        matchReason: analysis?.matchReason,
        coverLetterId: coverLetterId || undefined,
      });
      setCoverLetterId(null);
      setApplySuccess(true);
      setTimeout(() => setApplySuccess(false), 3000);
    } catch (err: unknown) {
      setApplyError(err instanceof Error ? err.message : 'Failed to apply');
      setTimeout(() => setApplyError(null), 5000);
    } finally {
      setApplying(false);
    }
  }

  async function fetchJobDetails(jobId: string, score: number) {
    if (jobDetails[jobId] || loadingDetails === jobId || !primaryResumeId) return;
    try {
      setLoadingDetails(jobId);
      const data = await resumesService.fetchResumeMatches(primaryResumeId, jobId, score);
      setJobDetails((prev) => ({ ...prev, [jobId]: data.match }));
    } catch (err) {
      console.error('Error fetching job details:', err);
    } finally {
      setLoadingDetails(null);
    }
  }

  useEffect(() => {
    if (jobs[selectedJob]) {
      const j = jobs[selectedJob];
      fetchJobDetails(j.id, j.vectorScore ?? j.matchScore);
    }
  }, [selectedJob, jobs.length, primaryResumeId]);

  const header = (
    <JobMatchesHeader
      jobCount={jobs.length}
      mode={mode}
      query={query}
      searching={searching}
      onModeChange={handleModeChange}
      onQueryChange={setQuery}
      onSearch={handleSearch}
      onRefresh={() => runSearch({ mode, query: query.trim() || undefined, forceRefresh: true })}
    />
  );

  if (loading) return <JobMatchesShimmer jobCount={5} />;

  if (error) {
    return (
      <div className="space-y-6">
        {header}
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-red-400 mb-1">Search Error</h3>
            <p className="text-gray-300 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="space-y-6">
        {header}
        <div className="bg-slate-800/50 rounded-2xl p-12 border border-white/10 text-center">
          <Briefcase className="w-10 h-10 text-blue-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">No Matches Found</h3>
          <p className="text-gray-400 mb-6">
            {mode === 'profile'
              ? 'Upload a resume or check back when more jobs are posted.'
              : 'Try a different query or switch to Hybrid mode.'}
          </p>
        </div>
      </div>
    );
  }

  const currentJob = jobs[selectedJob];

  return (
    <div className="space-y-6">
      {header}
      <div className="flex h-[calc(100vh-220px)] gap-6">
        <JobMatchesList jobs={jobs} selectedJobIndex={selectedJob} onSelect={setSelectedJob} />
        <JobDetailsPanel
          job={currentJob}
          analysis={jobDetails[currentJob.id]}
          loadingAnalysis={loadingDetails === currentJob.id}
          applying={applying}
          applySuccess={applySuccess}
          applyError={applyError}
          onApply={() => handleApplyNow(currentJob)}
          primaryResumeId={primaryResumeId}
          onCoverLetterGenerated={(id) => setCoverLetterId(id)}
        />
      </div>
    </div>
  );
}
