'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getBossDetail } from '@/lib/client-actions';
import { formatCurrency } from '@/lib/game-engine';
import type { Boss, Payment } from '@/lib/types';
import HpBar from '@/components/HpBar';

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
          <p className="text-3xl mb-3 animate-bounce-pixel">⚔️</p>
          <p className="text-sm animate-blink" style={{ color: '#9090c0' }}>Now Loading...</p>
        </div>
      </div>
    );
  }

  const { boss, payments, totalPaid, monthlyInterest, dailyInterest, monthsToDefeat } = detail;
  const hpPercentage = hpPercent(boss);

  return (
    <div className="px-3 pt-5">
      {/* Boss Display */}
      <div className="pixel-window text-center mb-4">
        <p className="text-5xl mb-2">{boss.emoji}</p>
        <h1 className="text-xl font-bold" style={{ color: '#ffffff' }}>
          {boss.name}
        </h1>
        <p className="text-xs mt-1" style={{ color: '#9090c0' }}>
          {boss.subtitle}
        </p>
        {boss.is_defeated && (
          <span
            className="inline-block mt-2 text-xs font-bold px-3 py-1"
            style={{
              backgroundColor: '#30f84830',
              color: '#30f848',
              border: '2px solid #30f848',
            }}
          >
            ☆ 撃破済み ☆
          </span>
        )}
      </div>

      {/* HP Bar (Large) */}
      <div className="pixel-window mb-4">
        <div className="flex justify-between text-xs mb-2">
          <span style={{ color: '#f83030' }}>HP</span>
          <span style={{ color: '#ffffff' }}>
            {formatCurrency(boss.current_hp)} / {formatCurrency(boss.original_hp)}
          </span>
        </div>
        <HpBar percentage={hpPercentage} size="md" />
        <p className="text-right text-[10px] mt-1" style={{ color: '#9090c0' }}>
          のこり {hpPercentage}%
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="pixel-window-dark">
          <p className="text-[10px]" style={{ color: '#9090c0' }}>げつかんりそく</p>
          <p className="text-sm font-bold text-glow-red" style={{ color: '#f83030' }}>
            {formatCurrency(monthlyInterest)}
          </p>
        </div>
        <div className="pixel-window-dark">
          <p className="text-[10px]" style={{ color: '#9090c0' }}>にちわりりそく</p>
          <p className="text-sm font-bold" style={{ color: '#f87830' }}>
            {formatCurrency(dailyInterest)}
          </p>
        </div>
        <div className="pixel-window-dark">
          <p className="text-[10px]" style={{ color: '#9090c0' }}>げきはよそう</p>
          <p className="text-sm font-bold text-glow-blue" style={{ color: '#3080f8' }}>
            {monthsToDefeat !== null ? `${monthsToDefeat}ヶげつ` : '---'}
          </p>
        </div>
        <div className="pixel-window-dark">
          <p className="text-[10px]" style={{ color: '#9090c0' }}>そうダメージ</p>
          <p className="text-sm font-bold text-glow-green" style={{ color: '#30f848' }}>
            {formatCurrency(totalPaid)}
          </p>
        </div>
      </div>

      {/* Battle Log */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <span style={{ color: '#f8d830' }}>▶</span>
          <h2 className="text-sm font-bold" style={{ color: '#ffffff' }}>
            せんとうログ
          </h2>
        </div>
        {payments.length > 0 ? (
          <div className="space-y-2">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="pixel-window-dark flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-bold" style={{ color: '#ffffff' }}>
                    {payment.type === 'extra' ? '★ ひっさつわざ' : '▸ つうじょうこうげき'}
                  </p>
                  <p className="text-[10px]" style={{ color: '#9090c0' }}>
                    {new Date(payment.paid_at).toLocaleDateString('ja-JP')}
                    {payment.memo && ` - ${payment.memo}`}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className="text-xs font-bold"
                    style={{ color: payment.type === 'extra' ? '#f8d830' : '#30f848' }}
                  >
                    -{formatCurrency(payment.amount)}
                  </p>
                  <p className="text-[10px]" style={{ color: '#3080f8' }}>
                    +{payment.xp_earned}EXP
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="pixel-window text-center">
            <p style={{ color: '#9090c0' }}>
              まだせんとうきろくがありません
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {!boss.is_defeated && (
        <div className="flex gap-2 mb-6">
          <Link
            href={`/record?boss=${id}&type=normal`}
            className="flex-1 pixel-btn pixel-btn-attack text-sm"
          >
            ⚔️ こうげき
          </Link>
          <Link
            href={`/record?boss=${id}&type=extra`}
            className="flex-1 pixel-btn pixel-btn-gold text-sm"
          >
            💥 ひっさつわざ
          </Link>
        </div>
      )}
    </div>
  );
}

export default function BattlePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-3xl mb-3 animate-bounce-pixel">⚔️</p>
          <p className="text-sm animate-blink" style={{ color: '#9090c0' }}>Now Loading...</p>
        </div>
      </div>
    }>
      <BattleContent />
    </Suspense>
  );
}
