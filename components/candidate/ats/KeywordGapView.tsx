"use client";

interface KeywordGapViewProps {
    matched: string[];
    missing: string[];
    matchPercentage: number;
    tailoredSuggestions?: string[];
}

function Tag({ text, variant }: { text: string; variant: "matched" | "missing" }) {
    return (
        <span
            className={`inline-block rounded-md px-2 py-0.5 text-xs font-medium ${
                variant === "matched"
                    ? "bg-emerald-500/15 text-emerald-300"
                    : "bg-red-500/15 text-red-300"
            }`}
        >
            {text}
        </span>
    );
}

export function KeywordGapView({ matched, missing, matchPercentage, tailoredSuggestions }: KeywordGapViewProps) {
    const safePercent = Math.max(0, Math.min(100, Math.round(matchPercentage)));

    const barColor =
        safePercent >= 70 ? "bg-emerald-500" :
        safePercent >= 45 ? "bg-amber-500" :
        "bg-red-500";

    return (
        <div className="space-y-5">
            {/* Progress */}
            <div>
                <div className="flex items-baseline justify-between mb-1.5">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Keyword Coverage</h4>
                    <span className="text-sm font-semibold text-white">{safePercent}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                    <div className={`h-full rounded-full ${barColor} transition-all duration-500`} style={{ width: `${safePercent}%` }} />
                </div>
            </div>

            {/* Tags */}
            <div className="grid gap-4 sm:grid-cols-2">
                <div>
                    <p className="mb-2 text-xs font-medium text-emerald-400">Matched ({matched.length})</p>
                    <div className="flex flex-wrap gap-1.5">
                        {matched.length > 0
                            ? matched.map((k, i) => <Tag key={i} text={k} variant="matched" />)
                            : <span className="text-xs text-gray-500">None detected</span>
                        }
                    </div>
                </div>
                <div>
                    <p className="mb-2 text-xs font-medium text-red-400">Missing ({missing.length})</p>
                    <div className="flex flex-wrap gap-1.5">
                        {missing.length > 0
                            ? missing.map((k, i) => <Tag key={i} text={k} variant="missing" />)
                            : <span className="text-xs text-gray-500">All covered</span>
                        }
                    </div>
                </div>
            </div>

            {/* Suggestions */}
            {tailoredSuggestions && tailoredSuggestions.length > 0 && (
                <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Suggestions</p>
                    <ul className="space-y-1.5">
                        {tailoredSuggestions.map((s, i) => (
                            <li key={i} className="flex gap-2 text-sm text-gray-300 leading-relaxed">
                                <span className="mt-2 h-1 w-1 flex-shrink-0 rounded-full bg-blue-400" />
                                {s}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
