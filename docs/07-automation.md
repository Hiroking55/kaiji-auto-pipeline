# ⑦ 自動化フロー設計

## 自動化一覧

| # | フロー名 | トリガー | 頻度 |
|---|----------|----------|------|
| 1 | モーニングレポート | Cron 8:00 JST | 毎日 |
| 2 | 利息計算 | Cron 0:00 JST | 毎日 |
| 3 | 返済検知・XP付与 | 返済記録時 | 都度 |
| 4 | 実績チェック | 返済記録時 / 日次 | 都度 |
| 5 | 月初リセット | Cron 毎月1日 | 月次 |

---

## フロー1: モーニングレポート（毎朝 8:00）

```
[GitHub Actions Cron 8:00 JST]
       │
       ▼
[API /api/cron/morning を呼び出し]
       │
       ▼
[Supabase からデータ取得]
  - player テーブル（レベル、XP、連続日数）
  - bosses テーブル（全ボスHP）
  - daily_snapshots テーブル（前日分）
  - payments テーブル（今月分集計）
       │
       ▼
[ログインストリーク更新]
  - last_login を今日に更新
  - login_streak +1
  - デイリーXP +10
       │
       ▼
[今日の数値を計算]
  - 借金残高合計
  - 前日比
  - 今月返済額
  - 今日使える金額
  - 今月残予算
  - 完済予定日
       │
       ▼
[LINE Messaging API でメッセージ送信]
  - Flex Message（リッチ表示）
  - ボスHP、レベル、今日の予算
       │
       ▼
[daily_snapshots にレコード追加]
```

## フロー2: 利息計算（毎日 0:00）

```
[GitHub Actions Cron 0:00 JST]
       │
       ▼
[API /api/cron/interest を呼び出し]
       │
       ▼
[各ボスの日次利息を計算]
  FOR EACH boss WHERE is_defeated = FALSE:
    daily_interest = current_hp * (interest_rate / 100 / 365)
    current_hp += daily_interest (切り上げ)
       │
       ▼
[bosses テーブル更新]
  - current_hp を利息分増加
       │
       ▼
[daily_snapshots に利息額を記録]
```

## フロー3: 返済検知・XP付与

```
[ユーザーが返済を記録（ダッシュボード or LINE）]
       │
       ▼
[API /api/payments POST]
       │
       ▼
[payments テーブルに記録]
       │
       ▼
[boss の current_hp を減算]
  current_hp -= amount
  IF current_hp <= 0:
    is_defeated = TRUE
    defeated_at = NOW()
       │
       ▼
[XP計算・付与]
  IF type == 'normal':
    xp = 100
  IF type == 'extra':
    xp = 200 * (amount / 10000)
  IF boss defeated:
    xp += 1000
       │
       ▼
[レベルアップ判定]
  WHILE xp >= required_xp_for_next_level:
    level += 1
    title = getTitle(level)
       │
       ▼
[実績チェック（フロー4へ）]
       │
       ▼
[LINE通知: 攻撃結果]
  - ダメージ量
  - ボスHP変化
  - 獲得XP
  - レベルアップ（あれば）
  - ボス撃破（あれば）
```

## フロー4: 実績チェック

```
[返済記録時 or 日次実行]
       │
       ▼
[未獲得の実績を全チェック]
  - first_payment: payments が1件以上？
  - streak_3/7/30/100: login_streak >= N？
  - first_boss: bosses WHERE is_defeated = TRUE が1件以上？
  - half_debt: total_debt <= original_total / 2？
  - extra_payment: payments WHERE type='extra' が1件以上？
  - all_bosses: bosses WHERE is_defeated = FALSE が0件？
       │
       ▼
[新規獲得があれば]
  - player_achievements に記録
  - XP報酬を付与
  - LINE通知: 実績解除！
```

## フロー5: 月初リセット（毎月1日）

```
[GitHub Actions Cron 毎月1日 0:05 JST]
       │
       ▼
[API /api/cron/monthly を呼び出し]
       │
       ▼
[月次サマリーを計算]
  - 先月の返済総額
  - 先月のXP獲得量
  - 先月の借金減少額
  - 月間予算達成したか？
       │
       ▼
[月間予算達成チェック]
  IF 達成: +500 XP
       │
       ▼
[LINE通知: 月次レポート]
  - 先月の戦績
  - 今月の目標
  - 完済予定日の更新
```

## GitHub Actions 設定

```yaml
# .github/workflows/debt-game-cron.yml
name: Debt Game Daily

on:
  schedule:
    - cron: '0 15 * * *'    # UTC 15:00 = JST 0:00（利息計算）
    - cron: '0 23 * * *'    # UTC 23:00 = JST 8:00（モーニングレポート）
    - cron: '5 15 1 * *'    # 毎月1日 JST 0:05（月次リセット）
  workflow_dispatch:          # 手動実行

jobs:
  cron:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger cron endpoint
        run: |
          HOUR=$(date -u +%H)
          DAY=$(date -u +%d)
          if [ "$HOUR" = "15" ] && [ "$DAY" = "01" ]; then
            curl -X POST "${{ secrets.APP_URL }}/api/cron/monthly" \
              -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
          elif [ "$HOUR" = "15" ]; then
            curl -X POST "${{ secrets.APP_URL }}/api/cron/interest" \
              -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
          else
            curl -X POST "${{ secrets.APP_URL }}/api/cron/morning" \
              -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
          fi
```

## 将来の自動化拡張

| フェーズ | 自動化 | 説明 |
|----------|--------|------|
| Phase 2 | LINE返済記録 | LINEで「返済 3万」と送るだけで記録 |
| Phase 3 | Money Forward連携 | 引落を自動検知して返済記録 |
| Phase 4 | 予算アラート | 使いすぎ時にLINE警告 |
