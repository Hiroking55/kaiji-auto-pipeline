'use client';

export default function HpBar({ percentage, size = 'md' }: { percentage: number; showLabel?: boolean; size?: 'sm' | 'md' | 'lg' }) {
  const c = Math.max(0, Math.min(100, percentage));
  const color = c > 60 ? '#ef4444' : c > 30 ? '#f59e0b' : '#10b981';
  return (
    <div className={`bar-track ${size === 'sm' ? 'bar-track-sm' : ''}`}>
      <div className="bar-fill" style={{ width: `${c}%`, backgroundColor: color }} />
    </div>
  );
}
