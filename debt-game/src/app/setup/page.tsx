'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { setupGame, resetAllData } from '@/lib/client-actions';

interface DebtEntry {
  debtType: string;
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

  const addDebt = () => {
    setDebts([...debts, { ...EMPTY_DEBT }]);
  };

  const removeDebt = (index: number) => {
    if (debts.length <= 1) return;
    setDebts(debts.filter((_, i) => i !== index));
  };

  const updateDebt = (index: number, field: keyof DebtEntry, value: string) => {
    const updated = [...debts];
    updated[index] = { ...updated[index], [field]: value };
    setDebts(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      setupGame({
        playerName: playerName.trim() || '勇者',
        monthlyIncome: Number(monthlyIncome) || 0,
        fixedExpenses: Number(fixedExpenses) || 0,
        debts: debts
          .filter((d) => Number(d.amount) > 0)
          .map((d) => ({
            debtType: d.debtType,
            amount: Number(d.amount),
            interestRate: Number(d.interestRate),
            minMonthly: Number(d.minMonthly),
            paymentDay: Number(d.paymentDay) || 27,
          })),
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
        playerName: playerName.trim() || '勇者',
        monthlyIncome: Number(monthlyIncome) || 0,
        fixedExpenses: Number(fixedExpenses) || 0,
        debts: debts
          .filter((d) => Number(d.amount) > 0)
          .map((d) => ({
            debtType: d.debtType,
            amount: Number(d.amount),
            interestRate: Number(d.interestRate),
            minMonthly: Number(d.minMonthly),
            paymentDay: Number(d.paymentDay) || 27,
          })),
      });
      router.push('/');
    } catch (error) {
      console.error('Reset failed:', error);
    } finally {
      setIsResetting(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    backgroundColor: '#1a1a2e',
    color: '#e0e0e0',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  };

  const labelStyle: React.CSSProperties = {
    color: '#8888aa',
  };

  return (
    <div className="px-4 pt-6 pb-8">
      {/* Header */}
      <div className="text-center mb-8">
        <p className="text-5xl mb-3">&#x2694;&#xFE0F;</p>
        <h1 className="text-2xl font-bold" style={{ color: '#ffd700' }}>
          借金キラー
        </h1>
        <p className="text-sm mt-1" style={{ color: '#8888aa' }}>
          借金返済RPG - 冒険の準備をしよう
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Player Info */}
        <div
          className="rounded-xl p-5 border border-white/10 mb-5"
          style={{ backgroundColor: '#16213e' }}
        >
          <h2 className="text-base font-bold mb-4" style={{ color: '#e0e0e0' }}>
            プレイヤー情報
          </h2>

          <div className="mb-4">
            <label className="block text-xs font-medium mb-1" style={labelStyle}>
              名前
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="勇者"
              className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none focus:border-blue-500"
              style={inputStyle}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={labelStyle}>
                月収（手取り）
              </label>
              <input
                type="number"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(e.target.value)}
                placeholder="250000"
                className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none focus:border-blue-500"
                style={inputStyle}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={labelStyle}>
                固定費（家賃等）
              </label>
              <input
                type="number"
                value={fixedExpenses}
                onChange={(e) => setFixedExpenses(e.target.value)}
                placeholder="80000"
                className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none focus:border-blue-500"
                style={inputStyle}
              />
            </div>
          </div>
        </div>

        {/* Debt List */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold" style={{ color: '#e0e0e0' }}>
              借金（ボス）一覧
            </h2>
            <button
              type="button"
              onClick={addDebt}
              className="text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
              style={{ backgroundColor: '#4488ff30', color: '#4488ff' }}
            >
              + ボス追加
            </button>
          </div>

          <div className="space-y-4">
            {debts.map((debt, index) => (
              <div
                key={index}
                className="rounded-xl p-4 border border-white/10"
                style={{ backgroundColor: '#16213e' }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold" style={{ color: '#ffd700' }}>
                    ボス #{index + 1}
                  </span>
                  {debts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeDebt(index)}
                      className="text-xs px-2 py-1 rounded transition-colors"
                      style={{ backgroundColor: '#ff444430', color: '#ff4444' }}
                    >
                      削除
                    </button>
                  )}
                </div>

                <div className="mb-3">
                  <label className="block text-xs font-medium mb-1" style={labelStyle}>
                    借金の種類
                  </label>
                  <select
                    value={debt.debtType}
                    onChange={(e) => updateDebt(index, 'debtType', e.target.value)}
                    className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none focus:border-blue-500"
                    style={inputStyle}
                  >
                    {DEBT_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-medium mb-1" style={labelStyle}>
                      借金額（円）
                    </label>
                    <input
                      type="number"
                      value={debt.amount}
                      onChange={(e) => updateDebt(index, 'amount', e.target.value)}
                      placeholder="500000"
                      className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none focus:border-blue-500"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={labelStyle}>
                      年利（%）
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={debt.interestRate}
                      onChange={(e) => updateDebt(index, 'interestRate', e.target.value)}
                      placeholder="15.0"
                      className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none focus:border-blue-500"
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1" style={labelStyle}>
                      毎月返済額（円）
                    </label>
                    <input
                      type="number"
                      value={debt.minMonthly}
                      onChange={(e) => updateDebt(index, 'minMonthly', e.target.value)}
                      placeholder="15000"
                      className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none focus:border-blue-500"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={labelStyle}>
                      支払日
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={debt.paymentDay}
                      onChange={(e) => updateDebt(index, 'paymentDay', e.target.value)}
                      placeholder="27"
                      className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none focus:border-blue-500"
                      style={inputStyle}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 rounded-xl font-bold text-lg transition-all active:scale-[0.97] disabled:opacity-50"
          style={{
            backgroundColor: '#ffd700',
            color: '#0f0f23',
            boxShadow: '0 0 20px rgba(255, 215, 0, 0.3)',
          }}
        >
          {isSubmitting ? '準備中...' : '冒険を始める！'}
        </button>
      </form>

      {/* Reset Section */}
      <div
        className="mt-8 rounded-xl p-5 border border-white/5"
        style={{ backgroundColor: '#1a1a2e' }}
      >
        <h3 className="text-sm font-bold mb-2" style={{ color: '#ff4444' }}>
          データリセット
        </h3>
        <p className="text-xs mb-3" style={{ color: '#8888aa' }}>
          全てのデータを削除して、最初からやり直します。上のフォームに新しい情報を入力してからリセットしてください。
        </p>
        <button
          type="button"
          onClick={handleReset}
          disabled={isResetting}
          className="w-full py-2.5 rounded-lg text-sm font-bold transition-all active:scale-[0.97] disabled:opacity-50"
          style={{
            backgroundColor: '#ff444430',
            color: '#ff4444',
            border: '1px solid rgba(255, 68, 68, 0.3)',
          }}
        >
          {isResetting ? 'リセット中...' : 'データをリセットして再設定'}
        </button>
      </div>
    </div>
  );
}
