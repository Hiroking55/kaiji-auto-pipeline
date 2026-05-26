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
  { value: 'consumer_finance', label: 'サラきん（しょうひしゃきんゆう）' },
  { value: 'credit_card', label: 'クレジットカード（リボばらい）' },
  { value: 'loan', label: 'ローン（ぎんこうとう）' },
  { value: 'student_loan', label: 'しょうがくきん' },
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
        playerName: playerName.trim() || 'ゆうしゃ',
        monthlyIncome: Number(monthlyIncome) || 0,
        fixedExpenses: Number(fixedExpenses) || 0,
        debts: debts
          .filter((d) => Number(d.amount) > 0)
          .map((d) => ({
            debtType: d.debtType,
            customName: d.customName.trim() || undefined,
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
    if (!confirm('ぜんてのデータをリセットしますか？このそうさはとりけせません。')) return;
    setIsResetting(true);
    try {
      resetAllData();
      setupGame({
        playerName: playerName.trim() || 'ゆうしゃ',
        monthlyIncome: Number(monthlyIncome) || 0,
        fixedExpenses: Number(fixedExpenses) || 0,
        debts: debts
          .filter((d) => Number(d.amount) > 0)
          .map((d) => ({
            debtType: d.debtType,
            customName: d.customName.trim() || undefined,
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

  return (
    <div className="px-3 pt-5 pb-8">
      {/* Header */}
      <div className="pixel-window text-center mb-5">
        <p className="text-4xl mb-2">⚔️</p>
        <h1 className="text-xl font-bold text-glow-gold" style={{ color: '#f8d830' }}>
          しゃっきんキラー
        </h1>
        <p className="text-xs mt-1" style={{ color: '#9090c0' }}>
          しゃっきんへんさいRPG - ぼうけんのじゅんび
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Player Info */}
        <div className="pixel-window mb-4">
          <div className="flex items-center gap-2 mb-3">
            <span style={{ color: '#f8d830' }}>▶</span>
            <h2 className="text-sm font-bold" style={{ color: '#ffffff' }}>
              プレイヤーじょうほう
            </h2>
          </div>

          <div className="mb-3">
            <label className="block text-[10px] font-bold mb-1" style={{ color: '#9090c0' }}>
              なまえ
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="ゆうしゃ"
              className="w-full pixel-input text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold mb-1" style={{ color: '#9090c0' }}>
                げっしゅう（てどり）
              </label>
              <input
                type="number"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(e.target.value)}
                placeholder="250000"
                className="w-full pixel-input text-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold mb-1" style={{ color: '#9090c0' }}>
                こていひ（やちんとう）
              </label>
              <input
                type="number"
                value={fixedExpenses}
                onChange={(e) => setFixedExpenses(e.target.value)}
                placeholder="80000"
                className="w-full pixel-input text-sm"
              />
            </div>
          </div>
        </div>

        {/* Debt List */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span style={{ color: '#f8d830' }}>▶</span>
              <h2 className="text-sm font-bold" style={{ color: '#ffffff' }}>
                しゃっきん（ボス）いちらん
              </h2>
            </div>
            <button
              type="button"
              onClick={addDebt}
              className="pixel-btn text-[10px] !py-1 !px-2"
              style={{ outlineWidth: '2px', borderWidth: '2px' }}
            >
              + ついか
            </button>
          </div>

          <div className="space-y-3">
            {debts.map((debt, index) => (
              <div key={index} className="pixel-window">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold" style={{ color: '#f8d830' }}>
                    ★ ボス #{index + 1}
                  </span>
                  {debts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeDebt(index)}
                      className="text-[10px] px-2 py-0.5 font-bold"
                      style={{
                        backgroundColor: '#f8303020',
                        color: '#f83030',
                        border: '1px solid #f83030',
                      }}
                    >
                      さくじょ
                    </button>
                  )}
                </div>

                <div className="mb-2">
                  <label className="block text-[10px] font-bold mb-1" style={{ color: '#9090c0' }}>
                    しゃっきんのしゅるい
                  </label>
                  <select
                    value={debt.debtType}
                    onChange={(e) => updateDebt(index, 'debtType', e.target.value)}
                    className="w-full pixel-select text-sm"
                  >
                    {DEBT_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-2">
                  <label className="block text-[10px] font-bold mb-1" style={{ color: '#9090c0' }}>
                    ボスめい（にんい）
                  </label>
                  <input
                    type="text"
                    value={debt.customName}
                    onChange={(e) => updateDebt(index, 'customName', e.target.value)}
                    placeholder="れい: らくてんカードのあくま"
                    className="w-full pixel-input text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div>
                    <label className="block text-[10px] font-bold mb-1" style={{ color: '#9090c0' }}>
                      しゃっきんがく（えん）
                    </label>
                    <input
                      type="number"
                      value={debt.amount}
                      onChange={(e) => updateDebt(index, 'amount', e.target.value)}
                      placeholder="500000"
                      className="w-full pixel-input text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold mb-1" style={{ color: '#9090c0' }}>
                      ねんり（%）
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={debt.interestRate}
                      onChange={(e) => updateDebt(index, 'interestRate', e.target.value)}
                      placeholder="15.0"
                      className="w-full pixel-input text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold mb-1" style={{ color: '#9090c0' }}>
                      まいつきへんさい（えん）
                    </label>
                    <input
                      type="number"
                      value={debt.minMonthly}
                      onChange={(e) => updateDebt(index, 'minMonthly', e.target.value)}
                      placeholder="15000"
                      className="w-full pixel-input text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold mb-1" style={{ color: '#9090c0' }}>
                      しはらいび
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={debt.paymentDay}
                      onChange={(e) => updateDebt(index, 'paymentDay', e.target.value)}
                      placeholder="27"
                      className="w-full pixel-input text-sm"
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
          className="w-full pixel-btn pixel-btn-gold text-base disabled:opacity-40"
        >
          {isSubmitting ? 'じゅんびちゅう...' : '▶ ぼうけんをはじめる！'}
        </button>
      </form>

      {/* Reset Section */}
      <div className="mt-6 pixel-window-dark">
        <h3 className="text-xs font-bold mb-2" style={{ color: '#f83030' }}>
          ⚠ データリセット
        </h3>
        <p className="text-[10px] mb-2" style={{ color: '#9090c0' }}>
          ぜんてのデータをさくじょして、さいしょからやりなおします。
        </p>
        <button
          type="button"
          onClick={handleReset}
          disabled={isResetting}
          className="w-full py-2 text-xs font-bold disabled:opacity-40"
          style={{
            backgroundColor: '#f8303020',
            color: '#f83030',
            border: '2px solid #f83030',
          }}
        >
          {isResetting ? 'リセットちゅう...' : 'データをリセット'}
        </button>
      </div>
    </div>
  );
}
