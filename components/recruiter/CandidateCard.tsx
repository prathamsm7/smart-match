"use client";

import {
  ArrowRight,
  Loader2,
  MessageCircle,
  MapPin,
  Sparkles,
} from "lucide-react";
import { Candidate } from "./types";
import { ShimmerBox } from "./Shimmer";

interface CandidateCardProps {
  data: Candidate;
  onAnalyze: (id: string) => void;
  analyzingId: string | null;
}

const AVATAR_COLORS = [
  "from-blue-600 to-blue-400",
  "from-indigo-600 to-purple-400",
  "from-emerald-600 to-teal-400",
  "from-orange-600 to-amber-400",
  "from-pink-600 to-rose-400",
];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getScoreBadgeClass(score: number) {
  if (score >= 90) return "bg-green-600";
  if (score >= 80) return "bg-amber-500";
  return "bg-blue-600";
}

export function CandidateCard({ data, onAnalyze, analyzingId }: CandidateCardProps) {
  const isAnalyzed = data.matchScore > 0;
  const isAnalyzing = analyzingId === data.id;

  const initials = getInitials(data.name);
  const colorIdx = initials.charCodeAt(0) % AVATAR_COLORS.length;

  return (
    <div className="bg-[#161b27] border border-white/5 rounded-2xl overflow-hidden hover:border-white/10 transition-all group relative">
      {/* TOP MATCH badge */}
      {data.isTopMatch && (
        <div className="absolute top-0 left-6 bg-amber-400 text-black text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-b-lg z-10">
          Top Match
        </div>
      )}

      <div className="p-6 pt-8">
        {/* Header Row */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-4">
            <div
              className={`w-14 h-14 bg-linear-to-br ${AVATAR_COLORS[colorIdx]} rounded-xl flex items-center justify-center text-white font-black text-lg shadow-lg shrink-0`}
            >
              {initials}
            </div>
            <div>
              <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition leading-tight">
                {data.name}
              </h3>
              <p className="text-gray-400 text-sm font-medium mt-0.5">{data.title}</p>
              <p className="text-gray-600 text-xs mt-1 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {data.location}
              </p>
            </div>
          </div>

          {/* Score badge */}
          {isAnalyzing ? (
            <ShimmerBox className="h-9 w-28 rounded-xl shrink-0" />
          ) : isAnalyzed ? (
            <div
              className={`${getScoreBadgeClass(data.matchScore)} text-white text-sm font-black px-5 py-2 rounded-xl flex items-center gap-2 shadow-lg shrink-0`}
            >
              <span className="w-2 h-2 rounded-full bg-white/50 inline-block" />
              {data.matchScore}% Match
            </div>
          ) : (
            <div className="bg-[#1e2433] border border-white/5 text-gray-500 text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 shrink-0">
              <span className="w-2 h-2 rounded-full bg-gray-600 inline-block" />
              Not Analyzed
            </div>
          )}
        </div>

        {/* Shimmer body while analyzing */}
        {isAnalyzing && <AnalyzingShimmer />}

        {/* Summary — only shown after AI analysis */}
        {isAnalyzed && data.summary && (
          <div className="border-l-2 border-blue-600/40 pl-4 mb-5">
            <p className="text-gray-300 text-sm leading-relaxed line-clamp-3">
              {data.summary}
            </p>
          </div>
        )}

        {/* Skills & Strengths & Weaknesses — only after AI analysis */}
        {isAnalyzed && (
          <AnalysisDetails
            skills={data.skills}
            strengths={data.strengths}
            weaknesses={data.weaknesses}
          />
        )}

        {/* Placeholder for non-analyzed candidates */}
        {!isAnalyzed && !isAnalyzing && (
          <div className="mb-5 border border-dashed border-white/10 rounded-xl px-4 py-3 text-center">
            <p className="text-xs text-gray-600">
              Run <span className="text-purple-400 font-semibold">Analyze with AI</span> to
              reveal match summary, key skills, strengths & gaps.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition flex items-center gap-2 active:scale-95">
            <ArrowRight className="w-4 h-4" />
            View Resume
          </button>
          <button className="bg-[#1e2433] hover:bg-[#252c3d] border border-white/5 text-gray-300 font-semibold px-5 py-2.5 rounded-xl text-sm transition flex items-center gap-2 active:scale-95">
            <MessageCircle className="w-4 h-4" />
            Message
          </button>
          <button
            onClick={() => onAnalyze(data.id)}
            disabled={isAnalyzing || isAnalyzed}
            className="bg-[#1e1533] hover:bg-[#261a42] border border-purple-500/20 text-purple-400 font-semibold px-5 py-2.5 rounded-xl text-sm transition flex items-center gap-2 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ml-auto"
          >
            {isAnalyzing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {isAnalyzing ? "Analyzing..." : isAnalyzed ? "Analyzed" : "Analyze with AI"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function AnalyzingShimmer() {
  return (
    <div className="mb-5 space-y-4">
      <div className="border-l-2 border-blue-600/20 pl-4 space-y-2">
        <ShimmerBox className="h-3.5 w-full rounded-md" />
        <ShimmerBox className="h-3.5 w-4/5 rounded-md" />
        <ShimmerBox className="h-3.5 w-3/5 rounded-md" />
      </div>
      <div>
        <ShimmerBox className="h-2.5 w-16 rounded mb-2" />
        <div className="flex flex-wrap gap-2">
          {[80, 64, 96, 72, 56].map((w, i) => (
            <ShimmerBox key={i} className="h-6 rounded-lg" style={{ width: `${w}px` }} />
          ))}
        </div>
      </div>
      <ShimmerBox className="h-16 w-full rounded-xl" />
      <ShimmerBox className="h-16 w-full rounded-xl" />
    </div>
  );
}

function AnalysisDetails({
  skills = [],
  strengths = [],
  weaknesses = [],
}: {
  skills?: string[];
  strengths?: string[];
  weaknesses?: string[];
}) {
  const hasContent = skills.length > 0 || strengths.length > 0 || weaknesses.length > 0;
  if (!hasContent) return null;

  return (
    <div className="mb-5 space-y-4">
      {skills.length > 0 && (
        <div>
          <p className="text-[10px] text-gray-600 uppercase font-black tracking-widest mb-2">
            Key Skills
          </p>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill, i) => (
              <span
                key={i}
                className="bg-[#1e2a3a] text-blue-400 border border-blue-500/20 px-3 py-1 text-xs font-semibold rounded-lg"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {strengths.length > 0 && (
        <div className="bg-green-500/5 border border-green-500/10 p-3 rounded-xl">
          <p className="text-[10px] text-green-500/80 uppercase font-black tracking-widest mb-2">
            Strengths
          </p>
          <ul className="list-disc list-inside text-sm text-green-300 space-y-1">
            {strengths.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}

      {weaknesses.length > 0 && (
        <div className="bg-amber-500/5 border border-amber-500/10 p-3 rounded-xl">
          <p className="text-[10px] text-amber-500/80 uppercase font-black tracking-widest mb-2">
            Weaknesses & Gaps
          </p>
          <ul className="list-disc list-inside text-sm text-amber-300 space-y-1">
            {weaknesses.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
