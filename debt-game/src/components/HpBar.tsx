'use client';

interface HpBarProps {
  percentage: number;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

export default function HpBar({ percentage, showLabel = false, size = 'md' }: HpBarProps) {
  const clamped = Math.max(0, Math.min(100, percentage));
  const barColor = clamped > 60 ? '#e84040' : clamped > 30 ? '#e8a020' : '#40c850';
  const trackClass = size === 'sm' ? 'mh-hp-track mh-hp-track-sm' : 'mh-hp-track';

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between text-xs mb-1">
          <span style={{ color: '#a09078' }}>HP</span>
          <span style={{ color: '#f0e8d8' }}>{clamped}%</span>
        </div>
      )}
      <div className={trackClass}>
        <div
          className="mh-hp-fill"
          style={{ width: `${clamped}%`, backgroundColor: barColor }}
        />
      </div>
    </div>
  );
}
