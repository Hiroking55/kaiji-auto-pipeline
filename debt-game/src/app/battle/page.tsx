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
    if (!result) {
      router.push('/');
      return;
    }
    setDetail(result as BossDetailData);
    setLoading(false);
  }, [id, router]);

  if (loading || !detail) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-3xl mb-3 animate-pulse-glow">⚔️</p>
          <p className="text-sm" style={{ color: '#a09078' }}>Loading...</p>
        </div>
      </div>
    );
  }

  const { boss, payments, totalPaid, monthlyInterest, dailyInterest, monthsToDefeat } = detail;
  const hpPercentage = hpPercent(boss);
  const difficulty = getQuestDifficulty(boss);
  const daysRemaining = getQuestDaysRemaining(boss);

  return (
    <div className="px-3 pt-4">
      {/* Quest Header */}
      <div className="mh-panel-accent p-4 mb-3">
        <div className="flex items-center justify-between mb-1">
          <StarRating difficulty={difficulty} size="md" />
          {boss.is_defeated ? (
            <span className="mh-tag mh-tag-clear">QUEST CLEAR</span>
          ) : (
            <span className="mh-tag mh-tag-active">受注中</span>
          )}
        </div>

        <div className="flex items-center gap-3 mb-3">
          <span className="text-4xl">{boss.emoji}</span>
          <div>
            <h1 className="text-xl font-black" style={{ color: '#f0e8d8' }}>
              {boss.name}
            </h1>
            <p className="text-[11px]" style={{ color: '#a09078' }}>
              {boss.subtitle}
            </p>
          </div>
        </div>

        {/* HP Section */}
        <div className="mb-1">
          <div className="flex justify-between text-xs mb-1">
            <span className="font-bold" style={{ color: '#e84040' }}>HP</span>
            <span style={{ color: '#f0e8d8' }}>
              {formatCurrency(boss.current_hp)} / {formatCurrency(boss.original_hp)}
            </span>
          </div>
          <HpBar percentage={hpPercentage} size="md" />
          <div className="flex justify-between mt-1">
            <span className="text-[10px]" style={{ color: '#a09078' }}>
              残り {hpPercentage}%
            </span>
            {!boss.is_defeated && daysRemaining !== null && (
              <span className="mh-timer" style={{ color: daysRemaining < 90 ? '#e84040' : '#a09078' }}>
                ⏱ 討伐まで約{daysRemaining}日
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Quest Info Grid */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="mh-panel-dark p-3">
          <p className="text-[10px] font-bold" style={{ color: '#a09078' }}>月間利息ダメージ</p>
          <p className="text-sm font-black" style={{ color: '#e84040' }}>
            {formatCurrency(monthlyInterest)}
          </p>
        </div>
        <div className="mh-panel-dark p-3">
          <p className="text-[10px] font-bold" style={{ color: '#a09078' }}>日割り利息</p>
          <p className="text-sm font-black" style={{ color: '#ff8820' }}>
            {formatCurrency(dailyInterest)}
          </p>
        </div>
        <div className="mh-panel-dark p-3">
          <p className="text-[10px] font-bold" style={{ color: '#a09078' }}>討伐予想</p>
          <p className="text-sm font-black" style={{ color: '#4890d0' }}>
            {monthsToDefeat !== null ? `${monthsToDefeat}ヶ月` : '---'}
          </p>
        </div>
        <div className="mh-panel-dark p-3">
          <p className="text-[10px] font-bold" style={{ color: '#a09078' }}>累計ダメージ</p>
          <p className="text-sm font-black" style={{ color: '#40c850' }}>
            {formatCurrency(totalPaid)}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      {!boss.is_defeated && (
        <div className="flex gap-2 mb-3">
          <Link href={`/record?boss=${id}&type=normal`} className="flex-1 mh-btn mh-btn-primary text-center text-sm">
            ⚔️ 通常攻撃
          </Link>
          <Link href={`/record?boss=${id}&type=extra`} className="flex-1 mh-btn mh-btn-gold text-center text-sm">
            💥 必殺技
          </Link>
        </div>
      )}

      {/* Hunt Log */}
      <div className="mb-6">
        <div className="mh-section-header">
          <h2>狩猟記録</h2>
        </div>
        {payments.length > 0 ? (
          <div className="space-y-1.5">
            {payments.map((payment) => (
              <div key={payment.id} className="mh-panel-dark p-2.5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold" style={{ color: '#f0e8d8' }}>
                    {payment.type === 'extra' ? '💥 必殺技' : '⚔️ 通常攻撃'}
                  </p>
                  <p className="text-[10px]" style={{ color: '#a09078' }}>
                    {new Date(payment.paid_at).toLocaleDateString('ja-JP')}
                    {payment.memo && ` — ${payment.memo}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black" style={{ color: payment.type === 'extra' ? '#ffc830' : '#40c850' }}>
                    -{formatCurrency(payment.amount)}
                  </p>
                  <p className="text-[10px] font-bold" style={{ color: '#4890d0' }}>
                    +{payment.xp_earned} EXP
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mh-panel p-6 text-center">
            <p style={{ color: '#a09078' }}>まだ狩猟記録がありません</p>
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
        <div className="text-center">
          <p className="text-3xl mb-3 animate-pulse-glow">⚔️</p>
          <p className="text-sm" style={{ color: '#a09078' }}>Loading...</p>
        </div>
      </div>
    }>
      <BattleContent />
    </Suspense>
  );
}
