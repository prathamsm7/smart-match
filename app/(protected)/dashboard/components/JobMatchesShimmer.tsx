"use client";

// Shimmer animation base component
function ShimmerBlock({ className }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden bg-slate-700/50 rounded ${className}`}
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-slate-600/30 to-transparent" />
    </div>
  );
}

// Job card skeleton for the list
function JobCardSkeleton({ isSelected = false }: { isSelected?: boolean }) {
  return (
    <div
      className={`p-5 rounded-xl border transition-all ${
        isSelected
          ? "bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-500/50"
          : "bg-slate-800/30 border-white/10"
      }`}
    >
      <div className="flex items-start gap-4 mb-3">
        {/* Logo */}
        <ShimmerBlock className="w-12 h-12 rounded-lg flex-shrink-0" />
        <div className="flex-1 min-w-0 space-y-2">
          {/* Title */}
          <ShimmerBlock className="h-6 w-3/4 rounded" />
          {/* Company */}
          <ShimmerBlock className="h-4 w-1/2 rounded" />
        </div>
      </div>

      {/* Footer row */}
      <div className="flex items-center justify-between">
        <ShimmerBlock className="h-4 w-20 rounded" />
        <ShimmerBlock className="h-4 w-24 rounded" />
        <ShimmerBlock className="h-4 w-16 rounded" />
      </div>
    </div>
  );
}

// Job detail skeleton for the right panel
function JobDetailSkeleton() {
  return (
    <div className="max-w-4xl space-y-6">
      {/* Header Card */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-8 border border-white/10 backdrop-blur-sm">
        <div className="flex items-start gap-6 mb-6">
          {/* Logo */}
          <ShimmerBlock className="w-20 h-20 rounded-xl flex-shrink-0" />
          
          <div className="flex-1 space-y-4">
            {/* Title */}
            <ShimmerBlock className="h-9 w-2/3 rounded-lg" />
            {/* Company */}
            <ShimmerBlock className="h-6 w-1/3 rounded" />
            {/* Meta info */}
            <div className="flex flex-wrap gap-4">
              <ShimmerBlock className="h-5 w-24 rounded" />
              <ShimmerBlock className="h-5 w-28 rounded" />
              <ShimmerBlock className="h-5 w-20 rounded" />
              <ShimmerBlock className="h-5 w-24 rounded" />
            </div>
          </div>

          {/* Match Score Circle */}
          <div className="w-32 h-32 rounded-full border-8 border-slate-700 flex items-center justify-center flex-shrink-0">
            <div className="text-center space-y-1">
              <ShimmerBlock className="h-10 w-16 rounded mx-auto" />
              <ShimmerBlock className="h-3 w-10 rounded mx-auto" />
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <ShimmerBlock className="flex-1 h-12 rounded-lg" />
          <ShimmerBlock className="w-28 h-12 rounded-lg" />
        </div>
      </div>

      {/* Description Section */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-8 border border-white/10 backdrop-blur-sm">
        <ShimmerBlock className="h-7 w-48 rounded-lg mb-6" />
        <div className="space-y-3">
          <ShimmerBlock className="h-4 w-full rounded" />
          <ShimmerBlock className="h-4 w-full rounded" />
          <ShimmerBlock className="h-4 w-5/6 rounded" />
          <ShimmerBlock className="h-4 w-full rounded" />
          <ShimmerBlock className="h-4 w-4/5 rounded" />
          <ShimmerBlock className="h-4 w-full rounded" />
          <ShimmerBlock className="h-4 w-3/4 rounded" />
        </div>
      </div>

      {/* Skills Analysis Section */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-8 border border-white/10 backdrop-blur-sm">
        <ShimmerBlock className="h-7 w-40 rounded-lg mb-6" />
        <div className="flex flex-wrap gap-2">
          {[...Array(8)].map((_, i) => (
            <ShimmerBlock key={i} className="h-9 w-20 rounded-lg" style={{ width: `${60 + Math.random() * 40}px` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function JobMatchesShimmer({ jobCount = 5 }: { jobCount?: number }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <ShimmerBlock className="h-8 w-48 rounded-lg" />
          <ShimmerBlock className="h-4 w-64 rounded" />
        </div>

        <div className="flex items-center gap-3">
          {/* Search bar */}
          <ShimmerBlock className="h-11 w-64 rounded-xl hidden md:block" />
          {/* Filter button */}
          <ShimmerBlock className="h-11 w-24 rounded-xl" />
          {/* Refresh button */}
          <ShimmerBlock className="h-11 w-11 rounded-xl" />
        </div>
      </div>

      {/* Content - Two column layout */}
      <div className="flex h-[calc(100vh-150px)] gap-6">
        {/* Job List - Left side */}
        <div className="w-2/5 border-r border-white/10 overflow-hidden space-y-4 pr-4">
          {[...Array(jobCount)].map((_, i) => (
            <JobCardSkeleton key={i} isSelected={i === 0} />
          ))}
        </div>

        {/* Job Details - Right side */}
        <div className="flex-1 overflow-hidden">
          <JobDetailSkeleton />
        </div>
      </div>
    </div>
  );
}

export default JobMatchesShimmer;

