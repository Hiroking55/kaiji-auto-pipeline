'use client';

import Link from 'next/link';
import type { Boss } from '@/lib/types';
import { formatCurrency, getHpPercentage } from '@/lib/game-engine';
import HpBar from './HpBar';

interface BossCardProps {
  boss: Boss;
}

export default function BossCard({ boss }: BossCardProps) {
  const hpPercentage = getHpPercentage(boss);

  return (
    <Link href={`/battle?id=${boss.id}`} className="block">
      <div
        className={`rounded-xl p-4 border transition-all duration-200 ${
          boss.is_defeated
            ? 'opacity-50 border-green-500/50'
            : 'border-white/10 active:scale-[0.98]'
        }`}
        style={{ backgroundColor: '#16213e' }}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{boss.emoji}</span>
            <div>
              <h3 className="font-bold text-base" style={{ color: '#e0e0e0' }}>
                {boss.name}
              </h3>
              <p className="text-xs" style={{ color: '#8888aa' }}>
                {boss.subtitle}
              </p>
            </div>
          </div>
          {boss.is_defeated && (
            <span
              className="text-xs font-bold px-2 py-1 rounded"
              style={{ backgroundColor: '#44ff4420', color: '#44ff44' }}
            >
              DEFEATED
            </span>
          )}
        </div>

        <HpBar percentage={hpPercentage} size="sm" />

        <div className="flex justify-between items-center mt-2 text-xs" style={{ color: '#8888aa' }}>
          <span>
            {formatCurrency(boss.current_hp)} / {formatCurrency(boss.original_hp)}
          </span>
          <span>{hpPercentage}%</span>
        </div>
      </div>
    </Link>
  );
}
