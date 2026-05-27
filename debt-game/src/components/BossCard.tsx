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
    <Link href={`/battle?id=${boss.id}`}>
      <div className={`card p-4 active:scale-[0.98] transition-transform ${boss.is_defeated ? 'quest-defeated' : ''}`}>
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{boss.emoji}</span>
            <div>
              <p className="text-sm font-bold" style={{ color: '#1a1a2e' }}>{boss.name}</p>
              <StarRating difficulty={diff} />
            </div>
          </div>
          {boss.is_defeated
            ? <span className="tag tag-clear">討伐済</span>
            : days !== null
              ? <span className="text-[10px] font-semibold" style={{ color: days < 90 ? '#ef4444' : '#9ca3af' }}>残{days}日</span>
              : null
          }
        </div>
        <HpBar percentage={hp} size="sm" />
        <div className="flex justify-between mt-1.5 text-[10px]" style={{ color: '#6b7280' }}>
          <span>{formatCurrency(boss.current_hp)} / {formatCurrency(boss.original_hp)}</span>
          <span>{hp}%</span>
        </div>
      </div>
    </Link>
  );
}
