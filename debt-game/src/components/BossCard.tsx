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
      <div className={`pixel-window ${boss.is_defeated ? 'defeated' : ''}`}>
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{boss.emoji}</span>
            <div>
              <h3 className="font-bold text-sm" style={{ color: '#ffffff' }}>
                {boss.name}
              </h3>
              <p className="text-[10px]" style={{ color: '#9090c0' }}>
                {boss.subtitle}
              </p>
            </div>
          </div>
          {boss.is_defeated && (
            <span
              className="text-[10px] font-bold px-2 py-0.5"
              style={{
                backgroundColor: '#30f84830',
                color: '#30f848',
                border: '1px solid #30f848',
              }}
            >
              撃破
            </span>
          )}
        </div>

        <HpBar percentage={hpPercentage} size="sm" />

        <div className="flex justify-between items-center mt-1 text-[10px]" style={{ color: '#9090c0' }}>
          <span>
            {formatCurrency(boss.current_hp)} / {formatCurrency(boss.original_hp)}
          </span>
          <span>{hpPercentage}%</span>
        </div>
      </div>
    </Link>
  );
}
