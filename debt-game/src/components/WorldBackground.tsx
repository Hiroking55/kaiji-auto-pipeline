'use client';

import { useEffect, useState } from 'react';
import { getDashboardData } from '@/lib/client-actions';
import { getTownStage } from '@/lib/game-engine';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

const TOWN_IMAGES: Record<number, string> = {
  1: `${basePath}/town-lv1.png`,
  3: `${basePath}/town-lv3.png`,
  5: `${basePath}/town-lv5.png`,
  7: `${basePath}/town-lv7.png`,
};

export default function WorldBackground() {
  const [imgSrc, setImgSrc] = useState(TOWN_IMAGES[1]);

  useEffect(() => {
    const data = getDashboardData();
    if (data) {
      const stage = getTownStage(data.netWorth);
      setImgSrc(TOWN_IMAGES[stage.level]);
    }
  }, []);

  return (
    <div className="fixed inset-0 z-0">
      <img
        src={imgSrc}
        alt=""
        className="pixel"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center 20%',
        }}
      />
      {/* Bottom fade for content readability */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '65%',
        background: 'linear-gradient(180deg, transparent 0%, rgba(15,20,40,0.6) 30%, rgba(15,20,40,0.92) 60%, #0f1428 80%)',
      }} />
    </div>
  );
}
