import { Boss, Player } from './types';

const TITLES: Record<number, string> = {
  1: '借金奴隷',
  5: '見習い戦士',
  10: '借金ハンター',
  20: '節約マスター',
  30: '財務の達人',
  50: '完済王',
};

export function getTitle(level: number): string {
  const thresholds = Object.keys(TITLES).map(Number).sort((a, b) => b - a);
  for (const threshold of thresholds) {
    if (level >= threshold) return TITLES[threshold];
  }
  return '借金奴隷';
}

export function xpForLevel(level: number): number {
  return level * 100;
}

export function totalXpForLevel(level: number): number {
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += xpForLevel(i);
  }
  return total;
}

export function calculateLevel(totalXp: number): { level: number; currentLevelXp: number; nextLevelXp: number } {
  let level = 1;
  let remaining = totalXp;
  while (remaining >= xpForLevel(level)) {
    remaining -= xpForLevel(level);
    level++;
  }
  return {
    level,
    currentLevelXp: remaining,
    nextLevelXp: xpForLevel(level),
  };
}

export function calculatePaymentXp(amount: number, type: 'normal' | 'extra', bossDefeated: boolean): number {
  let xp = 0;
  if (type === 'normal') {
    xp = 100;
  } else {
    xp = Math.max(200, Math.floor((amount / 10000) * 200));
  }
  if (bossDefeated) {
    xp += 1000;
  }
  return xp;
}

export function calculateDailyInterest(boss: Boss): number {
  if (boss.is_defeated || boss.interest_rate <= 0) return 0;
  return Math.ceil(boss.current_hp * (boss.interest_rate / 100 / 365));
}

export function calculateDailyBudget(
  monthlyIncome: number,
  fixedExpenses: number,
  monthlyDebtPayments: number,
  monthlySpent: number,
  dayOfMonth: number,
  daysInMonth: number
): number {
  const disposable = monthlyIncome - fixedExpenses - monthlyDebtPayments;
  const remaining = disposable - monthlySpent;
  const daysLeft = daysInMonth - dayOfMonth + 1;
  return Math.max(0, Math.floor(remaining / daysLeft));
}

export function calculateMonthlyBudget(
  monthlyIncome: number,
  fixedExpenses: number,
  monthlyDebtPayments: number,
  monthlySpent: number
): number {
  return Math.max(0, monthlyIncome - fixedExpenses - monthlyDebtPayments - monthlySpent);
}

export function estimatePayoffDate(bosses: Boss[]): string | null {
  const activeBosses = bosses.filter(b => !b.is_defeated);
  if (activeBosses.length === 0) return null;

  const totalMinMonthly = activeBosses.reduce((sum, b) => sum + b.min_monthly, 0);
  if (totalMinMonthly === 0) return null;

  let totalDebt = activeBosses.reduce((sum, b) => sum + b.current_hp, 0);
  const avgMonthlyInterest = activeBosses.reduce((sum, b) => {
    return sum + (b.current_hp * b.interest_rate / 100 / 12);
  }, 0);

  let months = 0;
  const maxMonths = 360;
  let remaining = totalDebt;

  while (remaining > 0 && months < maxMonths) {
    const interest = remaining * (avgMonthlyInterest / totalDebt || 0);
    remaining = remaining + interest - totalMinMonthly;
    months++;
  }

  if (months >= maxMonths) return null;

  const now = new Date();
  const payoff = new Date(now.getFullYear(), now.getMonth() + months, 1);
  return payoff.toISOString().split('T')[0];
}

export function formatCurrency(amount: number): string {
  return `¥${amount.toLocaleString()}`;
}

export function getHpPercentage(boss: Boss): number {
  if (boss.original_hp === 0) return 0;
  return Math.max(0, Math.min(100, Math.round((boss.current_hp / boss.original_hp) * 100)));
}

export function getHpColor(percentage: number): string {
  if (percentage > 60) return '#ff4444';
  if (percentage > 30) return '#ffaa00';
  return '#44ff44';
}

export function getBossDefaults(debtType: string): { name: string; emoji: string; subtitle: string; sort_order: number } {
  switch (debtType) {
    case 'student_loan':
      return { name: '奨学金の亡霊', emoji: '👻', subtitle: '～低金利だが長期戦～', sort_order: 4 };
    case 'credit_card':
      return { name: 'リボの悪魔', emoji: '😈', subtitle: '～毎月HP回復する厄介者～', sort_order: 2 };
    case 'loan':
      return { name: '金利の竜', emoji: '🐉', subtitle: '～高金利のパワー型～', sort_order: 3 };
    case 'consumer_finance':
      return { name: 'サラ金の魔王', emoji: '👿', subtitle: '～利息18%の暴君～', sort_order: 1 };
    default:
      return { name: '謎の敵', emoji: '❓', subtitle: '～未知の借金～', sort_order: 5 };
  }
}
