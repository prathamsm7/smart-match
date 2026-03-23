"use client";

interface ATSScoreCardProps {
    score: number;
    improvementPotential?: string;
}

const RADIUS = 40;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function getScoreInfo(score: number) {
    if (score >= 85) return { color: "#22c55e", label: "Excellent" };
    if (score >= 70) return { color: "#84cc16", label: "Good" };
    if (score >= 50) return { color: "#eab308", label: "Needs Work" };
    return { color: "#ef4444", label: "Poor" };
}

export function ATSScoreCard({ score, improvementPotential }: ATSScoreCardProps) {
    const safeScore = Math.max(0, Math.min(100, Math.round(score)));
    const { color, label } = getScoreInfo(safeScore);
    const offset = CIRCUMFERENCE * (1 - safeScore / 100);

    return (
        <div className="flex items-center gap-5">
            <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90 flex-shrink-0">
                <circle cx="48" cy="48" r={RADIUS} fill="none" stroke="currentColor" strokeWidth="7" className="text-white/10" />
                <circle
                    cx="48" cy="48" r={RADIUS}
                    fill="none"
                    stroke={color}
                    strokeWidth="7"
                    strokeLinecap="round"
                    strokeDasharray={CIRCUMFERENCE}
                    strokeDashoffset={offset}
                    className="transition-all duration-700"
                />
            </svg>
            <div className="absolute w-24 h-24 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">{safeScore}</span>
            </div>
            <div>
                <p className="text-lg font-semibold text-white">{label}</p>
                <p className="text-sm text-gray-400">ATS Compatibility Score</p>
                {improvementPotential && (
                    <p className="mt-1 text-xs text-gray-500">{improvementPotential}</p>
                )}
            </div>
        </div>
    );
}
