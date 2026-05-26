'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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

export default function BattlePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
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
          <p className="text-4xl mb-3 animate-pulse">&#x2694;&#xFE0F;</p>
          <p className="text-sm" style={{ color: '#8888aa' }}>読み込み中...</p>
        </div>
      </div>
    );
  }

  const { boss, payments, totalPaid, monthlyInterest, dailyInterest, monthsToDefeat } = detail;
  const hpPercentage = hpPercent(boss);

  return (
    <div className="px-4 pt-6">
      {/* Boss Display */}
      <div className="text-center mb-6">
        <p className="text-6xl mb-3">{boss.emoji}</p>
        <h1 className="text-2xl font-bold" style={{ color: '#e0e0e0' }}>
          {boss.name}
        </h1>
        <p className="text-sm mt-1" style={{ color: '#8888aa' }}>
          {boss.subtitle}
        </p>
        {boss.is_defeated && (
          <span
            className="inline-block mt-2 text-sm font-bold px-3 py-1 rounded"
            style={{ backgroundColor: '#44ff4420', color: '#44ff44' }}
          >
            DEFEATED
          </span>
        )}
      </div>

      {/* HP Bar (Large) */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span style={{ color: '#8888aa' }}>HP</span>
          <span style={{ color: '#e0e0e0' }}>
            {formatCurrency(boss.current_hp)} / {formatCurrency(boss.original_hp)}
          </span>
        </div>
        <HpBar percentage={hpPercentage} size="md" />
        <p className="text-right text-xs mt-1" style={{ color: '#8888aa' }}>
          {hpPercentage}% 残り
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div
          className="rounded-xl p-4 border border-white/10"
          style={{ backgroundColor: '#16213e' }}
        >
          <p className="text-xs" style={{ color: '#8888aa' }}>月間利息</p>
          <p className="text-lg font-bold" style={{ color: '#ff4444' }}>
            {formatCurrency(monthlyInterest)}
          </p>
        </div>
        <div
          className="rounded-xl p-4 border border-white/10"
          style={{ backgroundColor: '#16213e' }}
        >
          <p className="text-xs" style={{ color: '#8888aa' }}>日割り利息</p>
          <p className="text-lg font-bold" style={{ color: '#ff6600' }}>
            {formatCurrency(dailyInterest)}
          </p>
        </div>
        <div
          className="rounded-xl p-4 border border-white/10"
          style={{ backgroundColor: '#16213e' }}
        >
          <p className="text-xs" style={{ color: '#8888aa' }}>撃破予想</p>
          <p className="text-lg font-bold" style={{ color: '#4488ff' }}>
            {monthsToDefeat !== null ? `${monthsToDefeat}ヶ月` : '---'}
          </p>
        </div>
        <div
          className="rounded-xl p-4 border border-white/10"
          style={{ backgroundColor: '#16213e' }}
        >
          <p className="text-xs" style={{ color: '#8888aa' }}>総ダメージ</p>
          <p className="text-lg font-bold" style={{ color: '#44ff44' }}>
            {formatCurrency(totalPaid)}
          </p>
        </div>
      </div>

      {/* Battle Log */}
      <div className="mb-6">
        <h2 className="text-base font-bold mb-3" style={{ color: '#e0e0e0' }}>
          戦闘ログ
        </h2>
        {payments.length > 0 ? (
          <div className="space-y-2">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="rounded-xl p-3 border border-white/10 flex items-center justify-between"
                style={{ backgroundColor: '#16213e' }}
              >
                <div>
                  <p className="text-sm font-medium" style={{ color: '#e0e0e0' }}>
                    {payment.type === 'extra' ? '必殺技' : '通常攻撃'}
                  </p>
                  <p className="text-xs" style={{ color: '#8888aa' }}>
                    {new Date(payment.paid_at).toLocaleDateString('ja-JP')}
                    {payment.memo && ` - ${payment.memo}`}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className="text-sm font-bold"
                    style={{ color: payment.type === 'extra' ? '#ffd700' : '#44ff44' }}
                  >
                    -{formatCurrency(payment.amount)}
                  </p>
                  <p className="text-xs" style={{ color: '#4488ff' }}>
                    +{payment.xp_earned}XP
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center py-6" style={{ color: '#8888aa' }}>
            まだ戦闘記録がありません
          </p>
        )}
      </div>

      {/* Action Buttons */}
      {!boss.is_defeated && (
        <div className="flex gap-3 mb-6">
          <Link
            href={`/record?boss=${id}&type=normal`}
            className="flex-1 text-center py-3 rounded-xl font-bold text-base transition-all active:scale-[0.97]"
            style={{
              backgroundColor: '#4488ff',
              color: '#ffffff',
              boxShadow: '0 0 12px rgba(68, 136, 255, 0.3)',
            }}
          >
            &#x2694;&#xFE0F; 攻撃する
          </Link>
          <Link
            href={`/record?boss=${id}&type=extra`}
            className="flex-1 text-center py-3 rounded-xl font-bold text-base transition-all active:scale-[0.97]"
            style={{
              backgroundColor: '#ffd700',
              color: '#0f0f23',
              boxShadow: '0 0 12px rgba(255, 215, 0, 0.3)',
            }}
          >
            &#x1F4A5; 必殺技
          </Link>
        </div>
      )}
    </div>
  );
}
