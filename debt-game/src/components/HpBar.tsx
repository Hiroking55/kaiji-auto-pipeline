'use client';

interface HpBarProps {
  percentage: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function HpBar({ percentage, showLabel = false, size = 'md' }: HpBarProps) {
  const c = Math.max(0, Math.min(100, percentage));
  const color = c > 60 ? '#d9534f' : c > 30 ? '#e8a020' : '#2d8a4e';
  const cls = size === 'sm' ? 'bar-track bar-track-sm' : size === 'lg' ? 'bar-track bar-track-lg' : 'bar-track';

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between text-[11px] mb-1">
          <span style={{ color: '#5a6a8a' }}>HP</span>
          <span style={{ color: '#2b3a67' }}>{c}%</span>
        </div>
      )}
      <div className={cls}>
        <div className="bar-fill" style={{ width: `${c}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}
