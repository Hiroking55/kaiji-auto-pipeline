'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getDashboardData, addInvestment, updateInvestmentValue } from '@/lib/client-actions';
import { formatCurrency, calculateReturnRate, simulateCompoundGrowth } from '@/lib/game-engine';
import { DashboardData, Investment } from '@/lib/types';

const TYPE_LABELS: Record<Investment['type'], string> = {
  stock: '個別株',
  fund: '投資信託',
  crypto: '暗号資産',
  other: 'その他',
};

const TYPE_EMOJIS: Record<Investment['type'], string> = {
  stock: '📈',
  fund: '🏛️',
  crypto: '⛓️',
  other: '🗺️',
};

/* ── Simple SVG line chart ── */
function GrowthChart({ dataPoints }: { dataPoints: number[] }) {
  if (dataPoints.length < 2) return null;

  const W = 600;
  const H = 200;
  const PAD_X = 60;
  const PAD_Y = 24;
  const PAD_B = 32;

  const minV = Math.min(...dataPoints);
  const maxV = Math.max(...dataPoints);
  const range = maxV - minV || 1;

  const chartW = W - PAD_X * 2;
  const chartH = H - PAD_Y - PAD_B;

  const points = dataPoints.map((v, i) => {
    const x = PAD_X + (i / (dataPoints.length - 1)) * chartW;
    const y = PAD_Y + chartH - ((v - minV) / range) * chartH;
    return `${x},${y}`;
  });

  // Y-axis labels (5 ticks)
  const yTicks = Array.from({ length: 5 }, (_, i) => {
    const val = minV + (range * i) / 4;
    const y = PAD_Y + chartH - (i / 4) * chartH;
    return { val, y };
  });

  // X-axis labels (show every N months)
  const totalMonths = dataPoints.length - 1;
  const step = totalMonths <= 12 ? 1 : totalMonths <= 24 ? 3 : totalMonths <= 60 ? 6 : 12;
  const xTicks: { month: number; x: number }[] = [];
  for (let m = 0; m <= totalMonths; m += step) {
    xTicks.push({ month: m, x: PAD_X + (m / (dataPoints.length - 1)) * chartW });
  }
  // Always include the last month
  if (xTicks.length === 0 || xTicks[xTicks.length - 1].month !== totalMonths) {
    xTicks.push({ month: totalMonths, x: PAD_X + chartW });
  }

  const formatShort = (n: number) => {
    if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}億`;
    if (n >= 10_000) return `${Math.round(n / 10_000)}万`;
    return n.toLocaleString();
  };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 200 }}>
      {/* Grid lines */}
      {yTicks.map((t, i) => (
        <line key={i} x1={PAD_X} y1={t.y} x2={W - PAD_X} y2={t.y} stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
      ))}
      {/* Y-axis labels */}
      {yTicks.map((t, i) => (
        <text key={`yl-${i}`} x={PAD_X - 6} y={t.y + 4} textAnchor="end" fill="#6b7280" fontSize={10} fontWeight={600}>
          {formatShort(t.val)}
        </text>
      ))}
      {/* X-axis labels */}
      {xTicks.map((t, i) => (
        <text key={`xl-${i}`} x={t.x} y={H - 8} textAnchor="middle" fill="#6b7280" fontSize={10} fontWeight={600}>
          {t.month}m
        </text>
      ))}
      {/* Gradient fill under the line */}
      <defs>
        <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d4a020" stopOpacity={0.2} />
          <stop offset="100%" stopColor="#d4a020" stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon
        points={`${PAD_X},${PAD_Y + chartH} ${points.join(' ')} ${W - PAD_X},${PAD_Y + chartH}`}
        fill="url(#chartFill)"
      />
      {/* Line */}
      <polyline points={points.join(' ')} fill="none" stroke="#d4a020" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      {/* End dot */}
      <circle cx={Number(points[points.length - 1].split(',')[0])} cy={Number(points[points.length - 1].split(',')[1])} r={4} fill="#d4a020" />
    </svg>
  );
}

export default function ExpeditionPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  // Update form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [updateValue, setUpdateValue] = useState('');
  const [updateResult, setUpdateResult] = useState<{ id: string; xp: number; rate: number } | null>(null);

  // Simulator state
  const [simPrincipal, setSimPrincipal] = useState('100000');
  const [simRate, setSimRate] = useState('5');
  const [simMonths, setSimMonths] = useState('12');

  // Add form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [addName, setAddName] = useState('');
  const [addType, setAddType] = useState<Investment['type']>('fund');
  const [addPrincipal, setAddPrincipal] = useState('');
  const [addCurrentValue, setAddCurrentValue] = useState('');
  const [addRate, setAddRate] = useState('');
  const [addStartDate, setAddStartDate] = useState(new Date().toISOString().split('T')[0]);

  function reload() {
    const result = getDashboardData();
    if (!result) { router.push('/setup'); return; }
    setData(result);
    setLoading(false);
  }

  useEffect(() => { reload(); }, [router]);

  // Compound growth simulation
  const simData = useMemo(() => {
    const p = Number(simPrincipal) || 0;
    const r = Number(simRate) || 0;
    const m = Math.min(360, Math.max(1, Math.floor(Number(simMonths) || 12)));
    if (p <= 0) return null;
    const points = simulateCompoundGrowth(p, r, m);
    return { points, finalValue: points[points.length - 1] };
  }, [simPrincipal, simRate, simMonths]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-4xl animate-sparkle">🗺️</p>
      </div>
    );
  }

  const { investments, totalInvestmentValue, totalInvestmentReturn } = data;
  const totalPrincipal = investments.reduce((s, i) => s + i.principal, 0);
  const totalReturnRate = totalPrincipal > 0 ? calculateReturnRate(totalPrincipal, totalInvestmentValue) : 0;

  function handleUpdateValue(inv: Investment) {
    const val = Number(updateValue);
    if (!val || val < 0) return;
    const result = updateInvestmentValue(inv.id, val);
    setUpdateResult({ id: inv.id, xp: result.xpEarned, rate: result.returnRate });
    setEditingId(null);
    setUpdateValue('');
    reload();
    setTimeout(() => setUpdateResult(null), 3000);
  }

  function handleAddInvestment(e: React.FormEvent) {
    e.preventDefault();
    const principal = Number(addPrincipal);
    const currentValue = Number(addCurrentValue) || principal;
    const rate = Number(addRate) || 0;
    if (!addName.trim() || principal <= 0) return;

    addInvestment({
      name: addName.trim(),
      type: addType,
      principal,
      currentValue,
      annualRate: rate,
      startedAt: addStartDate,
    });

    setAddName('');
    setAddPrincipal('');
    setAddCurrentValue('');
    setAddRate('');
    setAddStartDate(new Date().toISOString().split('T')[0]);
    setShowAddForm(false);
    reload();
  }

  return (
    <div className="pt-6 space-y-4">
      {/* Header */}
      <div className="card-accent p-5 text-center">
        <p className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: '#6b7280' }}>EXPEDITION QUEST</p>
        <h1 className="text-2xl font-extrabold" style={{ color: '#d4a020' }}>遠征クエスト</h1>
        <p className="text-xs font-bold mt-1" style={{ color: '#6b7280' }}>投資で自動狩り</p>
      </div>

      {/* Summary Panel */}
      <div>
        <div className="section-label">
          <h2 className="text-[15px] font-extrabold" style={{ color: '#1a1a2e' }}>遠征サマリー</h2>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="card-inner p-3.5 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#6b7280' }}>総資産</p>
            <p className="text-base font-extrabold" style={{ color: '#d4a020' }}>{formatCurrency(totalInvestmentValue)}</p>
          </div>
          <div className="card-inner p-3.5 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#6b7280' }}>総損益</p>
            <p className={`text-base font-extrabold ${totalInvestmentReturn >= 0 ? 'glow-green' : 'glow-red'}`} style={{ color: totalInvestmentReturn >= 0 ? '#10b981' : '#ef4444' }}>
              {totalInvestmentReturn >= 0 ? '+' : ''}{formatCurrency(totalInvestmentReturn)}
            </p>
          </div>
          <div className="card-inner p-3.5 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#6b7280' }}>利回り</p>
            <p className={`text-base font-extrabold ${totalReturnRate >= 0 ? 'glow-green' : 'glow-red'}`} style={{ color: totalReturnRate >= 0 ? '#10b981' : '#ef4444' }}>
              {totalReturnRate >= 0 ? '+' : ''}{totalReturnRate}%
            </p>
          </div>
        </div>
      </div>

      {/* Investment List */}
      <div>
        <div className="section-label">
          <h2 className="text-[15px] font-extrabold" style={{ color: '#1a1a2e' }}>遠征モンスター</h2>
          <span className="tag tag-active">{investments.length}体</span>
        </div>

        {investments.length === 0 && (
          <div className="card-inner p-6 text-center">
            <p className="text-3xl mb-2">🗺️</p>
            <p className="text-sm font-bold" style={{ color: '#6b7280' }}>遠征先がありません</p>
            <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>モンスターを派遣して自動で狩りを始めよう</p>
          </div>
        )}

        <div className="space-y-3">
          {investments.map((inv) => {
            const returnAmt = inv.current_value - inv.principal;
            const returnRate = calculateReturnRate(inv.principal, inv.current_value);
            const isPositive = returnRate >= 0;
            const isEditing = editingId === inv.id;
            const justUpdated = updateResult?.id === inv.id;

            return (
              <div key={inv.id} className="card p-4 space-y-3">
                <div className="flex items-start gap-3">
                  {/* Emoji */}
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                    style={{ background: 'rgba(184,148,80,0.08)', border: '1px solid rgba(184,148,80,0.12)' }}
                  >
                    {TYPE_EMOJIS[inv.type]}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-extrabold truncate" style={{ color: '#1a1a2e' }}>{inv.name}</h3>
                      <span className="tag tag-active shrink-0">{TYPE_LABELS[inv.type]}</span>
                    </div>
                    <div className="flex items-baseline gap-3 mt-1.5">
                      <div>
                        <p className="text-[10px] font-bold" style={{ color: '#9ca3af' }}>元本</p>
                        <p className="text-xs font-bold" style={{ color: '#6b7280' }}>{formatCurrency(inv.principal)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold" style={{ color: '#9ca3af' }}>現在</p>
                        <p className="text-sm font-extrabold" style={{ color: '#1a1a2e' }}>{formatCurrency(inv.current_value)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Return badge */}
                  <div className="text-right shrink-0">
                    <p className={`text-lg font-extrabold ${isPositive ? 'glow-green' : 'glow-red'}`} style={{ color: isPositive ? '#10b981' : '#ef4444' }}>
                      {isPositive ? '+' : ''}{returnRate}%
                    </p>
                    <p className="text-[10px] font-bold" style={{ color: isPositive ? '#10b981' : '#ef4444' }}>
                      {isPositive ? '+' : ''}{formatCurrency(returnAmt)}
                    </p>
                  </div>
                </div>

                {/* Update value inline form */}
                {isEditing ? (
                  <div className="card-inner p-3 space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#6b7280' }}>現在の評価額を入力</p>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        className="input-clean flex-1"
                        placeholder="例: 110000"
                        value={updateValue}
                        onChange={(e) => setUpdateValue(e.target.value)}
                        autoFocus
                      />
                      <button className="btn-gold px-4 py-2 text-xs" onClick={() => handleUpdateValue(inv)}>更新</button>
                      <button className="btn-outline px-3 py-2 text-xs" onClick={() => { setEditingId(null); setUpdateValue(''); }}>戻る</button>
                    </div>
                  </div>
                ) : (
                  <button
                    className="btn-outline w-full py-2 text-xs"
                    onClick={() => { setEditingId(inv.id); setUpdateValue(String(inv.current_value)); }}
                  >
                    評価額を更新
                  </button>
                )}

                {/* XP notification */}
                {justUpdated && (
                  <div className="card-inner p-2 text-center animate-slide-up">
                    <p className="text-xs font-bold" style={{ color: '#d4a020' }}>+{updateResult.xp} EXP 獲得!</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Compound Interest Simulator */}
      <div>
        <div className="section-label">
          <h2 className="text-[15px] font-extrabold" style={{ color: '#1a1a2e' }}>複利シミュレーター</h2>
        </div>
        <div className="card p-4 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#6b7280' }}>元本 (円)</label>
              <input
                type="number"
                className="input-clean"
                value={simPrincipal}
                onChange={(e) => setSimPrincipal(e.target.value)}
                placeholder="100000"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#6b7280' }}>年利 (%)</label>
              <input
                type="number"
                className="input-clean"
                value={simRate}
                onChange={(e) => setSimRate(e.target.value)}
                placeholder="5"
                step="0.1"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#6b7280' }}>期間 (月)</label>
              <input
                type="number"
                className="input-clean"
                value={simMonths}
                onChange={(e) => setSimMonths(e.target.value)}
                placeholder="12"
              />
            </div>
          </div>

          {simData && (
            <>
              <div className="card-inner p-2 rounded-xl overflow-hidden">
                <GrowthChart dataPoints={simData.points} />
              </div>
              <div className="flex items-center justify-between px-1">
                <div>
                  <p className="text-[10px] font-bold" style={{ color: '#9ca3af' }}>元本</p>
                  <p className="text-sm font-bold" style={{ color: '#6b7280' }}>{formatCurrency(Number(simPrincipal) || 0)}</p>
                </div>
                <div className="text-lg" style={{ color: '#9ca3af' }}>→</div>
                <div className="text-right">
                  <p className="text-[10px] font-bold" style={{ color: '#9ca3af' }}>{simMonths}ヶ月後</p>
                  <p className="text-lg font-extrabold" style={{ color: '#d4a020' }}>{formatCurrency(simData.finalValue)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold" style={{ color: '#9ca3af' }}>増加額</p>
                  <p className="text-sm font-extrabold" style={{ color: '#10b981' }}>
                    +{formatCurrency(simData.finalValue - (Number(simPrincipal) || 0))}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Add Investment Form */}
      <div>
        <div className="section-label">
          <h2 className="text-[15px] font-extrabold" style={{ color: '#1a1a2e' }}>新しい遠征</h2>
        </div>

        {!showAddForm ? (
          <button className="btn-main w-full" onClick={() => setShowAddForm(true)}>
            + モンスターを遠征に派遣する
          </button>
        ) : (
          <form className="card p-4 space-y-3" onSubmit={handleAddInvestment}>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#6b7280' }}>投資名</label>
              <input
                type="text"
                className="input-clean"
                placeholder="例: S&P500インデックス"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#6b7280' }}>種類</label>
              <select className="select-clean" value={addType} onChange={(e) => setAddType(e.target.value as Investment['type'])}>
                <option value="stock">📈 個別株</option>
                <option value="fund">🏛️ 投資信託</option>
                <option value="crypto">⛓️ 暗号資産</option>
                <option value="other">🗺️ その他</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#6b7280' }}>元本 (円)</label>
                <input
                  type="number"
                  className="input-clean"
                  placeholder="100000"
                  value={addPrincipal}
                  onChange={(e) => setAddPrincipal(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#6b7280' }}>現在の評価額 (円)</label>
                <input
                  type="number"
                  className="input-clean"
                  placeholder="元本と同額"
                  value={addCurrentValue}
                  onChange={(e) => setAddCurrentValue(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#6b7280' }}>想定年利 (%)</label>
                <input
                  type="number"
                  className="input-clean"
                  placeholder="5"
                  step="0.1"
                  value={addRate}
                  onChange={(e) => setAddRate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#6b7280' }}>開始日</label>
                <input
                  type="date"
                  className="input-clean"
                  value={addStartDate}
                  onChange={(e) => setAddStartDate(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button type="submit" className="btn-gold flex-1">遠征開始</button>
              <button type="button" className="btn-outline flex-1" onClick={() => setShowAddForm(false)}>キャンセル</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
