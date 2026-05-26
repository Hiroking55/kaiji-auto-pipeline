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
        <span className="font-bold" style={{ color: '#ffd700' }}>
          Lv.{level}
        </span>
        <span style={{ color: '#8888aa' }}>
          {current}/{max}
        </span>
      </div>
      <div
        className="w-full h-3 rounded-full overflow-hidden"
        style={{ backgroundColor: '#1a1a2e' }}
      >
        <div
          className="h-3 rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${percentage}%`,
            background: 'linear-gradient(90deg, #4488ff, #44bbff)',
            boxShadow: '0 0 8px #4488ff80',
          }}
        />
      </div>
    </div>
  );
}
