'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getDashboardData, recordPayment } from '@/lib/client-actions';
import { formatCurrency } from '@/lib/game-engine';
import type { Boss, Payment } from '@/lib/types';
import NavBar from '@/components/NavBar';

interface PaymentResult {
  xpEarned: number;
  comboCount: number;
  comboMultiplier: number;
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
      const ab = data.bosses.filter((b) => !b.is_defeated);
      setBosses(ab);
      setRecentPayments(data.recentPayments);
      const pb = searchParams.get('boss');
      const pt = searchParams.get('type');
      if (pb && ab.some((b) => b.id === pb)) setSelectedBossId(pb);
      else if (ab.length > 0) setSelectedBossId(ab[0].id);
      if (pt === 'normal' || pt === 'extra') setType(pt);
    }
    setLoading(false);
  }, [searchParams]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedBossId || !amount || submitting) return;
    const n = parseInt(amount, 10);
    if (isNaN(n) || n <= 0) return;
    const boss = bosses.find((b) => b.id === selectedBossId);
    if (!boss) return;
    setSubmitting(true);
    try {
      const res = recordPayment({ bossId: selectedBossId, amount: n, type, paidAt, memo: memo || undefined });
      setResult({ ...res, bossName: boss.name, bossEmoji: boss.emoji, amount: n, type });
      const data = getDashboardData();
      if (data) { setBosses(data.bosses.filter((b) => !b.is_defeated)); setRecentPayments(data.recentPayments); }
      setAmount(''); setMemo('');
    } catch (err) {
      alert(err instanceof Error ? err.message : '記録に失敗しました');
    } finally { setSubmitting(false); }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-4xl animate-sparkle">⚔️</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      <div className="max-w-md mx-auto px-4 pt-6 space-y-4">
        <div className="text-center">
          <h1 className="text-2xl font-extrabold" style={{ color: '#b08810' }}>クエスト出発</h1>
          <p className="text-xs mt-1 font-medium" style={{ color: '#5a6a8a' }}>返済を記録して討伐ダメージを与えよう</p>
        </div>

        <div className="rpg-panel p-5">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: '#b08810' }}>討伐対象</label>
              {bosses.length === 0 ? (
                <p className="text-sm" style={{ color: '#8a96b0' }}>討伐可能なモンスターがいません</p>
              ) : (
                <select value={selectedBossId} onChange={(e) => setSelectedBossId(e.target.value)} className="select-rpg">
                  {bosses.map((b) => <option key={b.id} value={b.id}>{b.emoji} {b.name} (HP: {formatCurrency(b.current_hp)})</option>)}
                </select>
              )}
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: '#b08810' }}>攻撃力（返済額）</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-extrabold" style={{ color: '#b08810' }}>¥</span>
                <input type="number" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" min="1" required className="input-rpg pl-9" />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: '#b08810' }}>出撃日</label>
              <input type="date" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} required className="input-rpg" style={{ colorScheme: 'light' }} />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: '#b08810' }}>攻撃タイプ</label>
              <div className="grid grid-cols-2 gap-3">
                {(['normal', 'extra'] as const).map(t => (
                  <button key={t} type="button" onClick={() => setType(t)}
                    className="py-3 rounded-xl text-sm font-bold transition-all"
                    style={{
                      background: type === t ? (t === 'normal' ? 'rgba(232,144,64,0.15)' : 'rgba(232,184,73,0.15)') : 'rgba(43,58,103,0.06)',
                      border: `1.5px solid ${type === t ? (t === 'normal' ? '#d9534f' : '#b08810') : 'rgba(255,255,255,0.06)'}`,
                      color: type === t ? (t === 'normal' ? '#d9534f' : '#b08810') : '#8a96b0',
                      boxShadow: type === t ? `0 0 16px ${t === 'normal' ? 'rgba(232,144,64,0.15)' : 'rgba(232,184,73,0.15)'}` : 'none',
                    }}>
                    {t === 'normal' ? '⚔️ 通常攻撃' : '💥 必殺技'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: '#b08810' }}>メモ（任意）</label>
              <input type="text" value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="例: ボーナスから返済" className="input-rpg" />
            </div>
            <button type="submit" disabled={submitting || bosses.length === 0 || !amount} className="w-full btn-rpg">
              {submitting ? '攻撃中...' : '⚔️ 出撃！'}
            </button>
          </form>
        </div>

        {/* Recent */}
        <div>
          <div className="section-bar">
            <h2 className="text-[15px] font-extrabold" style={{ color: '#2b3a67' }}>最近の狩猟記録</h2>
          </div>
          {recentPayments.length === 0 ? (
            <div className="rpg-panel p-8 text-center">
              <p className="text-2xl mb-2">🗡️</p>
              <p className="text-xs" style={{ color: '#8a96b0' }}>まだ狩猟記録がありません</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentPayments.map((p) => (
                <div key={p.id} className="rpg-panel-inner p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{p.boss_emoji}</span>
                      <div>
                        <p className="text-xs font-bold" style={{ color: '#2b3a67' }}>{p.boss_name}</p>
                        <p className="text-[10px]" style={{ color: '#5a6a8a' }}>
                          {p.paid_at}{p.type === 'extra' && <span className="ml-1.5" style={{ color: '#b08810' }}>★ 必殺技</span>}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-extrabold" style={{ color: '#d9534f' }}>-{formatCurrency(p.amount)}</p>
                      <p className="text-[10px] font-bold" style={{ color: '#7a4a8a' }}>+{p.xp_earned} EXP</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Result Modal */}
      {result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-sm rpg-panel-accent p-6 animate-slide-up">
            <div className="text-center mb-4">
              <p className="text-5xl mb-3">{result.bossDefeated ? '💀' : result.type === 'extra' ? '💥' : '⚔️'}</p>
              <p className="text-sm font-bold" style={{ color: '#2b3a67' }}>{result.bossEmoji} {result.bossName} に</p>
              <p className="text-2xl font-extrabold mt-1" style={{ color: '#d9534f' }}>
                {formatCurrency(result.amount)} ダメージ！
              </p>
            </div>
            <p className="text-xl font-extrabold text-center animate-glow my-4" style={{ color: '#b08810' }}>+{result.xpEarned} EXP</p>
            {result.comboMultiplier > 1 && (
              <div className="rpg-panel-inner p-2 text-center mb-3">
                <p className="text-xs font-bold" style={{ color: '#d9534f' }}>
                  🔥 {result.comboCount}コンボ！ ×{result.comboMultiplier.toFixed(1)} ボーナス
                </p>
              </div>
            )}
            {result.levelUp && (
              <div className="rpg-panel-inner p-3 text-center mb-3" style={{ borderColor: 'rgba(232,184,73,0.3)' }}>
                <p className="text-sm font-extrabold" style={{ color: '#b08810' }}>🎉 HR UP! → HR {result.newLevel}</p>
              </div>
            )}
            {result.bossDefeated && (
              <div className="rpg-panel-inner p-3 text-center mb-3" style={{ borderColor: 'rgba(76,206,123,0.3)' }}>
                <p className="text-sm font-extrabold" style={{ color: '#2d8a4e' }}>QUEST CLEAR!</p>
              </div>
            )}
            {result.achievementsEarned.length > 0 && (
              <div className="rpg-panel-inner p-3 mb-3">
                <p className="text-xs font-bold mb-1" style={{ color: '#b08810' }}>🏆 勲章獲得！</p>
                {result.achievementsEarned.map((n, i) => <p key={i} className="text-xs" style={{ color: '#2b3a67' }}>{n}</p>)}
              </div>
            )}
            <button onClick={() => setResult(null)} className="w-full btn-outline mt-2">OK</button>
          </div>
        </div>
      )}
      <NavBar />
    </div>
  );
}

export default function RecordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p className="text-4xl animate-sparkle">⚔️</p></div>}>
      <RecordForm />
    </Suspense>
  );
}
