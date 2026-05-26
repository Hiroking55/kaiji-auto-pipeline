'use client';

import Link from 'next/link';
import type { Boss } from '@/lib/types';
import { formatCurrency, getHpPercentage, getQuestDifficulty, getQuestDaysRemaining } from '@/lib/game-engine';
import HpBar from './HpBar';
import StarRating from './StarRating';

interface BossCardProps {
  boss: Boss;
}

export default function BossCard({ boss }: BossCardProps) {
  const hpPercentage = getHpPercentage(boss);
  const difficulty = getQuestDifficulty(boss);
  const daysRemaining = getQuestDaysRemaining(boss);

  return (
    <Link href={`/battle?id=${boss.id}`} className="block">
      <div className={`mh-quest-card p-3 ${boss.is_defeated ? 'quest-defeated' : ''}`}>
        {/* Quest Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{boss.emoji}</span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm" style={{ color: '#f0e8d8' }}>
                  {boss.name}
                </h3>
                {boss.is_defeated && <span className="mh-tag mh-tag-clear">CLEAR</span>}
              </div>
              <StarRating difficulty={difficulty} />
            </div>
          </div>
          {!boss.is_defeated && daysRemaining !== null && (
            <span className="mh-timer" style={{ color: daysRemaining < 90 ? '#e84040' : '#a09078' }}>
              ⏱ 残{daysRemaining}日
            </span>
          )}
        </div>

        {/* HP Bar */}
        <HpBar percentage={hpPercentage} size="sm" />

        {/* Info Row */}
        <div className="flex justify-between items-center mt-1.5 text-[10px]">
          <span style={{ color: '#a09078' }}>
            {formatCurrency(boss.current_hp)} / {formatCurrency(boss.original_hp)}
          </span>
          <span style={{ color: hpPercentage > 50 ? '#e84040' : hpPercentage > 20 ? '#e8a020' : '#40c850' }}>
            {hpPercentage}%
          </span>
        </div>
      </div>
    </Link>
  );
}
