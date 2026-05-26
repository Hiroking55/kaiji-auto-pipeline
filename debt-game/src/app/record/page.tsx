'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getDashboardData, recordPayment } from '@/lib/client-actions';
import { formatCurrency } from '@/lib/game-engine';
import type { Boss, Payment } from '@/lib/types';
import NavBar from '@/components/NavBar';

interface PaymentResult {
  xpEarned: number;
  levelUp: boolean;
  newLevel: number;
  bossDefeated: boolean;
  achievementsEarned: string[];
  bossName: string;
  bossEmoji: string;
  amount: number;
  type: 'normal' | 'extra';
}

function RecordForm() {
  const searchParams = useSearchParams();
  const [bosses, setBosses] = useState<Boss[]>([]);
  const [recentPayments, setRecentPayments] = useState<(Payment & { boss_name: string; boss_emoji: string })[]>([]);
  const [selectedBossId, setSelectedBossId] = useState('');
  const [amount, setAmount] = useState('');
  const [paidAt, setPaidAt] = useState(() => new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<'normal' | 'extra'>('normal');
  const [memo, setMemo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<PaymentResult | null>(null);

  useEffect(() => {
    const data = getDashboardData();
    if (data) {
      const activeBosses = data.bosses.filter((b) => !b.is_defeated);
      setBosses(activeBosses);
      setRecentPayments(data.recentPayments);
      const preselectedBoss = searchParams.get('boss');
      const preselectedType = searchParams.get('type');
      if (preselectedBoss && activeBosses.some((b) => b.id === preselectedBoss)) {
        setSelectedBossId(preselectedBoss);
      } else if (activeBosses.length > 0) {
        setSelectedBossId(activeBosses[0].id);
      }
      if (preselectedType === 'normal' || preselectedType === 'extra') {
        setType(preselectedType);
      }
    }
    setLoading(false);
  }, [searchParams]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedBossId || !amount || submitting) return;
    const parsedAmount = parseInt(amount, 10);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;
    const boss = bosses.find((b) => b.id === selectedBossId);
    if (!boss) return;

    setSubmitting(true);
    try {
      const res = recordPayment({
        bossId: selectedBossId,
        amount: parsedAmount,
        type,
        paidAt,
        memo: memo || undefined,
      });
      setResult({ ...res, bossName: boss.name, bossEmoji: boss.emoji, amount: parsedAmount, type });
      const data = getDashboardData();
      if (data) {
        setBosses(data.bosses.filter((b) => !b.is_defeated));
        setRecentPayments(data.recentPayments);
      }
      setAmount('');
      setMemo('');
    } catch (err) {
      alert(err instanceof Error ? err.message : '記録に失敗しました');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-3xl mb-3 animate-pulse-glow">⚔️</p>
          <p className="text-sm" style={{ color: '#a09078' }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: '#12100e' }}>
      {/* Header */}
      <div className="px-3 pt-4 pb-3">
        <h1 className="text-xl font-black text-center" style={{ color: '#ffc830' }}>
          クエスト出発
        </h1>
        <p className="text-center text-[11px] mt-1" style={{ color: '#a09078' }}>
          返済を記録して討伐ダメージを与えよう
        </p>
      </div>

      {/* Form */}
      <div className="mx-3 mh-panel p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold mb-1.5" style={{ color: '#ffc830' }}>
              討伐対象
            </label>
            {bosses.length === 0 ? (
              <p className="text-sm" style={{ color: '#a09078' }}>討伐可能なモンスターがいません</p>
            ) : (
              <select
                value={selectedBossId}
                onChange={(e) => setSelectedBossId(e.target.value)}
                className="mh-select"
              >
                {bosses.map((boss) => (
                  <option key={boss.id} value={boss.id}>
                    {boss.emoji} {boss.name} (HP: {formatCurrency(boss.current_hp)})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold mb-1.5" style={{ color: '#ffc830' }}>
              攻撃力（返済額）
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color: '#ffc830' }}>¥</span>
              <input
                type="number"
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                min="1"
                required
                className="mh-input pl-8"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1.5" style={{ color: '#ffc830' }}>
              出撃日
            </label>
            <input
              type="date"
              value={paidAt}
              onChange={(e) => setPaidAt(e.target.value)}
              required
              className="mh-input"
              style={{ colorScheme: 'dark' }}
            />
          </div>

          <div>
            <label className="block text-xs font-bold mb-1.5" style={{ color: '#ffc830' }}>
              攻撃タイプ
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('normal')}
                className="py-2.5 px-3 text-xs font-bold text-center rounded"
                style={{
                  backgroundColor: type === 'normal' ? 'rgba(255,136,32,0.2)' : '#18140e',
                  border: `2px solid ${type === 'normal' ? '#ff8820' : '#3a3020'}`,
                  color: type === 'normal' ? '#ff8820' : '#706050',
                }}
              >
                ⚔️ 通常攻撃
              </button>
              <button
                type="button"
                onClick={() => setType('extra')}
                className="py-2.5 px-3 text-xs font-bold text-center rounded"
                style={{
                  backgroundColor: type === 'extra' ? 'rgba(255,200,48,0.2)' : '#18140e',
                  border: `2px solid ${type === 'extra' ? '#ffc830' : '#3a3020'}`,
                  color: type === 'extra' ? '#ffc830' : '#706050',
                }}
              >
                💥 必殺技
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1.5" style={{ color: '#ffc830' }}>
              メモ（任意）
            </label>
            <input
              type="text"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="例: ボーナスから返済"
              className="mh-input"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || bosses.length === 0 || !amount}
            className="w-full mh-btn mh-btn-primary text-base disabled:opacity-40"
          >
            {submitting ? '攻撃中...' : '⚔️ 出撃！'}
          </button>
        </form>
      </div>

      {/* Recent Hunts */}
      <div className="mx-3 mt-4">
        <div className="mh-section-header">
          <h2>最近の狩猟記録</h2>
        </div>
        {recentPayments.length === 0 ? (
          <div className="mh-panel p-6 text-center">
            <p className="text-2xl mb-2">🗡️</p>
            <p className="text-xs" style={{ color: '#a09078' }}>まだ狩猟記録がありません</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {recentPayments.map((payment) => (
              <div key={payment.id} className="mh-panel-dark p-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{payment.boss_emoji}</span>
                    <div>
                      <p className="text-xs font-bold" style={{ color: '#f0e8d8' }}>{payment.boss_name}</p>
                      <p className="text-[10px]" style={{ color: '#a09078' }}>
                        {payment.paid_at}
                        {payment.type === 'extra' && <span className="ml-1" style={{ color: '#ffc830' }}>💥 必殺技</span>}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black" style={{ color: '#ff8820' }}>-{formatCurrency(payment.amount)}</p>
                    <p className="text-[10px] font-bold" style={{ color: '#ffc830' }}>+{payment.xp_earned} EXP</p>
                  </div>
                </div>
                {payment.memo && (
                  <p className="text-[10px] mt-1 pl-8" style={{ color: '#706050' }}>{payment.memo}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Result Modal */}
      {result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="w-full max-w-sm mh-panel-accent p-5 animate-slide-up">
            <div className="text-center mb-3">
              <p className="text-4xl mb-2">
                {result.bossDefeated ? '💀' : result.type === 'extra' ? '💥' : '⚔️'}
              </p>
              <p className="text-sm font-bold" style={{ color: '#f0e8d8' }}>
                {result.bossEmoji} {result.bossName} に
              </p>
              <p className="text-xl font-black mt-1" style={{ color: '#ff8820' }}>
                {formatCurrency(result.amount)} ダメージ！
              </p>
            </div>

            <div className="text-center my-3">
              <p className="text-lg font-black animate-xp" style={{ color: '#ffc830' }}>
                +{result.xpEarned} EXP
              </p>
            </div>

            {result.levelUp && (
              <div className="mh-panel-dark p-3 text-center mb-2" style={{ borderColor: '#ffc830' }}>
                <p className="text-sm font-black" style={{ color: '#ffc830' }}>
                  🎉 ハンターランクUP！ HR {result.newLevel}
                </p>
              </div>
            )}

            {result.bossDefeated && (
              <div className="mh-panel-dark p-3 text-center mb-2" style={{ borderColor: '#40c850' }}>
                <p className="text-sm font-black quest-clear-stamp">
                  QUEST CLEAR!
                </p>
              </div>
            )}

            {result.achievementsEarned.length > 0 && (
              <div className="mh-panel-dark p-3 mb-2" style={{ borderColor: '#ffc830' }}>
                <p className="text-xs font-bold mb-1" style={{ color: '#ffc830' }}>🏆 勲章獲得！</p>
                {result.achievementsEarned.map((name, i) => (
                  <p key={i} className="text-xs" style={{ color: '#f0e8d8' }}>{name}</p>
                ))}
              </div>
            )}

            <button
              onClick={() => setResult(null)}
              className="w-full mt-3 mh-btn text-sm"
            >
              OK
            </button>
          </div>
        </div>
      )}

      <NavBar />
    </div>
  );
}

export default function RecordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-3xl animate-pulse-glow">⚔️</p>
      </div>
    }>
      <RecordForm />
    </Suspense>
  );
}
