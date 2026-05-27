'use client';

import { getTownStage, getVitalityLabel } from '@/lib/game-engine';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

const TOWN_IMAGES: Record<number, string> = {
  1: `${basePath}/town-lv1.png`,
  3: `${basePath}/town-lv3.png`,
  5: `${basePath}/town-lv5.png`,
  7: `${basePath}/town-lv7.png`,
};

export default function TownScene({ netWorth, vitality }: { netWorth: number; vitality: number }) {
  const stage = getTownStage(netWorth);
  const vLabel = getVitalityLabel(vitality);
  const desolation = Math.max(0, 0.5 * (1 - vitality / 100));

  return (
    <div style={{ margin: '0 -12px' }}>
      {/* Hero image */}
      <div style={{ position: 'relative' }}>
        <img
          src={TOWN_IMAGES[stage.level]}
          alt={stage.name}
          className="town-hero"
        />
        {desolation > 0.05 && (
          <div style={{
            position: 'absolute', inset: 0,
            background: `rgba(80,80,90,${desolation})`,
            mixBlendMode: 'multiply',
            borderRadius: '0 0 16px 16px',
          }} />
        )}
        {vitality >= 80 && (
          <div className="animate-sparkle" style={{ position: 'absolute', top: 12, right: 16, fontSize: 20 }}>✨</div>
        )}
      </div>

      {/* Info bar below image */}
      <div className="rpg-panel" style={{ margin: '-12px 12px 0', position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px' }}>
        <div>
          <p style={{ fontSize: 14, fontWeight: 800, color: '#2b3a67' }}>🏰 {stage.name}</p>
          <p style={{ fontSize: 10, color: '#5a6a8a' }}>{stage.description}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: 11, fontWeight: 800, color: vLabel.color }}>{vLabel.text}</p>
          <p style={{ fontSize: 10, color: '#5a6a8a' }}>活気 {vitality}%</p>
        </div>
      </div>
    </div>
  );
}
