"use client";

interface PriorityFix {
    text: string;
    impact: "high" | "medium";
}

interface PriorityFixesPanelProps {
    fixes: PriorityFix[];
}

export function PriorityFixesPanel({ fixes }: PriorityFixesPanelProps) {
    if (!fixes?.length) return null;

    return (
        <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Priority Fixes</h4>
            <div className="space-y-2">
                {fixes.map((fix, idx) => (
                    <div key={`${fix.text}-${idx}`} className="flex items-start gap-3 py-2">
                        <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-[11px] font-medium text-gray-300">
                            {idx + 1}
                        </span>
                        <p className="flex-1 text-sm text-gray-200 leading-relaxed">{fix.text}</p>
                        <span
                            className={`flex-shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                                fix.impact === "high"
                                    ? "bg-red-500/15 text-red-400"
                                    : "bg-amber-500/15 text-amber-400"
                            }`}
                        >
                            {fix.impact}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
