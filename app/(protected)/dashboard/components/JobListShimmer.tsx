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

// Single job card skeleton
function JobCardSkeleton() {
  return (
    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-6 border border-white/10 backdrop-blur-sm">
      <div className="flex items-start gap-6">
        {/* Company Logo Skeleton */}
        <ShimmerBlock className="w-16 h-16 rounded-xl flex-shrink-0" />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 space-y-3">
              {/* Title */}
              <ShimmerBlock className="h-7 w-3/4 rounded-lg" />
              {/* Company Name */}
              <ShimmerBlock className="h-5 w-1/3 rounded" />
              {/* Description */}
              <div className="space-y-2">
                <ShimmerBlock className="h-4 w-full rounded" />
                <ShimmerBlock className="h-4 w-4/5 rounded" />
              </div>
            </div>
            {/* Action Buttons */}
            <div className="flex gap-2 ml-4">
              <ShimmerBlock className="w-10 h-10 rounded-lg" />
              <ShimmerBlock className="w-10 h-10 rounded-lg" />
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-4 gap-4 p-4 bg-white/5 rounded-xl mb-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="text-center space-y-2">
                <ShimmerBlock className="h-7 w-12 mx-auto rounded" />
                <ShimmerBlock className="h-3 w-16 mx-auto rounded" />
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <div className="flex gap-4">
              <ShimmerBlock className="h-5 w-24 rounded" />
              <ShimmerBlock className="h-5 w-20 rounded" />
              <ShimmerBlock className="h-6 w-16 rounded-full" />
            </div>
            <ShimmerBlock className="h-10 w-32 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Stats card skeleton
function StatCardSkeleton() {
  return (
    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-6 border border-white/10 backdrop-blur-sm">
      <ShimmerBlock className="w-12 h-12 rounded-xl mb-4" />
      <ShimmerBlock className="h-9 w-16 rounded mb-2" />
      <ShimmerBlock className="h-4 w-24 rounded" />
    </div>
  );
}

export function JobListShimmer({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <ShimmerBlock className="h-8 w-48 rounded-lg" />
          <ShimmerBlock className="h-5 w-64 rounded" />
        </div>
        <ShimmerBlock className="h-11 w-36 rounded-xl" />
      </div>

      {/* Search Skeleton */}
      <ShimmerBlock className="h-12 w-full rounded-xl" />

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      {/* Jobs List Skeleton */}
      <div className="space-y-4">
        {[...Array(count)].map((_, i) => (
          <JobCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export default JobListShimmer;

