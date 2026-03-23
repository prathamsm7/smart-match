"use client";

import React from "react";
import { getSectionChip } from "@/lib/atsUtils";

import { ATSAnalysis } from "@/types";

interface ATSSectionDetailsProps {
  activeSectionKey: "summary" | "skills" | "experience" | "projects" | "structure";
  activeSection: ATSAnalysis["sections"][keyof ATSAnalysis["sections"]];
  sectionDisplay: Record<string, { label: string; iconBg: string; iconBorder: string }>;
  activeTab: string;
}

export function ATSSectionDetails({
  activeSectionKey,
  activeSection,
  sectionDisplay,
  activeTab,
}: ATSSectionDetailsProps) {
  if (!activeSection) return null;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      <div className="card">
        <div className="card-head">
          <div className="card-title">
            {sectionDisplay[activeSectionKey]?.label ?? activeTab}
          </div>
          <span
            className="cbadge"
            style={{
              background: getSectionChip(activeSection.score).bg,
              color: getSectionChip(activeSection.score).color,
            }}
          >
            Score {activeSection.score}
          </span>
        </div>
        <div
          className="card-body"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {activeSection.issues?.length > 0 && (
            <div>
              <div
                className="sg-head"
                style={{ color: "var(--amber2)", marginBottom: 8 }}
              >
                Issues
              </div>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: 18,
                  fontSize: 13,
                  color: "var(--text2)",
                }}
              >
                {activeSection.issues.map((issue: string, i: number) => (
                  <li key={i}>{issue}</li>
                ))}
              </ul>
            </div>
          )}
          {activeSection.fixes?.length > 0 && (
            <div>
              <div
                className="sg-head"
                style={{ color: "var(--cyan)", marginBottom: 8 }}
              >
                Suggested fixes
              </div>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: 18,
                  fontSize: 13,
                  color: "var(--text2)",
                }}
              >
                {activeSection.fixes.map((fix: string, i: number) => (
                  <li key={i}>{fix}</li>
                ))}
              </ul>
            </div>
          )}
          {activeSection.examples?.length > 0 && (
            <div>
              <div
                className="sg-head"
                style={{ color: "var(--teal)", marginBottom: 8 }}
              >
                Examples / Confirmed
              </div>
              <div className="skills-row">
                {activeSection.examples.map((s: string, i: number) => (
                  <span className="skill found" key={i}>
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
          {activeSection.improvements?.length > 0 &&
            activeSection.improvements.map((imp: { original: string; improved: string }, idx: number) => (
              <div className="ba-container" key={idx}>
                <div className="ba-row orig">
                  <div className="ba-tag">
                    <div className="ba-dot" />
                    <div className="ba-lbl">Before</div>
                  </div>
                  <div className="ba-txt">{imp.original}</div>
                </div>
                <div className="ba-row impr">
                  <div className="ba-tag">
                    <div className="ba-dot" />
                    <div className="ba-lbl">After</div>
                  </div>
                  <div className="ba-txt">{imp.improved}</div>
                </div>
              </div>
            ))}
          {activeSection.goodThings?.length > 0 && (
            <div>
              <div
                className="sg-head"
                style={{ color: "var(--teal)", marginBottom: 8 }}
              >
                What&apos;s working well
              </div>
              <div className="good-list">
                {activeSection.goodThings.map((item: string, i: number) => (
                  <div className="good-item" key={i}>
                    <div className="good-ico">
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 10 10"
                        fill="none"
                      >
                        <path
                          d="M2 5l2 2L8 3"
                          stroke="#00e5c3"
                          strokeWidth="1.3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <div className="good-txt">{item}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {activeSection.tips?.length > 0 && (
            <div>
              <div
                className="sg-head"
                style={{ color: "var(--cyan)", marginBottom: 8 }}
              >
                Tips
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                {activeSection.tips.map((tip: string, i: number) => (
                  <div className="tip-row" key={i}>
                    <div
                      className="tip-ico"
                      style={{ background: "rgba(0,212,255,.1)" }}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                      >
                        <path
                          d="M2 4h10M2 7.5h7M2 11h5"
                          stroke="#00d4ff"
                          strokeWidth="1.3"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                    <div className="tip-d">{tip}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
