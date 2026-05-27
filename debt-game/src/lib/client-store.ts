import { Player, Boss, Payment, Achievement, PlayerAchievement, DailySnapshot, SavingsGoal, SavingsDeposit, Investment, InvestmentUpdate } from './types';

const STORAGE_KEY = 'debt-game-data';

interface GameData {
  player: Player | null;
  bosses: Boss[];
  payments: Payment[];
  snapshots: DailySnapshot[];
  achievements: Achievement[];
  earnedAchievements: PlayerAchievement[];
  savingsGoals: SavingsGoal[];
  savingsDeposits: SavingsDeposit[];
  investments: Investment[];
  investmentUpdates: InvestmentUpdate[];
}

const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  { id: 'first_payment', name: 'はじめの一歩', description: '初めての返済を記録', icon: '🎯', condition: 'first_payment', xp_reward: 100, sort_order: 1 },
  { id: 'streak_3', name: '三日坊主突破', description: '3日連続ログイン', icon: '🔥', condition: 'streak_3', xp_reward: 50, sort_order: 2 },
  { id: 'streak_7', name: '一週間戦士', description: '7日連続ログイン', icon: '⚡', condition: 'streak_7', xp_reward: 100, sort_order: 3 },
  { id: 'streak_30', name: '一ヶ月の覚悟', description: '30日連続ログイン', icon: '💎', condition: 'streak_30', xp_reward: 500, sort_order: 4 },
  { id: 'streak_100', name: '百日の修行僧', description: '100日連続ログイン', icon: '👑', condition: 'streak_100', xp_reward: 1000, sort_order: 5 },
  { id: 'first_boss', name: 'ボスキラー', description: '初めてのボス撃破', icon: '🏆', condition: 'first_boss', xp_reward: 500, sort_order: 6 },
  { id: 'half_debt', name: '借金半減', description: '総借金が初期の50%以下に', icon: '⚔️', condition: 'half_debt', xp_reward: 300, sort_order: 7 },
  { id: 'extra_payment', name: '必殺技発動', description: '初めての繰上返済', icon: '💥', condition: 'extra_payment', xp_reward: 200, sort_order: 8 },
  { id: 'all_bosses', name: '完全勝利', description: '全ボス撃破（完済）', icon: '🎉', condition: 'all_bosses', xp_reward: 5000, sort_order: 9 },
  { id: 'budget_master', name: '予算マスター', description: '月間予算内で生活', icon: '📊', condition: 'budget_master', xp_reward: 300, sort_order: 10 },
];

function getDefaultData(): GameData {
  return {
    player: null,
    bosses: [],
    payments: [],
    snapshots: [],
    achievements: DEFAULT_ACHIEVEMENTS,
    earnedAchievements: [],
    savingsGoals: [],
    savingsDeposits: [],
    investments: [],
    investmentUpdates: [],
  };
}

export function loadData(): GameData {
  if (typeof window === 'undefined') return getDefaultData();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultData();
    const parsed = JSON.parse(raw) as GameData;
    if (!parsed.achievements || parsed.achievements.length === 0) {
      parsed.achievements = DEFAULT_ACHIEVEMENTS;
    }
    if (!parsed.savingsGoals) parsed.savingsGoals = [];
    if (!parsed.savingsDeposits) parsed.savingsDeposits = [];
    if (!parsed.investments) parsed.investments = [];
    if (!parsed.investmentUpdates) parsed.investmentUpdates = [];
    return parsed;
  } catch {
    return getDefaultData();
  }
}

export function saveData(data: GameData): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getPlayer(): Player | null {
  return loadData().player;
}

export function createPlayer(p: { name: string; monthly_income: number; fixed_expenses: number }): Player {
  const data = loadData();
  const now = new Date().toISOString();
  data.player = {
    id: 'player1',
    name: p.name,
    level: 1,
    xp: 0,
    title: '借金奴隷',
    monthly_income: p.monthly_income,
    fixed_expenses: p.fixed_expenses,
    login_streak: 0,
    max_streak: 0,
    last_login: null,
    line_user_id: null,
    created_at: now,
    updated_at: now,
  };
  saveData(data);
  return data.player;
}

export function updatePlayer(updates: Partial<Player>): Player {
  const data = loadData();
  if (!data.player) throw new Error('Player not found');
  data.player = { ...data.player, ...updates, updated_at: new Date().toISOString() };
  saveData(data);
  return data.player;
}

export function getBosses(): Boss[] {
  return loadData().bosses.sort((a, b) => a.sort_order - b.sort_order);
}

export function getBoss(id: string): Boss | null {
  return loadData().bosses.find(b => b.id === id) || null;
}

export function createBoss(b: Omit<Boss, 'created_at' | 'updated_at' | 'is_defeated' | 'defeated_at'>): Boss {
  const data = loadData();
  const now = new Date().toISOString();
  const boss: Boss = { ...b, is_defeated: false, defeated_at: null, created_at: now, updated_at: now };
  data.bosses.push(boss);
  saveData(data);
  return boss;
}

export function updateBoss(id: string, updates: Partial<Boss>): Boss {
  const data = loadData();
  const idx = data.bosses.findIndex(b => b.id === id);
  if (idx === -1) throw new Error('Boss not found');
  data.bosses[idx] = { ...data.bosses[idx], ...updates, updated_at: new Date().toISOString() };
  saveData(data);
  return data.bosses[idx];
}

export function getPayments(limit = 20): Payment[] {
  const data = loadData();
  return data.payments
    .sort((a, b) => b.paid_at.localeCompare(a.paid_at) || b.created_at.localeCompare(a.created_at))
    .slice(0, limit);
}

export function getPaymentsByBoss(bossId: string, limit = 20): Payment[] {
  const data = loadData();
  return data.payments
    .filter(p => p.boss_id === bossId)
    .sort((a, b) => b.paid_at.localeCompare(a.paid_at))
    .slice(0, limit);
}

export function getMonthlyPayments(year: number, month: number): Payment[] {
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const nextMonth = month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const data = loadData();
  return data.payments.filter(p => p.paid_at >= start && p.paid_at < nextMonth);
}

export function createPayment(p: Payment): Payment {
  const data = loadData();
  data.payments.push(p);
  saveData(data);
  return p;
}

export function getAchievements(): Achievement[] {
  return loadData().achievements.sort((a, b) => a.sort_order - b.sort_order);
}

export function getEarnedAchievements(): PlayerAchievement[] {
  return loadData().earnedAchievements;
}

export function earnAchievement(achievementId: string): void {
  const data = loadData();
  if (data.earnedAchievements.some(e => e.achievement_id === achievementId)) return;
  data.earnedAchievements.push({
    player_id: 'player1',
    achievement_id: achievementId,
    earned_at: new Date().toISOString(),
  });
  saveData(data);
}

export function getLatestSnapshot(): DailySnapshot | null {
  const data = loadData();
  const sorted = data.snapshots.sort((a, b) => b.snapshot_date.localeCompare(a.snapshot_date));
  return sorted[0] || null;
}

export function createSnapshot(s: DailySnapshot): void {
  const data = loadData();
  const idx = data.snapshots.findIndex(x => x.snapshot_date === s.snapshot_date);
  if (idx >= 0) data.snapshots[idx] = s;
  else data.snapshots.push(s);
  saveData(data);
}

// === Savings Goals ===
export function getSavingsGoals(): SavingsGoal[] {
  return loadData().savingsGoals;
}

export function getSavingsGoal(id: string): SavingsGoal | null {
  return loadData().savingsGoals.find(g => g.id === id) || null;
}

export function createSavingsGoal(g: Omit<SavingsGoal, 'created_at' | 'updated_at' | 'is_hatched' | 'hatched_at' | 'companion_name' | 'companion_emoji'>): SavingsGoal {
  const data = loadData();
  const now = new Date().toISOString();
  const goal: SavingsGoal = { ...g, is_hatched: false, hatched_at: null, companion_name: null, companion_emoji: null, created_at: now, updated_at: now };
  data.savingsGoals.push(goal);
  saveData(data);
  return goal;
}

export function updateSavingsGoal(id: string, updates: Partial<SavingsGoal>): SavingsGoal {
  const data = loadData();
  const idx = data.savingsGoals.findIndex(g => g.id === id);
  if (idx === -1) throw new Error('Goal not found');
  data.savingsGoals[idx] = { ...data.savingsGoals[idx], ...updates, updated_at: new Date().toISOString() };
  saveData(data);
  return data.savingsGoals[idx];
}

export function getSavingsDeposits(goalId: string, limit = 20): SavingsDeposit[] {
  return loadData().savingsDeposits
    .filter(d => d.goal_id === goalId)
    .sort((a, b) => b.deposited_at.localeCompare(a.deposited_at))
    .slice(0, limit);
}

export function createSavingsDeposit(d: SavingsDeposit): SavingsDeposit {
  const data = loadData();
  data.savingsDeposits.push(d);
  saveData(data);
  return d;
}

// === Investments ===
export function getInvestments(): Investment[] {
  return loadData().investments;
}

export function getInvestment(id: string): Investment | null {
  return loadData().investments.find(i => i.id === id) || null;
}

export function createInvestment(i: Omit<Investment, 'created_at' | 'updated_at'>): Investment {
  const data = loadData();
  const now = new Date().toISOString();
  const inv: Investment = { ...i, created_at: now, updated_at: now };
  data.investments.push(inv);
  saveData(data);
  return inv;
}

export function updateInvestment(id: string, updates: Partial<Investment>): Investment {
  const data = loadData();
  const idx = data.investments.findIndex(i => i.id === id);
  if (idx === -1) throw new Error('Investment not found');
  data.investments[idx] = { ...data.investments[idx], ...updates, updated_at: new Date().toISOString() };
  saveData(data);
  return data.investments[idx];
}

export function getInvestmentUpdates(investmentId: string, limit = 20): InvestmentUpdate[] {
  return loadData().investmentUpdates
    .filter(u => u.investment_id === investmentId)
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    .slice(0, limit);
}

export function createInvestmentUpdate(u: InvestmentUpdate): InvestmentUpdate {
  const data = loadData();
  data.investmentUpdates.push(u);
  saveData(data);
  return u;
}

export function resetAllData(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}
