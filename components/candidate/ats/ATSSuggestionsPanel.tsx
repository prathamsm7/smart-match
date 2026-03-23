"use client";

import { useState } from "react";
import type { ATSAnalysis, SectionAnalysis } from "@/types";

interface ATSSuggestionsPanelProps {
    sections: ATSAnalysis["sections"];
    globalTips: string[];
}

const sectionOrder: Array<keyof ATSAnalysis["sections"]> = [
    "summary",
    "skills",
    "experience",
    "projects",
    "structure",
];

const sectionLabels: Record<keyof ATSAnalysis["sections"], string> = {
    summary: "Summary",
    skills: "Skills",
    experience: "Experience",
    projects: "Projects",
    structure: "Structure",
};

function ScoreDot({ score }: { score: number }) {
    const color =
        score >= 80 ? "bg-emerald-400" :
        score >= 60 ? "bg-amber-400" :
        "bg-red-400";
    return <span className={`inline-block h-2 w-2 rounded-full ${color}`} />;
}

function SectionContent({ section }: { section: SectionAnalysis }) {
    const hasAnything =
        section.issues?.length ||
        section.fixes?.length ||
        section.goodThings?.length ||
        section.tips?.length ||
        section.improvements?.length;

    if (!hasAnything) {
        return <p className="text-sm text-gray-500 py-1">Looks good — no suggestions.</p>;
    }

    return (
        <div className="space-y-4 pt-2">
            {section.issues?.length > 0 && (
                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-red-400 mb-1.5">Issues</p>
                    {section.issues.map((t, i) => (
                        <p key={i} className="text-sm text-gray-300 py-1 leading-relaxed">{t}</p>
                    ))}
                </div>
            )}

            {section.fixes?.length > 0 && (
                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-400 mb-1.5">Suggested Fixes</p>
                    {section.fixes.map((t, i) => (
                        <p key={i} className="text-sm text-gray-300 py-1 leading-relaxed">{t}</p>
                    ))}
                </div>
            )}

            {section.goodThings?.length > 0 && (
                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400 mb-1.5">What's Working</p>
                    {section.goodThings.map((t, i) => (
                        <p key={i} className="text-sm text-gray-300 py-1 leading-relaxed">{t}</p>
                    ))}
                </div>
            )}

            {section.tips?.length > 0 && (
                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-violet-400 mb-1.5">Tips</p>
                    {section.tips.map((t, i) => (
                        <p key={i} className="text-sm text-gray-300 py-1 leading-relaxed">{t}</p>
                    ))}
                </div>
            )}

            {section.improvements?.length > 0 && (
                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2">Rewrites</p>
                    <div className="space-y-3">
                        {section.improvements.map((imp, i) => (
                            <div key={i} className="grid gap-px sm:grid-cols-2 rounded-lg overflow-hidden bg-white/5">
                                <div className="bg-slate-800/60 p-3">
                                    <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500 mb-1">Before</p>
                                    <p className="text-sm text-gray-400 leading-relaxed">{imp.original}</p>
                                </div>
                                <div className="bg-slate-800/80 p-3">
                                    <p className="text-[10px] font-medium uppercase tracking-wide text-emerald-500 mb-1">After</p>
                                    <p className="text-sm text-gray-100 leading-relaxed">{imp.improved}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export function ATSSuggestionsPanel({ sections, globalTips }: ATSSuggestionsPanelProps) {
    const [activeTab, setActiveTab] = useState<keyof ATSAnalysis["sections"]>("summary");

    return (
        <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Section Breakdown</h4>

            {/* Tab bar */}
            <div className="flex gap-1 overflow-x-auto pb-1 mb-4">
                {sectionOrder.map((key) => {
                    const isActive = key === activeTab;
                    return (
                        <button
                            key={key}
                            onClick={() => setActiveTab(key)}
                            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition whitespace-nowrap ${
                                isActive
                                    ? "bg-white/10 text-white"
                                    : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
                            }`}
                        >
                            <ScoreDot score={sections[key].score} />
                            {sectionLabels[key]}
                            <span className="text-[10px] text-gray-500">{Math.round(sections[key].score)}</span>
                        </button>
                    );
                })}
            </div>

            {/* Active tab content */}
            <SectionContent section={sections[activeTab]} />

            {/* Global tips */}
            {globalTips?.length > 0 && (
                <div className="mt-6 pt-4 border-t border-white/5">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2">General Tips</p>
                    {globalTips.map((tip, idx) => (
                        <p key={idx} className="text-sm text-gray-300 py-1 leading-relaxed">{tip}</p>
                    ))}
                </div>
            )}
        </div>
    );
}
