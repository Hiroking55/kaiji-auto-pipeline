'use client';

import { useState, useEffect } from 'react';
import { getDashboardData, addSavingsGoal, recordSavingsDeposit } from '@/lib/client-actions';
import { formatCurrency, estimateGoalMonths } from '@/lib/game-engine';
import type { SavingsGoal } from '@/lib/types';

const CATEGORY_LABELS: Record<SavingsGoal['category'], string> = {
  travel: '旅行',
  emergency: '緊急資金',
  education: '自己投資',
  other: 'その他',
};

interface DepositResult {
  goalName: string;
  xpEarned: number;
  hatched: boolean;
  companionEmoji?: string;
  companionName?: string;
}

export default function SavingsPage() {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);

  // Add goal form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<SavingsGoal['category']>('emergency');
  const [newTarget, setNewTarget] = useState('');
  const [newMonthly, setNewMonthly] = useState('');
  const [addingGoal, setAddingGoal] = useState(false);

  // Deposit form
  const [depositGoalId, setDepositGoalId] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositing, setDepositing] = useState(false);

  // Result display
  const [depositResult, setDepositResult] = useState<DepositResult | null>(null);

  function refresh() {
    const data = getDashboardData();
    if (data) {
      setGoals(data.savingsGoals);
    }
  }

  useEffect(() => {
    refresh();
    setLoading(false);
  }, []);

  function handleAddGoal(e: React.FormEvent) {
    e.preventDefault();
    if (addingGoal || !newName.trim() || !newTarget || !newMonthly) return;
    const target = parseInt(newTarget, 10);
    const monthly = parseInt(newMonthly, 10);
    if (isNaN(target) || target <= 0 || isNaN(monthly) || monthly <= 0) return;

    setAddingGoal(true);
    try {
      addSavingsGoal({
        name: newName.trim(),
        category: newCategory,
        targetAmount: target,
        monthlyTarget: monthly,
      });
      refresh();
      setNewName('');
      setNewCategory('emergency');
      setNewTarget('');
      setNewMonthly('');
      setShowAddForm(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : '目標の追加に失敗しました');
    } finally {
      setAddingGoal(false);
    }
  }

  function handleDeposit(e: React.FormEvent, goalId: string) {
    e.preventDefault();
    if (depositing || !depositAmount) return;
    const amount = parseInt(depositAmount, 10);
    if (isNaN(amount) || amount <= 0) return;

    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    setDepositing(true);
    try {
      const res = recordSavingsDeposit({
        goalId,
        amount,
        depositedAt: new Date().toISOString().split('T')[0],
      });
      // Refresh to get updated goal (with possible companion info)
      const data = getDashboardData();
      const updatedGoal = data?.savingsGoals.find(g => g.id === goalId);
      setDepositResult({
        goalName: goal.name,
        xpEarned: res.xpEarned,
        hatched: res.hatched,
        companionEmoji: updatedGoal?.companion_emoji || undefined,
        companionName: updatedGoal?.companion_name || undefined,
      });
      refresh();
      setDepositGoalId(null);
      setDepositAmount('');
    } catch (err) {
      alert(err instanceof Error ? err.message : '入金に失敗しました');
    } finally {
      setDepositing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-4xl animate-soft-pulse">🥚</p>
      </div>
    );
  }

  const active = goals.filter(g => !g.is_hatched);
  const hatched = goals.filter(g => g.is_hatched);

  return (
    <div className="pt-6 space-y-4">
      {/* Header */}
      <div className="text-center mb-2">
        <h1 className="text-2xl font-extrabold glow-gold" style={{ color: '#b89450' }}>
          防衛クエスト
        </h1>
        <p className="text-xs mt-1 font-medium" style={{ color: '#7c7870' }}>
          貯金目標を守り育てよう
        </p>
      </div>

      {/* Summary */}
      {goals.length > 0 && (
        <div className="glass p-4">
          <div className="grid grid-cols-3 gap-2">
            {[
              { v: String(active.length), l: '育成中', c: '#c07838' },
              { v: String(hatched.length), l: '孵化済', c: '#40a060' },
              {
                v: formatCurrency(goals.reduce((s, g) => s + g.current_amount, 0)).replace('¥', ''),
                l: '総貯金',
                c: '#b89450',
              },
            ].map(({ v, l, c }) => (
              <div key={l} className="text-center">
                <p className="text-lg font-extrabold" style={{ color: c }}>{v}</p>
                <p className="text-[8px] font-bold uppercase tracking-wider mt-0.5" style={{ color: '#4a4640' }}>{l}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Goals */}
      {active.length > 0 && (
        <div>
          <div className="section-bar">
            <h2 className="text-[15px] font-extrabold" style={{ color: '#e8e6e2' }}>育成中の卵</h2>
            <span className="text-[11px] font-bold" style={{ color: '#7c7870' }}>
              {active.length}個
            </span>
          </div>
          <div className="space-y-3">
            {active.map(goal => {
              const progress = goal.target_amount > 0
                ? Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100))
                : 0;
              const months = estimateGoalMonths(goal);

              return (
                <div key={goal.id} className="glass p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                      style={{
                        background: 'rgba(14, 15, 20, 0.6)',
                        border: '1px solid rgba(255,255,255,0.04)',
                      }}
                    >
                      🥚
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-extrabold truncate" style={{ color: '#e8e6e2' }}>
                          {goal.name}
                        </p>
                        <span className="tag tag-active text-[9px] shrink-0">
                          {CATEGORY_LABELS[goal.category]}
                        </span>
                      </div>
                      <p className="text-[10px] font-bold mt-0.5" style={{ color: '#7c7870' }}>
                        {months !== null
                          ? `あと約${months}ヶ月`
                          : '計算不可'}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-extrabold" style={{ color: '#b89450' }}>
                        {progress}
                        <span className="text-xs">%</span>
                      </p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mb-2">
                    <div className="hp-track hp-track-sm">
                      <div
                        className="hp-fill"
                        style={{
                          width: `${progress}%`,
                          background: 'linear-gradient(90deg, #b89450, #40a060)',
                          boxShadow: '0 0 12px rgba(76,206,123,0.3)',
                        }}
                      />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-[10px] font-bold" style={{ color: '#7c7870' }}>
                        {formatCurrency(goal.current_amount)}
                      </span>
                      <span className="text-[10px] font-bold" style={{ color: '#4a4640' }}>
                        {formatCurrency(goal.target_amount)}
                      </span>
                    </div>
                  </div>

                  {/* Deposit form (inline) */}
                  {depositGoalId === goal.id ? (
                    <form onSubmit={(e) => handleDeposit(e, goal.id)} className="mt-3">
                      <div className="glass-inner p-3 space-y-3">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#b89450' }}>
                            入金額
                          </label>
                          <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-extrabold" style={{ color: '#b89450' }}>
                              ¥
                            </span>
                            <input
                              type="number"
                              inputMode="numeric"
                              value={depositAmount}
                              onChange={(e) => setDepositAmount(e.target.value)}
                              placeholder="0"
                              min="1"
                              required
                              className="input-glass pl-9"
                              autoFocus
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button type="submit" disabled={depositing || !depositAmount} className="flex-1 btn-gold">
                            {depositing ? '処理中...' : '🥚 入金する'}
                          </button>
                          <button
                            type="button"
                            onClick={() => { setDepositGoalId(null); setDepositAmount(''); }}
                            className="btn-secondary px-4"
                          >
                            戻る
                          </button>
                        </div>
                      </div>
                    </form>
                  ) : (
                    <button
                      onClick={() => setDepositGoalId(goal.id)}
                      className="w-full btn-primary mt-2 text-sm"
                    >
                      💰 入金する
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Hatched Goals */}
      {hatched.length > 0 && (
        <div>
          <div className="section-bar">
            <h2 className="text-[15px] font-extrabold" style={{ color: '#e8e6e2' }}>孵化した仲間</h2>
            <span className="text-[11px] font-bold" style={{ color: '#40a060' }}>
              {hatched.length}体
            </span>
          </div>
          <div className="space-y-3">
            {hatched.map(goal => (
              <div key={goal.id} className="glass-accent p-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                    style={{
                      background: 'rgba(64, 160, 96, 0.1)',
                      border: '1px solid rgba(64, 160, 96, 0.2)',
                    }}
                  >
                    {goal.companion_emoji || goal.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-extrabold truncate" style={{ color: '#e8e6e2' }}>
                        {goal.companion_name || goal.name}
                      </p>
                      <span className="tag tag-clear text-[9px] shrink-0">HATCHED</span>
                    </div>
                    <p className="text-[10px] font-bold mt-0.5" style={{ color: '#7c7870' }}>
                      {goal.name} - {CATEGORY_LABELS[goal.category]}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-extrabold glow-green" style={{ color: '#40a060' }}>
                      {formatCurrency(goal.target_amount)}
                    </p>
                    <p className="text-[9px] font-bold" style={{ color: '#4a4640' }}>達成</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {goals.length === 0 && !showAddForm && (
        <div className="glass p-8 text-center">
          <p className="text-4xl mb-3">🥚</p>
          <p className="text-sm font-bold mb-1" style={{ color: '#e8e6e2' }}>
            まだ卵がありません
          </p>
          <p className="text-xs mb-4" style={{ color: '#7c7870' }}>
            貯金目標を設定して卵を育てよう
          </p>
        </div>
      )}

      {/* Add Goal Section */}
      {showAddForm ? (
        <div className="glass p-5">
          <p className="text-[11px] font-bold uppercase tracking-wider mb-4" style={{ color: '#b89450' }}>
            新しい卵を入手
          </p>
          <form onSubmit={handleAddGoal} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#b89450' }}>
                目標名
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="例: 沖縄旅行資金"
                required
                className="input-glass"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#b89450' }}>
                カテゴリ
              </label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as SavingsGoal['category'])}
                className="select-glass"
              >
                <option value="travel">旅行</option>
                <option value="emergency">緊急資金</option>
                <option value="education">自己投資</option>
                <option value="other">その他</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#b89450' }}>
                目標金額
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-extrabold" style={{ color: '#b89450' }}>
                  ¥
                </span>
                <input
                  type="number"
                  inputMode="numeric"
                  value={newTarget}
                  onChange={(e) => setNewTarget(e.target.value)}
                  placeholder="0"
                  min="1"
                  required
                  className="input-glass pl-9"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#b89450' }}>
                毎月の積立目標
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-extrabold" style={{ color: '#b89450' }}>
                  ¥
                </span>
                <input
                  type="number"
                  inputMode="numeric"
                  value={newMonthly}
                  onChange={(e) => setNewMonthly(e.target.value)}
                  placeholder="0"
                  min="1"
                  required
                  className="input-glass pl-9"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={addingGoal} className="flex-1 btn-gold">
                {addingGoal ? '追加中...' : '🥚 卵を入手'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="btn-secondary px-4"
              >
                戻る
              </button>
            </div>
          </form>
        </div>
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full btn-gold py-3"
        >
          + 新しい目標を追加
        </button>
      )}

      {/* Deposit Result Modal */}
      {depositResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5" style={{ background: 'rgba(0,0,0,0.85)' }}>
          <div className="w-full max-w-sm glass-accent p-6 animate-slide-up">
            <div className="text-center mb-4">
              <p className="text-5xl mb-3">{depositResult.hatched ? depositResult.companionEmoji || '🐣' : '💰'}</p>
              <p className="text-sm font-bold" style={{ color: '#e8e6e2' }}>
                {depositResult.goalName}
              </p>
              {depositResult.hatched ? (
                <p className="text-lg font-extrabold mt-2 glow-green" style={{ color: '#40a060' }}>
                  卵が孵化した！
                </p>
              ) : (
                <p className="text-sm font-bold mt-2" style={{ color: '#7c7870' }}>
                  入金完了！
                </p>
              )}
            </div>
            <p className="text-xl font-extrabold text-center animate-glow my-4" style={{ color: '#b89450' }}>
              +{depositResult.xpEarned} EXP
            </p>
            {depositResult.hatched && depositResult.companionName && (
              <div className="glass-inner p-3 text-center mb-3" style={{ borderColor: 'rgba(64,160,96,0.3)' }}>
                <p className="text-sm font-extrabold glow-green" style={{ color: '#40a060' }}>
                  {depositResult.companionEmoji} {depositResult.companionName} が仲間になった！
                </p>
              </div>
            )}
            <button onClick={() => setDepositResult(null)} className="w-full btn-secondary mt-2">OK</button>
          </div>
        </div>
      )}
    </div>
  );
}
