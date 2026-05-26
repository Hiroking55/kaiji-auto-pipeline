'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getDashboardData, processLogin } from '@/lib/client-actions';
import { formatCurrency, calculateLevel, getHunterRankTitle } from '@/lib/game-engine';
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
          <p className="text-3xl mb-3 animate-pulse-glow">⚔️</p>
          <p className="text-sm" style={{ color: '#a09078' }}>Loading...</p>
        </div>
      </div>
    );
  }

  const { player, bosses, totalDebt, originalTotalDebt, previousDayDebt, monthlyPaid, monthlyPaymentCount, monthlyXpEarned, largestHitThisMonth, dailyBudget, monthlyBudget, estimatedPayoff, xpForNextLevel } = data;
  const levelInfo = calculateLevel(player.xp);
  const debtDiff = previousDayDebt !== null ? totalDebt - previousDayDebt : null;
  const activeBosses = bosses.filter(b => !b.is_defeated);
  const defeatedBosses = bosses.filter(b => b.is_defeated);
  const progressPercent = originalTotalDebt > 0 ? Math.round(((originalTotalDebt - totalDebt) / originalTotalDebt) * 100) : 0;

  return (
    <div className="px-3 pt-4">
      {/* Hunter Card */}
      <div className="mh-panel-accent p-4 mb-3">
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-12 h-12 rounded flex items-center justify-center text-2xl"
            style={{ backgroundColor: '#1e1a14', border: '1px solid #4a3c28' }}
          >
            ⚔️
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-black" style={{ color: '#f0e8d8' }}>
              {player.name}
            </h1>
            <p className="text-[11px]" style={{ color: '#ffc830' }}>
              {getHunterRankTitle(player.level)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px]" style={{ color: '#a09078' }}>連続</p>
            <p className="text-base font-black" style={{ color: '#ff8820' }}>
              {player.login_streak}日
            </p>
          </div>
        </div>
        <XpBar current={levelInfo.currentLevelXp} max={xpForNextLevel} level={player.level} />
      </div>

      {/* Total Debt / Bounty */}
      <div className="mh-panel p-4 mb-3">
        <div className="flex justify-between items-start mb-2">
          <div>
            <p className="text-[10px] font-bold" style={{ color: '#a09078' }}>
              総懸賞金（借金残高）
            </p>
            <p className="text-2xl font-black" style={{ color: '#e84040' }}>
              {formatCurrency(totalDebt)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px]" style={{ color: '#a09078' }}>討伐進捗</p>
            <p className="text-lg font-black" style={{ color: '#ffc830' }}>
              {progressPercent}%
            </p>
          </div>
        </div>
        {/* Overall progress bar */}
        <div className="mh-hp-track mh-hp-track-sm">
          <div
            className="mh-hp-fill"
            style={{ width: `${100 - progressPercent}%`, backgroundColor: '#e84040' }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          {debtDiff !== null && (
            <p className="text-[11px] font-bold" style={{ color: debtDiff <= 0 ? '#40c850' : '#e84040' }}>
              前日比 {debtDiff <= 0 ? '▼' : '▲'}{formatCurrency(Math.abs(debtDiff))}
            </p>
          )}
          <p className="text-[11px]" style={{ color: '#a09078' }}>
            {activeBosses.length}体 残存 / {defeatedBosses.length}体 討伐済
          </p>
        </div>
      </div>

      {/* Monthly Hunt Summary */}
      <div className="mh-panel p-3 mb-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs" style={{ color: '#ffc830' }}>📊</span>
          <h2 className="text-xs font-bold" style={{ color: '#f0e8d8' }}>
            今月の狩猟成果
          </h2>
        </div>
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center">
            <p className="text-lg font-black" style={{ color: '#ff8820' }}>{monthlyPaymentCount}</p>
            <p className="text-[9px]" style={{ color: '#a09078' }}>出撃数</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-black" style={{ color: '#40c850' }}>{formatCurrency(monthlyPaid).replace('¥', '')}</p>
            <p className="text-[9px]" style={{ color: '#a09078' }}>総ダメージ</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-black" style={{ color: '#ffc830' }}>{monthlyXpEarned}</p>
            <p className="text-[9px]" style={{ color: '#a09078' }}>獲得EXP</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-black" style={{ color: '#e84040' }}>{formatCurrency(largestHitThisMonth).replace('¥', '')}</p>
            <p className="text-[9px]" style={{ color: '#a09078' }}>最大火力</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <StatCard
          label="今日使える額"
          value={formatCurrency(dailyBudget)}
          variant={dailyBudget > 0 ? 'positive' : 'negative'}
        />
        <StatCard
          label="完済予定"
          value={estimatedPayoff
            ? new Date(estimatedPayoff).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short' })
            : '---'
          }
        />
      </div>

      {/* Quest Board */}
      <div className="mb-6">
        <div className="mh-section-header">
          <h2>クエストボード</h2>
        </div>

        {activeBosses.length > 0 && (
          <div className="space-y-2 mb-3">
            {activeBosses
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((boss) => (
                <BossCard key={boss.id} boss={boss} />
              ))}
          </div>
        )}

        {defeatedBosses.length > 0 && (
          <>
            <p className="text-[10px] font-bold mb-2" style={{ color: '#706050' }}>
              ── 討伐済みクエスト ──
            </p>
            <div className="space-y-2">
              {defeatedBosses.map((boss) => (
                <BossCard key={boss.id} boss={boss} />
              ))}
            </div>
          </>
        )}

        {bosses.length === 0 && (
          <div className="mh-panel p-6 text-center">
            <p style={{ color: '#a09078' }}>
              クエストが登録されていません
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
