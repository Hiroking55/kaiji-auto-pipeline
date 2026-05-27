'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getDashboardData, processLogin } from '@/lib/client-actions';
import { formatCurrency, calculateLevel, getHunterRankTitle } from '@/lib/game-engine';
import XpBar from '@/components/XpBar';
import TownScene from '@/components/TownScene';
import BossCard from '@/components/BossCard';
import { DashboardData } from '@/lib/types';

export default function Page() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    processLogin();
    const result = getDashboardData();
    if (!result) { router.push('/setup'); return; }
    setData(result);
    setLoading(false);
  }, [router]);

  if (loading || !data) {
    return <div className="flex items-center justify-center min-h-screen"><p className="text-3xl animate-bounce">🏰</p></div>;
  }

  const { player, bosses, totalDebt, monthlyPaid, monthlyPaymentCount, xpForNextLevel, netWorth, townVitality, totalSavings, totalInvestmentReturn } = data;
  const levelInfo = calculateLevel(player.xp);
  const active = bosses.filter(b => !b.is_defeated);

  return (
    <div className="space-y-4 pb-4">
      {/* Town */}
      <TownScene netWorth={netWorth} vitality={townVitality} />

      {/* Profile + Stats */}
      <div className="card p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1">
            <p className="text-lg font-bold">{player.name}</p>
            <p className="text-xs font-semibold" style={{ color: '#d4a020' }}>{getHunterRankTitle(player.level)}</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold" style={{ color: '#d4a020' }}>{player.login_streak}</p>
            <p className="text-[9px] font-semibold" style={{ color: '#9ca3af' }}>連続日</p>
          </div>
        </div>
        <XpBar current={levelInfo.currentLevelXp} max={xpForNextLevel} level={player.level} />

        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t" style={{ borderColor: '#f1f5f9' }}>
          <div className="text-center">
            <p className="text-base font-bold" style={{ color: netWorth >= 0 ? '#10b981' : '#ef4444' }}>{formatCurrency(netWorth)}</p>
            <p className="text-[9px]" style={{ color: '#9ca3af' }}>純資産</p>
          </div>
          <div className="text-center">
            <p className="text-base font-bold" style={{ color: '#ef4444' }}>{formatCurrency(totalDebt)}</p>
            <p className="text-[9px]" style={{ color: '#9ca3af' }}>借金</p>
          </div>
          <div className="text-center">
            <p className="text-base font-bold" style={{ color: '#10b981' }}>{formatCurrency(monthlyPaid)}</p>
            <p className="text-[9px]" style={{ color: '#9ca3af' }}>今月返済</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/record" className="btn-main">⚔️ 討伐に出る</Link>
        <Link href="/bestiary" className="btn-gold">📖 財産を見る</Link>
      </div>

      {/* Active Quests */}
      {active.length > 0 && (
        <div>
          <p className="section-label">受注中クエスト</p>
          <div className="space-y-2">
            {active.sort((a, b) => a.sort_order - b.sort_order).map(b => <BossCard key={b.id} boss={b} />)}
          </div>
        </div>
      )}

      {/* Savings / Investment links */}
      {(totalSavings > 0 || totalInvestmentReturn !== 0) && (
        <div className="grid grid-cols-2 gap-3">
          <Link href="/savings" className="card p-3 text-center active:scale-[0.97] transition-transform">
            <p className="text-lg mb-0.5">🥚</p>
            <p className="text-[10px] font-semibold" style={{ color: '#6b7280' }}>貯金</p>
            <p className="text-sm font-bold" style={{ color: '#10b981' }}>{formatCurrency(totalSavings)}</p>
          </Link>
          <Link href="/expedition" className="card p-3 text-center active:scale-[0.97] transition-transform">
            <p className="text-lg mb-0.5">🗺️</p>
            <p className="text-[10px] font-semibold" style={{ color: '#6b7280' }}>投資</p>
            <p className="text-sm font-bold" style={{ color: totalInvestmentReturn >= 0 ? '#10b981' : '#ef4444' }}>
              {totalInvestmentReturn >= 0 ? '+' : ''}{formatCurrency(totalInvestmentReturn)}
            </p>
          </Link>
        </div>
      )}
    </div>
  );
}
