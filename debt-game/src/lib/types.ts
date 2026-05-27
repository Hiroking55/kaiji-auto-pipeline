export interface Player {
  id: string;
  name: string;
  level: number;
  xp: number;
  title: string;
  monthly_income: number;
  fixed_expenses: number;
  login_streak: number;
  max_streak: number;
  last_login: string | null;
  line_user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Boss {
  id: string;
  name: string;
  debt_type: 'student_loan' | 'credit_card' | 'loan' | 'consumer_finance';
  emoji: string;
  subtitle: string;
  original_hp: number;
  current_hp: number;
  interest_rate: number;
  min_monthly: number;
  payment_day: number;
  is_defeated: boolean;
  defeated_at: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  boss_id: string;
  amount: number;
  type: 'normal' | 'extra';
  xp_earned: number;
  memo: string | null;
  paid_at: string;
  created_at: string;
}

export interface DailySnapshot {
  id: string;
  snapshot_date: string;
  total_debt: number;
  total_paid: number;
  daily_interest: number;
  monthly_paid: number;
  daily_budget: number;
  monthly_budget: number;
  player_level: number;
  player_xp: number;
  bosses_defeated: number;
  estimated_payoff: string | null;
  created_at: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: string;
  xp_reward: number;
  sort_order: number;
}

export interface PlayerAchievement {
  player_id: string;
  achievement_id: string;
  earned_at: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  emoji: string;
  category: 'travel' | 'emergency' | 'education' | 'other';
  target_amount: number;
  current_amount: number;
  monthly_target: number;
  is_hatched: boolean;
  hatched_at: string | null;
  companion_name: string | null;
  companion_emoji: string | null;
  created_at: string;
  updated_at: string;
}

export interface SavingsDeposit {
  id: string;
  goal_id: string;
  amount: number;
  xp_earned: number;
  deposited_at: string;
  created_at: string;
}

export interface Investment {
  id: string;
  name: string;
  emoji: string;
  type: 'stock' | 'fund' | 'crypto' | 'other';
  principal: number;
  current_value: number;
  annual_rate: number;
  started_at: string;
  last_updated: string;
  created_at: string;
  updated_at: string;
}

export interface InvestmentUpdate {
  id: string;
  investment_id: string;
  previous_value: number;
  new_value: number;
  updated_at: string;
}

export interface BestiaryEntry {
  id: string;
  name: string;
  emoji: string;
  category: 'boss' | 'companion' | 'expedition';
  subtitle: string;
  unlocked: boolean;
  unlocked_at: string | null;
  stats: Record<string, string>;
}

export interface DashboardData {
  player: Player;
  bosses: Boss[];
  totalDebt: number;
  originalTotalDebt: number;
  previousDayDebt: number | null;
  monthlyPaid: number;
  monthlyPaymentCount: number;
  monthlyXpEarned: number;
  largestHitThisMonth: number;
  dailyBudget: number;
  monthlyBudget: number;
  estimatedPayoff: string | null;
  recentPayments: (Payment & { boss_name: string; boss_emoji: string })[];
  achievements: Achievement[];
  earnedAchievements: string[];
  xpForNextLevel: number;
  savingsGoals: SavingsGoal[];
  totalSavings: number;
  investments: Investment[];
  totalInvestmentValue: number;
  totalInvestmentReturn: number;
  netWorth: number;
  townVitality: number;
  monthlyTarget: number;
}
