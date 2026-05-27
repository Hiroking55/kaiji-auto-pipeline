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
      <div className="card-accent p-5">
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
            <h1 className="text-2xl font-extrabold" style={{ color: '#1a1a2e' }}>{boss.name}</h1>
            <p className="text-xs font-medium" style={{ color: '#6b7280' }}>{boss.subtitle}</p>
          </div>
        </div>

        <div className="flex justify-between text-[11px] font-bold mb-1.5">
          <span style={{ color: '#ef4444' }}>HP</span>
          <span style={{ color: '#1a1a2e' }}>
            {formatCurrency(boss.current_hp)} / {formatCurrency(boss.original_hp)}
          </span>
        </div>
        <HpBar percentage={hp} size="lg" />
        <div className="flex justify-between mt-2 text-[10px] font-medium">
          <span style={{ color: '#6b7280' }}>残り {hp}%</span>
          {!boss.is_defeated && days !== null && (
            <span className="timer-badge" style={{ color: days < 90 ? '#ef4444' : '#6b7280' }}>
              討伐まで約{days}日
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card-inner p-3.5">
          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#6b7280' }}>月間利息</p>
          <p className="text-base font-extrabold" style={{ color: '#ef4444' }}>{formatCurrency(monthlyInterest)}</p>
        </div>
        <div className="card-inner p-3.5">
          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#6b7280' }}>日割り利息</p>
          <p className="text-base font-extrabold" style={{ color: '#ef4444' }}>{formatCurrency(dailyInterest)}</p>
        </div>
        <div className="card-inner p-3.5">
          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#6b7280' }}>討伐予想</p>
          <p className="text-base font-extrabold" style={{ color: '#3b82f6' }}>
            {monthsToDefeat !== null ? `${monthsToDefeat}ヶ月` : '---'}
          </p>
        </div>
        <div className="card-inner p-3.5">
          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#6b7280' }}>累計ダメージ</p>
          <p className="text-base font-extrabold" style={{ color: '#10b981' }}>{formatCurrency(totalPaid)}</p>
        </div>
      </div>

      {/* Action Buttons */}
      {!boss.is_defeated && (
        <div className="flex gap-3">
          <Link href={`/record?boss=${id}&type=normal`} className="flex-1 btn-main text-center">
            ⚔️ 通常攻撃
          </Link>
          <Link href={`/record?boss=${id}&type=extra`} className="flex-1 btn-gold text-center">
            💥 必殺技
          </Link>
        </div>
      )}

      {/* Hunt Log */}
      <div>
        <div className="section-label">
          <h2 className="text-[15px] font-extrabold" style={{ color: '#1a1a2e' }}>狩猟記録</h2>
        </div>
        {payments.length > 0 ? (
          <div className="space-y-2">
            {payments.map((p) => (
              <div key={p.id} className="card-inner p-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold" style={{ color: '#1a1a2e' }}>
                    {p.type === 'extra' ? '💥 必殺技' : '⚔️ 通常攻撃'}
                  </p>
                  <p className="text-[10px] font-medium" style={{ color: '#6b7280' }}>
                    {new Date(p.paid_at).toLocaleDateString('ja-JP')}
                    {p.memo && ` — ${p.memo}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-extrabold" style={{ color: p.type === 'extra' ? '#d4a020' : '#10b981' }}>
                    -{formatCurrency(p.amount)}
                  </p>
                  <p className="text-[10px] font-bold" style={{ color: '#8b5cf6' }}>+{p.xp_earned} EXP</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card p-8 text-center">
            <p className="text-sm" style={{ color: '#9ca3af' }}>まだ狩猟記録がありません</p>
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
