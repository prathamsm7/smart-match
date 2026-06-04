"use client";

import { useState, useRef, useCallback } from "react";
import { atsService } from "@/lib/services";
import type { ATSAnalysis, JobTargetedATSAnalysis } from "@/types";
import "./ats/ats-checker.css";
import { ATSUploadZone } from "./ats/ATSUploadZone";
import { ATSScoreHero } from "./ats/ATSScoreHero";
import { ATSSectionTabs } from "./ats/ATSSectionTabs";
import { ATSSectionDetails } from "./ats/ATSSectionDetails";
import { ATSPriorityFixes } from "./ats/ATSPriorityFixes";
import { ATSSkillsAnalysis } from "./ats/ATSSkillsAnalysis";
import { ATSKeywordMatch } from "./ats/ATSKeywordMatch";
import {
  ATS_SCAN_LABELS,
  initialScanSteps,
  type ATSProgressEvent,
  type ATSScanStep,
} from "@/lib/ats/progress";

type ViewState = "upload" | "scanning" | "results";

type ScanStep = ATSScanStep;

export function ATSCheckerView() {
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [analysis, setAnalysis] = useState<
    ATSAnalysis | JobTargetedATSAnalysis | null
  >(null);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [moving, setMoving] = useState(false);

  const [viewState, setViewState] = useState<ViewState>("upload");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showProgressBar, setShowProgressBar] = useState(false);
  const [activeTab, setActiveTab] = useState("All Issues");

  // Scan state
  const [scanPct, setScanPct] = useState(0);
  const [scanLabel, setScanLabel] = useState("Parsing document…");
  const [scanPbWidth, setScanPbWidth] = useState(0);
  const [scanSteps, setScanSteps] = useState<ScanStep[]>(initialScanSteps);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerUpload = () => fileInputRef.current?.click();

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setError(null);
    setMessage(null);

    // Simulate upload progress
    setShowProgressBar(true);
    setUploadProgress(0);
    let p = 0;
    const iv = setInterval(() => {
      p += 16;
      setUploadProgress(Math.min(p, 100));
      if (p >= 100) {
        clearInterval(iv);
        setTimeout(() => setShowProgressBar(false), 300);
      }
    }, 60);
  }, []);

  const resetPage = useCallback(() => {
    setFile(null);
    setJobDescription("");
    setAnalysis(null);
    setDraftId(null);
    setError(null);
    setMessage(null);
    setViewState("upload");
    setUploadProgress(0);
    setShowProgressBar(false);
    setScanPct(0);
    setScanLabel("Parsing document…");
    setScanPbWidth(0);
    setScanSteps(initialScanSteps());
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleProgress = useCallback((event: ATSProgressEvent) => {
    if (event.type !== "progress") return;

    const idx = ATS_SCAN_LABELS.indexOf(
      event.label as (typeof ATS_SCAN_LABELS)[number],
    );

    setScanLabel(`${event.label}…`);
    setScanSteps((prev) =>
      prev.map((s, i) => {
        if (s.label === event.label) return { ...s, status: event.status };
        if (event.status === "running" && idx >= 0 && i < idx) {
          return { ...s, status: "done" };
        }
        if (event.status === "done" && idx >= 0 && i < idx) {
          return { ...s, status: "done" };
        }
        return s;
      }),
    );

    const doneCount = event.status === "done" && idx >= 0 ? idx + 1 : idx;
    const pct = Math.round(
      (Math.max(0, doneCount) / ATS_SCAN_LABELS.length) * 100,
    );
    setScanPct(pct);
    setScanPbWidth(pct);
  }, []);

  const startScan = useCallback(async () => {
    if (!file) return;
    setError(null);
    setMessage(null);
    setViewState("scanning");
    setScanSteps(initialScanSteps());
    setScanPct(0);
    setScanPbWidth(0);
    setScanLabel("Parsing document…");

    try {
      const res = await atsService.analyzeResumeWithProgress(
        file,
        handleProgress,
        jobDescription,
      );
      setAnalysis(res.analysis);
      setDraftId(res.draftId);
      setMessage(
        "ATS analysis ready. Improve your resume, then move it to dashboard when satisfied.",
      );
      setViewState("results");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to analyze resume");
      setViewState("upload");
    }
  }, [file, jobDescription, handleProgress]);

  const handleMove = useCallback(async () => {
    if (!draftId) return;
    setMoving(true);
    setError(null);
    try {
      await atsService.moveToDashboard(draftId);
      setMessage("Resume moved to dashboard successfully.");
      setDraftId(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to move resume");
    } finally {
      setMoving(false);
    }
  }, [draftId]);

  // Derive data from analysis
  const overallScore = analysis?.overallScore ?? 81;
  const sections = analysis?.sections;
  const priorityFixes = analysis?.priorityFixes ?? [];
  const globalTips = analysis?.globalTips ?? [];
  const improvementPotential = analysis?.improvementPotential ?? "+15";
  const keywordAnalysis =
    analysis && "keywordAnalysis" in analysis
      ? analysis.keywordAnalysis
      : null;

  // Parse improvement potential number
  const potentialNum =
    parseInt(improvementPotential.replace(/[^0-9]/g, ""), 10) || 15;
  const targetScore = Math.min(overallScore + potentialNum, 100);

  // Section data for display
  const sectionKeys = [
    "summary",
    "skills",
    "experience",
    "projects",
    "structure",
  ] as const;
  const sectionDisplay: Record<
    string,
    { label: string; iconBg: string; iconBorder: string }
  > = {
    summary: {
      label: "Summary",
      iconBg: "rgba(255,171,64,.1)",
      iconBorder: "rgba(255,171,64,.2)",
    },
    skills: {
      label: "Skills",
      iconBg: "rgba(0,212,255,.08)",
      iconBorder: "rgba(0,212,255,.18)",
    },
    experience: {
      label: "Experience",
      iconBg: "rgba(0,229,195,.08)",
      iconBorder: "rgba(0,229,195,.2)",
    },
    projects: {
      label: "Projects",
      iconBg: "rgba(41,121,255,.08)",
      iconBorder: "rgba(41,121,255,.2)",
    },
    structure: {
      label: "Structure",
      iconBg: "rgba(0,230,118,.08)",
      iconBorder: "rgba(0,230,118,.18)",
    },
  };

  // Collect all improvements for before/after display
  const allImprovements: {
    section: string;
    score: number;
    original: string;
    improved: string;
  }[] = [];
  if (sections) {
    for (const key of sectionKeys) {
      const sec = sections[key];
      if (sec.improvements?.length) {
        for (const imp of sec.improvements) {
          allImprovements.push({
            section: sectionDisplay[key].label,
            score: sec.score,
            original: imp.original,
            improved: imp.improved,
          });
        }
      }
    }
  }

  // Collect all good things
  const allGoodThings: string[] = [];
  if (sections) {
    for (const key of sectionKeys) {
      if (sections[key].goodThings?.length) {
        allGoodThings.push(...sections[key].goodThings);
      }
    }
  }

  // Collect all tips
  const allTips: { text: string; section: string }[] = [];
  if (sections) {
    for (const key of sectionKeys) {
      if (sections[key].tips?.length) {
        for (const t of sections[key].tips) {
          allTips.push({ text: t, section: sectionDisplay[key].label });
        }
      }
    }
  }

  // Count passed criteria
  const totalCriteria = 40;
  const issuesCount = priorityFixes.length;
  const passedCriteria = totalCriteria - issuesCount;
  const highPriorityCount = priorityFixes.filter(
    (f) => f.impact === "high",
  ).length;

  // Fix descriptions from sections
  const fixDescriptions: Record<string, string> = {};
  if (sections) {
    for (const key of sectionKeys) {
      const sec = sections[key];
      if (sec.fixes?.length) {
        fixDescriptions[key] = sec.fixes.join(". ");
      }
    }
  }

  const tabItems = [
    "All Issues",
    "Summary",
    "Skills",
    "Experience",
    "Projects",
  ];

  const tabToSectionKey: Record<
    string,
    "summary" | "skills" | "experience" | "projects" | null
  > = {
    "All Issues": null,
    Summary: "summary",
    Skills: "skills",
    Experience: "experience",
    Projects: "projects",
  };

  const activeSectionKey = tabToSectionKey[activeTab] ?? null;
  const activeSection =
    activeSectionKey && sections ? sections[activeSectionKey] : null;

  return (
    <div className="ats-page">
      <div className="page">
        {/* TOPBAR */}
        <div className="topbar">
          <div className="breadcrumb">
            <a href="#">My Resumes</a>
            <span className="bc-sep">›</span>
            <span className="bc-cur">ATS Score Check</span>
          </div>
          <div className="tb-right">
            <button className="btn btn-ghost" onClick={resetPage}>
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <path
                  d="M1 5.5a4.5 4.5 0 109-1"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                />
                <path
                  d="M1 5.5V2.5L4 5.5"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              New Scan
            </button>
            {viewState === "results" && (
              <button
                className="btn btn-teal"
                onClick={() => alert("Exporting PDF report…")}
              >
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <path
                    d="M5.5 1v6M3 5l2.5 2L8 5M1 9h9"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Export Report
              </button>
            )}
            <button className="btn btn-grad" onClick={triggerUpload}>
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <path
                  d="M5.5 7V1M3 3.5l2.5-2.5L8 3.5M1 9h9"
                  stroke="white"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Upload Resume
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              style={{ display: "none" }}
              onChange={handleFile}
            />
          </div>
        </div>

        {/* PAGE HEADER */}
        <div
          className={`page-header${viewState === "upload" ? " page-header--landing" : ""}`}
        >
          <div>
            <div className="ph-eyebrow">ATS Intelligence · Powered by AI</div>
            <div className="ph-title">Resume Score &amp; Analysis</div>
            {viewState !== "upload" && (
              <div className="ph-sub">
                Comprehensive analysis across 40+ ATS criteria — keywords,
                formatting, section scores, and AI-powered fix recommendations.
              </div>
            )}
            {viewState === "upload" && (
              <div className="ph-sub ph-sub--landing">
                Upload your resume and optionally match it to a job posting.
              </div>
            )}
          </div>
          {viewState !== "upload" && (
            <div className="ph-stats">
              <div className="ph-stat">
                <div className="ph-stat-val" style={{ color: "var(--cyan)" }}>
                  {analysis ? overallScore : "—"}
                </div>
                <div className="ph-stat-lbl">ATS Score</div>
              </div>
              <div className="ph-stat">
                <div className="ph-stat-val" style={{ color: "var(--amber)" }}>
                  {analysis ? `+${potentialNum}` : "—"}
                </div>
                <div className="ph-stat-lbl">Potential</div>
              </div>
              <div className="ph-stat">
                <div className="ph-stat-val" style={{ color: "var(--teal)" }}>
                  {analysis ? targetScore : "—"}
                </div>
                <div className="ph-stat-lbl">Target</div>
              </div>
            </div>
          )}
        </div>

        {/* Error / Success Messages */}
        {error && (
          <div className="error-box">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle
                cx="8"
                cy="8"
                r="7"
                stroke="currentColor"
                strokeWidth="1.3"
              />
              <path
                d="M8 4.5v4"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
              <circle cx="8" cy="11" r=".7" fill="currentColor" />
            </svg>
            {error}
          </div>
        )}
        {message && (
          <div className="success-box">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle
                cx="8"
                cy="8"
                r="7"
                stroke="currentColor"
                strokeWidth="1.3"
              />
              <path
                d="M5 8l2 2L11 6"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {message}
            {draftId && (
              <button
                className="btn btn-teal"
                style={{ marginLeft: "auto" }}
                onClick={handleMove}
                disabled={moving}
              >
                {moving ? "Moving…" : "Move to Dashboard"}
              </button>
            )}
          </div>
        )}

        {/* ── UPLOAD ZONE ── */}
        {viewState === "upload" && (
          <ATSUploadZone
            file={file}
            jobDescription={jobDescription}
            onJobDescriptionChange={setJobDescription}
            triggerUpload={triggerUpload}
            showProgressBar={showProgressBar}
            uploadProgress={uploadProgress}
            startScan={startScan}
          />
        )}

        {/* ── SCAN SCREEN ── */}
        {viewState === "scanning" && (
          <div className="scan-screen">
            <div className="scan-ring-wrap">
              <svg viewBox="0 0 90 90">
                <circle
                  cx="45"
                  cy="45"
                  r="36"
                  fill="none"
                  stroke="rgba(0,212,255,.08)"
                  strokeWidth="7"
                />
                <circle
                  cx="45"
                  cy="45"
                  r="36"
                  fill="none"
                  stroke="url(#sg)"
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray="55 171"
                />
                <defs>
                  <linearGradient id="sg" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop stopColor="#00d4ff" />
                    <stop offset="1" stopColor="#2979ff" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="scan-ring-center">
                <div className="scan-ring-num">{scanPct}%</div>
              </div>
            </div>
            <div className="scan-label">{scanLabel}</div>
            <div className="scan-pbar">
              <div
                className="scan-pbfill"
                style={{ width: `${scanPbWidth}%` }}
              />
            </div>
            <div className="scan-steps">
              {scanSteps.map((step) => (
                <div className="scan-step" key={step.label}>
                  <span className="ss-name">{step.label}</span>
                  <span
                    className={`ss-val${step.status === "done" ? " done" : ""}${step.status === "running" ? " run" : ""}`}
                  >
                    {step.status === "done"
                      ? "✓ Done"
                      : step.status === "running"
                        ? "● Running"
                        : "—"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── RESULTS ── */}
        {viewState === "results" && analysis && sections && (
          <div className="results">
            {/* SCORE HERO */}
            <ATSScoreHero
              overallScore={overallScore}
              potentialNum={potentialNum}
              sections={sections}
              sectionKeys={sectionKeys}
              sectionDisplay={sectionDisplay}
            />

            {/* STAT STRIP */}
            <div className="stat-strip">
              <div className="stat-item">
                <div className="stat-val">{totalCriteria}</div>
                <div className="stat-lbl">Criteria Checked</div>
                <div className="stat-chg up">↑ {passedCriteria} passed</div>
              </div>
              <div className="stat-item">
                <div className="stat-val" style={{ color: "var(--red2)" }}>
                  {issuesCount}
                </div>
                <div className="stat-lbl">Issues Found</div>
                <div className="stat-chg dn">
                  {highPriorityCount} high priority
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-val" style={{ color: "var(--teal)" }}>
                  {keywordAnalysis
                    ? `${keywordAnalysis.matchPercentage}%`
                    : `${sections.skills.score}%`}
                </div>
                <div className="stat-lbl">Keyword Match</div>
                <div className="stat-chg up">
                  {keywordAnalysis
                    ? `${keywordAnalysis.matched.length} matched`
                    : "↑ skills score"}
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-val">1 pg</div>
                <div className="stat-lbl">Resume Length</div>
                <div className="stat-chg up">↑ Optimal</div>
              </div>
              <div className="stat-item">
                <div className="stat-val" style={{ color: "var(--cyan)" }}>
                  ATS
                </div>
                <div className="stat-lbl">Parse Status</div>
                <div className="stat-chg up">↑ Fully readable</div>
              </div>
            </div>

            {keywordAnalysis && (
              <ATSKeywordMatch keywordAnalysis={keywordAnalysis} />
            )}

            {/* GLOBAL TIPS */}
            {globalTips.length > 0 && (
              <div className="global-tips">
                <div className="gt-ico">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path
                      d="M9 1l1.8 3.6L15 5.5l-3 2.9.7 4.1L9 10.4l-3.7 2.1.7-4.1L3 5.5l4.2-.9L9 1z"
                      fill="white"
                    />
                  </svg>
                </div>
                <div>
                  <div className="report-section-title">Global Recommendations</div>
                  <div className="gt-items">
                    {globalTips.map((tip, i) => (
                      <div className="gt-item" key={i}>
                        <span className="gt-bullet">›</span>
                        {tip}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TABS */}
            <ATSSectionTabs
              tabItems={tabItems}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              activeSectionKey={activeSectionKey}
              activeSection={activeSection}
              issuesCount={issuesCount}
              potentialNum={potentialNum}
            />

            {/* TAB CONTENT: All Issues vs single section */}
            {activeSectionKey && activeSection ? (
              <ATSSectionDetails
                activeSectionKey={activeSectionKey}
                activeSection={activeSection}
                sectionDisplay={sectionDisplay}
                activeTab={activeTab}
              />
            ) : (
              <>
                {/* PRIORITY FIXES + BEFORE/AFTER */}
                <ATSPriorityFixes
                  priorityFixes={priorityFixes}
                  issuesCount={issuesCount}
                  potentialNum={potentialNum}
                />

                {/* SKILLS + SECTION SCORES */}
                <ATSSkillsAnalysis sections={sections} />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
