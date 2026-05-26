'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getDashboardData } from '@/lib/client-actions';
import { formatCurrency, calculateLevel } from '@/lib/game-engine';
import { DashboardData } from '@/lib/types';

const TITLES: Record<number, string> = {
  1: '借金奴隷',
  5: '見習い戦士',
  10: '借金ハンター',
  20: '節約マスター',
  30: '財務の達人',
  50: '完済王',
};

export default function StatusPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
          <p className="text-3xl mb-3 animate-bounce-pixel">📊</p>
          <p className="text-sm animate-blink" style={{ color: '#9090c0' }}>Now Loading...</p>
        </div>
      </div>
    );
  }

  const { player, bosses, totalDebt, originalTotalDebt, monthlyPaid, achievements, earnedAchievements } = data;
  const totalPaid = originalTotalDebt - totalDebt;
  const bossesDefeated = bosses.filter((b) => b.is_defeated).length;
  const titleEntries = Object.entries(TITLES)
    .map(([level, title]) => ({ level: Number(level), title }))
    .sort((a, b) => a.level - b.level);

  return (
    <div className="px-3 pt-5">
      {/* Player Stats Header */}
      <div className="pixel-window text-center mb-4">
        <p className="text-3xl mb-2">👤</p>
        <h1 className="text-lg font-bold text-glow-gold" style={{ color: '#f8d830' }}>
          {player.name}
        </h1>
        <p className="text-xs" style={{ color: '#9090c0' }}>
          Lv.{player.level} {player.title}
        </p>
      </div>

      {/* Battle Stats */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <span style={{ color: '#f8d830' }}>▶</span>
          <h2 className="text-sm font-bold" style={{ color: '#ffffff' }}>
            せんとうきろく
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="pixel-window-dark">
            <p className="text-[10px]" style={{ color: '#9090c0' }}>そうへんさいがく</p>
            <p className="text-sm font-bold text-glow-green" style={{ color: '#30f848' }}>
              {formatCurrency(totalPaid)}
            </p>
          </div>
          <div className="pixel-window-dark">
            <p className="text-[10px]" style={{ color: '#9090c0' }}>げきはボスすう</p>
            <p className="text-sm font-bold text-glow-gold" style={{ color: '#f8d830' }}>
              {bossesDefeated} / {bosses.length}
            </p>
          </div>
          <div className="pixel-window-dark">
            <p className="text-[10px]" style={{ color: '#9090c0' }}>れんぞくログイン</p>
            <p className="text-sm font-bold text-glow-blue" style={{ color: '#3080f8' }}>
              {player.login_streak}にち
            </p>
          </div>
          <div className="pixel-window-dark">
            <p className="text-[10px]" style={{ color: '#9090c0' }}>さいだいれんぞく</p>
            <p className="text-sm font-bold" style={{ color: '#f87830' }}>
              {player.max_streak}にち
            </p>
          </div>
        </div>
      </div>

      {/* Title Collection */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <span style={{ color: '#f8d830' }}>▶</span>
          <h2 className="text-sm font-bold" style={{ color: '#ffffff' }}>
            しょうごうコレクション
          </h2>
        </div>
        <div className="space-y-2">
          {titleEntries.map(({ level, title }) => {
            const isCurrent = title === player.title;
            const isEarned = player.level >= level;

            return (
              <div
                key={level}
                className={isEarned ? 'pixel-window-dark' : 'pixel-window-dark'}
                style={{
                  opacity: isEarned ? 1 : 0.4,
                  borderColor: isCurrent ? '#f8d830' : undefined,
                  boxShadow: isCurrent ? '0 0 8px #f8d83040' : undefined,
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">
                      {isEarned ? '👑' : '🔒'}
                    </span>
                    <div>
                      <p
                        className="font-bold text-xs"
                        style={{ color: isCurrent ? '#f8d830' : isEarned ? '#ffffff' : '#9090c0' }}
                      >
                        {title}
                      </p>
                      <p className="text-[10px]" style={{ color: '#9090c0' }}>
                        Lv.{level} でかいほう
                      </p>
                    </div>
                  </div>
                  {isCurrent && (
                    <span
                      className="text-[10px] font-bold px-2 py-0.5"
                      style={{
                        backgroundColor: '#f8d83020',
                        color: '#f8d830',
                        border: '1px solid #f8d830',
                      }}
                    >
                      いま
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Achievement List */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span style={{ color: '#f8d830' }}>▶</span>
          <h2 className="text-sm font-bold" style={{ color: '#ffffff' }}>
            じっせき
          </h2>
        </div>
        <div className="space-y-2">
          {achievements.map((achievement) => {
            const isEarned = earnedAchievements.includes(achievement.id);

            return (
              <div
                key={achievement.id}
                className="pixel-window-dark"
                style={{ opacity: isEarned ? 1 : 0.4 }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">
                    {isEarned ? achievement.icon : '🔒'}
                  </span>
                  <div className="flex-1">
                    <p
                      className="font-bold text-xs"
                      style={{ color: isEarned ? '#ffffff' : '#9090c0' }}
                    >
                      {achievement.name}
                    </p>
                    <p className="text-[10px]" style={{ color: '#9090c0' }}>
                      {achievement.description}
                    </p>
                  </div>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5"
                    style={{
                      backgroundColor: isEarned ? '#30f84820' : '#40407020',
                      color: isEarned ? '#30f848' : '#9090c0',
                      border: `1px solid ${isEarned ? '#30f848' : '#404070'}`,
                    }}
                  >
                    {isEarned ? 'たっせい' : `+${achievement.xp_reward}EXP`}
                  </span>
                </div>
              </div>
            );
          })}
          {achievements.length === 0 && (
            <div className="pixel-window text-center">
              <p style={{ color: '#9090c0' }}>
                じっせきはまだありません
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
