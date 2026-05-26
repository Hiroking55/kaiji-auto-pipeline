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
  const hp = getHpPercentage(boss);
  const diff = getQuestDifficulty(boss);
  const days = getQuestDaysRemaining(boss);

  return (
    <Link href={`/battle?id=${boss.id}`} className="block">
      <div
        className={`glass-sm p-4 transition-all duration-200 active:scale-[0.98] ${boss.is_defeated ? 'quest-defeated' : ''}`}
        style={{
          borderColor: boss.is_defeated
            ? 'rgba(56, 192, 112, 0.15)'
            : 'rgba(255, 255, 255, 0.05)',
        }}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl"
              style={{
                background: 'rgba(8, 10, 20, 0.6)',
                boxShadow: 'inset 0 0 8px rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.03)',
              }}
            >
              {boss.emoji}
            </div>
            <div>
              <h3 className="font-extrabold text-[15px]" style={{ color: '#e8e6e2' }}>
                {boss.name}
              </h3>
              <StarRating difficulty={diff} />
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            {boss.is_defeated ? (
              <span className="tag tag-clear">CLEAR</span>
            ) : days !== null ? (
              <span className="timer-badge" style={{ color: days < 90 ? '#c04040' : '#7c7870' }}>
                残{days}日
              </span>
            ) : null}
          </div>
        </div>

        <HpBar percentage={hp} size="sm" />

        <div className="flex justify-between mt-2 text-[10px] font-medium" style={{ color: '#7c7870' }}>
          <span>{formatCurrency(boss.current_hp)} / {formatCurrency(boss.original_hp)}</span>
          <span style={{ color: hp > 50 ? '#c04040' : hp > 20 ? '#b89450' : '#40a060' }}>
            残り{hp}%
          </span>
        </div>
      </div>
    </Link>
  );
}
