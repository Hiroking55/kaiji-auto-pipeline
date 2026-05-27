'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getDashboardData } from '@/lib/client-actions';
import { formatCurrency, getQuestDifficulty, calculateReturnRate } from '@/lib/game-engine';
import { DashboardData, Boss, SavingsGoal, Investment } from '@/lib/types';

type Category = 'all' | 'boss' | 'companion' | 'expedition';

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '---';
  const d = new Date(dateStr);
  return d.toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' });
}

function DifficultyStars({ difficulty }: { difficulty: number }) {
  const full = Math.min(difficulty, 9);
  return (
    <span className="text-[10px] tracking-tight" style={{ color: '#b89450' }}>
      {'★'.repeat(full)}
      <span style={{ color: '#4a4640' }}>{'★'.repeat(Math.max(0, 9 - full))}</span>
    </span>
  );
}

function BossMonsterCard({ boss }: { boss: Boss }) {
  const unlocked = boss.is_defeated;
  const difficulty = getQuestDifficulty(boss);
  const totalDamage = boss.original_hp - boss.current_hp;

  return (
    <div
      className="glass-inner p-4 flex flex-col items-center text-center gap-2"
      style={{
        opacity: unlocked ? 1 : 0.3,
        filter: unlocked ? 'none' : 'grayscale(1)',
        borderColor: unlocked ? 'rgba(232,184,73,0.15)' : undefined,
        boxShadow: unlocked ? '0 0 12px rgba(232,184,73,0.06)' : undefined,
      }}
    >
      <span className="text-4xl">{unlocked ? boss.emoji : '🔒'}</span>
      <div>
        <p className="text-sm font-extrabold" style={{ color: unlocked ? '#e8e6e2' : '#4a4640' }}>
          {unlocked ? boss.name : '???'}
        </p>
        <p className="text-[10px] font-medium mt-0.5" style={{ color: '#7c7870' }}>
          {unlocked ? boss.subtitle : '討伐すると解放'}
        </p>
      </div>
      {unlocked ? (
        <div className="w-full space-y-1.5 mt-1">
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: '#7c7870' }}>討伐日</span>
            <span className="text-[10px] font-bold" style={{ color: '#e8e6e2' }}>{formatDate(boss.defeated_at)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: '#7c7870' }}>総ダメージ</span>
            <span className="text-[10px] font-bold" style={{ color: '#40a060' }}>{formatCurrency(totalDamage)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: '#7c7870' }}>難易度</span>
            <DifficultyStars difficulty={difficulty} />
          </div>
        </div>
      ) : (
        <div className="mt-1">
          <DifficultyStars difficulty={difficulty} />
        </div>
      )}
    </div>
  );
}

function CompanionMonsterCard({ goal }: { goal: SavingsGoal }) {
  const unlocked = goal.is_hatched;

  return (
    <div
      className="glass-inner p-4 flex flex-col items-center text-center gap-2"
      style={{
        opacity: unlocked ? 1 : 0.3,
        filter: unlocked ? 'none' : 'grayscale(1)',
        borderColor: unlocked ? 'rgba(64,160,96,0.2)' : undefined,
        boxShadow: unlocked ? '0 0 12px rgba(64,160,96,0.08)' : undefined,
      }}
    >
      <span className="text-4xl">{unlocked ? (goal.companion_emoji || goal.emoji) : '🥚'}</span>
      <div>
        <p className="text-sm font-extrabold" style={{ color: unlocked ? '#e8e6e2' : '#4a4640' }}>
          {unlocked ? goal.companion_name : goal.name}
        </p>
        <p className="text-[10px] font-medium mt-0.5" style={{ color: '#7c7870' }}>
          {unlocked ? '仲間になった!' : '目標達成で孵化'}
        </p>
      </div>
      {unlocked ? (
        <div className="w-full space-y-1.5 mt-1">
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: '#7c7870' }}>孵化日</span>
            <span className="text-[10px] font-bold" style={{ color: '#e8e6e2' }}>{formatDate(goal.hatched_at)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: '#7c7870' }}>貯金額</span>
            <span className="text-[10px] font-bold" style={{ color: '#40a060' }}>{formatCurrency(goal.current_amount)}</span>
          </div>
        </div>
      ) : (
        <div className="w-full mt-1">
          <div className="hp-track hp-track-sm">
            <div
              className="hp-fill"
              style={{
                width: `${Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100))}%`,
                background: 'linear-gradient(90deg, #7c7870, #40a060)',
              }}
            />
          </div>
          <p className="text-[9px] font-medium mt-1" style={{ color: '#4a4640' }}>
            {formatCurrency(goal.current_amount)} / {formatCurrency(goal.target_amount)}
          </p>
        </div>
      )}
    </div>
  );
}

function ExpeditionMonsterCard({ investment }: { investment: Investment }) {
  const returnRate = calculateReturnRate(investment.principal, investment.current_value);
  const isPositive = returnRate >= 0;

  return (
    <div
      className="glass-inner p-4 flex flex-col items-center text-center gap-2"
      style={{
        borderColor: 'rgba(72,120,176,0.15)',
        boxShadow: '0 0 12px rgba(72,120,176,0.06)',
      }}
    >
      <span className="text-4xl">{investment.emoji}</span>
      <div>
        <p className="text-sm font-extrabold" style={{ color: '#e8e6e2' }}>
          {investment.name}
        </p>
        <p className="text-[10px] font-medium mt-0.5" style={{ color: '#7c7870' }}>
          遠征中
        </p>
      </div>
      <div className="w-full space-y-1.5 mt-1">
        <div className="flex justify-between items-center">
          <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: '#7c7870' }}>現在価値</span>
          <span className="text-[10px] font-bold" style={{ color: '#e8e6e2' }}>{formatCurrency(investment.current_value)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: '#7c7870' }}>リターン</span>
          <span className="text-[10px] font-bold" style={{ color: isPositive ? '#40a060' : '#c04040' }}>
            {isPositive ? '+' : ''}{returnRate}%
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: '#7c7870' }}>開始日</span>
          <span className="text-[10px] font-bold" style={{ color: '#e8e6e2' }}>{formatDate(investment.started_at)}</span>
        </div>
      </div>
    </div>
  );
}

export default function BestiaryPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<Category>('all');

  useEffect(() => {
    const result = getDashboardData();
    if (!result) { router.push('/setup'); return; }
    setData(result);
    setLoading(false);
  }, [router]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-4xl animate-soft-pulse">📖</p>
      </div>
    );
  }

  const { bosses, savingsGoals, investments } = data;

  const defeatedBosses = bosses.filter(b => b.is_defeated).length;
  const hatchedGoals = savingsGoals.filter(g => g.is_hatched).length;
  const totalDiscovered = defeatedBosses + hatchedGoals + investments.length;
  const totalMonsters = bosses.length + savingsGoals.length + investments.length;

  const categories: { key: Category; label: string; count: string }[] = [
    { key: 'all', label: '全て', count: `${totalDiscovered}/${totalMonsters}` },
    { key: 'boss', label: '討伐', count: `${defeatedBosses}/${bosses.length}` },
    { key: 'companion', label: '仲間', count: `${hatchedGoals}/${savingsGoals.length}` },
    { key: 'expedition', label: '遠征', count: `${investments.length}` },
  ];

  const showBosses = category === 'all' || category === 'boss';
  const showCompanions = category === 'all' || category === 'companion';
  const showExpeditions = category === 'all' || category === 'expedition';

  return (
    <div className="pt-6 space-y-4">
      {/* Header */}
      <div className="glass-accent p-5 text-center">
        <p className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: '#7c7870' }}>MONSTER BESTIARY</p>
        <h1 className="text-2xl font-extrabold" style={{ color: '#e8e6e2' }}>
          モンスター図鑑
        </h1>
        <p className="text-sm font-bold mt-2 glow-gold" style={{ color: '#b89450' }}>
          {totalDiscovered} / {totalMonsters} 体 発見済み
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2">
        {categories.map(cat => (
          <button
            key={cat.key}
            onClick={() => setCategory(cat.key)}
            className={`flex-1 py-2.5 rounded-xl text-center transition-all duration-200 ${
              category === cat.key ? 'btn-primary' : 'btn-secondary'
            }`}
            style={category === cat.key ? {} : {}}
          >
            <p className="text-[11px] font-extrabold">{cat.label}</p>
            <p className="text-[9px] font-bold mt-0.5" style={{ opacity: 0.7 }}>{cat.count}</p>
          </button>
        ))}
      </div>

      {/* Boss Monsters */}
      {showBosses && bosses.length > 0 && (
        <div>
          <div className="section-bar">
            <h2 className="text-[15px] font-extrabold" style={{ color: '#e8e6e2' }}>討伐モンスター</h2>
            <span className="text-[11px] font-bold" style={{ color: '#7c7870' }}>
              {defeatedBosses}/{bosses.length}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[...bosses].sort((a, b) => {
              if (a.is_defeated && !b.is_defeated) return -1;
              if (!a.is_defeated && b.is_defeated) return 1;
              return a.sort_order - b.sort_order;
            }).map(boss => (
              <BossMonsterCard key={boss.id} boss={boss} />
            ))}
          </div>
        </div>
      )}

      {/* Companion Monsters */}
      {showCompanions && savingsGoals.length > 0 && (
        <div>
          <div className="section-bar">
            <h2 className="text-[15px] font-extrabold" style={{ color: '#e8e6e2' }}>仲間モンスター</h2>
            <span className="text-[11px] font-bold" style={{ color: '#7c7870' }}>
              {hatchedGoals}/{savingsGoals.length}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[...savingsGoals].sort((a, b) => {
              if (a.is_hatched && !b.is_hatched) return -1;
              if (!a.is_hatched && b.is_hatched) return 1;
              return 0;
            }).map(goal => (
              <CompanionMonsterCard key={goal.id} goal={goal} />
            ))}
          </div>
        </div>
      )}

      {/* Expedition Monsters */}
      {showExpeditions && investments.length > 0 && (
        <div>
          <div className="section-bar">
            <h2 className="text-[15px] font-extrabold" style={{ color: '#e8e6e2' }}>遠征モンスター</h2>
            <span className="text-[11px] font-bold" style={{ color: '#7c7870' }}>
              {investments.length}体
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {investments.map(inv => (
              <ExpeditionMonsterCard key={inv.id} investment={inv} />
            ))}
          </div>
        </div>
      )}

      {/* Empty States */}
      {totalMonsters === 0 && (
        <div className="glass-inner p-8 text-center">
          <p className="text-4xl mb-3">📖</p>
          <p className="text-sm font-bold" style={{ color: '#e8e6e2' }}>まだモンスターがいません</p>
          <p className="text-[11px] mt-1" style={{ color: '#7c7870' }}>
            借金を登録するか、貯金目標を作成しましょう
          </p>
        </div>
      )}

      {/* Settings Link */}
      <div className="text-center pb-4">
        <Link
          href="/setup"
          className="inline-block text-[11px] font-bold py-2 px-4 rounded-lg transition-all"
          style={{ color: '#7c7870', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          ⚙️ 設定
        </Link>
      </div>
    </div>
  );
}
