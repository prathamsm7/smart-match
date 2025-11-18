"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { 
  FileText, Plus, Star, Download, Eye, Edit, Trash2, 
  Upload, Check, Clock, Briefcase,
  Copy, Share2, Sparkles, Crown, RefreshCw, AlertCircle
} from 'lucide-react';

// Resume interface matching Prisma model + computed fields
export interface ResumeData {
  id: string;
  userId: string;
  json: any; // Resume JSON data
  vectorId: string | null;
  isPrimary: boolean;
  createdAt: Date | string;
  // Computed/display fields (not in DB)
  name?: string;
  fileName?: string;
  lastModified?: string;
  fileSize?: string;
  views?: number;
  downloads?: number;
  applications?: number;
  tags?: string[];
  matchScore?: number;
}

interface ResumesViewProps {
  userId: string;
}

export function ResumesView({ userId }: ResumesViewProps) {
  const [resumes, setResumes] = useState<ResumeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settingPrimary, setSettingPrimary] = useState<string | null>(null);
  
  // Upload states
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Fetch resumes from API
  useEffect(() => {
    fetchResumes();
  }, []);

  async function fetchResumes() {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/resumes',{
        next: { revalidate: 900 },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch resumes');
      }

      // Transform dates from strings to Date objects
      const transformedResumes = data.resumes.map((resume: any) => ({
        ...resume,
        createdAt: new Date(resume.createdAt),
      }));

      setResumes(transformedResumes);
    } catch (err: any) {
      console.error('Error fetching resumes:', err);
      setError(err.message || 'Failed to load resumes');
    } finally {
      setLoading(false);
    }
  }

  async function handleSetPrimary(id: string) {
    try {
      setSettingPrimary(id);
      
      const response = await fetch('/api/resumes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resumeId: id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to set primary resume');
      }

      // Refresh resumes to get updated primary status
      await fetchResumes();
    } catch (err: any) {
      console.error('Error setting primary resume:', err);
      alert(err.message || 'Failed to set primary resume');
    } finally {
      setSettingPrimary(null);
    }
  }

  async function handleUpload(e?: React.FormEvent) {
    if (e) {
      e.preventDefault();
    }

    if (!file) {
      setUploadError('Please select a PDF file to upload');
      return;
    }

    // Check resume limit
    if (resumes.length >= 5) {
      setUploadError('Maximum limit of 5 resumes reached. Please delete a resume first.');
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('skipJobSearch', 'true'); // Skip job search for faster upload

      const response = await fetch('/api/resume/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload resume');
      }

      // Clear form
      setFile(null);
      
      // Refresh resumes list
      await fetchResumes();
    } catch (err: any) {
      console.error('Error uploading resume:', err);
      setUploadError(err.message || 'Failed to upload resume');
    } finally {
      setUploading(false);
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'application/pdf') {
      setFile(droppedFile);
      setUploadError(null);
    } else {
      setUploadError('Please upload a PDF file');
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === 'application/pdf') {
        setFile(selectedFile);
        setUploadError(null);
      } else {
        setUploadError('Please upload a PDF file');
      }
    }
  }

  const stats = useMemo(
    () => [
      { 
        label: "Total Resumes", 
        value: resumes.length, 
        max: 5, 
        icon: <FileText className="w-5 h-5" />, 
        color: "from-blue-500 to-cyan-500" 
      },
      { 
        label: "Total Views", 
        value: resumes.reduce((sum, r) => sum + (r.views || 0), 0), 
        icon: <Eye className="w-5 h-5" />, 
        color: "from-green-500 to-emerald-500" 
      },
      { 
        label: "Downloads", 
        value: resumes.reduce((sum, r) => sum + (r.downloads || 0), 0), 
        icon: <Download className="w-5 h-5" />, 
        color: "from-purple-500 to-pink-500" 
      },
      { 
        label: "Applications", 
        value: resumes.reduce((sum, r) => sum + (r.applications || 0), 0), 
        icon: <Briefcase className="w-5 h-5" />, 
        color: "from-orange-500 to-red-500" 
      }
    ],
    [resumes]
  );

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading resumes...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-400 mb-1">Error Loading Resumes</h3>
            <p className="text-gray-300 text-sm mb-3">{error}</p>
            <button
              onClick={fetchResumes}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-semibold transition flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Try Again</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center">
            My Resumes
            <FileText className="w-6 h-6 ml-2 text-blue-400" />
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Manage your resumes • {resumes.length} of 5 slots used
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchResumes}
            disabled={loading}
            className="p-2.5 bg-slate-700 hover:bg-slate-600 rounded-xl transition disabled:opacity-60 disabled:cursor-not-allowed"
            title="Refresh"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-6 border border-white/10 backdrop-blur-sm hover:border-white/20 transition"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center text-white shadow-lg`}>
                {stat.icon}
              </div>
              {stat.max && (
                <span className="text-xs text-gray-400">
                  {stat.value}/{stat.max}
                </span>
              )}
            </div>
            <h3 className="text-3xl font-bold mb-1">{stat.value}</h3>
            <p className="text-gray-400 text-sm">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-2xl p-8 border-2 border-dashed transition group ${
          isDragging
            ? 'border-blue-500 border-solid bg-blue-500/20'
            : 'border-blue-500/30 hover:border-blue-500/50'
        }`}
      >
        <form onSubmit={handleUpload} className="space-y-6">
          {/* File Upload Section */}
          <div className="text-center">
            <div className={`w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition shadow-lg shadow-blue-500/50 ${
              uploading ? 'animate-pulse' : ''
            }`}>
              {uploading ? (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              ) : (
                <Upload className="w-8 h-8" />
              )}
            </div>
            <h3 className="text-xl font-bold mb-2">
              {uploading ? 'Uploading Resume...' : 'Upload a New Resume'}
            </h3>
            <p className="text-gray-400 mb-4">
              Drag and drop your resume here or click to browse • Max 5 resumes
            </p>
            
            {/* File Input */}
            <div className="mb-4">
              <label className="relative cursor-pointer">
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileSelect}
                  disabled={uploading || resumes.length >= 5}
                  className="sr-only"
                />
                <span className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed">
                  {file ? 'Change File' : 'Select PDF File'}
                </span>
              </label>
              {file && (
                <p className="mt-2 text-sm text-blue-400">
                  Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>

            <div className="flex items-center justify-center gap-4 text-sm text-gray-400">
              <span>Supported formats: PDF</span>
              <span>•</span>
              <span>Max size: 10MB</span>
            </div>
          </div>

          {/* Upload Error */}
          {uploadError && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
              <p className="text-sm text-red-200">{uploadError}</p>
            </div>
          )}

          {/* Upload Button */}
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={uploading || !file || resumes.length >= 5}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all transform hover:scale-105 hover:shadow-lg hover:shadow-blue-500/50 disabled:transform-none"
            >
              {uploading ? 'Processing...' : 'Upload Resume'}
            </button>
          </div>
        </form>
      </div>

      {/* Info Banner */}
      <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-xl p-4 border border-yellow-500/20 flex items-start space-x-3">
        <Sparkles className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm text-gray-300">
            <span className="font-semibold text-yellow-400">Pro Tip:</span> Set a primary resume that will be used by default for job applications. You can customize resumes for specific job types!
          </p>
        </div>
      </div>

      {/* Resume List */}
      {resumes.length === 0 ? (
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-12 border border-white/10 backdrop-blur-sm text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-blue-400" />
          </div>
          <h3 className="text-xl font-bold mb-2">No Resumes Yet</h3>
          <p className="text-gray-400 mb-6">
            Upload your first resume to get started with job matching
          </p>
          <div className="space-y-4">
            <p className="text-gray-400 text-sm">
              Get started by uploading your resume to find matching job opportunities
            </p>
            <div className="flex flex-col items-center gap-3">
              <label className="relative cursor-pointer">
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileSelect}
                  disabled={uploading}
                  className="sr-only"
                />
                <span className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-xl font-semibold transition-all transform hover:scale-105 hover:shadow-lg hover:shadow-blue-500/50">
                  <Plus className="w-5 h-5 mr-2" />
                  Upload Your First Resume
                </span>
              </label>
              {file && (
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-xl font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Processing...' : `Upload ${file.name}`}
                </button>
              )}
            </div>
            {uploadError && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mt-4">
                <p className="text-sm text-red-200">{uploadError}</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {resumes.map((resume) => (
          <div
            key={resume.id}
            className={`bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-6 border transition-all ${
              resume.isPrimary
                ? 'border-blue-500/50 shadow-lg shadow-blue-500/20'
                : 'border-white/10 hover:border-white/20'
            }`}
          >
            <div className="flex items-start gap-6">
              {/* Resume Icon */}
              <div className="w-20 h-24 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl border border-blue-500/30 flex items-center justify-center flex-shrink-0 relative">
                <FileText className="w-10 h-10 text-blue-400" />
                {resume.isPrimary && (
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                    <Crown className="w-4 h-4" />
                  </div>
                )}
              </div>

              {/* Resume Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold">{resume.name || 'Untitled Resume'}</h3>
                      {resume.isPrimary && (
                        <span className="px-3 py-1 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-lg text-xs font-semibold text-yellow-400 flex items-center">
                          <Star className="w-3 h-3 mr-1 fill-current" />
                          Primary
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm mb-2">{resume.fileName}</p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {resume.tags?.map((tag, idx) => (
                        <span key={idx} className="px-2 py-1 bg-blue-500/20 border border-blue-500/30 rounded-lg text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Match Score */}
                  <div className="text-center ml-4">
                    <div className={`text-3xl font-bold ${
                      (resume.matchScore || 0) >= 90 ? 'text-green-400' : 
                      (resume.matchScore || 0) >= 80 ? 'text-yellow-400' : 
                      'text-orange-400'
                    }`}>
                      {resume.matchScore}%
                    </div>
                    <span className="text-xs text-gray-400">Avg Match</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-4 mb-4 p-4 bg-white/5 rounded-xl">
                  <div className="text-center">
                    <div className="flex items-center justify-center text-blue-400 mb-1">
                      <Eye className="w-4 h-4 mr-1" />
                      <span className="font-bold">{resume.views}</span>
                    </div>
                    <p className="text-xs text-gray-400">Views</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center text-green-400 mb-1">
                      <Download className="w-4 h-4 mr-1" />
                      <span className="font-bold">{resume.downloads}</span>
                    </div>
                    <p className="text-xs text-gray-400">Downloads</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center text-purple-400 mb-1">
                      <Briefcase className="w-4 h-4 mr-1" />
                      <span className="font-bold">{resume.applications}</span>
                    </div>
                    <p className="text-xs text-gray-400">Applications</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center text-gray-400 mb-1">
                      <Clock className="w-4 h-4 mr-1" />
                      <span className="font-bold text-xs">{resume.lastModified}</span>
                    </div>
                    <p className="text-xs text-gray-400">Modified</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {!resume.isPrimary && (
                    <button
                      onClick={() => handleSetPrimary(resume.id)}
                      disabled={settingPrimary === resume.id}
                      className="px-4 py-2 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 rounded-lg text-sm font-semibold transition flex items-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <Star className={`w-4 h-4 ${settingPrimary === resume.id ? 'animate-spin' : ''}`} />
                      <span>{settingPrimary === resume.id ? 'Setting...' : 'Set as Primary'}</span>
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
                  </button>
                  <button className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm font-semibold transition flex items-center space-x-2">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        </div>
      )}

      {/* Empty State Message if max reached */}
      {resumes.length >= 5 && (
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-8 border border-white/10 backdrop-blur-sm text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-gray-500 to-gray-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold mb-2">Maximum Resumes Reached</h3>
          <p className="text-gray-400">
            You've reached the maximum limit of 5 resumes. Delete an existing resume to upload a new one.
          </p>
        </div>
      )}
    </div>
  );
}

