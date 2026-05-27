'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getDashboardData, processLogin } from '@/lib/client-actions';
import { formatCurrency, calculateLevel, getHunterRankTitle, getTownStage, estimateGoalMonths, calculateReturnRate } from '@/lib/game-engine';
import XpBar from '@/components/XpBar';
import StatCard from '@/components/StatCard';
import BossCard from '@/components/BossCard';
import TownScene from '@/components/TownScene';
import { DashboardData } from '@/lib/types';

export default function Page() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginBonus, setLoginBonus] = useState<{ bonus: number; show: boolean }>({ bonus: 0, show: false });

  useEffect(() => {
    const { streakBonus, isNewDay } = processLogin();
    if (isNewDay && streakBonus > 0) {
      setLoginBonus({ bonus: streakBonus, show: true });
      setTimeout(() => setLoginBonus(p => ({ ...p, show: false })), 3000);
    }
    const result = getDashboardData();
    if (!result) { router.push('/setup'); return; }
    setData(result);
    setLoading(false);
  }, [router]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-3xl animate-bounce">🏰</p>
      </div>
    );
  }

  const { player, bosses, totalDebt, originalTotalDebt, previousDayDebt, monthlyPaid, monthlyPaymentCount, monthlyXpEarned, largestHitThisMonth, dailyBudget, estimatedPayoff, xpForNextLevel, savingsGoals, totalSavings, investments, totalInvestmentValue, totalInvestmentReturn, netWorth, townVitality } = data;
  const levelInfo = calculateLevel(player.xp);
  const debtDiff = previousDayDebt !== null ? totalDebt - previousDayDebt : null;
  const active = bosses.filter(b => !b.is_defeated);
  const defeated = bosses.filter(b => b.is_defeated);
  const progress = originalTotalDebt > 0 ? Math.round(((originalTotalDebt - totalDebt) / originalTotalDebt) * 100) : 0;

  return (
    <div className="pt-4 space-y-3">
      {/* Login Bonus Toast */}
      {loginBonus.show && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
          <div className="rpg-panel-accent px-5 py-2 text-center">
            <p className="text-[10px] font-bold" style={{ color: '#5a6a8a' }}>ログインボーナス</p>
            <p className="text-lg font-bold" style={{ color: '#b08810' }}>+{loginBonus.bonus} EXP ✨</p>
            <p className="text-[10px]" style={{ color: '#5a6a8a' }}>{player.login_streak}日連続</p>
          </div>
        </div>
      )}

      {/* Town Scene */}
      <TownScene netWorth={netWorth} vitality={townVitality} />

      {/* Hunter Profile */}
      <div className="rpg-panel p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-11 h-11 rounded-lg flex items-center justify-center text-2xl" style={{ background: 'rgba(43,58,103,0.06)', border: '2px solid rgba(43,58,103,0.15)' }}>
            ⚔️
          </div>
          <div className="flex-1">
            <h1 className="text-base font-bold" style={{ color: '#2b3a67' }}>{player.name}</h1>
            <p className="text-[10px] font-bold" style={{ color: '#b08810' }}>{getHunterRankTitle(player.level)}</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold" style={{ color: '#d9534f' }}>{player.login_streak}</p>
            <p className="text-[8px] font-bold" style={{ color: '#5a6a8a' }}>連続日</p>
          </div>
        </div>
        <XpBar current={levelInfo.currentLevelXp} max={xpForNextLevel} level={player.level} />
      </div>

      {/* Net Worth & Debt */}
      <div className="rpg-panel p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <p className="text-[10px] font-bold" style={{ color: '#5a6a8a' }}>純資産</p>
            <p className="text-xl font-bold" style={{ color: netWorth >= 0 ? '#2d8a4e' : '#d9534f' }}>
              {formatCurrency(netWorth)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold" style={{ color: '#5a6a8a' }}>借金残高</p>
            <p className="text-base font-bold" style={{ color: '#d9534f' }}>{formatCurrency(totalDebt)}</p>
          </div>
        </div>
        {originalTotalDebt > 0 && (
          <>
            <div className="bar-track bar-track-sm">
              <div className="bar-fill" style={{ width: `${progress}%`, backgroundColor: '#2d8a4e' }} />
            </div>
            <div className="flex justify-between mt-1 text-[10px]">
              <span style={{ color: '#2d8a4e' }}>討伐進捗 {progress}%</span>
              {debtDiff !== null && (
                <span style={{ color: debtDiff <= 0 ? '#2d8a4e' : '#d9534f' }}>
                  前日比 {debtDiff <= 0 ? '↓' : '↑'}{formatCurrency(Math.abs(debtDiff))}
                </span>
              )}
            </div>
          </>
        )}
      </div>

      {/* Monthly Summary */}
      <div className="rpg-panel p-3">
        <p className="text-[10px] font-bold mb-2" style={{ color: '#5a6a8a' }}>📊 今月の討伐成果</p>
        <div className="grid grid-cols-4 gap-1 text-center">
          {[
            { v: String(monthlyPaymentCount), l: '出撃', c: '#2b3a67' },
            { v: formatCurrency(monthlyPaid).replace('¥', ''), l: 'ダメージ', c: '#2d8a4e' },
            { v: String(monthlyXpEarned), l: 'EXP', c: '#b08810' },
            { v: formatCurrency(largestHitThisMonth).replace('¥', ''), l: '最大火力', c: '#5aa8e0' },
          ].map(({ v, l, c }) => (
            <div key={l}>
              <p className="text-base font-bold" style={{ color: c }}>{v}</p>
              <p className="text-[8px] font-bold" style={{ color: '#8a96b0' }}>{l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-2">
        <StatCard label="今日使える額" value={formatCurrency(dailyBudget)} variant={dailyBudget > 0 ? 'positive' : 'negative'} />
        <StatCard label="完済予定" value={estimatedPayoff ? new Date(estimatedPayoff).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short' }) : '---'} />
      </div>

      {/* Monster Quest Board */}
      <div>
        <div className="section-bar">
          <h2 className="text-sm font-bold" style={{ color: '#2b3a67' }}>討伐クエスト</h2>
          <span className="text-[10px] font-bold" style={{ color: '#5a6a8a' }}>{active.length}体</span>
        </div>
        <div className="space-y-2">
          {active.sort((a, b) => a.sort_order - b.sort_order).map(b => <BossCard key={b.id} boss={b} />)}
        </div>
        {defeated.length > 0 && (
          <>
            <p className="text-[10px] font-bold mt-4 mb-2" style={{ color: '#8a96b0' }}>── 討伐済み ──</p>
            <div className="space-y-2">
              {defeated.map(b => <BossCard key={b.id} boss={b} />)}
            </div>
          </>
        )}
      </div>

      {/* Savings & Investments quick links */}
      <div className="grid grid-cols-2 gap-2">
        <Link href="/savings" className="rpg-panel p-3 text-center active:scale-[0.97] transition-transform">
          <p className="text-xl mb-1">🥚</p>
          <p className="text-xs font-bold" style={{ color: '#2b3a67' }}>貯金クエスト</p>
          {totalSavings > 0 && <p className="text-[10px]" style={{ color: '#2d8a4e' }}>{formatCurrency(totalSavings)}</p>}
        </Link>
        <Link href="/expedition" className="rpg-panel p-3 text-center active:scale-[0.97] transition-transform">
          <p className="text-xl mb-1">🗺️</p>
          <p className="text-xs font-bold" style={{ color: '#2b3a67' }}>投資クエスト</p>
          {totalInvestmentValue > 0 && (
            <p className="text-[10px]" style={{ color: totalInvestmentReturn >= 0 ? '#2d8a4e' : '#d9534f' }}>
              {totalInvestmentReturn >= 0 ? '+' : ''}{formatCurrency(totalInvestmentReturn)}
            </p>
          )}
        </Link>
      </div>
    </div>
  );
}
