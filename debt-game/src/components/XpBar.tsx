'use client';

interface XpBarProps {
  current: number;
  max: number;
  level: number;
}

export default function XpBar({ current, max, level }: XpBarProps) {
  const percentage = max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0;

  return (
    <div className="w-full">
      <div className="flex justify-between items-center text-xs mb-1">
        <span className="font-bold" style={{ color: '#ffc830' }}>
          HR {level}
        </span>
        <span style={{ color: '#a09078' }}>
          {current} / {max}
        </span>
      </div>
      <div className="mh-hp-track mh-hp-track-sm">
        <div
          className="mh-hp-fill"
          style={{
            width: `${percentage}%`,
            backgroundColor: '#4890d0',
          }}
        />
      </div>
    </div>
  );
}
