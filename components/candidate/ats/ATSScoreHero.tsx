"use client";

import React from "react";
import { 
  getScoreGrade, 
  getScoreColor, 
  getBarGradient 
} from "@/lib/atsUtils";

import { ATSAnalysis } from "@/types";

interface ATSScoreHeroProps {
  overallScore: number;
  potentialNum: number;
  sections: ATSAnalysis["sections"];
  sectionKeys: readonly (keyof ATSAnalysis["sections"])[];
  sectionDisplay: Record<string, { label: string; iconBg: string; iconBorder: string }>;
}

export function ATSScoreHero({
  overallScore,
  potentialNum,
  sections,
  sectionKeys,
  sectionDisplay,
}: ATSScoreHeroProps) {
  if (!sections || !sectionKeys || sectionKeys.length === 0) return null;

  const ARC_RADIUS = 54;
  const ARC_CIRCUMFERENCE = 2 * Math.PI * ARC_RADIUS;
  const scoreOffset = ARC_CIRCUMFERENCE * (1 - overallScore / 100);
  const grade = getScoreGrade(overallScore);

  return (
    <div className="score-hero">
      <div className="sh-left">
        <div className="score-arc-wrap">
          <svg viewBox="0 0 130 130">
            <circle
              cx="65"
              cy="65"
              r={ARC_RADIUS}
              fill="none"
              stroke="rgba(255,255,255,.05)"
              strokeWidth="11"
            />
            <circle
              cx="65"
              cy="65"
              r={ARC_RADIUS}
              fill="none"
              stroke="url(#rg)"
              strokeWidth="11"
              strokeLinecap="round"
              strokeDasharray={ARC_CIRCUMFERENCE}
              strokeDashoffset={scoreOffset}
            />
            <defs>
              <linearGradient id="rg" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop stopColor="#00d4ff" />
                <stop offset="1" stopColor="#2979ff" />
              </linearGradient>
            </defs>
          </svg>
          <div className="score-arc-center">
            <div className="score-num">{overallScore}</div>
            <div className="score-denom">/100</div>
          </div>
        </div>
        <div className="score-grade">
          <div className="sg-dot" />
          <div className="sg-txt">{grade.label}</div>
        </div>
        <div className="sh-ats-tag">ATS Ready</div>
      </div>

      <div className="sh-mid">
        <div>
          <div className="sh-title">
            Your resume is{" "}
            <span>
              {overallScore >= 75 ? "competitive" : "showing potential"}
            </span>{" "}
            — targeted fixes will push it to{" "}
            {overallScore >= 75 ? "Excellent" : "Good"}
          </div>
          <div className="sh-desc">
            {overallScore >= 75
              ? `You're outperforming the majority of applicants. With `
              : `There's room for improvement. With `}
            <strong style={{ color: "var(--amber2)" }}>
              +{potentialNum} points achievable
            </strong>
          </div>
        </div>
        <div className="sh-cats">
          {sectionKeys.map((key) => {
            const sec = sections[key];
            return (
              <div className="sh-cat" key={key}>
                <div className="sh-cat-top">
                  <div className="sh-cat-name">
                    {sectionDisplay[key].label}
                  </div>
                  <div
                    className="sh-cat-score"
                    style={{ color: getScoreColor(sec.score) }}
                  >
                    {sec.score}
                  </div>
                </div>
                <div className="sh-cat-bar">
                  <div
                    className="sh-cat-fill"
                    style={{
                      width: `${sec.score}%`,
                      background: getBarGradient(sec.score),
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="sh-right">
        <div className="sh-rank">
          <div className="sh-rank-val">
            Top {Math.max(5, 100 - overallScore)}%
          </div>
          <div className="sh-rank-lbl">of applicants</div>
        </div>
        <div className="potential-pill">
          <div className="pp-val">+{potentialNum} pts</div>
          <div className="pp-lbl">achievable</div>
        </div>
      </div>
    </div>
  );
}
