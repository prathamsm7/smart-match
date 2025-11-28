"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { AlertCircle, FileText, Eye, Download, Briefcase, RefreshCw } from 'lucide-react';
import { ResumesHeader } from './resumes/ResumesHeader';
import { ResumeStatsGrid } from './resumes/ResumeStatsGrid';
import { ResumeUploader } from './resumes/ResumeUploader';
import { ProTipBanner } from './resumes/ProTipBanner';
import { ResumeCard } from './resumes/ResumeCard';
import { ResumeLimitBanner } from './resumes/ResumeLimitBanner';
import type { ResumeData, ResumeStat } from './resumes/types';
import { resumesService } from '@/lib/services';

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

      const data = await resumesService.fetchResumes({ revalidate: 900 });

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

      await resumesService.setPrimaryResume(id);

      // Refresh resumes to get updated primary status
      await fetchResumes();
    } catch (err: any) {
      console.error('Error setting primary resume:', err);
      alert(err.message || 'Failed to set primary resume');
    } finally {
      setSettingPrimary(null);
    }
  }

  async function handleUpload() {
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
      await resumesService.uploadResume(file, { skipJobSearch: true });

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

  function handleSelectedFile(selectedFile: File) {
    if (selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setUploadError(null);
    } else {
      setUploadError('Please upload a PDF file');
    }
  }

  const stats = useMemo<ResumeStat[]>(
    () => [
      {
        label: "Total Resumes",
        value: resumes.length,
        max: 5,
        icon: <FileText className="w-5 h-5" />,
        color: "from-blue-500 to-cyan-500",
      },
      {
        label: "Total Views",
        value: resumes.reduce((sum, r) => sum + (r.views || 0), 0),
        icon: <Eye className="w-5 h-5" />,
        color: "from-green-500 to-emerald-500",
      },
      {
        label: "Downloads",
        value: resumes.reduce((sum, r) => sum + (r.downloads || 0), 0),
        icon: <Download className="w-5 h-5" />,
        color: "from-purple-500 to-pink-500",
      },
      {
        label: "Applications",
        value: resumes.reduce((sum, r) => sum + (r.applications || 0), 0),
        icon: <Briefcase className="w-5 h-5" />,
        color: "from-orange-500 to-red-500",
      },
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

  const canUpload = resumes.length < 5;

  return (
    <div className="space-y-6">
      <ResumesHeader resumeCount={resumes.length} onRefresh={fetchResumes} loading={loading} />
      <ResumeStatsGrid stats={stats} />
      <ResumeUploader
        file={file}
        uploading={uploading}
        uploadError={uploadError}
        isDragging={isDragging}
        canUpload={canUpload}
        onSubmit={handleUpload}
        onFileSelect={handleSelectedFile}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      />
      <ProTipBanner />

      {resumes.length > 0 && (
        <div className="space-y-4">
          {resumes.map((resume) => (
            <ResumeCard
              key={resume.id}
              resume={resume}
              onSetPrimary={handleSetPrimary}
              settingPrimaryId={settingPrimary}
            />
          ))}
        </div>
      )}

      <ResumeLimitBanner visible={resumes.length >= 5} />
    </div>
  );
}

