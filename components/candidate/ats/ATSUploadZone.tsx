"use client";

import React from "react";

interface ATSUploadZoneProps {
  file: File | null;
  triggerUpload: () => void;
  showProgressBar: boolean;
  uploadProgress: number;
  startScan: () => void;
}

export function ATSUploadZone({
  file,
  triggerUpload,
  showProgressBar,
  uploadProgress,
  startScan,
}: ATSUploadZoneProps) {
  return (
    <div>
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
            ? 'File ready for AI analysis. Click "Run ATS Analysis" to continue.'
            : "Our AI analyzes 40+ ATS criteria — keywords, formatting, section scores, readability. Your file is never stored."}
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
      {file && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: 16,
          }}
        >
          <button
            className="btn btn-grad"
            style={{
              padding: "11px 36px",
              fontSize: 13,
              borderRadius: 12,
            }}
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
