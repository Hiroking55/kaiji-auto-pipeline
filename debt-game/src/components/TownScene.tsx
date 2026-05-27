'use client';

import { getTownStage, getVitalityLabel } from '@/lib/game-engine';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
const IMGS: Record<number, string> = { 1: `${basePath}/town-lv1.png`, 3: `${basePath}/town-lv3.png`, 5: `${basePath}/town-lv5.png`, 7: `${basePath}/town-lv7.png` };

export default function TownScene({ netWorth, vitality }: { netWorth: number; vitality: number }) {
  const stage = getTownStage(netWorth);
  const vl = getVitalityLabel(vitality);

  return (
    <div>
      <div style={{ position: 'relative' }}>
        <img src={IMGS[stage.level]} alt={stage.name} className="town-hero" />
        {vitality < 50 && (
          <div style={{ position: 'absolute', inset: 0, background: `rgba(100,100,110,${0.4 * (1 - vitality / 100)})`, mixBlendMode: 'multiply' }} />
        )}
      </div>
      <div className="card -mt-4 relative z-10 mx-1 p-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold" style={{ color: '#1a1a2e' }}>🏰 {stage.name}</p>
          <p className="text-[10px]" style={{ color: '#6b7280' }}>{stage.description}</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-bold" style={{ color: vl.color }}>{vl.text}</p>
          <p className="text-[10px]" style={{ color: '#9ca3af' }}>活気 {vitality}%</p>
        </div>
      </div>
    </div>
  );
}
