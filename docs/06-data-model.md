# ⑥ データ構造設計

## テーブル一覧

| テーブル名 | 用途 |
|-----------|------|
| player | ユーザー情報・ゲーム状態 |
| bosses | 借金（ボス）マスタ |
| payments | 返済記録（攻撃ログ） |
| daily_snapshots | 日次スナップショット |
| achievements | 実績定義 |
| player_achievements | 獲得済み実績 |

## テーブル定義

### player（プレイヤー）

```sql
CREATE TABLE player (
  id            TEXT PRIMARY KEY DEFAULT 'player1',
  name          TEXT NOT NULL DEFAULT 'プレイヤー',
  level         INTEGER NOT NULL DEFAULT 1,
  xp            INTEGER NOT NULL DEFAULT 0,
  title         TEXT NOT NULL DEFAULT '借金奴隷',
  monthly_income INTEGER NOT NULL,      -- 月収（手取り）
  fixed_expenses INTEGER NOT NULL,      -- 固定費合計
  login_streak   INTEGER NOT NULL DEFAULT 0,  -- 連続ログイン日数
  max_streak     INTEGER NOT NULL DEFAULT 0,  -- 最大連続日数
  last_login     DATE,
  line_user_id   TEXT,                  -- LINE通知用
  created_at     TIMESTAMP DEFAULT NOW(),
  updated_at     TIMESTAMP DEFAULT NOW()
);
```

### bosses（ボス = 借金）

```sql
CREATE TABLE bosses (
  id              TEXT PRIMARY KEY,     -- 'boss_1', 'boss_2', ...
  name            TEXT NOT NULL,        -- '奨学金の亡霊'
  debt_type       TEXT NOT NULL,        -- 'student_loan', 'credit_card', 'loan', 'consumer_finance'
  emoji           TEXT NOT NULL,        -- '👻', '😈', '🐉', '👿'
  subtitle        TEXT,                 -- '～低金利だが長期戦～'
  original_hp     INTEGER NOT NULL,     -- 初期借金額（＝最大HP）
  current_hp      INTEGER NOT NULL,     -- 現在の借金残高（＝現HP）
  interest_rate   REAL NOT NULL DEFAULT 0, -- 年利（%）
  min_monthly     INTEGER NOT NULL DEFAULT 0, -- 最低月額返済
  payment_day     INTEGER DEFAULT 27,   -- 返済日（毎月N日）
  is_defeated     BOOLEAN DEFAULT FALSE,
  defeated_at     TIMESTAMP,
  sort_order      INTEGER DEFAULT 0,    -- 表示順（金利高い順推奨）
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);
```

### payments（返済記録 = 攻撃ログ）

```sql
CREATE TABLE payments (
  id          TEXT PRIMARY KEY,
  boss_id     TEXT NOT NULL REFERENCES bosses(id),
  amount      INTEGER NOT NULL,         -- 返済額（正の数）
  type        TEXT NOT NULL DEFAULT 'normal', -- 'normal'(通常攻撃) or 'extra'(必殺技/繰上返済)
  xp_earned   INTEGER NOT NULL DEFAULT 0,
  memo        TEXT,
  paid_at     DATE NOT NULL,
  created_at  TIMESTAMP DEFAULT NOW()
);
```

### daily_snapshots（日次スナップショット）

```sql
CREATE TABLE daily_snapshots (
  id              TEXT PRIMARY KEY,
  snapshot_date   DATE NOT NULL UNIQUE,
  total_debt      INTEGER NOT NULL,     -- 借金総額
  total_paid      INTEGER NOT NULL,     -- 累計返済額
  daily_interest  INTEGER NOT NULL DEFAULT 0, -- その日の利息
  monthly_paid    INTEGER NOT NULL DEFAULT 0, -- 今月の返済額
  daily_budget    INTEGER NOT NULL,     -- 今日使える金額
  monthly_budget  INTEGER NOT NULL,     -- 今月残予算
  player_level    INTEGER NOT NULL,
  player_xp       INTEGER NOT NULL,
  bosses_defeated INTEGER NOT NULL DEFAULT 0,
  estimated_payoff DATE,                -- 完済予定日
  created_at      TIMESTAMP DEFAULT NOW()
);
```

### achievements（実績定義）

```sql
CREATE TABLE achievements (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT NOT NULL,
  icon        TEXT NOT NULL,            -- emoji
  condition   TEXT NOT NULL,            -- 条件の説明
  xp_reward   INTEGER NOT NULL DEFAULT 0,
  sort_order  INTEGER DEFAULT 0
);

-- 初期データ
INSERT INTO achievements VALUES
  ('first_payment',   'はじめの一歩',     '初めての返済',              '🎯', 'first_payment', 100, 1),
  ('streak_3',        '三日坊主突破',     '3日連続ログイン',           '🔥', 'streak_3',      50,  2),
  ('streak_7',        '一週間戦士',       '7日連続ログイン',           '⚡', 'streak_7',      100, 3),
  ('streak_30',       '一ヶ月の覚悟',     '30日連続ログイン',          '💎', 'streak_30',     500, 4),
  ('streak_100',      '百日の修行僧',     '100日連続ログイン',         '👑', 'streak_100',    1000,5),
  ('first_boss',      'ボスキラー',       '初めてのボス撃破',          '🏆', 'first_boss',    500, 6),
  ('half_debt',       '借金半減',         '総借金が50%以下に',         '⚔️', 'half_debt',     300, 7),
  ('extra_payment',   '必殺技発動',       '初めての繰上返済',          '💥', 'extra_payment', 200, 8),
  ('all_bosses',      '完全勝利',         '全ボス撃破（完済）',        '🎉', 'all_bosses',    5000,9),
  ('budget_master',   '予算マスター',     '月間予算を3ヶ月連続達成',    '📊', 'budget_master', 300, 10);
```

### player_achievements（獲得済み実績）

```sql
CREATE TABLE player_achievements (
  player_id      TEXT REFERENCES player(id),
  achievement_id TEXT REFERENCES achievements(id),
  earned_at      TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (player_id, achievement_id)
);
```

## レベルテーブル（計算式）

```
必要XP = level * 100

Lv.1 → Lv.2:  100 XP
Lv.2 → Lv.3:  200 XP
Lv.5 → Lv.6:  500 XP
Lv.10→ Lv.11: 1000 XP
...
```

## 称号マッピング

```typescript
const TITLES: Record<number, string> = {
  1:  '借金奴隷',
  5:  '見習い戦士',
  10: '借金ハンター',
  20: '節約マスター',
  30: '財務の達人',
  50: '完済王',
};

function getTitle(level: number): string {
  const thresholds = Object.keys(TITLES).map(Number).sort((a, b) => b - a);
  for (const threshold of thresholds) {
    if (level >= threshold) return TITLES[threshold];
  }
  return '借金奴隷';
}
```

## 計算ロジック

### 日次利息計算
```
日次利息 = 借金残高 × (年利 / 365)
```

### 今日使える金額
```
月の可処分所得 = 月収 - 固定費 - 今月の返済予定額
今日使える金額 = (月の可処分所得 - 今月の支出済額) / 残り日数
```

### 完済予定日
```
月間返済額 = 全ボスの最低月額返済合計 + 平均繰上返済額
利息を考慮した返済シミュレーション → 残高が0になる月
```
