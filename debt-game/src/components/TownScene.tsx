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
  const desolation = Math.max(0, 0.6 * (1 - vitality / 100));

  return (
    <div className="rpg-panel-accent overflow-hidden" style={{ borderRadius: 12 }}>
      <div style={{ position: 'relative', height: 280 }}>
        {/* Town background image */}
        <img
          src={TOWN_IMAGES[stage.level]}
          alt={stage.name}
          className="pixel"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center 30%',
            display: 'block',
          }}
        />

        {/* Desolation overlay when vitality is low */}
        {desolation > 0.05 && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: `rgba(80, 80, 90, ${desolation})`,
            mixBlendMode: 'multiply',
          }} />
        )}

        {/* Vitality sparkles */}
        {vitality >= 70 && (
          <div className="animate-sparkle" style={{ position: 'absolute', top: 16, right: 20, fontSize: 18 }}>✨</div>
        )}
        {vitality >= 90 && (
          <div className="animate-bounce" style={{ position: 'absolute', bottom: 60, left: 24, fontSize: 16 }}>🌸</div>
        )}
      </div>

      {/* Town info bar */}
      <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--ui-cream)' }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 800, color: '#2b3a67' }}>🏰 {stage.name}</p>
          <p style={{ fontSize: 10, color: '#5a6a8a' }}>{stage.description}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: 10, fontWeight: 800, color: vLabel.color }}>{vLabel.text}</p>
          <p style={{ fontSize: 10, color: '#5a6a8a' }}>活気 {vitality}%</p>
        </div>
      </div>
    </div>
  );
}
