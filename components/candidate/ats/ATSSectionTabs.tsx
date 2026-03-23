"use client";

import React from "react";
import { getScoreColor } from "@/lib/atsUtils";

import { ATSAnalysis } from "@/types";

interface ATSSectionTabsProps {
  tabItems: string[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeSectionKey: string | null;
  activeSection: ATSAnalysis["sections"][keyof ATSAnalysis["sections"]] | null;
  issuesCount: number;
  potentialNum: number;
}

export function ATSSectionTabs({
  tabItems,
  activeTab,
  setActiveTab,
  activeSectionKey,
  activeSection,
  issuesCount,
  potentialNum,
}: ATSSectionTabsProps) {
  if (!tabItems || tabItems.length === 0) return null;

  return (
    <div className="tabs-row">
      <div className="tabs">
        {tabItems.map((t) => (
          <div
            key={t}
            className={`tab${activeTab === t ? " active" : ""}`}
            onClick={() => setActiveTab(t)}
          >
            {t}
          </div>
        ))}
      </div>
      <div className="tab-meta">
        {activeSectionKey && activeSection ? (
          <>
            {activeSection.issues?.length ?? 0} issue
            {(activeSection.issues?.length ?? 0) !== 1 ? "s" : ""} ·
            Score{" "}
            <span
              style={{
                color: getScoreColor(activeSection.score),
                fontWeight: 700,
              }}
            >
              {activeSection.score}
            </span>
          </>
        ) : (
          <>
            {issuesCount} issue{issuesCount !== 1 ? "s" : ""} · Est.{" "}
            <span style={{ color: "var(--amber2)", fontWeight: 700 }}>
              +{potentialNum} pts
            </span>{" "}
            if fixed
          </>
        )}
      </div>
    </div>
  );
}
