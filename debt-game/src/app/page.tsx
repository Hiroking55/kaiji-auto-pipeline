'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getDashboardData, processLogin } from '@/lib/client-actions';
import { formatCurrency, getHpPercentage, calculateLevel } from '@/lib/game-engine';
import XpBar from '@/components/XpBar';
import StatCard from '@/components/StatCard';
import BossCard from '@/components/BossCard';
import { DashboardData } from '@/lib/types';

export default function Page() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    processLogin();
    const result = getDashboardData();
    if (!result) {
      router.push('/setup');
      return;
    }
    setData(result);
    setLoading(false);
  }, [router]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-3xl mb-3 animate-bounce-pixel">⚔️</p>
          <p className="text-sm animate-blink" style={{ color: '#9090c0' }}>Now Loading...</p>
        </div>
      </div>
    );
  }

  const { player, bosses, totalDebt, previousDayDebt, monthlyPaid, dailyBudget, monthlyBudget, estimatedPayoff, xpForNextLevel } = data;
  const levelInfo = calculateLevel(player.xp);
  const debtDiff = previousDayDebt !== null ? totalDebt - previousDayDebt : null;

  return (
    <div className="px-3 pt-5">
      {/* Player Header */}
      <div className="pixel-window mb-4">
        <div className="text-center mb-3">
          <p className="text-2xl mb-1">⚔️</p>
          <h1 className="text-lg font-bold text-glow-gold" style={{ color: '#f8d830' }}>
            {player.name}
          </h1>
          <p className="text-xs" style={{ color: '#9090c0' }}>
            Lv.{player.level} {player.title}
          </p>
        </div>
        <XpBar
          current={levelInfo.currentLevelXp}
          max={xpForNextLevel}
          level={player.level}
        />
      </div>

      {/* Total Debt Card */}
      <div className="pixel-window mb-4 text-center">
        <p className="text-[10px] mb-1" style={{ color: '#9090c0' }}>
          ▼ そうざんだか ▼
        </p>
        <p className="text-2xl font-bold text-glow-red" style={{ color: '#f83030' }}>
          {formatCurrency(totalDebt)}
        </p>
        {debtDiff !== null && (
          <p
            className="text-xs mt-1 font-bold"
            style={{ color: debtDiff <= 0 ? '#30f848' : '#f83030' }}
          >
            {debtDiff <= 0 ? '▼' : '▲'} {formatCurrency(Math.abs(debtDiff))} ぜんじつひ
          </p>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <StatCard
          label="こんげつへんさい"
          value={formatCurrency(monthlyPaid)}
          variant="positive"
        />
        <StatCard
          label="かんさいよてい"
          value={estimatedPayoff
            ? new Date(estimatedPayoff).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short' })
            : '---'
          }
        />
        <StatCard
          label="きょうつかえる"
          value={formatCurrency(dailyBudget)}
          variant={dailyBudget > 0 ? 'positive' : 'negative'}
        />
        <StatCard
          label="こんげつよさん"
          value={formatCurrency(monthlyBudget)}
          variant={monthlyBudget > 0 ? 'positive' : 'negative'}
        />
      </div>

      {/* Boss List */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span style={{ color: '#f8d830' }}>▶</span>
          <h2 className="text-base font-bold" style={{ color: '#ffffff' }}>
            ボスいちらん
          </h2>
        </div>
        <div className="space-y-3">
          {bosses
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((boss) => (
              <BossCard key={boss.id} boss={boss} />
            ))}
        </div>
        {bosses.length === 0 && (
          <div className="pixel-window text-center">
            <p style={{ color: '#9090c0' }}>
              ボスがまだとうろくされていません
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
