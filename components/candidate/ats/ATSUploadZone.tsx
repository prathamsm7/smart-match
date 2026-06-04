"use client";

import React from "react";

interface ATSUploadZoneProps {
  file: File | null;
  jobDescription: string;
  onJobDescriptionChange: (value: string) => void;
  triggerUpload: () => void;
  showProgressBar: boolean;
  uploadProgress: number;
  startScan: () => void;
}

export function ATSUploadZone({
  file,
  jobDescription,
  onJobDescriptionChange,
  triggerUpload,
  showProgressBar,
  uploadProgress,
  startScan,
}: ATSUploadZoneProps) {
  const hasJd = jobDescription.trim().length > 0;

  return (
    <div className="upload-landing">
      <div
        className={`upload-zone${file ? " loaded" : ""}`}
        onClick={triggerUpload}
      >
        {!file && (
          <div className="upload-ico-wrap">
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
              <path
                d="M13 18V8M9 11l4-4 4 4"
                stroke="url(#ug)"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <rect
                x="3"
                y="3"
                width="20"
                height="20"
                rx="4"
                stroke="url(#ug)"
                strokeWidth="1.4"
                opacity=".3"
              />
              <defs>
                <linearGradient id="ug" x1="3" y1="3" x2="23" y2="23">
                  <stop stopColor="#00d4ff" />
                  <stop offset="1" stopColor="#2979ff" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        )}
        <div className="upload-title">
          {file ? file.name : "Drop your resume here or click to browse"}
        </div>
        <div className="upload-sub">
          {file
            ? "Ready to scan — add a job description below for role-specific scoring."
            : "PDF, Word, or text · analyzed in seconds · not stored"}
        </div>
        {!file && (
          <div className="fmt-row">
            <span className="fmt">PDF</span>
            <span className="fmt">DOCX</span>
            <span className="fmt">DOC</span>
            <span className="fmt">TXT</span>
          </div>
        )}
        {showProgressBar && (
          <div className="progress-bar" style={{ display: "block" }}>
            <div
              className="progress-fill"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        )}
        {file && (
          <div className="file-pill">
            <div className="fp-ico">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect
                  x="2"
                  y="1"
                  width="12"
                  height="14"
                  rx="2"
                  stroke="#00e5c3"
                  strokeWidth="1.3"
                />
                <path
                  d="M4.5 5.5h7M4.5 8h7M4.5 10.5h4"
                  stroke="#00e5c3"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div>
              <div className="fp-name">{file.name}</div>
              <div className="fp-size">
                {Math.round(file.size / 1024)} KB · ready
              </div>
            </div>
            <div className="fp-check">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path
                  d="M2 5l2 2L8 3"
                  stroke="#00e5c3"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        )}
      </div>

      <div className={`jd-card${hasJd ? " jd-card--active" : ""}`}>
        <div className="jd-card-head">
          <div className="jd-card-title-wrap">
            <span className="jd-card-icon" aria-hidden>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect
                  x="2"
                  y="1"
                  width="12"
                  height="14"
                  rx="2"
                  stroke="currentColor"
                  strokeWidth="1.2"
                />
                <path
                  d="M4.5 5h7M4.5 7.5h5M4.5 10h6"
                  stroke="currentColor"
                  strokeWidth="1.1"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <div>
              <label htmlFor="ats-jd" className="jd-card-label">
                Target job description
              </label>
              <p className="jd-card-hint">
                Optional — unlocks keyword match & role-specific fixes
              </p>
            </div>
          </div>
          <span className="jd-card-badge">Recommended</span>
        </div>
        <textarea
          id="ats-jd"
          className="ats-jd-input"
          placeholder="Paste the job posting here for tailored ATS scoring…"
          value={jobDescription}
          onChange={(e) => onJobDescriptionChange(e.target.value)}
          rows={4}
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {file && (
        <div className="upload-actions">
          <button
            className="btn btn-grad upload-cta"
            onClick={(e) => {
              e.stopPropagation();
              startScan();
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle
                cx="7"
                cy="7"
                r="5.5"
                stroke="white"
                strokeWidth="1.4"
              />
              <path
                d="M4 7h6M8.5 5l2 2-2 2"
                stroke="white"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Run ATS Analysis
          </button>
        </div>
      )}
    </div>
  );
}
