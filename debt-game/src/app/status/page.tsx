import { redirect } from 'next/navigation';
import { getDashboardData } from '@/lib/actions';
import { formatCurrency, calculateLevel } from '@/lib/game-engine';

const TITLES: Record<number, string> = {
  1: '借金奴隷',
  5: '見習い戦士',
  10: '借金ハンター',
  20: '節約マスター',
  30: '財務の達人',
  50: '完済王',
};

export default async function StatusPage() {
  const data = await getDashboardData();

  if (!data) {
    redirect('/setup');
  }

  const { player, bosses, totalDebt, originalTotalDebt, monthlyPaid, achievements, earnedAchievements } = data;
  const totalPaid = originalTotalDebt - totalDebt;
  const bossesDefeated = bosses.filter((b) => b.is_defeated).length;
  const titleEntries = Object.entries(TITLES)
    .map(([level, title]) => ({ level: Number(level), title }))
    .sort((a, b) => a.level - b.level);

  return (
    <div className="px-4 pt-6">
      {/* Player Stats Header */}
      <div className="text-center mb-6">
        <p className="text-4xl mb-2">&#x1F4CA;</p>
        <h1 className="text-xl font-bold" style={{ color: '#ffd700' }}>
          {player.name} のステータス
        </h1>
        <p className="text-sm" style={{ color: '#8888aa' }}>
          Lv.{player.level} {player.title}
        </p>
      </div>

      {/* Battle Stats */}
      <div className="mb-6">
        <h2 className="text-base font-bold mb-3" style={{ color: '#e0e0e0' }}>
          戦闘記録
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <div
            className="rounded-xl p-4 border border-white/10"
            style={{ backgroundColor: '#16213e' }}
          >
            <p className="text-xs" style={{ color: '#8888aa' }}>総返済額</p>
            <p className="text-lg font-bold" style={{ color: '#44ff44' }}>
              {formatCurrency(totalPaid)}
            </p>
          </div>
          <div
            className="rounded-xl p-4 border border-white/10"
            style={{ backgroundColor: '#16213e' }}
          >
            <p className="text-xs" style={{ color: '#8888aa' }}>撃破ボス数</p>
            <p className="text-lg font-bold" style={{ color: '#ffd700' }}>
              {bossesDefeated} / {bosses.length}
            </p>
          </div>
          <div
            className="rounded-xl p-4 border border-white/10"
            style={{ backgroundColor: '#16213e' }}
          >
            <p className="text-xs" style={{ color: '#8888aa' }}>ログイン連続</p>
            <p className="text-lg font-bold" style={{ color: '#4488ff' }}>
              {player.login_streak}日
            </p>
          </div>
          <div
            className="rounded-xl p-4 border border-white/10"
            style={{ backgroundColor: '#16213e' }}
          >
            <p className="text-xs" style={{ color: '#8888aa' }}>最大連続記録</p>
            <p className="text-lg font-bold" style={{ color: '#ff6600' }}>
              {player.max_streak}日
            </p>
          </div>
        </div>
      </div>

      {/* Title Collection */}
      <div className="mb-6">
        <h2 className="text-base font-bold mb-3" style={{ color: '#e0e0e0' }}>
          称号コレクション
        </h2>
        <div className="space-y-2">
          {titleEntries.map(({ level, title }) => {
            const isCurrent = title === player.title;
            const isEarned = player.level >= level;

            return (
              <div
                key={level}
                className={`rounded-xl p-3 border flex items-center justify-between ${
                  isCurrent
                    ? 'border-yellow-500/50'
                    : isEarned
                    ? 'border-white/10'
                    : 'border-white/5 opacity-40'
                }`}
                style={{
                  backgroundColor: isCurrent ? '#16213e' : '#16213e',
                  boxShadow: isCurrent ? '0 0 12px rgba(255, 215, 0, 0.2)' : undefined,
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">
                    {isEarned ? '&#x1F451;' : '&#x1F512;'}
                  </span>
                  <div>
                    <p
                      className="font-bold text-sm"
                      style={{ color: isCurrent ? '#ffd700' : isEarned ? '#e0e0e0' : '#8888aa' }}
                    >
                      {title}
                    </p>
                    <p className="text-xs" style={{ color: '#8888aa' }}>
                      Lv.{level} で解放
                    </p>
                  </div>
                </div>
                {isCurrent && (
                  <span
                    className="text-xs font-bold px-2 py-1 rounded"
                    style={{ backgroundColor: '#ffd70020', color: '#ffd700' }}
                  >
                    現在
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Achievement List */}
      <div className="mb-6">
        <h2 className="text-base font-bold mb-3" style={{ color: '#e0e0e0' }}>
          実績
        </h2>
        <div className="space-y-2">
          {achievements.map((achievement) => {
            const isEarned = earnedAchievements.includes(achievement.id);

            return (
              <div
                key={achievement.id}
                className={`rounded-xl p-3 border flex items-center gap-3 ${
                  isEarned ? 'border-white/10' : 'border-white/5 opacity-40'
                }`}
                style={{ backgroundColor: '#16213e' }}
              >
                <span className="text-2xl">
                  {isEarned ? achievement.icon : '&#x1F512;'}
                </span>
                <div className="flex-1">
                  <p
                    className="font-bold text-sm"
                    style={{ color: isEarned ? '#e0e0e0' : '#8888aa' }}
                  >
                    {achievement.name}
                  </p>
                  <p className="text-xs" style={{ color: '#8888aa' }}>
                    {achievement.description}
                  </p>
                </div>
                <span
                  className="text-xs font-medium px-2 py-1 rounded"
                  style={{
                    backgroundColor: isEarned ? '#44ff4420' : '#8888aa20',
                    color: isEarned ? '#44ff44' : '#8888aa',
                  }}
                >
                  {isEarned ? '達成' : `+${achievement.xp_reward}XP`}
                </span>
              </div>
            );
          })}
          {achievements.length === 0 && (
            <p className="text-center py-8" style={{ color: '#8888aa' }}>
              実績はまだありません
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
