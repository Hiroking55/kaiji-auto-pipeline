'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getDashboardData } from '@/lib/client-actions';
import { formatCurrency, calculateLevel, getHunterRankTitle } from '@/lib/game-engine';
import { DashboardData } from '@/lib/types';
import XpBar from '@/components/XpBar';

const HR_TITLES: { level: number; title: string }[] = [
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
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-3xl animate-pulse-glow">📋</p>
      </div>
    );
  }

  const { player, bosses, totalDebt, originalTotalDebt, achievements, earnedAchievements, xpForNextLevel } = data;
  const totalPaid = originalTotalDebt - totalDebt;
  const bossesDefeated = bosses.filter((b) => b.is_defeated).length;
  const levelInfo = calculateLevel(player.xp);

  return (
    <div className="px-3 pt-4">
      {/* Hunter Card */}
      <div className="mh-panel-accent p-4 mb-3">
        <div className="text-center mb-3">
          <p className="text-[10px] font-bold mb-1" style={{ color: '#a09078' }}>HUNTER CARD</p>
          <div
            className="w-16 h-16 rounded mx-auto mb-2 flex items-center justify-center text-3xl"
            style={{ backgroundColor: '#1e1a14', border: '2px solid #4a3c28' }}
          >
            ⚔️
          </div>
          <h1 className="text-xl font-black" style={{ color: '#f0e8d8' }}>
            {player.name}
          </h1>
          <p className="text-xs font-bold" style={{ color: '#ffc830' }}>
            {getHunterRankTitle(player.level)}
          </p>
        </div>
        <XpBar current={levelInfo.currentLevelXp} max={xpForNextLevel} level={player.level} />
      </div>

      {/* Stats Grid */}
      <div className="mb-3">
        <div className="mh-section-header">
          <h2>狩猟実績</h2>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="mh-panel-dark p-3">
            <p className="text-[10px] font-bold" style={{ color: '#a09078' }}>総返済額</p>
            <p className="text-base font-black" style={{ color: '#40c850' }}>{formatCurrency(totalPaid)}</p>
          </div>
          <div className="mh-panel-dark p-3">
            <p className="text-[10px] font-bold" style={{ color: '#a09078' }}>討伐数</p>
            <p className="text-base font-black" style={{ color: '#ffc830' }}>{bossesDefeated} / {bosses.length}</p>
          </div>
          <div className="mh-panel-dark p-3">
            <p className="text-[10px] font-bold" style={{ color: '#a09078' }}>連続ログイン</p>
            <p className="text-base font-black" style={{ color: '#4890d0' }}>{player.login_streak}日</p>
          </div>
          <div className="mh-panel-dark p-3">
            <p className="text-[10px] font-bold" style={{ color: '#a09078' }}>最大連続記録</p>
            <p className="text-base font-black" style={{ color: '#ff8820' }}>{player.max_streak}日</p>
          </div>
        </div>
      </div>

      {/* HR Progression */}
      <div className="mb-3">
        <div className="mh-section-header">
          <h2>ハンターランク</h2>
        </div>
        <div className="space-y-1.5">
          {HR_TITLES.map(({ level, title }) => {
            const isCurrent = title === getHunterRankTitle(player.level);
            const isUnlocked = player.level >= level;
            return (
              <div
                key={level}
                className="mh-panel-dark p-2.5 flex items-center justify-between"
                style={{
                  opacity: isUnlocked ? 1 : 0.35,
                  borderColor: isCurrent ? '#c89830' : undefined,
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{isUnlocked ? '👑' : '🔒'}</span>
                  <div>
                    <p className="text-xs font-bold" style={{ color: isCurrent ? '#ffc830' : '#f0e8d8' }}>
                      {title}
                    </p>
                    <p className="text-[10px]" style={{ color: '#706050' }}>HR {level} で解放</p>
                  </div>
                </div>
                {isCurrent && <span className="mh-tag mh-tag-active">現在</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Achievements / Medals */}
      <div className="mb-6">
        <div className="mh-section-header">
          <h2>勲章</h2>
        </div>
        <div className="space-y-1.5">
          {achievements.map((achievement) => {
            const isEarned = earnedAchievements.includes(achievement.id);
            return (
              <div
                key={achievement.id}
                className="mh-panel-dark p-2.5 flex items-center gap-2"
                style={{ opacity: isEarned ? 1 : 0.35 }}
              >
                <span className="text-xl">{isEarned ? achievement.icon : '🔒'}</span>
                <div className="flex-1">
                  <p className="text-xs font-bold" style={{ color: isEarned ? '#f0e8d8' : '#706050' }}>
                    {achievement.name}
                  </p>
                  <p className="text-[10px]" style={{ color: '#706050' }}>{achievement.description}</p>
                </div>
                <span
                  className="mh-tag"
                  style={{
                    backgroundColor: isEarned ? 'rgba(64,200,80,0.15)' : 'rgba(112,96,80,0.15)',
                    color: isEarned ? '#40c850' : '#706050',
                    borderColor: isEarned ? '#40c850' : '#3a3020',
                  }}
                >
                  {isEarned ? '達成' : `+${achievement.xp_reward}EXP`}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
