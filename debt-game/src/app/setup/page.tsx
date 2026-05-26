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
  const removeDebt = (index: number) => {
    if (debts.length <= 1) return;
    setDebts(debts.filter((_, i) => i !== index));
  };
  const updateDebt = (index: number, field: keyof DebtEntry, value: string) => {
    const updated = [...debts];
    updated[index] = { ...updated[index], [field]: value };
    setDebts(updated);
  };

  const buildDebts = () => debts
    .filter((d) => Number(d.amount) > 0)
    .map((d) => ({
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
      setupGame({
        playerName: playerName.trim() || 'ハンター',
        monthlyIncome: Number(monthlyIncome) || 0,
        fixedExpenses: Number(fixedExpenses) || 0,
        debts: buildDebts(),
      });
      router.push('/');
    } catch (error) {
      console.error('Setup failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    if (!confirm('全てのデータをリセットしますか？この操作は取り消せません。')) return;
    setIsResetting(true);
    try {
      resetAllData();
      setupGame({
        playerName: playerName.trim() || 'ハンター',
        monthlyIncome: Number(monthlyIncome) || 0,
        fixedExpenses: Number(fixedExpenses) || 0,
        debts: buildDebts(),
      });
      router.push('/');
    } catch (error) {
      console.error('Reset failed:', error);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="px-3 pt-4 pb-8">
      {/* Header */}
      <div className="mh-panel-accent p-4 text-center mb-4">
        <p className="text-3xl mb-2">⚔️</p>
        <h1 className="text-xl font-black" style={{ color: '#ffc830' }}>
          借金キラー
        </h1>
        <p className="text-xs mt-1" style={{ color: '#a09078' }}>
          借金討伐クエスト — 冒険の準備
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Player Info */}
        <div className="mh-panel p-4 mb-3">
          <div className="mh-section-header" style={{ marginBottom: '10px' }}>
            <h2>ハンター情報</h2>
          </div>
          <div className="mb-3">
            <label className="block text-[11px] font-bold mb-1" style={{ color: '#a09078' }}>ハンター名</label>
            <input type="text" value={playerName} onChange={(e) => setPlayerName(e.target.value)} placeholder="ハンター" className="mh-input" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold mb-1" style={{ color: '#a09078' }}>月収（手取り）</label>
              <input type="number" value={monthlyIncome} onChange={(e) => setMonthlyIncome(e.target.value)} placeholder="250000" className="mh-input" />
            </div>
            <div>
              <label className="block text-[11px] font-bold mb-1" style={{ color: '#a09078' }}>固定費（家賃等）</label>
              <input type="number" value={fixedExpenses} onChange={(e) => setFixedExpenses(e.target.value)} placeholder="80000" className="mh-input" />
            </div>
          </div>
        </div>

        {/* Quest (Debt) List */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="mh-section-header" style={{ marginBottom: 0 }}>
              <h2>討伐クエスト登録</h2>
            </div>
            <button type="button" onClick={addDebt} className="mh-btn text-[10px] !py-1.5 !px-3">
              + 追加
            </button>
          </div>

          <div className="space-y-3">
            {debts.map((debt, index) => (
              <div key={index} className="mh-panel p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-black" style={{ color: '#ffc830' }}>
                    クエスト #{index + 1}
                  </span>
                  {debts.length > 1 && (
                    <button type="button" onClick={() => removeDebt(index)} className="mh-tag mh-tag-danger">
                      削除
                    </button>
                  )}
                </div>

                <div className="mb-2.5">
                  <label className="block text-[11px] font-bold mb-1" style={{ color: '#a09078' }}>モンスター種別</label>
                  <select value={debt.debtType} onChange={(e) => updateDebt(index, 'debtType', e.target.value)} className="mh-select">
                    {DEBT_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-2.5">
                  <label className="block text-[11px] font-bold mb-1" style={{ color: '#a09078' }}>モンスター名（任意）</label>
                  <input type="text" value={debt.customName} onChange={(e) => updateDebt(index, 'customName', e.target.value)} placeholder="例: 楽天カードの悪魔" className="mh-input" />
                </div>

                <div className="grid grid-cols-2 gap-2 mb-2.5">
                  <div>
                    <label className="block text-[11px] font-bold mb-1" style={{ color: '#a09078' }}>借金額（円）</label>
                    <input type="number" value={debt.amount} onChange={(e) => updateDebt(index, 'amount', e.target.value)} placeholder="500000" className="mh-input" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold mb-1" style={{ color: '#a09078' }}>年利（%）</label>
                    <input type="number" step="0.1" value={debt.interestRate} onChange={(e) => updateDebt(index, 'interestRate', e.target.value)} placeholder="15.0" className="mh-input" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold mb-1" style={{ color: '#a09078' }}>毎月返済額</label>
                    <input type="number" value={debt.minMonthly} onChange={(e) => updateDebt(index, 'minMonthly', e.target.value)} placeholder="15000" className="mh-input" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold mb-1" style={{ color: '#a09078' }}>支払日</label>
                    <input type="number" min="1" max="31" value={debt.paymentDay} onChange={(e) => updateDebt(index, 'paymentDay', e.target.value)} placeholder="27" className="mh-input" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button type="submit" disabled={isSubmitting} className="w-full mh-btn mh-btn-gold text-base disabled:opacity-40">
          {isSubmitting ? '準備中...' : '⚔️ 狩猟開始！'}
        </button>
      </form>

      {/* Reset */}
      <div className="mt-6 mh-panel-dark p-4">
        <p className="text-xs font-bold mb-1" style={{ color: '#e84040' }}>⚠ データリセット</p>
        <p className="text-[10px] mb-2" style={{ color: '#706050' }}>
          全てのデータを削除して最初からやり直します。
        </p>
        <button
          type="button"
          onClick={handleReset}
          disabled={isResetting}
          className="w-full mh-btn mh-btn-danger text-xs disabled:opacity-40"
        >
          {isResetting ? 'リセット中...' : 'データをリセット'}
        </button>
      </div>
    </div>
  );
}
