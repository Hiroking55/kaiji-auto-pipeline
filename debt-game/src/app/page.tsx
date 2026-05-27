'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getDashboardData, processLogin } from '@/lib/client-actions';
import { formatCurrency, calculateLevel, getHunterRankTitle } from '@/lib/game-engine';
import XpBar from '@/components/XpBar';
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
    return <div className="flex items-center justify-center min-h-screen"><p className="text-3xl animate-bounce">🏰</p></div>;
  }

  const { player, bosses, totalDebt, monthlyPaid, monthlyPaymentCount, xpForNextLevel, netWorth, townVitality, totalSavings, totalInvestmentReturn } = data;
  const levelInfo = calculateLevel(player.xp);
  const active = bosses.filter(b => !b.is_defeated);

  return (
    <div className="space-y-3">
      {/* Login Bonus */}
      {loginBonus.show && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
          <div className="rpg-panel-accent px-5 py-2 text-center">
            <p className="text-lg font-bold" style={{ color: '#b08810' }}>+{loginBonus.bonus} EXP ✨</p>
            <p className="text-[10px]" style={{ color: '#5a6a8a' }}>{player.login_streak}日連続ログイン</p>
          </div>
        </div>
      )}

      {/* Town Hero Image + Info Bar */}
      <TownScene netWorth={netWorth} vitality={townVitality} />

      {/* Core Stats - compact */}
      <div className="rpg-panel p-3">
        <div className="flex items-center gap-3 mb-2">
          <div>
            <p className="text-base font-bold" style={{ color: '#2b3a67' }}>{player.name}</p>
            <p className="text-[10px] font-bold" style={{ color: '#b08810' }}>{getHunterRankTitle(player.level)}</p>
          </div>
          <div className="flex-1">
            <XpBar current={levelInfo.currentLevelXp} max={xpForNextLevel} level={player.level} />
          </div>
        </div>
        <div className="flex justify-between text-center">
          <div>
            <p className="text-sm font-bold" style={{ color: netWorth >= 0 ? '#2d8a4e' : '#d9534f' }}>{formatCurrency(netWorth)}</p>
            <p className="text-[8px] font-bold" style={{ color: '#8a96b0' }}>純資産</p>
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: '#d9534f' }}>{formatCurrency(totalDebt)}</p>
            <p className="text-[8px] font-bold" style={{ color: '#8a96b0' }}>借金残高</p>
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: '#2d8a4e' }}>{formatCurrency(monthlyPaid)}</p>
            <p className="text-[8px] font-bold" style={{ color: '#8a96b0' }}>今月返済</p>
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: '#5aa8e0' }}>{monthlyPaymentCount}回</p>
            <p className="text-[8px] font-bold" style={{ color: '#8a96b0' }}>出撃</p>
          </div>
        </div>
      </div>

      {/* Action Buttons - the main thing the user should do */}
      <div className="grid grid-cols-2 gap-2">
        <Link href="/record" className="btn-rpg text-center text-sm">
          ⚔️ 討伐に出る
        </Link>
        <Link href="/bestiary" className="btn-gold text-center text-sm">
          📖 財産を見る
        </Link>
      </div>

      {/* Active Quests - minimal */}
      {active.length > 0 && (
        <div className="rpg-panel p-3">
          <p className="text-[10px] font-bold mb-2" style={{ color: '#5a6a8a' }}>受注中のクエスト</p>
          {active.slice(0, 3).map(b => (
            <Link key={b.id} href={`/battle?id=${b.id}`} className="flex items-center justify-between py-1.5 border-b last:border-0" style={{ borderColor: 'rgba(43,58,103,0.1)' }}>
              <div className="flex items-center gap-2">
                <span className="text-lg">{b.emoji}</span>
                <span className="text-xs font-bold" style={{ color: '#2b3a67' }}>{b.name}</span>
              </div>
              <span className="text-[10px] font-bold" style={{ color: '#d9534f' }}>{formatCurrency(b.current_hp)}</span>
            </Link>
          ))}
          {active.length > 3 && (
            <p className="text-[10px] text-center mt-1" style={{ color: '#8a96b0' }}>他{active.length - 3}体...</p>
          )}
        </div>
      )}

      {/* Quick links to savings/investment if they exist */}
      {(totalSavings > 0 || totalInvestmentReturn !== 0) && (
        <div className="flex gap-2">
          {totalSavings > 0 && (
            <Link href="/savings" className="rpg-panel-inner p-2.5 flex-1 text-center">
              <p className="text-[10px] font-bold" style={{ color: '#5a6a8a' }}>🥚 貯金</p>
              <p className="text-xs font-bold" style={{ color: '#2d8a4e' }}>{formatCurrency(totalSavings)}</p>
            </Link>
          )}
          {totalInvestmentReturn !== 0 && (
            <Link href="/expedition" className="rpg-panel-inner p-2.5 flex-1 text-center">
              <p className="text-[10px] font-bold" style={{ color: '#5a6a8a' }}>🗺️ 投資</p>
              <p className="text-xs font-bold" style={{ color: totalInvestmentReturn >= 0 ? '#2d8a4e' : '#d9534f' }}>
                {totalInvestmentReturn >= 0 ? '+' : ''}{formatCurrency(totalInvestmentReturn)}
              </p>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
