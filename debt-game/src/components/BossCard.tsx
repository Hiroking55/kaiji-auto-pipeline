'use client';

import Link from 'next/link';
import type { Boss } from '@/lib/types';
import { formatCurrency, getHpPercentage, getQuestDifficulty, getQuestDaysRemaining } from '@/lib/game-engine';
import HpBar from './HpBar';
import StarRating from './StarRating';

export default function BossCard({ boss }: { boss: Boss }) {
  const hp = getHpPercentage(boss);
  const diff = getQuestDifficulty(boss);
  const days = getQuestDaysRemaining(boss);

  return (
    <Link href={`/battle?id=${boss.id}`} className="block">
      <div className={`rpg-panel p-3 active:scale-[0.98] transition-transform ${boss.is_defeated ? 'quest-defeated' : ''}`}>
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{boss.emoji}</span>
            <div>
              <h3 className="font-bold text-sm" style={{ color: '#2b3a67' }}>{boss.name}</h3>
              <StarRating difficulty={diff} />
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            {boss.is_defeated
              ? <span className="tag-rpg tag-clear">討伐済</span>
              : days !== null
                ? <span className="timer-badge" style={{ color: days < 90 ? '#d9534f' : '#5a6a8a' }}>残{days}日</span>
                : null
            }
          </div>
        </div>
        <HpBar percentage={hp} size="sm" />
        <div className="flex justify-between mt-1.5 text-[10px]" style={{ color: '#5a6a8a' }}>
          <span>{formatCurrency(boss.current_hp)} / {formatCurrency(boss.original_hp)}</span>
          <span>{hp}%</span>
        </div>
      </div>
    </Link>
  );
}
