'use server';

import { v4 as uuidv4 } from 'uuid';
import {
  getPlayer, createPlayer, updatePlayer,
  getBosses, getBoss, createBoss, updateBoss,
  getPayments, getMonthlyPayments, createPayment,
  getLatestSnapshot, createSnapshot,
  getAchievements, getEarnedAchievements, earnAchievement,
  resetAllData, getPaymentsByBoss,
} from './db';
import {
  calculatePaymentXp, calculateLevel, getTitle,
  calculateDailyBudget, calculateMonthlyBudget,
  estimatePayoffDate, calculateDailyInterest,
  getBossDefaults,
} from './game-engine';
import { DashboardData, Boss } from './types';

export async function getDashboardData(): Promise<DashboardData | null> {
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
    dailyBudget,
    monthlyBudget,
    estimatedPayoff,
    recentPayments,
    achievements,
    earnedAchievements: earnedIds,
    xpForNextLevel: levelInfo.nextLevelXp,
  };
}

export async function setupGame(data: {
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
}): Promise<void> {
  resetAllData();

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

export async function recordPayment(data: {
  bossId: string;
  amount: number;
  type: 'normal' | 'extra';
  paidAt: string;
  memo?: string;
}): Promise<{ xpEarned: number; levelUp: boolean; newLevel: number; bossDefeated: boolean; achievementsEarned: string[] }> {
  const boss = getBoss(data.bossId);
  if (!boss) throw new Error('ボスが見つかりません');
  if (boss.is_defeated) throw new Error('このボスは既に撃破済みです');

  const newHp = Math.max(0, boss.current_hp - data.amount);
  const bossDefeated = newHp <= 0;

  const xpEarned = calculatePaymentXp(data.amount, data.type, bossDefeated);

  createPayment({
    id: uuidv4(),
    boss_id: data.bossId,
    amount: data.amount,
    type: data.type,
    xp_earned: xpEarned,
    memo: data.memo,
    paid_at: data.paidAt,
  });

  updateBoss(data.bossId, {
    current_hp: newHp,
    is_defeated: bossDefeated,
    defeated_at: bossDefeated ? new Date().toISOString() : undefined,
  } as Partial<Boss>);

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
  const payments = getPayments(1000);

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
      const player = getPlayer()!;
      updatePlayer({ xp: player.xp + achievement.xp_reward });
      newAchievements.push(achievement.name);
    }
  }

  return newAchievements;
}

export async function processLogin(): Promise<void> {
  const player = getPlayer();
  if (!player) return;

  const today = new Date().toISOString().split('T')[0];
  if (player.last_login === today) return;

  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const isConsecutive = player.last_login === yesterday;

  const newStreak = isConsecutive ? player.login_streak + 1 : 1;
  const newMaxStreak = Math.max(player.max_streak, newStreak);

  updatePlayer({
    last_login: today,
    login_streak: newStreak,
    max_streak: newMaxStreak,
    xp: player.xp + 10,
  });

  checkAndAwardAchievements();
}

export async function getBossDetail(bossId: string) {
  const boss = getBoss(bossId);
  if (!boss) return null;

  const payments = getPaymentsByBoss(bossId, 20);
  const totalPaid = getPaymentsByBoss(bossId, 10000).reduce((s, p) => s + p.amount, 0);

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

export async function processInterest(): Promise<number> {
  const bosses = getBosses().filter(b => !b.is_defeated);
  let totalInterest = 0;
  for (const boss of bosses) {
    const interest = calculateDailyInterest(boss);
    if (interest > 0) {
      updateBoss(boss.id, { current_hp: boss.current_hp + interest });
      totalInterest += interest;
    }
  }
  return totalInterest;
}

export async function deleteBoss(bossId: string): Promise<void> {
  const db = (await import('./db')).getDb();
  db.prepare('DELETE FROM payments WHERE boss_id = ?').run(bossId);
  db.prepare('DELETE FROM bosses WHERE id = ?').run(bossId);
}

export async function addBoss(data: {
  debtType: string;
  amount: number;
  interestRate: number;
  minMonthly: number;
  paymentDay: number;
  customName?: string;
}): Promise<void> {
  const bosses = getBosses();
  const nextId = `boss_${bosses.length + 1}_${Date.now()}`;
  const defaults = getBossDefaults(data.debtType);
  createBoss({
    id: nextId,
    name: data.customName || defaults.name,
    debt_type: data.debtType as Boss['debt_type'],
    emoji: defaults.emoji,
    subtitle: defaults.subtitle,
    original_hp: data.amount,
    current_hp: data.amount,
    interest_rate: data.interestRate,
    min_monthly: data.minMonthly,
    payment_day: data.paymentDay,
    sort_order: defaults.sort_order,
  });
}
