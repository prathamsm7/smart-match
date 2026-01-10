"use client";

interface ScoreRingProps {
  value?: number;
  label: string;
  size?: number;
}

const getScoreColor = (value?: number) => {
  if (value === undefined || value === null) return "text-gray-400";
  if (value >= 8) return "text-green-400";
  if (value >= 6) return "text-yellow-400";
  return "text-orange-400";
};

const getScoreRingColor = (value?: number) => {
  if (value === undefined || value === null) return "text-slate-700";
  if (value >= 8) return "text-green-400";
  if (value >= 6) return "text-yellow-400";
  return "text-orange-400";
};

export function ScoreRing({ value, label, size = 100 }: ScoreRingProps) {
  const radius = size / 2 - 10;
  const circumference = 2 * Math.PI * radius;
  const percentage = value ? (value / 10) * 100 : 0;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  const color = getScoreRingColor(value);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-slate-700"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={`${color} transition-all duration-1000`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className={`text-3xl font-bold ${getScoreColor(value)}`}>
              {value !== undefined && value !== null ? value.toFixed(1) : "—"}
            </div>
            <div className="text-xs text-gray-400 mt-1">/10</div>
          </div>
        </div>
      </div>
      <p className="text-xs uppercase tracking-wide text-gray-400 mt-3">{label}</p>
    </div>
  );
}


