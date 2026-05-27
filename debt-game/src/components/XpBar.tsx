'use client';

export default function XpBar({ current, max, level }: { current: number; max: number; level: number }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0;
  return (
    <div className="w-full">
      <div className="flex justify-between items-center text-[11px] mb-1">
        <span className="font-bold" style={{ color: '#d4a020' }}>Lv.{level}</span>
        <span style={{ color: '#9ca3af' }}>{current}/{max}</span>
      </div>
      <div className="bar-track bar-track-sm">
        <div className="bar-fill" style={{ width: `${pct}%`, backgroundColor: '#3b82f6' }} />
      </div>
    </div>
  );
}
