'use client';

interface HpBarProps {
  percentage: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function HpBar({ percentage, showLabel = false, size = 'md' }: HpBarProps) {
  const clamped = Math.max(0, Math.min(100, percentage));
  const color = clamped > 60 ? '#c04040' : clamped > 30 ? '#b89450' : '#40a060';
  const sizeClass = size === 'sm' ? 'hp-track hp-track-sm' : size === 'lg' ? 'hp-track hp-track-lg' : 'hp-track';

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between text-[11px] mb-1.5 font-medium">
          <span style={{ color: '#7c7870' }}>HP</span>
          <span style={{ color: '#e8e6e2' }}>{clamped}%</span>
        </div>
      )}
      <div className={sizeClass}>
        <div
          className="hp-fill"
          style={{
            width: `${clamped}%`,
            background: `linear-gradient(90deg, ${color}, ${color}dd)`,
            boxShadow: `0 0 12px ${color}40`,
          }}
        />
      </div>
    </div>
  );
}
