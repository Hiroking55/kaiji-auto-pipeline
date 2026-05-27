'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { setupGame, resetAllData } from '@/lib/client-actions';

interface DebtEntry {
  debtType: string;
  customName: string;
  amount: string;
  interestRate: string;
  minMonthly: string;
  paymentDay: string;
}

const DEBT_TYPES = [
  { value: 'consumer_finance', label: 'サラ金（消費者金融）' },
  { value: 'credit_card', label: 'クレジットカード（リボ払い）' },
  { value: 'loan', label: 'ローン（銀行等）' },
  { value: 'student_loan', label: '奨学金' },
] as const;

const EMPTY_DEBT: DebtEntry = {
  debtType: 'credit_card',
  customName: '',
  amount: '',
  interestRate: '',
  minMonthly: '',
  paymentDay: '27',
};

export default function SetupPage() {
  const router = useRouter();
  const [playerName, setPlayerName] = useState('');
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [fixedExpenses, setFixedExpenses] = useState('');
  const [debts, setDebts] = useState<DebtEntry[]>([{ ...EMPTY_DEBT }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const addDebt = () => setDebts([...debts, { ...EMPTY_DEBT }]);
  const removeDebt = (i: number) => { if (debts.length > 1) setDebts(debts.filter((_, j) => j !== i)); };
  const updateDebt = (i: number, f: keyof DebtEntry, v: string) => {
    const u = [...debts]; u[i] = { ...u[i], [f]: v }; setDebts(u);
  };

  const buildDebts = () => debts.filter(d => Number(d.amount) > 0).map(d => ({
    debtType: d.debtType,
    customName: d.customName.trim() || undefined,
    amount: Number(d.amount),
    interestRate: Number(d.interestRate),
    minMonthly: Number(d.minMonthly),
    paymentDay: Number(d.paymentDay) || 27,
  }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      setupGame({ playerName: playerName.trim() || 'ハンター', monthlyIncome: Number(monthlyIncome) || 0, fixedExpenses: Number(fixedExpenses) || 0, debts: buildDebts() });
      router.push('/');
    } catch (err) { console.error(err); }
    finally { setIsSubmitting(false); }
  };

  const handleReset = () => {
    if (!confirm('全てのデータをリセットしますか？')) return;
    setIsResetting(true);
    try {
      resetAllData();
      setupGame({ playerName: playerName.trim() || 'ハンター', monthlyIncome: Number(monthlyIncome) || 0, fixedExpenses: Number(fixedExpenses) || 0, debts: buildDebts() });
      router.push('/');
    } catch (err) { console.error(err); }
    finally { setIsResetting(false); }
  };

  return (
    <div className="pt-6 space-y-4 pb-8">
      {/* Header */}
      <div className="glass-accent p-6 text-center">
        <p className="text-4xl mb-3">⚔️</p>
        <h1 className="text-2xl font-extrabold glow-gold" style={{ color: '#b89450' }}>Debt Hunter</h1>
        <p className="text-xs mt-1.5 font-medium" style={{ color: '#7c7870' }}>借金討伐クエスト — 冒険の準備</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Player Info */}
        <div className="glass p-5">
          <div className="section-bar" style={{ marginBottom: '14px' }}>
            <h2 className="text-[15px] font-extrabold" style={{ color: '#e8e6e2' }}>ハンター情報</h2>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#7c7870' }}>ハンター名</label>
              <input type="text" value={playerName} onChange={e => setPlayerName(e.target.value)} placeholder="ハンター" className="input-glass" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#7c7870' }}>月収（手取り）</label>
                <input type="number" value={monthlyIncome} onChange={e => setMonthlyIncome(e.target.value)} placeholder="250000" className="input-glass" />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#7c7870' }}>固定費（家賃等）</label>
                <input type="number" value={fixedExpenses} onChange={e => setFixedExpenses(e.target.value)} placeholder="80000" className="input-glass" />
              </div>
            </div>
          </div>
        </div>

        {/* Quests */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="section-bar" style={{ marginBottom: 0 }}>
              <h2 className="text-[15px] font-extrabold" style={{ color: '#e8e6e2' }}>討伐クエスト登録</h2>
            </div>
            <button type="button" onClick={addDebt} className="btn-secondary !py-2 !px-4 !text-xs">+ 追加</button>
          </div>

          <div className="space-y-3">
            {debts.map((debt, i) => (
              <div key={i} className="glass p-5">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-extrabold" style={{ color: '#b89450' }}>クエスト #{i + 1}</span>
                  {debts.length > 1 && (
                    <button type="button" onClick={() => removeDebt(i)} className="tag tag-danger cursor-pointer">削除</button>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#7c7870' }}>モンスター種別</label>
                    <select value={debt.debtType} onChange={e => updateDebt(i, 'debtType', e.target.value)} className="select-glass">
                      {DEBT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#7c7870' }}>モンスター名（任意）</label>
                    <input type="text" value={debt.customName} onChange={e => updateDebt(i, 'customName', e.target.value)} placeholder="例: 楽天カードの悪魔" className="input-glass" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#7c7870' }}>借金額（円）</label>
                      <input type="number" value={debt.amount} onChange={e => updateDebt(i, 'amount', e.target.value)} placeholder="500000" className="input-glass" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#7c7870' }}>年利（%）</label>
                      <input type="number" step="0.1" value={debt.interestRate} onChange={e => updateDebt(i, 'interestRate', e.target.value)} placeholder="15.0" className="input-glass" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#7c7870' }}>毎月返済額</label>
                      <input type="number" value={debt.minMonthly} onChange={e => updateDebt(i, 'minMonthly', e.target.value)} placeholder="15000" className="input-glass" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#7c7870' }}>支払日</label>
                      <input type="number" min="1" max="31" value={debt.paymentDay} onChange={e => updateDebt(i, 'paymentDay', e.target.value)} placeholder="27" className="input-glass" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button type="submit" disabled={isSubmitting} className="w-full btn-gold !text-base">
          {isSubmitting ? '準備中...' : '⚔️ 狩猟開始！'}
        </button>
      </form>

      {/* Reset */}
      <div className="glass-inner p-5">
        <p className="text-xs font-bold mb-1" style={{ color: '#c04040' }}>⚠ データリセット</p>
        <p className="text-[10px] mb-3 font-medium" style={{ color: '#4a4640' }}>全てのデータを削除して最初からやり直します。</p>
        <button type="button" onClick={handleReset} disabled={isResetting} className="w-full btn-danger">
          {isResetting ? 'リセット中...' : 'データをリセット'}
        </button>
      </div>
    </div>
  );
}
