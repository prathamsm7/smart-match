"use client";

interface ProfileStrengthProps {
  value: number;
  onImprove: () => void;
}

export function ProfileStrength({ value, onImprove }: ProfileStrengthProps) {
  if (value >= 100) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-orange-600/20 to-amber-600/20 rounded-2xl p-6 border border-orange-500/20">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold">Complete Your Profile</h3>
          <p className="text-gray-400 text-sm">A complete profile helps you get better job matches</p>
        </div>
        <div className="text-3xl font-bold text-orange-400">{value}%</div>
      </div>
      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all duration-500" style={{ width: `${value}%` }} />
      </div>
      <button onClick={onImprove} className="mt-4 px-4 py-2 bg-orange-600 hover:bg-orange-500 rounded-lg text-sm">
        Improve Profile
      </button>
    </div>
  );
}
