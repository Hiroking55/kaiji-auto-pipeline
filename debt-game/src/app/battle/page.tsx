'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getBossDetail } from '@/lib/client-actions';
import { formatCurrency, getQuestDifficulty, getQuestDaysRemaining } from '@/lib/game-engine';
import type { Boss, Payment } from '@/lib/types';
import HpBar from '@/components/HpBar';
import StarRating from '@/components/StarRating';

interface BossDetailData {
  boss: Boss;
  payments: Payment[];
  totalPaid: number;
  monthlyInterest: number;
  dailyInterest: number;
  monthsToDefeat: number | null;
}

function hpPercent(boss: Boss): number {
  if (boss.original_hp === 0) return 0;
  return Math.max(0, Math.min(100, Math.round((boss.current_hp / boss.original_hp) * 100)));
}

function BattleContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id') || '';
  const [detail, setDetail] = useState<BossDetailData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const result = getBossDetail(id);
    if (!result) { router.push('/'); return; }
    setDetail(result as BossDetailData);
    setLoading(false);
  }, [id, router]);

  if (loading || !detail) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-4xl animate-sparkle">⚔️</p>
      </div>
    );
  }

  const { boss, payments, totalPaid, monthlyInterest, dailyInterest, monthsToDefeat } = detail;
  const hp = hpPercent(boss);
  const diff = getQuestDifficulty(boss);
  const days = getQuestDaysRemaining(boss);

  return (
    <div className="pt-6 space-y-4">
      {/* Monster Header */}
      <div className="rpg-panel-accent p-5">
        <div className="flex items-center justify-between mb-1">
          <StarRating difficulty={diff} size="md" />
          {boss.is_defeated
            ? <span className="tag tag-clear">QUEST CLEAR</span>
            : <span className="tag tag-active">受注中</span>
          }
        </div>
        <div className="flex items-center gap-4 my-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shrink-0"
            style={{ background: 'rgba(43, 58, 103, 0.06)' }}
          >
            {boss.emoji}
          </div>
          <div>
            <h1 className="text-2xl font-extrabold" style={{ color: '#2b3a67' }}>{boss.name}</h1>
            <p className="text-xs font-medium" style={{ color: '#5a6a8a' }}>{boss.subtitle}</p>
          </div>
        </div>

        <div className="flex justify-between text-[11px] font-bold mb-1.5">
          <span style={{ color: '#d9534f' }}>HP</span>
          <span style={{ color: '#2b3a67' }}>
            {formatCurrency(boss.current_hp)} / {formatCurrency(boss.original_hp)}
          </span>
        </div>
        <HpBar percentage={hp} size="lg" />
        <div className="flex justify-between mt-2 text-[10px] font-medium">
          <span style={{ color: '#5a6a8a' }}>残り {hp}%</span>
          {!boss.is_defeated && days !== null && (
            <span className="timer-badge" style={{ color: days < 90 ? '#d9534f' : '#5a6a8a' }}>
              討伐まで約{days}日
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rpg-panel-inner p-3.5">
          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#5a6a8a' }}>月間利息</p>
          <p className="text-base font-extrabold" style={{ color: '#d9534f' }}>{formatCurrency(monthlyInterest)}</p>
        </div>
        <div className="rpg-panel-inner p-3.5">
          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#5a6a8a' }}>日割り利息</p>
          <p className="text-base font-extrabold" style={{ color: '#d9534f' }}>{formatCurrency(dailyInterest)}</p>
        </div>
        <div className="rpg-panel-inner p-3.5">
          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#5a6a8a' }}>討伐予想</p>
          <p className="text-base font-extrabold" style={{ color: '#5aa8e0' }}>
            {monthsToDefeat !== null ? `${monthsToDefeat}ヶ月` : '---'}
          </p>
        </div>
        <div className="rpg-panel-inner p-3.5">
          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#5a6a8a' }}>累計ダメージ</p>
          <p className="text-base font-extrabold" style={{ color: '#2d8a4e' }}>{formatCurrency(totalPaid)}</p>
        </div>
      </div>

      {/* Action Buttons */}
      {!boss.is_defeated && (
        <div className="flex gap-3">
          <Link href={`/record?boss=${id}&type=normal`} className="flex-1 btn-rpg text-center">
            ⚔️ 通常攻撃
          </Link>
          <Link href={`/record?boss=${id}&type=extra`} className="flex-1 btn-gold text-center">
            💥 必殺技
          </Link>
        </div>
      )}

      {/* Hunt Log */}
      <div>
        <div className="section-bar">
          <h2 className="text-[15px] font-extrabold" style={{ color: '#2b3a67' }}>狩猟記録</h2>
        </div>
        {payments.length > 0 ? (
          <div className="space-y-2">
            {payments.map((p) => (
              <div key={p.id} className="rpg-panel-inner p-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold" style={{ color: '#2b3a67' }}>
                    {p.type === 'extra' ? '💥 必殺技' : '⚔️ 通常攻撃'}
                  </p>
                  <p className="text-[10px] font-medium" style={{ color: '#5a6a8a' }}>
                    {new Date(p.paid_at).toLocaleDateString('ja-JP')}
                    {p.memo && ` — ${p.memo}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-extrabold" style={{ color: p.type === 'extra' ? '#b08810' : '#2d8a4e' }}>
                    -{formatCurrency(p.amount)}
                  </p>
                  <p className="text-[10px] font-bold" style={{ color: '#7a4a8a' }}>+{p.xp_earned} EXP</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rpg-panel p-8 text-center">
            <p className="text-sm" style={{ color: '#8a96b0' }}>まだ狩猟記録がありません</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BattlePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-4xl animate-sparkle">⚔️</p>
      </div>
    }>
      <BattleContent />
    </Suspense>
  );
}
