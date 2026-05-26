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
          <p className="text-3xl mb-3 animate-pulse">&#x2694;&#xFE0F;</p>
          <p className="text-sm" style={{ color: '#8888aa' }}>読み込み中...</p>
        </div>
      </div>
    );
  }

  const { player, bosses, totalDebt, previousDayDebt, monthlyPaid, dailyBudget, monthlyBudget, estimatedPayoff, xpForNextLevel } = data;
  const levelInfo = calculateLevel(player.xp);

  const debtDiff = previousDayDebt !== null ? totalDebt - previousDayDebt : null;

  return (
    <div className="px-4 pt-6">
      {/* Player Header */}
      <div className="text-center mb-4">
        <p className="text-3xl mb-1">&#x2694;&#xFE0F;</p>
        <h1 className="text-xl font-bold" style={{ color: '#ffd700' }}>
          {player.name}
        </h1>
        <p className="text-sm" style={{ color: '#8888aa' }}>
          Lv.{player.level} {player.title}
        </p>
      </div>

      {/* XP Bar */}
      <div className="mb-6">
        <XpBar
          current={levelInfo.currentLevelXp}
          max={xpForNextLevel}
          level={player.level}
        />
      </div>

      {/* Total Debt Card */}
      <div
        className="rounded-xl p-5 border border-white/10 mb-6 text-center"
        style={{ backgroundColor: '#16213e' }}
      >
        <p className="text-xs mb-1" style={{ color: '#8888aa' }}>
          総借金残高
        </p>
        <p className="text-3xl font-bold" style={{ color: '#ff4444' }}>
          {formatCurrency(totalDebt)}
        </p>
        {debtDiff !== null && (
          <p
            className="text-sm mt-1 font-medium"
            style={{ color: debtDiff <= 0 ? '#44ff44' : '#ff4444' }}
          >
            {debtDiff <= 0 ? '▼' : '▲'} {formatCurrency(Math.abs(debtDiff))} 前日比
          </p>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatCard
          label="今月返済額"
          value={formatCurrency(monthlyPaid)}
          variant="positive"
        />
        <StatCard
          label="完済予定日"
          value={estimatedPayoff
            ? new Date(estimatedPayoff).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short' })
            : '---'
          }
        />
        <StatCard
          label="今日使える額"
          value={formatCurrency(dailyBudget)}
          variant={dailyBudget > 0 ? 'positive' : 'negative'}
        />
        <StatCard
          label="今月残予算"
          value={formatCurrency(monthlyBudget)}
          variant={monthlyBudget > 0 ? 'positive' : 'negative'}
        />
      </div>

      {/* Boss List */}
      <div className="mb-6">
        <h2 className="text-lg font-bold mb-3" style={{ color: '#e0e0e0' }}>
          ボス一覧
        </h2>
        <div className="space-y-3">
          {bosses
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((boss) => (
              <BossCard key={boss.id} boss={boss} />
            ))}
        </div>
        {bosses.length === 0 && (
          <p className="text-center py-8" style={{ color: '#8888aa' }}>
            まだボスが登録されていません
          </p>
        )}
      </div>
    </div>
  );
}
