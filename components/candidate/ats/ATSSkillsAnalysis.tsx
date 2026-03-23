"use client";

import React from "react";

import { ATSAnalysis } from "@/types";

interface ATSSkillsAnalysisProps {
  sections: ATSAnalysis["sections"];
}

export function ATSSkillsAnalysis({ sections }: ATSSkillsAnalysisProps) {
  if (!sections || !sections.skills) return null;

  return (
    <div className="two-col">
      <div className="card">
        <div className="card-head">
          <div className="card-title">
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
            >
              <rect
                x=".75"
                y=".75"
                width="5.5"
                height="5.5"
                rx="1.5"
                stroke="currentColor"
                strokeWidth="1.2"
              />
              <rect
                x="7.75"
                y=".75"
                width="5.5"
                height="5.5"
                rx="1.5"
                stroke="currentColor"
                strokeWidth="1.2"
              />
              <rect
                x=".75"
                y="7.75"
                width="5.5"
                height="5.5"
                rx="1.5"
                stroke="currentColor"
                strokeWidth="1.2"
              />
              <rect
                x="7.75"
                y="7.75"
                width="5.5"
                height="5.5"
                rx="1.5"
                stroke="currentColor"
                strokeWidth="1.2"
              />
            </svg>
            Skills Keyword Analysis
          </div>
          <span className="cbadge cb-t">
            Score {sections.skills.score}
          </span>
        </div>
        <div className="card-body">
          {/* Skills from examples (confirmed) */}
          {sections.skills.examples?.length > 0 && (
            <div className="skill-grp">
              <div
                className="sg-head"
                style={{ color: "var(--teal)" }}
              >
                Confirmed in resume{" "}
                <span className="sg-count">
                  {sections.skills.examples.length}
                </span>
              </div>
              <div className="skills-row">
                {sections.skills.examples.map((s: string, i: number) => (
                  <span className="skill found" key={i}>
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
          {/* Issues as missing or strengthen */}
          {sections.skills.issues?.length > 0 && (
            <div className="skill-grp">
              <div
                className="sg-head"
                style={{ color: "var(--amber)" }}
              >
                Add or strengthen{" "}
                <span className="sg-count">
                  {sections.skills.issues.length}
                </span>
              </div>
              <div className="skills-row">
                {sections.skills.issues.map((s: string, i: number) => (
                  <span className="skill partial" key={i}>
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
          {/* Fixes as missing */}
          {sections.skills.fixes?.length > 0 && (
            <div className="skill-grp">
              <div
                className="sg-head"
                style={{ color: "var(--red2)" }}
              >
                Suggested additions{" "}
                <span className="sg-count">
                  {sections.skills.fixes.length}
                </span>
              </div>
              <div className="skills-row">
                {sections.skills.fixes.map((s: string, i: number) => (
                  <span className="skill missing" key={i}>
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className="skill-legend">
            <div className="sl-i">
              <div
                className="sl-dot"
                style={{ background: "var(--teal2)" }}
              />
              Confirmed
            </div>
            <div className="sl-i">
              <div
                className="sl-dot"
                style={{ background: "var(--amber2)" }}
              />
              Strengthen
            </div>
            <div className="sl-i">
              <div
                className="sl-dot"
                style={{ background: "var(--red2)" }}
              />
              Missing
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
