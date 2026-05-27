'use client';

import { getTownStage, getVitalityLabel } from '@/lib/game-engine';

interface TownSceneProps {
  netWorth: number;
  vitality: number;
}

export default function TownScene({ netWorth, vitality }: TownSceneProps) {
  const stage = getTownStage(netWorth);
  const vLabel = getVitalityLabel(vitality);
  const desolation = Math.max(0, 0.7 * (1 - vitality / 100));

  return (
    <div className="rpg-panel-accent overflow-hidden" style={{ position: 'relative' }}>
      {/* Sky */}
      <div style={{
        height: 200,
        background: `linear-gradient(180deg, #5aa8e0 0%, #9ed6f6 50%, #dff3df 100%)`,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Clouds */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
          <ellipse cx="80" cy="40" rx="50" ry="18" fill="white" opacity="0.7" />
          <ellipse cx="250" cy="30" rx="60" ry="20" fill="white" opacity="0.6" />
          <ellipse cx="350" cy="55" rx="40" ry="14" fill="white" opacity="0.5" />
        </svg>

        {/* Town buildings based on stage */}
        <svg className="absolute bottom-0 w-full" viewBox="0 0 400 120" preserveAspectRatio="xMidYMax meet">
          {/* Ground */}
          <rect x="0" y="90" width="400" height="30" fill="#6db86b" />
          <rect x="0" y="95" width="400" height="25" fill="#5aa85a" />

          {stage.level >= 1 && (
            <>
              {/* Small hut */}
              <rect x="60" y="65" width="30" height="25" fill="#b08050" />
              <polygon points="55,65 90,65 75,50" fill="#c05030" />
              <rect x="70" y="75" width="8" height="15" fill="#604030" />
            </>
          )}

          {stage.level >= 3 && (
            <>
              {/* Castle keep */}
              <rect x="170" y="40" width="40" height="50" fill="#a0a0b0" />
              <rect x="165" y="30" width="50" height="12" fill="#8080a0" />
              <polygon points="175,30 195,15 215,30" fill="#c05030" />
              {/* House */}
              <rect x="250" y="60" width="35" height="30" fill="#d0a070" />
              <polygon points="245,60 290,60 267,45" fill="#4070b0" />
              {/* Banner */}
              <rect x="190" y="15" width="2" height="20" fill="#604030" />
              <polygon points="192,15 205,20 192,25" fill="#ffd23f" />
            </>
          )}

          {stage.level >= 5 && (
            <>
              {/* Fountain */}
              <circle cx="140" cy="88" r="10" fill="#80c0e0" opacity="0.6" />
              <rect x="138" y="78" width="4" height="12" fill="#a0a0b0" />
              {/* Market */}
              <rect x="300" y="65" width="30" height="25" fill="#e0c080" />
              <polygon points="295,65 335,65 315,52" fill="#d05030" />
              {/* More houses */}
              <rect x="100" y="68" width="25" height="22" fill="#c0a060" />
              <polygon points="95,68 130,68 112,56" fill="#3060a0" />
            </>
          )}

          {stage.level >= 7 && (
            <>
              {/* Grand castle spires */}
              <rect x="180" y="20" width="8" height="25" fill="#c0c0d0" />
              <polygon points="178,20 192,20 185,8" fill="#ffd23f" />
              <rect x="202" y="22" width="8" height="23" fill="#c0c0d0" />
              <polygon points="200,22 214,22 207,10" fill="#ffd23f" />
              {/* Extra buildings */}
              <rect x="30" y="70" width="22" height="20" fill="#d0b080" />
              <polygon points="28,70 54,70 41,60" fill="#c05030" />
              <rect x="340" y="68" width="28" height="22" fill="#b0a070" />
              <polygon points="338,68 370,68 354,55" fill="#4080c0" />
            </>
          )}
        </svg>

        {/* Desolation overlay */}
        {desolation > 0.1 && (
          <div className="absolute inset-0" style={{
            background: `rgba(107, 111, 120, ${desolation})`,
            mixBlendMode: 'multiply',
          }} />
        )}

        {/* Vitality effects */}
        {vitality >= 70 && (
          <div className="absolute bottom-4 left-1/4 text-lg animate-bounce">🌸</div>
        )}
        {vitality >= 90 && (
          <div className="absolute top-8 right-8 text-sm animate-sparkle">✨</div>
        )}
      </div>

      {/* Town info bar */}
      <div className="p-3 flex items-center justify-between" style={{ background: 'var(--ui-cream)' }}>
        <div>
          <p className="text-xs font-bold" style={{ color: '#2b3a67' }}>
            🏰 {stage.name}
          </p>
          <p className="text-[10px]" style={{ color: '#5a6a8a' }}>{stage.description}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold" style={{ color: vLabel.color }}>
            {vLabel.text}
          </p>
          <p className="text-[10px]" style={{ color: '#5a6a8a' }}>活気 {vitality}%</p>
        </div>
      </div>
    </div>
  );
}
