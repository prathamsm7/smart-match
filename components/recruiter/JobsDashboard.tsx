"use client";

import { useState } from "react";
import { Plus, Search, AlertCircle, Briefcase, ChevronRight, Building2 } from "lucide-react";
import { JobPostingForm } from "./JobPostingForm";
import { JobListShimmer } from "@/components/dashboard/JobListShimmer";
import { JobStats } from "./jobs/JobStats";
import { JobCard } from "./jobs/JobCard";
import { ApplicantList } from "./jobs/ApplicantList";
import { CandidateDetail } from "./jobs/CandidateDetail";
import { useJobs } from "@/hooks/useJobs";
import { useApplications } from "@/hooks/useApplications";
import { Job } from "@/types";

export function JobsDashboard({ userId }: { userId: string }) {
  const { jobs, loading, error, fetchJobs, deleteJob } = useJobs(userId);
  const {
    applications: jobApplications,
    loading: loadingApplications,
    fetchApplications: fetchJobApplications,
    clearApplications
  } = useApplications();

  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null);

  // View states
  const [selectedJobIndex, setSelectedJobIndex] = useState<number | null>(null);
  const [selectedCandidateIndex, setSelectedCandidateIndex] = useState<number | null>(null);

  async function handleDelete(jobId: string) {
    if (!confirm("Are you sure you want to delete this job posting? This action cannot be undone.")) {
      return;
    }

    try {
      setDeletingJobId(jobId);
      await deleteJob(jobId);
    } catch (err: any) {
      alert(err.message || "Failed to delete job");
    } finally {
      setDeletingJobId(null);
    }
  }

  function handleEdit(job: Job, e: React.MouseEvent) {
    e.stopPropagation();
    setEditingJob(job);
    setShowForm(true);
  }

  function handleFormSuccess() {
    setShowForm(false);
    setEditingJob(null);
    fetchJobs();
  }

  function handleFormCancel() {
    setShowForm(false);
    setEditingJob(null);
  }

  function handleSelectJob(index: number) {
    setSelectedJobIndex(index);
    setSelectedCandidateIndex(null);
    fetchJobApplications(jobs[index].id);
  }

  function handleBackToJobs() {
    setSelectedJobIndex(null);
    setSelectedCandidateIndex(null);
    clearApplications();
  }

  const filteredJobs = jobs.filter((job) => {
    const search = searchTerm.toLowerCase();
    return (
      job.title.toLowerCase().includes(search) ||
      (job.employerName && job.employerName.toLowerCase().includes(search)) ||
      (job.location && job.location.toLowerCase().includes(search))
    );
  });

  const currentJob = selectedJobIndex !== null ? jobs[selectedJobIndex] : null;
  const currentCandidate = selectedCandidateIndex !== null ? jobApplications[selectedCandidateIndex]?.candidate : null;
  const currentApplication = selectedCandidateIndex !== null ? jobApplications[selectedCandidateIndex] : null;

  if (loading) {
    return <JobListShimmer count={3} />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-500/10 mb-4">
          <AlertCircle className="w-6 h-6 text-red-500" />
        </div>
        <h3 className="text-lg font-medium text-white mb-2">Failed to load jobs</h3>
        <p className="text-gray-400 mb-6">{error}</p>
        <button
          onClick={fetchJobs}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (showForm) {
    return (
      <JobPostingForm
        initialData={editingJob || undefined}
        onSuccess={handleFormSuccess}
        onCancel={handleFormCancel}
      />
    );
  }

  // Job List View
  if (selectedJobIndex === null) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">My Job Postings</h2>
            <p className="text-gray-400 mt-1">Manage and track your job postings</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Post New Job</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search jobs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl focus:outline-none focus:border-blue-500 transition"
          />
        </div>

        {/* Stats Grid */}
        <JobStats jobs={jobs} />

        {/* Jobs List */}
        {filteredJobs.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/50 border border-slate-800 rounded-xl">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800 mb-4">
              <Briefcase className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">
              {searchTerm ? "No jobs match your search" : "No job postings yet"}
            </h3>
            <p className="text-gray-400 max-w-md mx-auto mb-6">
              {searchTerm
                ? "Try adjusting your search terms"
                : "Start posting jobs to attract top talent"}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowForm(true)}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-lg transition-all flex items-center gap-2 mx-auto"
              >
                <Plus className="w-5 h-5" />
                Post Your First Job
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredJobs.map((job, index) => (
              <JobCard
                key={job.id}
                job={job}
                onSelect={() => handleSelectJob(index)}
                onEdit={(e) => handleEdit(job, e)}
                onDelete={(e) => {
                  e.stopPropagation();
                  handleDelete(job.id);
                }}
                isDeleting={deletingJobId === job.id}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Job Detail View with Applicants
  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={handleBackToJobs}
        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition flex items-center space-x-2"
      >
        <ChevronRight className="w-4 h-4 rotate-180" />
        <span>Back to Jobs</span>
      </button>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Job Info & Applicants List */}
        <div className={selectedCandidateIndex !== null ? "lg:col-span-1" : "lg:col-span-3"}>
          {/* Job Card (Summary) */}
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-6 border border-white/10 mb-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <Building2 className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-1">{currentJob?.title}</h2>
                <p className="text-gray-400">{currentJob?.employerName || "Your Company"}</p>
              </div>
            </div>
            {/* ... (Job Summary Details - could be extracted too) ... */}
          </div>

          {/* Applicants List */}
          <ApplicantList
            applications={jobApplications}
            loading={loadingApplications}
            selectedIndex={selectedCandidateIndex}
            onSelect={setSelectedCandidateIndex}
          />
        </div>

        {/* Right Column - Candidate Details */}
        {selectedCandidateIndex !== null && currentCandidate && currentApplication && (
          <CandidateDetail candidate={currentCandidate} application={currentApplication} />
        )}
      </div>
    </div>
  );
}
