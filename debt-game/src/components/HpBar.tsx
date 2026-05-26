'use client';

interface HpBarProps {
  percentage: number;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

export default function HpBar({ percentage, showLabel = false, size = 'md' }: HpBarProps) {
  const clamped = Math.max(0, Math.min(100, percentage));

  const barColor = clamped > 60 ? '#ff4444' : clamped > 30 ? '#ffaa00' : '#44ff44';
  const height = size === 'sm' ? 'h-2' : 'h-4';

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between text-xs mb-1" style={{ color: '#8888aa' }}>
          <span>HP</span>
          <span>{clamped}%</span>
        </div>
      )}
      <div
        className={`w-full ${height} rounded-full overflow-hidden`}
        style={{ backgroundColor: '#1a1a2e' }}
      >
        <div
          className={`${height} rounded-full transition-all duration-700 ease-out`}
          style={{
            width: `${clamped}%`,
            backgroundColor: barColor,
            boxShadow: `0 0 8px ${barColor}80`,
          }}
        />
      </div>
    </div>
  );
}
