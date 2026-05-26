'use client';

interface HpBarProps {
  percentage: number;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

export default function HpBar({ percentage, showLabel = false, size = 'md' }: HpBarProps) {
  const clamped = Math.max(0, Math.min(100, percentage));
  const barColor = clamped > 60 ? '#f83030' : clamped > 30 ? '#f8c830' : '#30f848';
  const trackClass = size === 'sm' ? 'pixel-bar-track pixel-bar-track-sm' : 'pixel-bar-track';

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between text-xs mb-1" style={{ color: '#9090c0' }}>
          <span>HP</span>
          <span>{clamped}%</span>
        </div>
      )}
      <div className={trackClass}>
        <div
          className="pixel-bar-fill"
          style={{
            width: `${clamped}%`,
            backgroundColor: barColor,
            boxShadow: `inset 0 -3px 0 rgba(0,0,0,0.3), inset 0 2px 0 rgba(255,255,255,0.2)`,
          }}
        />
      </div>
    </div>
  );
}
