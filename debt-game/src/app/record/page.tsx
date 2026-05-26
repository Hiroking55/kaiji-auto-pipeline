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
      alert(err instanceof Error ? err.message : 'きろくにしっぱいしました');
    } finally {
      setSubmitting(false);
    }
  }

  function dismissResult() {
    setResult(null);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-3xl mb-3 animate-bounce-pixel">⚔️</div>
          <p className="animate-blink" style={{ color: '#9090c0' }}>Now Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: '#0a0a1a' }}>
      {/* Header */}
      <div className="px-3 pt-5 pb-3">
        <h1 className="text-xl font-bold text-center text-glow-gold" style={{ color: '#f8d830' }}>
          ⚔️ たたかう
        </h1>
        <p className="text-center text-xs mt-1" style={{ color: '#9090c0' }}>
          へんさいをきろくしてこうげきしよう
        </p>
      </div>

      {/* Form Card */}
      <div className="mx-3 pixel-window">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Boss Selector */}
          <div>
            <label className="block text-xs font-bold mb-1" style={{ color: '#f8d830' }}>
              ▶ こうげきたいしょう
            </label>
            {bosses.length === 0 ? (
              <p className="text-xs" style={{ color: '#9090c0' }}>
                たおせるボスがいません
              </p>
            ) : (
              <select
                value={selectedBossId}
                onChange={(e) => setSelectedBossId(e.target.value)}
                className="w-full pixel-select text-sm"
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
            <label className="block text-xs font-bold mb-1" style={{ color: '#f8d830' }}>
              ▶ こうげきりょく（きんがく）
            </label>
            <div className="relative">
              <span
                className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold"
                style={{ color: '#f8d830' }}
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
                className="w-full pixel-input text-sm pl-8"
              />
            </div>
          </div>

          {/* Date Input */}
          <div>
            <label className="block text-xs font-bold mb-1" style={{ color: '#f8d830' }}>
              ▶ こうげきび
            </label>
            <input
              type="date"
              value={paidAt}
              onChange={(e) => setPaidAt(e.target.value)}
              required
              className="w-full pixel-input text-sm"
              style={{ colorScheme: 'dark' }}
            />
          </div>

          {/* Type Toggle */}
          <div>
            <label className="block text-xs font-bold mb-1" style={{ color: '#f8d830' }}>
              ▶ こうげきタイプ
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('normal')}
                className="py-2 px-3 text-xs font-bold text-center"
                style={{
                  backgroundColor: type === 'normal' ? '#f8783030' : '#0e0e2a',
                  border: `2px solid ${type === 'normal' ? '#f87830' : '#404070'}`,
                  color: type === 'normal' ? '#f87830' : '#9090c0',
                }}
              >
                ⚔️ つうじょう
              </button>
              <button
                type="button"
                onClick={() => setType('extra')}
                className="py-2 px-3 text-xs font-bold text-center"
                style={{
                  backgroundColor: type === 'extra' ? '#f8d83030' : '#0e0e2a',
                  border: `2px solid ${type === 'extra' ? '#f8d830' : '#404070'}`,
                  color: type === 'extra' ? '#f8d830' : '#9090c0',
                }}
              >
                💥 ひっさつ
              </button>
            </div>
          </div>

          {/* Memo Input */}
          <div>
            <label className="block text-xs font-bold mb-1" style={{ color: '#f8d830' }}>
              ▶ メモ（にんい）
            </label>
            <input
              type="text"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="れい: ボーナスからへんさい"
              className="w-full pixel-input text-sm"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || bosses.length === 0 || !amount}
            className="w-full pixel-btn pixel-btn-attack text-base disabled:opacity-40"
          >
            {submitting ? 'こうげきちゅう...' : '⚔️ こうげき！'}
          </button>
        </form>
      </div>

      {/* Recent Payments */}
      <div className="mx-3 mt-4">
        <div className="flex items-center gap-2 mb-3">
          <span style={{ color: '#f8d830' }}>▶</span>
          <h2 className="text-sm font-bold" style={{ color: '#ffffff' }}>
            さいきんのこうげき
          </h2>
        </div>
        {recentPayments.length === 0 ? (
          <div className="pixel-window text-center">
            <p className="text-2xl mb-2">🗡️</p>
            <p className="text-xs" style={{ color: '#9090c0' }}>
              まだこうげききろくがありません
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentPayments.map((payment) => (
              <div key={payment.id} className="pixel-window-dark">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{payment.boss_emoji}</span>
                    <div>
                      <p className="text-xs font-bold" style={{ color: '#ffffff' }}>
                        {payment.boss_name}
                      </p>
                      <p className="text-[10px]" style={{ color: '#9090c0' }}>
                        {payment.paid_at}
                        {payment.type === 'extra' && (
                          <span className="ml-1" style={{ color: '#f8d830' }}>
                            ★ ひっさつ
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold" style={{ color: '#f87830' }}>
                      -{formatCurrency(payment.amount)}
                    </p>
                    <p className="text-[10px]" style={{ color: '#f8d830' }}>
                      +{payment.xp_earned} EXP
                    </p>
                  </div>
                </div>
                {payment.memo && (
                  <p className="text-[10px] mt-1 pl-8" style={{ color: '#9090c0' }}>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="w-full max-w-sm pixel-window animate-slide-up">
            {/* Damage display */}
            <div className="text-center mb-3">
              <div className="text-4xl mb-2">
                {result.bossDefeated ? '💀' : result.type === 'extra' ? '💥' : '⚔️'}
              </div>
              <p className="text-sm font-bold" style={{ color: '#ffffff' }}>
                {result.bossEmoji} {result.bossName} に
              </p>
              <p className="text-xl font-bold mt-1 text-glow-red" style={{ color: '#f87830' }}>
                {formatCurrency(result.amount)} ダメージ！
              </p>
            </div>

            {/* XP earned */}
            <div className="text-center my-3">
              <p className="text-lg font-bold animate-xp" style={{ color: '#f8d830' }}>
                +{result.xpEarned} EXP
              </p>
            </div>

            {/* Level up */}
            {result.levelUp && (
              <div
                className="text-center py-2 px-3 mb-2"
                style={{
                  backgroundColor: '#f8d83020',
                  border: '2px solid #f8d830',
                }}
              >
                <p className="text-sm font-bold text-glow-gold" style={{ color: '#f8d830' }}>
                  ★ レベルアップ！ Lv.{result.newLevel} ★
                </p>
              </div>
            )}

            {/* Boss defeated */}
            {result.bossDefeated && (
              <div
                className="text-center py-2 px-3 mb-2"
                style={{
                  backgroundColor: '#30f84820',
                  border: '2px solid #30f848',
                }}
              >
                <p className="text-sm font-bold text-glow-green" style={{ color: '#30f848' }}>
                  ★ ボスをたおした！ ★
                </p>
              </div>
            )}

            {/* Achievements */}
            {result.achievementsEarned.length > 0 && (
              <div
                className="py-2 px-3 mb-2"
                style={{
                  backgroundColor: '#f8d83010',
                  border: '2px solid #f8d830',
                }}
              >
                <p className="text-xs font-bold mb-1" style={{ color: '#f8d830' }}>
                  🏆 じっせきかいじょ！
                </p>
                {result.achievementsEarned.map((name, i) => (
                  <p key={i} className="text-xs" style={{ color: '#ffffff' }}>
                    {name}
                  </p>
                ))}
              </div>
            )}

            {/* Dismiss button */}
            <button
              onClick={dismissResult}
              className="w-full mt-3 pixel-btn text-sm"
            >
              ▶ つぎへ
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
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="text-3xl mb-3 animate-bounce-pixel">⚔️</div>
            <p className="animate-blink" style={{ color: '#9090c0' }}>Now Loading...</p>
          </div>
        </div>
      }
    >
      <RecordForm />
    </Suspense>
  );
}
