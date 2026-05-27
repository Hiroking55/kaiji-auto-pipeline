'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getDashboardData, processLogin } from '@/lib/client-actions';
import { formatCurrency, calculateLevel, getHunterRankTitle, getTownStage, getVitalityLabel } from '@/lib/game-engine';
import { DashboardData } from '@/lib/types';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
const IMGS: Record<number, string> = { 1: `${basePath}/town-lv1.png`, 3: `${basePath}/town-lv3.png`, 5: `${basePath}/town-lv5.png`, 7: `${basePath}/town-lv7.png` };

export default function Page() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginBonus, setLoginBonus] = useState(0);

  useEffect(() => {
    const { streakBonus, isNewDay } = processLogin();
    if (isNewDay && streakBonus > 0) setLoginBonus(streakBonus);
    const result = getDashboardData();
    if (!result) { router.push('/setup'); return; }
    setData(result);
    setLoading(false);
  }, [router]);

  if (loading || !data) {
    return <div className="flex items-center justify-center min-h-screen"><p className="text-3xl animate-bounce">🏰</p></div>;
  }

  const { player, bosses, totalDebt, netWorth, townVitality, xpForNextLevel } = data;
  const levelInfo = calculateLevel(player.xp);
  const stage = getTownStage(netWorth);
  const vl = getVitalityLabel(townVitality);
  const active = bosses.filter(b => !b.is_defeated);
  const pct = xpForNextLevel > 0 ? Math.round((levelInfo.currentLevelXp / xpForNextLevel) * 100) : 0;

  return (
    <div style={{ margin: '0 -12px', minHeight: '100dvh', position: 'relative' }}>
      {/* === FULL SCREEN TOWN IMAGE === */}
      <div style={{ position: 'relative', width: '100%' }}>
        <img
          src={IMGS[stage.level]}
          alt={stage.name}
          style={{
            width: '100%',
            height: 'calc(100dvh - 56px)',
            objectFit: 'cover',
            objectPosition: 'center 20%',
            display: 'block',
          }}
        />

        {/* Dark gradient at bottom for readability */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%',
          background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.7) 100%)',
        }} />

        {/* === HUD OVERLAY === */}

        {/* Top-left: Level badge */}
        <div style={{
          position: 'absolute', top: 12, left: 12,
          background: 'rgba(0,0,0,0.5)', borderRadius: 20, padding: '4px 12px',
          display: 'flex', alignItems: 'center', gap: 6,
          backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
        }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#ffd23f' }}>Lv.{player.level}</span>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)' }}>{getHunterRankTitle(player.level)}</span>
        </div>

        {/* Top-right: Streak */}
        <div style={{
          position: 'absolute', top: 12, right: 12,
          background: 'rgba(0,0,0,0.5)', borderRadius: 20, padding: '4px 12px',
          backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
        }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#ffffff' }}>🔥 {player.login_streak}日</span>
        </div>

        {/* Login bonus toast */}
        {loginBonus > 0 && (
          <div className="animate-slide-up" style={{
            position: 'absolute', top: 50, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.6)', borderRadius: 16, padding: '8px 20px',
            textAlign: 'center', backdropFilter: 'blur(8px)',
          }}>
            <p style={{ fontSize: 16, fontWeight: 800, color: '#ffd23f' }}>+{loginBonus} EXP</p>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)' }}>ログインボーナス</p>
          </div>
        )}

        {/* Bottom overlay: Town info + stats + actions */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 16px 16px' }}>

          {/* Town name + vitality */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: 10 }}>
            <div>
              <p style={{ fontSize: 18, fontWeight: 800, color: '#ffffff', textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
                🏰 {stage.name}
              </p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>{stage.description}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: vl.color === '#2d8a4e' ? '#6ee7b7' : vl.color === '#d9534f' ? '#fca5a5' : '#fde68a' }}>
                {vl.text}
              </p>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>活気 {townVitality}%</p>
            </div>
          </div>

          {/* Key numbers */}
          <div style={{
            display: 'flex', gap: 8, marginBottom: 10,
          }}>
            <div style={{ flex: 1, background: 'rgba(0,0,0,0.4)', borderRadius: 12, padding: '8px 10px', backdropFilter: 'blur(6px)', textAlign: 'center' }}>
              <p style={{ fontSize: 14, fontWeight: 800, color: netWorth >= 0 ? '#6ee7b7' : '#fca5a5' }}>{formatCurrency(netWorth)}</p>
              <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)' }}>純資産</p>
            </div>
            <div style={{ flex: 1, background: 'rgba(0,0,0,0.4)', borderRadius: 12, padding: '8px 10px', backdropFilter: 'blur(6px)', textAlign: 'center' }}>
              <p style={{ fontSize: 14, fontWeight: 800, color: '#fca5a5' }}>{formatCurrency(totalDebt)}</p>
              <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)' }}>借金</p>
            </div>
            <div style={{ flex: 1, background: 'rgba(0,0,0,0.4)', borderRadius: 12, padding: '8px 10px', backdropFilter: 'blur(6px)', textAlign: 'center' }}>
              <p style={{ fontSize: 14, fontWeight: 800, color: '#ffffff' }}>{active.length}体</p>
              <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)' }}>討伐中</p>
            </div>
          </div>

          {/* XP bar */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ height: 4, borderRadius: 100, background: 'rgba(255,255,255,0.15)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, borderRadius: 100, background: '#ffd23f', transition: 'width 0.8s' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>EXP {levelInfo.currentLevelXp}/{xpForNextLevel}</span>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>Next: Lv.{player.level + 1}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8 }}>
            <Link href="/record" style={{
              flex: 1, textAlign: 'center', padding: '13px 0', borderRadius: 14,
              background: 'rgba(255,255,255,0.95)', color: '#1a1a2e',
              fontSize: 14, fontWeight: 700, boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            }}>
              ⚔️ 討伐に出る
            </Link>
            <Link href="/bestiary" style={{
              flex: 1, textAlign: 'center', padding: '13px 0', borderRadius: 14,
              background: 'rgba(255,210,63,0.9)', color: '#1a1a2e',
              fontSize: 14, fontWeight: 700, boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            }}>
              📖 財産を見る
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
