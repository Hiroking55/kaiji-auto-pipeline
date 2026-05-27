import { Boss, Player, SavingsGoal, Investment } from './types';

// === Town Evolution ===
export function getTownStage(netWorth: number): { level: number; name: string; description: string } {
  if (netWorth >= 2000000) return { level: 7, name: '黄金の王都', description: '壮大な黄金の城と賑わう街' };
  if (netWorth >= 800000) return { level: 5, name: '栄える街', description: '城と市場と噴水のある活気ある街' };
  if (netWorth >= 0) return { level: 3, name: '城下町', description: '小さな城と数軒の家がある町' };
  return { level: 1, name: '開拓の村', description: '小屋がひとつふたつの開拓地' };
}

export function getTownVitality(monthlyPaid: number, monthlyTarget: number): number {
  if (monthlyTarget <= 0) return 100;
  return Math.max(0, Math.min(100, Math.round((monthlyPaid / monthlyTarget) * 100)));
}

export function getVitalityLabel(vitality: number): { text: string; color: string } {
  if (vitality >= 80) return { text: '栄えています！', color: '#2d8a4e' };
  if (vitality >= 50) return { text: '持ちこたえている', color: '#b89450' };
  if (vitality >= 20) return { text: '荒れてきている…', color: '#d9534f' };
  return { text: '荒れ果てています…', color: '#d9534f' };
}

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

export function getQuestDifficulty(boss: Boss): number {
  const amountScore = Math.min(5, Math.ceil(boss.original_hp / 300000));
  const rateScore = Math.min(4, Math.ceil(boss.interest_rate / 5));
  return Math.max(1, Math.min(9, amountScore + rateScore));
}

export function getQuestDaysRemaining(boss: Boss): number | null {
  if (boss.is_defeated) return 0;
  if (boss.min_monthly === 0) return null;

  const monthlyInterest = boss.current_hp * (boss.interest_rate / 100 / 12);
  if (boss.min_monthly <= monthlyInterest) return null;

  let remaining = boss.current_hp;
  let months = 0;
  while (remaining > 0 && months < 360) {
    const interest = remaining * (boss.interest_rate / 100 / 12);
    remaining = remaining + interest - boss.min_monthly;
    months++;
  }
  if (months >= 360) return null;
  return months * 30;
}

export function getHunterRankTitle(level: number): string {
  if (level >= 50) return '伝説のハンター';
  if (level >= 30) return 'マスターハンター';
  if (level >= 20) return '上位ハンター';
  if (level >= 10) return '一人前ハンター';
  if (level >= 5) return '駆け出しハンター';
  return '新米ハンター';
}

// === Savings ===
export function calculateSavingsXp(amount: number, goalReached: boolean): number {
  let xp = Math.max(50, Math.floor(amount / 5000) * 50);
  if (goalReached) xp += 500;
  return xp;
}

export function estimateGoalMonths(goal: SavingsGoal): number | null {
  if (goal.is_hatched) return 0;
  if (goal.monthly_target <= 0) return null;
  const remaining = goal.target_amount - goal.current_amount;
  if (remaining <= 0) return 0;
  return Math.ceil(remaining / goal.monthly_target);
}

export function getCompanionEmoji(category: string): { name: string; emoji: string } {
  switch (category) {
    case 'travel': return { name: '渡り鳥のプケプケ', emoji: '🦅' };
    case 'emergency': return { name: '鉄壁のバサルモス', emoji: '🛡️' };
    case 'education': return { name: '賢者のフルフル', emoji: '📚' };
    default: return { name: '宝の守り竜', emoji: '🐲' };
  }
}

// === Investments ===
export function calculateReturnRate(principal: number, currentValue: number): number {
  if (principal <= 0) return 0;
  return Math.round(((currentValue - principal) / principal) * 1000) / 10;
}

export function simulateCompoundGrowth(principal: number, annualRate: number, months: number): number[] {
  const result: number[] = [principal];
  const monthlyRate = annualRate / 100 / 12;
  let value = principal;
  for (let i = 1; i <= months; i++) {
    value = Math.round(value * (1 + monthlyRate));
    result.push(value);
  }
  return result;
}

export function getExpeditionEmoji(type: string): string {
  switch (type) {
    case 'stock': return '📈';
    case 'fund': return '🏛️';
    case 'crypto': return '⛓️';
    default: return '🗺️';
  }
}

export function calculateInvestmentXp(gain: number): number {
  if (gain <= 0) return 10;
  return Math.max(50, Math.floor(gain / 1000) * 10);
}

export function getBossDefaults(debtType: string): { name: string; emoji: string; subtitle: string; sort_order: number } {
  switch (debtType) {
    case 'student_loan':
      return { name: '奨学金の亡霊', emoji: '👻', subtitle: '低金利だが長期戦の古龍種', sort_order: 4 };
    case 'credit_card':
      return { name: 'リボの悪魔', emoji: '😈', subtitle: '毎月HP回復する厄介な牙竜種', sort_order: 2 };
    case 'loan':
      return { name: '金利の竜', emoji: '🐉', subtitle: '高金利のパワー型飛竜種', sort_order: 3 };
    case 'consumer_finance':
      return { name: 'サラ金の魔王', emoji: '👿', subtitle: '利息18%の暴君・古龍種', sort_order: 1 };
    default:
      return { name: '謎の敵', emoji: '❓', subtitle: '未知のモンスター', sort_order: 5 };
  }
}
