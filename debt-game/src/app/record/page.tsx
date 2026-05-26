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

      setResult({
        ...res,
        bossName: boss.name,
        bossEmoji: boss.emoji,
        amount: parsedAmount,
        type,
      });

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

  function dismissResult() {
    setResult(null);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0f0f23' }}>
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">⚔️</div>
          <p style={{ color: '#8888aa' }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: '#0f0f23' }}>
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-center" style={{ color: '#ffd700' }}>
          ⚔️ Battle Record
        </h1>
        <p className="text-center text-sm mt-1" style={{ color: '#8888aa' }}>
          返済を記録して攻撃しよう
        </p>
      </div>

      {/* Form Card */}
      <div className="mx-4 rounded-xl p-5 border border-white/10" style={{ backgroundColor: '#16213e' }}>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Boss Selector */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#e0e0e0' }}>
              攻撃対象
            </label>
            {bosses.length === 0 ? (
              <p className="text-sm" style={{ color: '#8888aa' }}>
                撃破可能なボスがいません
              </p>
            ) : (
              <select
                value={selectedBossId}
                onChange={(e) => setSelectedBossId(e.target.value)}
                className="w-full rounded-lg px-4 py-3 text-base border border-white/10 focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: '#0f0f23',
                  color: '#e0e0e0',
                  borderColor: 'rgba(255,255,255,0.1)',
                }}
              >
                {bosses.map((boss) => (
                  <option key={boss.id} value={boss.id}>
                    {boss.emoji} {boss.name} (HP: {formatCurrency(boss.current_hp)})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#e0e0e0' }}>
              攻撃力（金額）
            </label>
            <div className="relative">
              <span
                className="absolute left-4 top-1/2 -translate-y-1/2 text-base font-bold"
                style={{ color: '#ffd700' }}
              >
                ¥
              </span>
              <input
                type="number"
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                min="1"
                required
                className="w-full rounded-lg pl-10 pr-4 py-3 text-base border border-white/10 focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: '#0f0f23',
                  color: '#e0e0e0',
                  borderColor: 'rgba(255,255,255,0.1)',
                }}
              />
            </div>
          </div>

          {/* Date Input */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#e0e0e0' }}>
              攻撃日
            </label>
            <input
              type="date"
              value={paidAt}
              onChange={(e) => setPaidAt(e.target.value)}
              required
              className="w-full rounded-lg px-4 py-3 text-base border border-white/10 focus:outline-none focus:ring-2"
              style={{
                backgroundColor: '#0f0f23',
                color: '#e0e0e0',
                borderColor: 'rgba(255,255,255,0.1)',
                colorScheme: 'dark',
              }}
            />
          </div>

          {/* Type Toggle */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#e0e0e0' }}>
              攻撃タイプ
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('normal')}
                className="rounded-lg py-3 px-4 text-sm font-bold border-2 transition-all duration-200"
                style={{
                  backgroundColor: type === 'normal' ? 'rgba(255,102,0,0.2)' : 'transparent',
                  borderColor: type === 'normal' ? '#ff6600' : 'rgba(255,255,255,0.1)',
                  color: type === 'normal' ? '#ff6600' : '#8888aa',
                }}
              >
                ⚔️ 通常攻撃
              </button>
              <button
                type="button"
                onClick={() => setType('extra')}
                className="rounded-lg py-3 px-4 text-sm font-bold border-2 transition-all duration-200"
                style={{
                  backgroundColor: type === 'extra' ? 'rgba(255,215,0,0.2)' : 'transparent',
                  borderColor: type === 'extra' ? '#ffd700' : 'rgba(255,255,255,0.1)',
                  color: type === 'extra' ? '#ffd700' : '#8888aa',
                }}
              >
                💥 必殺技
              </button>
            </div>
          </div>

          {/* Memo Input */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#e0e0e0' }}>
              メモ（任意）
            </label>
            <input
              type="text"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="例: ボーナスから返済"
              className="w-full rounded-lg px-4 py-3 text-base border border-white/10 focus:outline-none focus:ring-2"
              style={{
                backgroundColor: '#0f0f23',
                color: '#e0e0e0',
                borderColor: 'rgba(255,255,255,0.1)',
              }}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || bosses.length === 0 || !amount}
            className="w-full py-4 rounded-xl text-lg font-bold text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
            style={{
              background: submitting
                ? '#555'
                : 'linear-gradient(135deg, #ff6600, #ff8800)',
              boxShadow: submitting ? 'none' : '0 4px 20px rgba(255,102,0,0.4)',
            }}
          >
            {submitting ? '攻撃中...' : '⚔️ 攻撃！'}
          </button>
        </form>
      </div>

      {/* Recent Payments */}
      <div className="mx-4 mt-6">
        <h2 className="text-lg font-bold mb-3" style={{ color: '#e0e0e0' }}>
          最近の攻撃履歴
        </h2>
        {recentPayments.length === 0 ? (
          <div
            className="rounded-xl p-6 text-center border border-white/10"
            style={{ backgroundColor: '#16213e' }}
          >
            <p className="text-3xl mb-2">🗡️</p>
            <p className="text-sm" style={{ color: '#8888aa' }}>
              まだ攻撃記録がありません
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentPayments.map((payment) => (
              <div
                key={payment.id}
                className="rounded-xl p-4 border border-white/10"
                style={{ backgroundColor: '#16213e' }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{payment.boss_emoji}</span>
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#e0e0e0' }}>
                        {payment.boss_name}
                      </p>
                      <p className="text-xs" style={{ color: '#8888aa' }}>
                        {payment.paid_at}
                        {payment.type === 'extra' && (
                          <span className="ml-2" style={{ color: '#ffd700' }}>
                            💥 必殺技
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold" style={{ color: '#ff6600' }}>
                      -{formatCurrency(payment.amount)}
                    </p>
                    <p className="text-xs" style={{ color: '#ffd700' }}>
                      +{payment.xp_earned} XP
                    </p>
                  </div>
                </div>
                {payment.memo && (
                  <p className="text-xs mt-2 pl-11" style={{ color: '#8888aa' }}>
                    {payment.memo}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Result Modal */}
      {result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div
            className="w-full max-w-sm rounded-2xl p-6 border border-white/10 animate-slide-up"
            style={{ backgroundColor: '#16213e' }}
          >
            {/* Damage display */}
            <div className="text-center mb-4">
              <div className="text-5xl mb-3">
                {result.bossDefeated ? '💀' : result.type === 'extra' ? '💥' : '⚔️'}
              </div>
              <p className="text-lg font-bold" style={{ color: '#e0e0e0' }}>
                {result.bossEmoji} {result.bossName}に
              </p>
              <p className="text-2xl font-black mt-1" style={{ color: '#ff6600' }}>
                {formatCurrency(result.amount)} ダメージ！
              </p>
            </div>

            {/* XP earned */}
            <div className="text-center my-4">
              <p className="text-xl font-bold animate-xp" style={{ color: '#ffd700' }}>
                +{result.xpEarned} XP
              </p>
            </div>

            {/* Level up */}
            {result.levelUp && (
              <div
                className="text-center py-3 px-4 rounded-xl mb-3"
                style={{ backgroundColor: 'rgba(255,215,0,0.15)' }}
              >
                <p className="text-lg font-bold" style={{ color: '#ffd700' }}>
                  🎉 レベルアップ！ Lv.{result.newLevel}
                </p>
              </div>
            )}

            {/* Boss defeated */}
            {result.bossDefeated && (
              <div
                className="text-center py-3 px-4 rounded-xl mb-3"
                style={{ backgroundColor: 'rgba(68,255,68,0.15)' }}
              >
                <p className="text-lg font-bold" style={{ color: '#44ff44' }}>
                  🎉 BOSS DEFEATED!
                </p>
              </div>
            )}

            {/* Achievements */}
            {result.achievementsEarned.length > 0 && (
              <div
                className="py-3 px-4 rounded-xl mb-3"
                style={{ backgroundColor: 'rgba(255,215,0,0.1)' }}
              >
                <p className="text-sm font-bold mb-2" style={{ color: '#ffd700' }}>
                  🏆 実績解除！
                </p>
                {result.achievementsEarned.map((name, i) => (
                  <p key={i} className="text-sm" style={{ color: '#e0e0e0' }}>
                    {name}
                  </p>
                ))}
              </div>
            )}

            {/* Dismiss button */}
            <button
              onClick={dismissResult}
              className="w-full mt-4 py-3 rounded-xl text-base font-bold transition-all duration-200 active:scale-[0.98]"
              style={{
                backgroundColor: 'rgba(255,255,255,0.1)',
                color: '#e0e0e0',
              }}
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
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0f0f23' }}>
          <div className="text-center">
            <div className="text-4xl mb-4 animate-pulse">⚔️</div>
            <p style={{ color: '#8888aa' }}>Loading...</p>
          </div>
        </div>
      }
    >
      <RecordForm />
    </Suspense>
  );
}
