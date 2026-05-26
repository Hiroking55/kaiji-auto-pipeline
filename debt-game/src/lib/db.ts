import Database from 'better-sqlite3';
import path from 'path';
import { Player, Boss, Payment, DailySnapshot, Achievement, PlayerAchievement } from './types';

const DB_PATH = path.join(process.cwd(), 'data', 'game.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    const fs = require('fs');
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    initializeDb(db);
  }
  return db;
}

function initializeDb(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS player (
      id TEXT PRIMARY KEY DEFAULT 'player1',
      name TEXT NOT NULL DEFAULT 'プレイヤー',
      level INTEGER NOT NULL DEFAULT 1,
      xp INTEGER NOT NULL DEFAULT 0,
      title TEXT NOT NULL DEFAULT '借金奴隷',
      monthly_income INTEGER NOT NULL DEFAULT 0,
      fixed_expenses INTEGER NOT NULL DEFAULT 0,
      login_streak INTEGER NOT NULL DEFAULT 0,
      max_streak INTEGER NOT NULL DEFAULT 0,
      last_login TEXT,
      line_user_id TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS bosses (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      debt_type TEXT NOT NULL,
      emoji TEXT NOT NULL,
      subtitle TEXT,
      original_hp INTEGER NOT NULL,
      current_hp INTEGER NOT NULL,
      interest_rate REAL NOT NULL DEFAULT 0,
      min_monthly INTEGER NOT NULL DEFAULT 0,
      payment_day INTEGER DEFAULT 27,
      is_defeated INTEGER DEFAULT 0,
      defeated_at TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      boss_id TEXT NOT NULL REFERENCES bosses(id),
      amount INTEGER NOT NULL,
      type TEXT NOT NULL DEFAULT 'normal',
      xp_earned INTEGER NOT NULL DEFAULT 0,
      memo TEXT,
      paid_at TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS daily_snapshots (
      id TEXT PRIMARY KEY,
      snapshot_date TEXT NOT NULL UNIQUE,
      total_debt INTEGER NOT NULL,
      total_paid INTEGER NOT NULL DEFAULT 0,
      daily_interest INTEGER NOT NULL DEFAULT 0,
      monthly_paid INTEGER NOT NULL DEFAULT 0,
      daily_budget INTEGER NOT NULL DEFAULT 0,
      monthly_budget INTEGER NOT NULL DEFAULT 0,
      player_level INTEGER NOT NULL DEFAULT 1,
      player_xp INTEGER NOT NULL DEFAULT 0,
      bosses_defeated INTEGER NOT NULL DEFAULT 0,
      estimated_payoff TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS achievements (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      icon TEXT NOT NULL,
      condition_key TEXT NOT NULL,
      xp_reward INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS player_achievements (
      player_id TEXT REFERENCES player(id),
      achievement_id TEXT REFERENCES achievements(id),
      earned_at TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (player_id, achievement_id)
    );
  `);

  const achievementCount = db.prepare('SELECT COUNT(*) as count FROM achievements').get() as { count: number };
  if (achievementCount.count === 0) {
    const insert = db.prepare(`
      INSERT INTO achievements (id, name, description, icon, condition_key, xp_reward, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const achievements = [
      ['first_payment', 'はじめの一歩', '初めての返済を記録', '🎯', 'first_payment', 100, 1],
      ['streak_3', '三日坊主突破', '3日連続ログイン', '🔥', 'streak_3', 50, 2],
      ['streak_7', '一週間戦士', '7日連続ログイン', '⚡', 'streak_7', 100, 3],
      ['streak_30', '一ヶ月の覚悟', '30日連続ログイン', '💎', 'streak_30', 500, 4],
      ['streak_100', '百日の修行僧', '100日連続ログイン', '👑', 'streak_100', 1000, 5],
      ['first_boss', 'ボスキラー', '初めてのボス撃破', '🏆', 'first_boss', 500, 6],
      ['half_debt', '借金半減', '総借金が初期の50%以下に', '⚔️', 'half_debt', 300, 7],
      ['extra_payment', '必殺技発動', '初めての繰上返済', '💥', 'extra_payment', 200, 8],
      ['all_bosses', '完全勝利', '全ボス撃破（完済）', '🎉', 'all_bosses', 5000, 9],
      ['budget_master', '予算マスター', '月間予算内で生活', '📊', 'budget_master', 300, 10],
    ];
    const insertMany = db.transaction(() => {
      for (const a of achievements) {
        insert.run(...a);
      }
    });
    insertMany();
  }
}

export function getPlayer(): Player | null {
  const row = getDb().prepare('SELECT * FROM player WHERE id = ?').get('player1') as Player | undefined;
  return row || null;
}

export function createPlayer(data: { name: string; monthly_income: number; fixed_expenses: number }): Player {
  const db = getDb();
  db.prepare(`
    INSERT OR REPLACE INTO player (id, name, monthly_income, fixed_expenses)
    VALUES ('player1', ?, ?, ?)
  `).run(data.name, data.monthly_income, data.fixed_expenses);
  return getPlayer()!;
}

export function updatePlayer(updates: Partial<Player>): Player {
  const db = getDb();
  const fields = Object.keys(updates).filter(k => k !== 'id');
  if (fields.length === 0) return getPlayer()!;
  const sets = fields.map(f => `${f} = ?`).join(', ');
  const values = fields.map(f => (updates as Record<string, unknown>)[f]);
  db.prepare(`UPDATE player SET ${sets}, updated_at = datetime('now') WHERE id = 'player1'`).run(...values);
  return getPlayer()!;
}

export function getBosses(): Boss[] {
  const rows = getDb().prepare('SELECT * FROM bosses ORDER BY sort_order, created_at').all() as Boss[];
  return rows.map(r => ({ ...r, is_defeated: !!r.is_defeated }));
}

export function getBoss(id: string): Boss | null {
  const row = getDb().prepare('SELECT * FROM bosses WHERE id = ?').get(id) as Boss | undefined;
  return row ? { ...row, is_defeated: !!row.is_defeated } : null;
}

export function createBoss(data: Omit<Boss, 'created_at' | 'updated_at' | 'is_defeated' | 'defeated_at'>): Boss {
  const db = getDb();
  db.prepare(`
    INSERT INTO bosses (id, name, debt_type, emoji, subtitle, original_hp, current_hp, interest_rate, min_monthly, payment_day, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(data.id, data.name, data.debt_type, data.emoji, data.subtitle, data.original_hp, data.current_hp, data.interest_rate, data.min_monthly, data.payment_day, data.sort_order);
  return getBoss(data.id)!;
}

export function updateBoss(id: string, updates: Partial<Boss>): Boss {
  const db = getDb();
  const fields = Object.keys(updates).filter(k => k !== 'id');
  if (fields.length === 0) return getBoss(id)!;
  const sets = fields.map(f => `${f} = ?`).join(', ');
  const values = fields.map(f => (updates as Record<string, unknown>)[f]);
  db.prepare(`UPDATE bosses SET ${sets}, updated_at = datetime('now') WHERE id = ?`).run(...values, id);
  return getBoss(id)!;
}

export function getPayments(limit = 20): Payment[] {
  return getDb().prepare('SELECT * FROM payments ORDER BY paid_at DESC, created_at DESC LIMIT ?').all(limit) as Payment[];
}

export function getPaymentsByBoss(bossId: string, limit = 20): Payment[] {
  return getDb().prepare('SELECT * FROM payments WHERE boss_id = ? ORDER BY paid_at DESC LIMIT ?').all(bossId, limit) as Payment[];
}

export function getMonthlyPayments(year: number, month: number): Payment[] {
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const nextMonth = month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, '0')}-01`;
  return getDb().prepare('SELECT * FROM payments WHERE paid_at >= ? AND paid_at < ? ORDER BY paid_at DESC').all(start, nextMonth) as Payment[];
}

export function createPayment(data: { id: string; boss_id: string; amount: number; type: string; xp_earned: number; memo?: string; paid_at: string }): Payment {
  const db = getDb();
  db.prepare(`
    INSERT INTO payments (id, boss_id, amount, type, xp_earned, memo, paid_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(data.id, data.boss_id, data.amount, data.type, data.xp_earned, data.memo || null, data.paid_at);
  return db.prepare('SELECT * FROM payments WHERE id = ?').get(data.id) as Payment;
}

export function getLatestSnapshot(): DailySnapshot | null {
  return getDb().prepare('SELECT * FROM daily_snapshots ORDER BY snapshot_date DESC LIMIT 1').get() as DailySnapshot | undefined || null;
}

export function createSnapshot(data: Omit<DailySnapshot, 'created_at'>): DailySnapshot {
  const db = getDb();
  db.prepare(`
    INSERT OR REPLACE INTO daily_snapshots (id, snapshot_date, total_debt, total_paid, daily_interest, monthly_paid, daily_budget, monthly_budget, player_level, player_xp, bosses_defeated, estimated_payoff)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(data.id, data.snapshot_date, data.total_debt, data.total_paid, data.daily_interest, data.monthly_paid, data.daily_budget, data.monthly_budget, data.player_level, data.player_xp, data.bosses_defeated, data.estimated_payoff);
  return db.prepare('SELECT * FROM daily_snapshots WHERE id = ?').get(data.id) as DailySnapshot;
}

export function getAchievements(): Achievement[] {
  return getDb().prepare('SELECT * FROM achievements ORDER BY sort_order').all() as Achievement[];
}

export function getEarnedAchievements(): PlayerAchievement[] {
  return getDb().prepare("SELECT * FROM player_achievements WHERE player_id = 'player1'").all() as PlayerAchievement[];
}

export function earnAchievement(achievementId: string): void {
  const db = getDb();
  db.prepare(`
    INSERT OR IGNORE INTO player_achievements (player_id, achievement_id)
    VALUES ('player1', ?)
  `).run(achievementId);
}

export function resetAllData(): void {
  const db = getDb();
  db.exec(`
    DELETE FROM player_achievements;
    DELETE FROM daily_snapshots;
    DELETE FROM payments;
    DELETE FROM bosses;
    DELETE FROM player;
  `);
}
