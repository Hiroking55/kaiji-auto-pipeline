'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getDashboardData } from '@/lib/client-actions';
import { formatCurrency, calculateLevel, getHunterRankTitle } from '@/lib/game-engine';
import { DashboardData } from '@/lib/types';
import XpBar from '@/components/XpBar';

const HR_TITLES = [
  { level: 1, title: '新米ハンター' },
  { level: 5, title: '駆け出しハンター' },
  { level: 10, title: '一人前ハンター' },
  { level: 20, title: '上位ハンター' },
  { level: 30, title: 'マスターハンター' },
  { level: 50, title: '伝説のハンター' },
];

export default function StatusPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const result = getDashboardData();
    if (!result) { router.push('/setup'); return; }
    setData(result);
    setLoading(false);
  }, [router]);

  if (loading || !data) {
    return <div className="flex items-center justify-center min-h-screen"><p className="text-4xl animate-soft-pulse">📋</p></div>;
  }

  const { player, bosses, totalDebt, originalTotalDebt, achievements, earnedAchievements, xpForNextLevel } = data;
  const totalPaid = originalTotalDebt - totalDebt;
  const defeated = bosses.filter(b => b.is_defeated).length;
  const levelInfo = calculateLevel(player.xp);

  return (
    <div className="pt-6 space-y-4">
      {/* Hunter Card */}
      <div className="glass-accent p-5 text-center">
        <p className="text-[9px] font-bold uppercase tracking-widest mb-3" style={{ color: '#7c7870' }}>HUNTER CARD</p>
        <div
          className="w-20 h-20 rounded-2xl mx-auto mb-3 flex items-center justify-center text-4xl"
          style={{ background: 'linear-gradient(135deg, rgba(232,184,73,0.12), rgba(155,110,232,0.08))' }}
        >⚔️</div>
        <h1 className="text-2xl font-extrabold" style={{ color: '#e8e6e2' }}>{player.name}</h1>
        <p className="text-sm font-bold mt-1 glow-gold" style={{ color: '#b89450' }}>{getHunterRankTitle(player.level)}</p>
        <div className="mt-4">
          <XpBar current={levelInfo.currentLevelXp} max={xpForNextLevel} level={player.level} />
        </div>
      </div>

      {/* Stats */}
      <div>
        <div className="section-bar">
          <h2 className="text-[15px] font-extrabold" style={{ color: '#e8e6e2' }}>狩猟実績</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { l: '総返済額', v: formatCurrency(totalPaid), c: '#40a060', g: 'glow-green' },
            { l: '討伐数', v: `${defeated} / ${bosses.length}`, c: '#b89450', g: 'glow-gold' },
            { l: '連続ログイン', v: `${player.login_streak}日`, c: '#4878b0', g: 'glow-blue' },
            { l: '最大連続', v: `${player.max_streak}日`, c: '#c07838', g: '' },
          ].map(({ l, v, c, g }) => (
            <div key={l} className="glass-inner p-3.5">
              <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#7c7870' }}>{l}</p>
              <p className={`text-lg font-extrabold ${g}`} style={{ color: c }}>{v}</p>
            </div>
          ))}
        </div>
      </div>

      {/* HR Titles */}
      <div>
        <div className="section-bar">
          <h2 className="text-[15px] font-extrabold" style={{ color: '#e8e6e2' }}>ハンターランク</h2>
        </div>
        <div className="space-y-2">
          {HR_TITLES.map(({ level, title }) => {
            const cur = title === getHunterRankTitle(player.level);
            const unlocked = player.level >= level;
            return (
              <div key={level} className="glass-inner p-3 flex items-center justify-between" style={{ opacity: unlocked ? 1 : 0.3, borderColor: cur ? 'rgba(232,184,73,0.3)' : undefined, boxShadow: cur ? '0 0 16px rgba(232,184,73,0.1)' : undefined }}>
                <div className="flex items-center gap-3">
                  <span className="text-lg">{unlocked ? '👑' : '🔒'}</span>
                  <div>
                    <p className="text-sm font-bold" style={{ color: cur ? '#b89450' : '#e8e6e2' }}>{title}</p>
                    <p className="text-[10px] font-medium" style={{ color: '#4a4640' }}>HR {level} で解放</p>
                  </div>
                </div>
                {cur && <span className="tag tag-active">現在</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Achievements */}
      <div>
        <div className="section-bar">
          <h2 className="text-[15px] font-extrabold" style={{ color: '#e8e6e2' }}>勲章</h2>
        </div>
        <div className="space-y-2">
          {achievements.map((a) => {
            const earned = earnedAchievements.includes(a.id);
            return (
              <div key={a.id} className="glass-inner p-3 flex items-center gap-3" style={{ opacity: earned ? 1 : 0.3 }}>
                <span className="text-2xl">{earned ? a.icon : '🔒'}</span>
                <div className="flex-1">
                  <p className="text-xs font-bold" style={{ color: earned ? '#e8e6e2' : '#4a4640' }}>{a.name}</p>
                  <p className="text-[10px]" style={{ color: '#4a4640' }}>{a.description}</p>
                </div>
                <span className={`tag ${earned ? 'tag-clear' : ''}`} style={earned ? {} : { background: 'rgba(80,88,120,0.1)', color: '#4a4640', border: '1px solid rgba(80,88,120,0.2)' }}>
                  {earned ? '達成' : `+${a.xp_reward}EXP`}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
