"use client";

import { useState, useEffect } from "react";
import {
  Briefcase,
  Building2,
  MapPin,
  DollarSign,
  Users,
  Edit,
  Trash2,
  Plus,
  Search,
  AlertCircle,
  Clock,
  TrendingUp,
  CheckCircle,
  XCircle,
  ChevronRight,
  Mail,
  Phone,
  Award,
  Code,
  Languages,
  FileText,
  Download,
  Eye,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { JobPostingForm } from "./JobPostingForm";
import { JobListShimmer } from "./JobListShimmer";

interface Job {
  id: string;
  title: string;
  employerName: string | null;
  description: string | null;
  location: string | null;
  salary: string | null;
  employmentType: string | null;
  applyLink: string | null;
  requirements: any;
  responsibilities: any;
  createdAt: string;
  _count: {
    applications: number;
  };
}

interface Candidate {
  name: string;
  email: string;
  phone: string | null;
  city: string | null;
  experience: number;
  skills: string[];
  summary: string;
  languages: string[];
  education: any[];
  experience_details: any[];
  socialLinks: any[];
  softSkills: string[];
  categorizedSkills: any;
}

interface Application {
  id: string;
  appliedDate: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  candidate: Candidate;
  matchScore?: number;
}

interface JobWithApplications extends Job {
  applications?: Application[];
}

export function JobsDashboard({ userId }: { userId: string }) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null);
  
  // View states
  const [selectedJobIndex, setSelectedJobIndex] = useState<number | null>(null);
  const [selectedCandidateIndex, setSelectedCandidateIndex] = useState<number | null>(null);
  const [jobApplications, setJobApplications] = useState<Application[]>([]);
  const [loadingApplications, setLoadingApplications] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  async function fetchJobs() {
    try {
      setLoading(true);
      const response = await fetch("/api/jobs?myJobs=true");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch jobs");
      }

      setJobs(data.jobs || []);
    } catch (err: any) {
      console.error("Error fetching jobs:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchJobApplications(jobId: string) {
    try {
      setLoadingApplications(true);
      const response = await fetch(`/api/jobs/${jobId}/applications`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch applications");
      }

      // Use real match scores from API (calculated based on skills vs job requirements)
      setJobApplications(data.applications || []);
    } catch (err: any) {
      console.error("Error fetching applications:", err);
      setJobApplications([]);
    } finally {
      setLoadingApplications(false);
    }
  }

  async function handleDelete(jobId: string) {
    if (!confirm("Are you sure you want to delete this job posting? This action cannot be undone.")) {
      return;
    }

    try {
      setDeletingJobId(jobId);
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete job");
      }

      setJobs(jobs.filter((job) => job.id !== jobId));
    } catch (err: any) {
      console.error("Error deleting job:", err);
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
    setJobApplications([]);
  }

  const filteredJobs = jobs.filter((job) => {
    const search = searchTerm.toLowerCase();
    return (
      job.title.toLowerCase().includes(search) ||
      (job.employerName && job.employerName.toLowerCase().includes(search)) ||
      (job.location && job.location.toLowerCase().includes(search))
    );
  });

  // Stats
  const stats = [
    { 
      label: "Total Jobs", 
      value: jobs.length, 
      icon: <Briefcase className="w-5 h-5" />, 
      color: "from-blue-500 to-cyan-500" 
    },
    { 
      label: "Total Applications", 
      value: jobs.reduce((sum, job) => sum + job._count.applications, 0), 
      icon: <Users className="w-5 h-5" />, 
      color: "from-green-500 to-emerald-500" 
    },
    { 
      label: "Jobs with Applications", 
      value: jobs.filter((job) => job._count.applications > 0).length, 
      icon: <CheckCircle className="w-5 h-5" />, 
      color: "from-purple-500 to-pink-500" 
    },
    { 
      label: "Active Jobs", 
      value: jobs.length, 
      icon: <TrendingUp className="w-5 h-5" />, 
      color: "from-orange-500 to-red-500" 
    },
  ];

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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-6 border border-white/10 backdrop-blur-sm"
            >
              <div
                className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center text-white shadow-lg mb-4`}
              >
                {stat.icon}
              </div>
              <h3 className="text-3xl font-bold mb-1">{stat.value}</h3>
              <p className="text-gray-400 text-sm">{stat.label}</p>
            </div>
          ))}
        </div>

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
              <div
                key={job.id}
                className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-6 border border-white/10 backdrop-blur-sm hover:border-blue-500/30 transition cursor-pointer"
                onClick={() => handleSelectJob(index)}
              >
                <div className="flex items-start gap-6">
                  {/* Company Logo */}
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-8 h-8" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold mb-2">{job.title}</h3>
                        <p className="text-gray-400 flex items-center mb-3">
                          <Building2 className="w-4 h-4 mr-2" />
                          {job.employerName || "Your Company"}
                        </p>
                        {job.description && (
                          <p className="text-gray-300 line-clamp-2">{job.description}</p>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={(e) => handleEdit(job, e)}
                          className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(job.id);
                          }}
                          disabled={deletingJobId === job.id}
                          className="p-2 bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded-lg transition"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-4 gap-4 p-4 bg-white/5 rounded-xl mb-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-400">{job._count.applications}</p>
                        <p className="text-xs text-gray-400">Applications</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-400">-</p>
                        <p className="text-xs text-gray-400">Views</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-purple-400">
                          {format(new Date(job.createdAt), "MMM d")}
                        </p>
                        <p className="text-xs text-gray-400">Posted</p>
                      </div>
                      <div className="text-center">
                        <span className="inline-block px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-xs font-semibold">
                          Active
                        </span>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between">
                      <div className="flex gap-4 text-sm text-gray-400">
                        {job.location && (
                          <span className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {job.location}
                          </span>
                        )}
                        {job.salary && (
                          <span className="flex items-center text-green-400">
                            <DollarSign className="w-4 h-4 mr-1" />
                            {job.salary}
                          </span>
                        )}
                        {job.employmentType && (
                          <span className="px-2 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs">
                            {job.employmentType}
                          </span>
                        )}
                      </div>
                      <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg font-semibold flex items-center">
                        View Details
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
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
          {/* Job Card */}
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

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 bg-white/5 rounded-xl text-center">
                <p className="text-2xl font-bold text-blue-400">{currentJob?._count.applications || 0}</p>
                <p className="text-xs text-gray-400">Applicants</p>
              </div>
              <div className="p-3 bg-white/5 rounded-xl text-center">
                <p className="text-2xl font-bold text-green-400">-</p>
                <p className="text-xs text-gray-400">Views</p>
              </div>
            </div>

            {currentJob?.location && (
              <div className="flex items-center text-sm text-gray-400 mb-2">
                <MapPin className="w-4 h-4 mr-2" />
                {currentJob.location}
              </div>
            )}
            {currentJob?.salary && (
              <div className="flex items-center text-sm text-green-400">
                <DollarSign className="w-4 h-4 mr-2" />
                {currentJob.salary}
              </div>
            )}
          </div>

          {/* Applicants List */}
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-6 border border-white/10">
            <h3 className="text-xl font-bold mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2 text-blue-400" />
              Applicants ({jobApplications.length})
            </h3>

            {loadingApplications ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : jobApplications.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No applications yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {jobApplications.map((application, idx) => {
                  const initials = application.candidate.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2);

                  return (
                    <div
                      key={application.id}
                      onClick={() => setSelectedCandidateIndex(idx)}
                      className={`p-4 rounded-xl border cursor-pointer transition ${
                        selectedCandidateIndex === idx
                          ? "bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-500/50"
                          : "bg-white/5 border-white/10 hover:bg-white/10"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center font-bold text-sm">
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold truncate">{application.candidate.name}</h4>
                          <p className="text-sm text-gray-400 truncate">{application.candidate.email}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="text-lg font-bold text-yellow-400">
                              {application.matchScore}%
                            </div>
                            <span className="text-xs text-gray-400">Match</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Candidate Details */}
        {selectedCandidateIndex !== null && currentCandidate && currentApplication && (
          <div className="lg:col-span-2 space-y-6">
            {/* Candidate Header */}
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-8 border border-white/10">
              <div className="flex items-start gap-6 mb-6">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center font-bold text-3xl">
                  {currentCandidate.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </div>
                <div className="flex-1">
                  <h2 className="text-3xl font-bold mb-2">{currentCandidate.name}</h2>
                  <div className="space-y-2 text-gray-300">
                    <p className="flex items-center">
                      <Mail className="w-4 h-4 mr-2 text-blue-400" />
                      {currentCandidate.email}
                    </p>
                    {currentCandidate.phone && (
                      <p className="flex items-center">
                        <Phone className="w-4 h-4 mr-2 text-green-400" />
                        {currentCandidate.phone}
                      </p>
                    )}
                    {currentCandidate.city && (
                      <p className="flex items-center">
                        <MapPin className="w-4 h-4 mr-2 text-purple-400" />
                        {currentCandidate.city}
                      </p>
                    )}
                    <p className="flex items-center">
                      <Award className="w-4 h-4 mr-2 text-orange-400" />
                      {currentCandidate.experience} years experience
                    </p>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-5xl font-bold text-yellow-400 mb-2">
                    {currentApplication.matchScore}%
                  </div>
                  <p className="text-sm text-gray-400">Match Score</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg font-semibold hover:shadow-lg hover:shadow-green-500/30 transition flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Accept
                </button>
                <button className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 rounded-lg font-semibold hover:shadow-lg hover:shadow-red-500/30 transition flex items-center justify-center">
                  <XCircle className="w-5 h-5 mr-2" />
                  Reject
                </button>
                <button className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition">
                  <Download className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Summary */}
            {currentCandidate.summary && (
              <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-6 border border-white/10">
                <h3 className="text-xl font-bold mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-blue-400" />
                  Summary
                </h3>
                <p className="text-gray-300 leading-relaxed">{currentCandidate.summary}</p>
              </div>
            )}

            {/* Skills */}
            {currentCandidate.skills && currentCandidate.skills.length > 0 && (
              <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl p-6 border border-green-500/20">
                <h3 className="text-xl font-bold mb-4 text-green-400 flex items-center">
                  <Code className="w-5 h-5 mr-2" />
                  Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {currentCandidate.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-lg font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Categorized Skills */}
            {currentCandidate.categorizedSkills && Object.keys(currentCandidate.categorizedSkills).length > 0 && (
              <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-6 border border-white/10">
                <h3 className="text-xl font-bold mb-4 flex items-center">
                  <Code className="w-5 h-5 mr-2 text-cyan-400" />
                  Skills by Category
                </h3>
                <div className="space-y-4">
                  {Object.entries(currentCandidate.categorizedSkills as Record<string, string[]>).map(([category, skills]) => (
                    skills && skills.length > 0 && (
                      <div key={category}>
                        <h4 className="text-sm font-semibold text-gray-400 mb-2 capitalize">
                          {category}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {skills.map((skill: string, idx: number) => (
                            <span
                              key={idx}
                              className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-lg text-sm"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}

            {/* Languages */}
            {currentCandidate.languages && currentCandidate.languages.length > 0 && (
              <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-6 border border-white/10">
                <h3 className="text-lg font-bold mb-4 flex items-center">
                  <Languages className="w-5 h-5 mr-2 text-purple-400" />
                  Languages
                </h3>
                <div className="flex flex-wrap gap-2">
                  {currentCandidate.languages.map((lang, idx) => (
                    <div
                      key={idx}
                      className="px-3 py-2 bg-purple-500/20 border border-purple-500/30 rounded-lg"
                    >
                      {typeof lang === 'string' ? lang : (lang as any).language || lang}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Soft Skills */}
            {currentCandidate.softSkills && currentCandidate.softSkills.length > 0 && (
              <div className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 rounded-2xl p-6 border border-orange-500/20">
                <h3 className="text-lg font-bold mb-4 text-orange-400 flex items-center">
                  <Award className="w-5 h-5 mr-2" />
                  Soft Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {currentCandidate.softSkills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-2 bg-orange-500/20 border border-orange-500/30 rounded-lg text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Experience Details */}
            {currentCandidate.experience_details && currentCandidate.experience_details.length > 0 && (
              <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-6 border border-white/10">
                <h3 className="text-xl font-bold mb-4 flex items-center">
                  <Briefcase className="w-5 h-5 mr-2 text-blue-400" />
                  Experience
                </h3>
                <div className="space-y-4">
                  {currentCandidate.experience_details.map((exp: any, idx: number) => (
                    <div key={idx} className="p-4 bg-white/5 rounded-xl border border-white/10">
                      <h4 className="font-bold text-lg">{exp.title || exp.role}</h4>
                      <p className="text-blue-400">{exp.company}</p>
                      <p className="text-sm text-gray-400 mt-1">
                        {exp.startDate} - {exp.endDate || "Present"}
                      </p>
                      {exp.description && (
                        <p className="text-gray-300 mt-2 text-sm">{exp.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Applied Date */}
            <div className="text-center text-sm text-gray-400">
              Applied {formatDistanceToNow(new Date(currentApplication.appliedDate), { addSuffix: true })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
