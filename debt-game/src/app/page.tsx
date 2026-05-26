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
    if (!result) { router.push('/setup'); return; }
    setData(result);
    setLoading(false);
  }, [router]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-4xl animate-soft-pulse">⚔️</p>
      </div>
    );
  }

  const { player, bosses, totalDebt, originalTotalDebt, previousDayDebt, monthlyPaid, monthlyPaymentCount, monthlyXpEarned, largestHitThisMonth, dailyBudget, estimatedPayoff, xpForNextLevel } = data;
  const levelInfo = calculateLevel(player.xp);
  const debtDiff = previousDayDebt !== null ? totalDebt - previousDayDebt : null;
  const active = bosses.filter(b => !b.is_defeated);
  const defeated = bosses.filter(b => b.is_defeated);
  const progress = originalTotalDebt > 0 ? Math.round(((originalTotalDebt - totalDebt) / originalTotalDebt) * 100) : 0;

  return (
    <div className="pt-6 space-y-4">
      {/* Hunter Profile */}
      <div className="glass-accent p-5">
        <div className="flex items-center gap-4 mb-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0 animate-float"
            style={{
              background: 'linear-gradient(135deg, rgba(212,168,50,0.12), rgba(136,96,216,0.08))',
              boxShadow: '0 0 24px rgba(212,168,50,0.1), inset 0 0 12px rgba(212,168,50,0.05)',
              border: '1px solid rgba(212,168,50,0.1)',
            }}
          >
            ⚔️
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-extrabold truncate" style={{ color: '#eef0f6' }}>
              {player.name}
            </h1>
            <p className="text-xs font-bold" style={{ color: '#e8b849' }}>
              {getHunterRankTitle(player.level)}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-extrabold" style={{ color: '#e89040' }}>
              {player.login_streak}
            </p>
            <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: '#8890b0' }}>
              連続日
            </p>
          </div>
        </div>
        <XpBar current={levelInfo.currentLevelXp} max={xpForNextLevel} level={player.level} />
      </div>

      {/* Debt Overview */}
      <div className="glass p-5">
        <div className="flex items-end justify-between mb-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#8890b0' }}>
              総借金残高
            </p>
            <p className="text-3xl font-extrabold glow-red" style={{ color: '#e85d5d' }}>
              {formatCurrency(totalDebt)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-extrabold glow-gold" style={{ color: '#e8b849' }}>
              {progress}
              <span className="text-base">%</span>
            </p>
            <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: '#8890b0' }}>討伐進捗</p>
          </div>
        </div>
        <div className="hp-track hp-track-sm">
          <div
            className="hp-fill"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #e8b849, #4cce7b)',
              boxShadow: '0 0 12px rgba(76,206,123,0.3)',
            }}
          />
        </div>
        {debtDiff !== null && (
          <p className="text-[11px] font-bold mt-2" style={{ color: debtDiff <= 0 ? '#4cce7b' : '#e85d5d' }}>
            前日比 {debtDiff <= 0 ? '↓' : '↑'} {formatCurrency(Math.abs(debtDiff))}
          </p>
        )}
      </div>

      {/* Monthly Activity */}
      <div className="glass p-4">
        <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: '#8890b0' }}>
          今月の狩猟成果
        </p>
        <div className="grid grid-cols-4 gap-2">
          {[
            { v: String(monthlyPaymentCount), l: '出撃', c: '#e89040' },
            { v: formatCurrency(monthlyPaid).replace('¥', ''), l: 'ダメージ', c: '#4cce7b' },
            { v: String(monthlyXpEarned), l: 'EXP', c: '#9b6ee8' },
            { v: formatCurrency(largestHitThisMonth).replace('¥', ''), l: '最大火力', c: '#5b9ee8' },
          ].map(({ v, l, c }) => (
            <div key={l} className="text-center">
              <p className="text-lg font-extrabold" style={{ color: c }}>{v}</p>
              <p className="text-[8px] font-bold uppercase tracking-wider mt-0.5" style={{ color: '#505878' }}>{l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="今日使える額" value={formatCurrency(dailyBudget)} variant={dailyBudget > 0 ? 'positive' : 'negative'} />
        <StatCard label="完済予定" value={estimatedPayoff ? new Date(estimatedPayoff).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short' }) : '---'} />
      </div>

      {/* Quest Board */}
      <div>
        <div className="section-bar">
          <h2 className="text-[15px] font-extrabold" style={{ color: '#eef0f6' }}>クエストボード</h2>
          <span className="text-[11px] font-bold" style={{ color: '#8890b0' }}>
            {active.length}件受注中
          </span>
        </div>
        <div className="space-y-3">
          {active.sort((a, b) => a.sort_order - b.sort_order).map(b => <BossCard key={b.id} boss={b} />)}
        </div>
        {defeated.length > 0 && (
          <>
            <p className="text-[10px] font-bold uppercase tracking-wider mt-5 mb-3" style={{ color: '#505878' }}>
              討伐済み
            </p>
            <div className="space-y-3">
              {defeated.map(b => <BossCard key={b.id} boss={b} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
