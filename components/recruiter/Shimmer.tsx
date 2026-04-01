"use client";

export function ShimmerBox({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`bg-white/5 rounded-lg animate-pulse ${className ?? ""}`}
      style={style}
    />
  );
}

export function ShimmerCard() {
  return (
    <div className="bg-[#161b27] border border-white/5 rounded-2xl overflow-hidden p-6 pt-8 space-y-5">
      {/* Header Row */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <ShimmerBox className="w-14 h-14 rounded-xl shrink-0" />
          <div className="space-y-2">
            <ShimmerBox className="h-5 w-36 rounded-md" />
            <ShimmerBox className="h-3.5 w-24 rounded-md" />
            <ShimmerBox className="h-3 w-16 rounded-md" />
          </div>
        </div>
        <ShimmerBox className="h-9 w-28 rounded-xl shrink-0" />
      </div>

      {/* Summary placeholder */}
      <ShimmerBox className="h-12 w-full rounded-xl" />

      {/* Skill pills */}
      <div className="flex flex-wrap gap-2">
        {[80, 64, 96, 72, 56].map((w, i) => (
          <ShimmerBox
            key={i}
            className="h-6 rounded-lg"
            style={{ width: `${w}px` } as React.CSSProperties}
          />
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-3 pt-1">
        <ShimmerBox className="h-10 w-32 rounded-xl" />
        <ShimmerBox className="h-10 w-28 rounded-xl" />
        <ShimmerBox className="h-10 w-36 rounded-xl ml-auto" />
      </div>
    </div>
  );
}

export function ShimmerResults() {
  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-2">
        <ShimmerBox className="h-6 w-48 rounded-lg" />
        <div className="flex items-center gap-2">
          <ShimmerBox className="h-9 w-20 rounded-xl" />
          <ShimmerBox className="h-9 w-36 rounded-xl" />
        </div>
      </div>
      {/* Card skeletons */}
      {Array.from({ length: 4 }).map((_, i) => (
        <ShimmerCard key={i} />
      ))}
    </div>
  );
}
