"use client";

import type { JobTargetedATSAnalysis } from "@/types";

interface ATSKeywordMatchProps {
  keywordAnalysis: NonNullable<JobTargetedATSAnalysis["keywordAnalysis"]>;
}

export function ATSKeywordMatch({ keywordAnalysis }: ATSKeywordMatchProps) {
  const { matched, missing, matchPercentage } = keywordAnalysis;

  if (matched.length === 0 && missing.length === 0) return null;

  return (
    <div className="keyword-match">
      <div className="keyword-match-head">
        <div className="keyword-match-title">Job keyword match</div>
        <span className="keyword-match-pct">{matchPercentage}% coverage</span>
      </div>

      {matched.length > 0 && (
        <div className="keyword-match-block">
          <div className="keyword-match-label matched-label">
            Top matches ({matched.length})
          </div>
          <div className="skills-row">
            {matched.map((skill) => (
              <span className="skill found" key={skill}>
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {missing.length > 0 && (
        <div className="keyword-match-block">
          <div className="keyword-match-label missing-label">
            Gaps to address ({missing.length})
          </div>
          <div className="skills-row">
            {missing.map((skill) => (
              <span className="skill missing" key={skill}>
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
