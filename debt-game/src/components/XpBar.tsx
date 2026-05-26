'use client';

interface XpBarProps {
  current: number;
  max: number;
  level: number;
}

export default function XpBar({ current, max, level }: XpBarProps) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0;

  return (
    <div className="w-full">
      <div className="flex justify-between items-center text-[11px] mb-1.5">
        <span className="font-extrabold glow-gold" style={{ color: '#b89450' }}>
          HR {level}
        </span>
        <span className="font-medium" style={{ color: '#7c7870' }}>
          {current} / {max}
        </span>
      </div>
      <div className="hp-track hp-track-sm">
        <div
          className="hp-fill"
          style={{
            width: `${pct}%`,
            background: 'linear-gradient(90deg, #4878b0, #7858a0)',
            boxShadow: '0 0 12px rgba(91, 158, 232, 0.3)',
          }}
        />
      </div>
    </div>
  );
}
