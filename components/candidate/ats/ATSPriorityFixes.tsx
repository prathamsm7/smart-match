"use client";

import React from "react";

interface ATSPriorityFixesProps {
  priorityFixes: Array<{ text: string; impact: "high" | "medium" }>;
  issuesCount: number;
  potentialNum: number;
}

export function ATSPriorityFixes({
  priorityFixes,
  issuesCount,
  potentialNum,
}: ATSPriorityFixesProps) {
  if (!priorityFixes || priorityFixes.length === 0) return null;

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
              <circle
                cx="7"
                cy="7"
                r="6"
                stroke="#ff5252"
                strokeWidth="1.3"
              />
              <path
                d="M7 4.5v3"
                stroke="#ff5252"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
              <circle cx="7" cy="9.5" r=".7" fill="#ff5252" />
            </svg>
            Priority Fixes
          </div>
          <span className="cbadge cb-r">
            {issuesCount} issue{issuesCount !== 1 ? "s" : ""} · +
            {potentialNum} pts
          </span>
        </div>
        <div className="fix-list">
          {priorityFixes.map((fix, idx) => (
            <div
              key={idx}
              className={`fix-row ${fix.impact === "high" ? "high" : "med"}`}
            >
              <div
                className={`fix-num ${fix.impact === "high" ? "fn-h" : "fn-m"}`}
              >
                {idx + 1}
              </div>
              <div className="fix-body">
                <div className="fix-text">{fix.text}</div>
                <div className="fix-tags">
                  <span
                    className={`imp-tag ${fix.impact === "high" ? "imp-high" : "imp-med"}`}
                  >
                    {fix.impact}
                  </span>
                  <span className="pts-tag">
                    +{fix.impact === "high" ? "6" : "3"} pts
                  </span>
                </div>
              </div>
              <div className="fix-arrow">→</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
