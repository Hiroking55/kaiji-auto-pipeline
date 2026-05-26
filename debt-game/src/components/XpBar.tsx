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
        <span className="font-bold text-glow-gold" style={{ color: '#f8d830' }}>
          Lv.{level}
        </span>
        <span style={{ color: '#9090c0' }}>
          EXP {current}/{max}
        </span>
      </div>
      <div className="pixel-bar-track pixel-bar-track-sm">
        <div
          className="pixel-bar-fill"
          style={{
            width: `${percentage}%`,
            backgroundColor: '#3080f8',
            boxShadow: 'inset 0 -2px 0 rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.3)',
          }}
        />
      </div>
    </div>
  );
}
