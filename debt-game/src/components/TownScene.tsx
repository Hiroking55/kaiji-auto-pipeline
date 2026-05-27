'use client';

import { getTownStage, getVitalityLabel } from '@/lib/game-engine';

export default function TownScene({ netWorth, vitality }: { netWorth: number; vitality: number }) {
  const stage = getTownStage(netWorth);
  const vLabel = getVitalityLabel(vitality);

  return (
    <div className="rpg-panel" style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div>
        <p style={{ fontSize: 13, fontWeight: 800, color: '#2b3a67' }}>🏰 {stage.name}</p>
        <p style={{ fontSize: 10, color: '#5a6a8a' }}>{stage.description}</p>
      </div>
      <div style={{ textAlign: 'right' }}>
        <p style={{ fontSize: 10, fontWeight: 800, color: vLabel.color }}>{vLabel.text}</p>
        <p style={{ fontSize: 10, color: '#5a6a8a' }}>活気 {vitality}%</p>
      </div>
    </div>
  );
}
