import { v4 as uuidv4 } from 'uuid';
import {
  getPlayer, createPlayer, updatePlayer,
  getBosses, getBoss, createBoss, updateBoss,
  getPayments, getMonthlyPayments, createPayment, getPaymentsByBoss,
  getAchievements, getEarnedAchievements, earnAchievement,
  getLatestSnapshot, createSnapshot,
  getSavingsGoals, getSavingsGoal, createSavingsGoal, updateSavingsGoal,
  getSavingsDeposits, createSavingsDeposit,
  getInvestments, getInvestment, createInvestment, updateInvestment,
  createInvestmentUpdate,
  resetAllData as resetStore,
} from './client-store';
import {
  calculatePaymentXp, calculateLevel, getTitle,
  calculateDailyBudget, calculateMonthlyBudget,
  estimatePayoffDate, calculateDailyInterest,
  getBossDefaults, calculateSavingsXp, getCompanionEmoji,
  calculateReturnRate, calculateInvestmentXp,
  getTownVitality,
} from './game-engine';
import { DashboardData, Boss } from './types';

export function getDashboardData(): DashboardData | null {
  const player = getPlayer();
  if (!player) return null;

  const bosses = getBosses();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(year, month, 0).getDate();

  const monthlyPayments = getMonthlyPayments(year, month);
  const monthlyPaid = monthlyPayments.reduce((sum, p) => sum + p.amount, 0);
  const monthlyPaymentCount = monthlyPayments.length;
  const monthlyXpEarned = monthlyPayments.reduce((sum, p) => sum + p.xp_earned, 0);
  const largestHitThisMonth = monthlyPayments.length > 0 ? Math.max(...monthlyPayments.map(p => p.amount)) : 0;
  const monthlyDebtPayments = bosses.filter(b => !b.is_defeated).reduce((sum, b) => sum + b.min_monthly, 0);

  const dailyBudget = calculateDailyBudget(
    player.monthly_income, player.fixed_expenses, monthlyDebtPayments, 0, dayOfMonth, daysInMonth
  );
  const monthlyBudget = calculateMonthlyBudget(
    player.monthly_income, player.fixed_expenses, monthlyDebtPayments, 0
  );

  const totalDebt = bosses.reduce((sum, b) => sum + (b.is_defeated ? 0 : b.current_hp), 0);
  const originalTotalDebt = bosses.reduce((sum, b) => sum + b.original_hp, 0);

  const latestSnapshot = getLatestSnapshot();
  const previousDayDebt = latestSnapshot ? latestSnapshot.total_debt : null;

  const estimatedPayoff = estimatePayoffDate(bosses);

  const recentPayments = getPayments(10).map(p => {
    const boss = getBoss(p.boss_id);
    return { ...p, boss_name: boss?.name || '不明', boss_emoji: boss?.emoji || '❓' };
  });

  const achievements = getAchievements();
  const earned = getEarnedAchievements();
  const earnedIds = earned.map(e => e.achievement_id);

  const levelInfo = calculateLevel(player.xp);

  return {
    player: { ...player, level: levelInfo.level, title: getTitle(levelInfo.level) },
    bosses,
    totalDebt,
    originalTotalDebt,
    previousDayDebt,
    monthlyPaid,
    monthlyPaymentCount,
    monthlyXpEarned,
    largestHitThisMonth,
    dailyBudget,
    monthlyBudget,
    estimatedPayoff,
    recentPayments,
    achievements,
    earnedAchievements: earnedIds,
    xpForNextLevel: levelInfo.nextLevelXp,
    savingsGoals: getSavingsGoals(),
    totalSavings: getSavingsGoals().reduce((s, g) => s + g.current_amount, 0),
    investments: getInvestments(),
    totalInvestmentValue: getInvestments().reduce((s, i) => s + i.current_value, 0),
    totalInvestmentReturn: getInvestments().reduce((s, i) => s + (i.current_value - i.principal), 0),
    netWorth: getSavingsGoals().reduce((s, g) => s + g.current_amount, 0)
      + getInvestments().reduce((s, i) => s + i.current_value, 0)
      - bosses.reduce((sum, b) => sum + (b.is_defeated ? 0 : b.current_hp), 0),
    townVitality: getTownVitality(monthlyPaid, monthlyDebtPayments),
    monthlyTarget: monthlyDebtPayments,
  };
}

export function setupGame(data: {
  playerName: string;
  monthlyIncome: number;
  fixedExpenses: number;
  debts: Array<{
    debtType: string;
    amount: number;
    interestRate: number;
    minMonthly: number;
    paymentDay: number;
    customName?: string;
  }>;
}): void {
  resetStore();

  createPlayer({
    name: data.playerName,
    monthly_income: data.monthlyIncome,
    fixed_expenses: data.fixedExpenses,
  });

  for (let i = 0; i < data.debts.length; i++) {
    const debt = data.debts[i];
    const defaults = getBossDefaults(debt.debtType);
    createBoss({
      id: `boss_${i + 1}`,
      name: debt.customName || defaults.name,
      debt_type: debt.debtType as Boss['debt_type'],
      emoji: defaults.emoji,
      subtitle: defaults.subtitle,
      original_hp: debt.amount,
      current_hp: debt.amount,
      interest_rate: debt.interestRate,
      min_monthly: debt.minMonthly,
      payment_day: debt.paymentDay,
      sort_order: defaults.sort_order,
    });
  }
}

export function recordPayment(data: {
  bossId: string;
  amount: number;
  type: 'normal' | 'extra';
  paidAt: string;
  memo?: string;
}): { xpEarned: number; comboCount: number; comboMultiplier: number; levelUp: boolean; newLevel: number; bossDefeated: boolean; achievementsEarned: string[] } {
  const boss = getBoss(data.bossId);
  if (!boss) throw new Error('ボスが見つかりません');
  if (boss.is_defeated) throw new Error('このボスは既に撃破済みです');

  const newHp = Math.max(0, boss.current_hp - data.amount);
  const bossDefeated = newHp <= 0;

  // Combo bonus: more payments this month = higher XP multiplier
  const now = new Date();
  const monthPayments = getMonthlyPayments(now.getFullYear(), now.getMonth() + 1);
  const comboCount = monthPayments.length; // current month payments before this one
  const comboMultiplier = 1 + Math.min(0.5, comboCount * 0.1); // max 1.5x at 5+ payments

  const baseXp = calculatePaymentXp(data.amount, data.type, bossDefeated);
  const xpEarned = Math.floor(baseXp * comboMultiplier);

  createPayment({
    id: uuidv4(),
    boss_id: data.bossId,
    amount: data.amount,
    type: data.type,
    xp_earned: xpEarned,
    memo: data.memo || null,
    paid_at: data.paidAt,
    created_at: new Date().toISOString(),
  });

  updateBoss(data.bossId, {
    current_hp: newHp,
    is_defeated: bossDefeated,
    defeated_at: bossDefeated ? new Date().toISOString() : null,
  });

  const player = getPlayer()!;
  const oldLevel = calculateLevel(player.xp);
  const newXp = player.xp + xpEarned;
  const newLevelInfo = calculateLevel(newXp);

  updatePlayer({
    xp: newXp,
    level: newLevelInfo.level,
    title: getTitle(newLevelInfo.level),
  });

  const achievementsEarned = checkAndAwardAchievements();

  return {
    xpEarned,
    comboCount: comboCount + 1,
    comboMultiplier,
    levelUp: newLevelInfo.level > oldLevel.level,
    newLevel: newLevelInfo.level,
    bossDefeated,
    achievementsEarned,
  };
}

function checkAndAwardAchievements(): string[] {
  const earned = getEarnedAchievements().map(e => e.achievement_id);
  const newAchievements: string[] = [];
  const player = getPlayer()!;
  const bosses = getBosses();
  const payments = getPayments(10000);

  const checks: Record<string, () => boolean> = {
    first_payment: () => payments.length > 0,
    streak_3: () => player.login_streak >= 3,
    streak_7: () => player.login_streak >= 7,
    streak_30: () => player.login_streak >= 30,
    streak_100: () => player.login_streak >= 100,
    first_boss: () => bosses.some(b => b.is_defeated),
    half_debt: () => {
      const original = bosses.reduce((s, b) => s + b.original_hp, 0);
      const current = bosses.reduce((s, b) => s + (b.is_defeated ? 0 : b.current_hp), 0);
      return original > 0 && current <= original / 2;
    },
    extra_payment: () => payments.some(p => p.type === 'extra'),
    all_bosses: () => bosses.length > 0 && bosses.every(b => b.is_defeated),
  };

  const achievements = getAchievements();
  for (const achievement of achievements) {
    if (earned.includes(achievement.id)) continue;
    const check = checks[achievement.id];
    if (check && check()) {
      earnAchievement(achievement.id);
      const p = getPlayer()!;
      updatePlayer({ xp: p.xp + achievement.xp_reward });
      newAchievements.push(achievement.name);
    }
  }

  return newAchievements;
}

export function processLogin(): { streakBonus: number; isNewDay: boolean } {
  const player = getPlayer();
  if (!player) return { streakBonus: 0, isNewDay: false };

  const today = new Date().toISOString().split('T')[0];
  if (player.last_login === today) return { streakBonus: 0, isNewDay: false };

  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const isConsecutive = player.last_login === yesterday;

  const newStreak = isConsecutive ? player.login_streak + 1 : 1;
  const newMaxStreak = Math.max(player.max_streak, newStreak);

  // Streak bonus: base 10 + streak multiplier (max 100 at 30 days)
  const streakBonus = Math.min(100, 10 + Math.floor(newStreak * 3));

  updatePlayer({
    last_login: today,
    login_streak: newStreak,
    max_streak: newMaxStreak,
    xp: player.xp + streakBonus,
  });

  checkAndAwardAchievements();
  return { streakBonus, isNewDay: true };
}

export function getBossDetail(bossId: string) {
  const boss = getBoss(bossId);
  if (!boss) return null;

  const payments = getPaymentsByBoss(bossId, 20);
  const allBossPayments = getPaymentsByBoss(bossId, 10000);
  const totalPaid = allBossPayments.reduce((s, p) => s + p.amount, 0);

  const monthlyPayment = boss.min_monthly;
  const monthlyInterest = boss.current_hp * (boss.interest_rate / 100 / 12);

  let monthsToDefeat: number | null = null;
  if (monthlyPayment > monthlyInterest && !boss.is_defeated) {
    let remaining = boss.current_hp;
    let months = 0;
    while (remaining > 0 && months < 360) {
      const interest = remaining * (boss.interest_rate / 100 / 12);
      remaining = remaining + interest - monthlyPayment;
      months++;
    }
    monthsToDefeat = months < 360 ? months : null;
  }

  return {
    boss,
    payments,
    totalPaid,
    monthlyInterest: Math.ceil(monthlyInterest),
    dailyInterest: calculateDailyInterest(boss),
    monthsToDefeat,
  };
}

// === Savings Goals ===
export function addSavingsGoal(data: { name: string; category: 'travel' | 'emergency' | 'education' | 'other'; targetAmount: number; monthlyTarget: number }): void {
  createSavingsGoal({
    id: `savings_${Date.now()}`,
    name: data.name,
    emoji: '🥚',
    category: data.category,
    target_amount: data.targetAmount,
    current_amount: 0,
    monthly_target: data.monthlyTarget,
  });
}

export function recordSavingsDeposit(data: { goalId: string; amount: number; depositedAt: string }): { xpEarned: number; hatched: boolean } {
  const goal = getSavingsGoal(data.goalId);
  if (!goal) throw new Error('目標が見つかりません');
  if (goal.is_hatched) throw new Error('この目標は達成済みです');

  const newAmount = goal.current_amount + data.amount;
  const hatched = newAmount >= goal.target_amount;

  const xpEarned = calculateSavingsXp(data.amount, hatched);

  createSavingsDeposit({
    id: uuidv4(),
    goal_id: data.goalId,
    amount: data.amount,
    xp_earned: xpEarned,
    deposited_at: data.depositedAt,
    created_at: new Date().toISOString(),
  });

  const updates: Partial<typeof goal> = { current_amount: newAmount };
  if (hatched) {
    const companion = getCompanionEmoji(goal.category);
    updates.is_hatched = true;
    updates.hatched_at = new Date().toISOString();
    updates.companion_name = companion.name;
    updates.companion_emoji = companion.emoji;
    updates.emoji = companion.emoji;
  }
  updateSavingsGoal(data.goalId, updates);

  const player = getPlayer()!;
  const newXp = player.xp + xpEarned;
  const levelInfo = calculateLevel(newXp);
  updatePlayer({ xp: newXp, level: levelInfo.level, title: getTitle(levelInfo.level) });

  return { xpEarned, hatched };
}

// === Investments ===
export function addInvestment(data: { name: string; type: 'stock' | 'fund' | 'crypto' | 'other'; principal: number; currentValue: number; annualRate: number; startedAt: string }): void {
  const emoji = data.type === 'stock' ? '📈' : data.type === 'fund' ? '🏛️' : data.type === 'crypto' ? '⛓️' : '🗺️';
  createInvestment({
    id: `inv_${Date.now()}`,
    name: data.name,
    emoji,
    type: data.type,
    principal: data.principal,
    current_value: data.currentValue,
    annual_rate: data.annualRate,
    started_at: data.startedAt,
    last_updated: new Date().toISOString(),
  });
}

export function updateInvestmentValue(investmentId: string, newValue: number): { xpEarned: number; returnRate: number } {
  const inv = getInvestment(investmentId);
  if (!inv) throw new Error('投資が見つかりません');

  createInvestmentUpdate({
    id: uuidv4(),
    investment_id: investmentId,
    previous_value: inv.current_value,
    new_value: newValue,
    updated_at: new Date().toISOString(),
  });

  updateInvestment(investmentId, { current_value: newValue, last_updated: new Date().toISOString() });

  const gain = newValue - inv.current_value;
  const xpEarned = calculateInvestmentXp(gain);
  const returnRate = calculateReturnRate(inv.principal, newValue);

  const player = getPlayer()!;
  const newXp = player.xp + xpEarned;
  const levelInfo = calculateLevel(newXp);
  updatePlayer({ xp: newXp, level: levelInfo.level, title: getTitle(levelInfo.level) });

  return { xpEarned, returnRate };
}

export function resetAllData(): void {
  resetStore();
}
