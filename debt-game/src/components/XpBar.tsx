'use client';

interface XpBarProps { current: number; max: number; level: number; }

export default function XpBar({ current, max, level }: XpBarProps) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0;
  return (
    <div className="w-full">
      <div className="flex justify-between items-center text-[11px] mb-1">
        <span className="font-bold" style={{ color: '#b08810' }}>Lv.{level}</span>
        <span style={{ color: '#5a6a8a' }}>EXP {current}/{max}</span>
      </div>
      <div className="bar-track bar-track-sm">
        <div className="bar-fill" style={{ width: `${pct}%`, backgroundColor: '#5aa8e0' }} />
      </div>
    </div>
  );
}
