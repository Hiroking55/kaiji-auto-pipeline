# ⑧ 実装ロードマップ

## フェーズ構成

| Phase | 名前 | 内容 | 期間 |
|-------|------|------|------|
| 0 | プロジェクト初期化 | Next.js + Supabase + 基盤構築 | Day 1 |
| 1 | コアゲームエンジン | ボス・XP・レベル計算ロジック | Day 1-2 |
| 2 | ダッシュボードUI | メイン画面・ボス画面・ステータス | Day 2-3 |
| 3 | 返済記録機能 | 攻撃（返済）入力・履歴表示 | Day 3 |
| 4 | LINE通知 | Messaging API連携・自動通知 | Day 4 |
| 5 | 自動化Cron | GitHub Actions・利息計算・モーニングレポート | Day 4-5 |
| 6 | PWA化 | iPhoneホーム画面対応 | Day 5 |
| 7 | デプロイ | Vercel + Supabase本番環境 | Day 5 |

---

## Phase 0: プロジェクト初期化（Day 1）

- [ ] Next.js 14 (App Router) プロジェクト作成
- [ ] TypeScript設定
- [ ] Tailwind CSS設定
- [ ] Supabase クライアント設定
- [ ] テーブル作成SQL
- [ ] 環境変数テンプレート
- [ ] ディレクトリ構造確定

```
debt-game/
├── app/
│   ├── layout.tsx          # ルートレイアウト（ダークテーマ）
│   ├── page.tsx            # ダッシュボード（ホーム）
│   ├── battle/[id]/page.tsx # ボスバトル画面
│   ├── status/page.tsx     # ステータス画面
│   ├── record/page.tsx     # 返済記録画面
│   ├── setup/page.tsx      # 初期設定画面
│   └── api/
│       ├── payments/route.ts
│       ├── bosses/route.ts
│       ├── player/route.ts
│       └── cron/
│           ├── morning/route.ts
│           ├── interest/route.ts
│           └── monthly/route.ts
├── lib/
│   ├── supabase.ts         # Supabaseクライアント
│   ├── game-engine.ts      # XP・レベル計算
│   ├── interest.ts         # 利息計算
│   ├── budget.ts           # 予算計算
│   ├── line.ts             # LINE通知
│   └── types.ts            # 型定義
├── components/
│   ├── BossCard.tsx         # ボスカード
│   ├── HpBar.tsx            # HPバー
│   ├── XpBar.tsx            # XPバー
│   ├── StatCard.tsx         # ステータスカード
│   ├── NavBar.tsx           # 下部ナビ
│   └── PaymentForm.tsx      # 返済フォーム
└── public/
    └── manifest.json        # PWAマニフェスト
```

## Phase 1: コアゲームエンジン（Day 1-2）

- [ ] 型定義 (Player, Boss, Payment, Achievement)
- [ ] XP計算ロジック
- [ ] レベルアップ判定
- [ ] 称号マッピング
- [ ] 利息計算（日割り）
- [ ] 予算計算（今日使える金額）
- [ ] 完済予定日シミュレーション
- [ ] 実績判定ロジック

## Phase 2: ダッシュボードUI（Day 2-3）

- [ ] ダークテーマ・RPG風レイアウト
- [ ] メインダッシュボード
  - レベル・XPバー
  - 借金残高カード
  - 4つのスタッツカード
  - ボス一覧（HPバー付き）
- [ ] ボスバトル画面
  - ボス詳細表示
  - バトルログ
  - 攻撃ボタン
- [ ] ステータス画面
  - 称号コレクション
  - 実績一覧

## Phase 3: 返済記録機能（Day 3）

- [ ] 返済フォーム（ボス選択・金額・日付・種類）
- [ ] API: POST /api/payments
- [ ] ボスHP更新
- [ ] XP付与
- [ ] 実績チェック
- [ ] 攻撃履歴表示

## Phase 4: LINE通知（Day 4）

- [ ] LINE Messaging API設定
- [ ] Webhook受信エンドポイント
- [ ] Flex Messageテンプレート
  - モーニングレポート
  - 攻撃結果
  - ボス撃破
  - 実績解除
  - 月次レポート

## Phase 5: 自動化Cron（Day 4-5）

- [ ] API: /api/cron/morning
- [ ] API: /api/cron/interest
- [ ] API: /api/cron/monthly
- [ ] GitHub Actions workflow

## Phase 6: PWA化（Day 5）

- [ ] manifest.json
- [ ] Service Worker
- [ ] アイコン設定
- [ ] iPhoneホーム画面追加テスト

## Phase 7: デプロイ（Day 5）

- [ ] Vercelプロジェクト作成
- [ ] Supabase本番DB作成
- [ ] 環境変数設定
- [ ] 動作確認
- [ ] 初期データ投入

---

## 今回のセッションでの実装範囲

Phase 0〜3 を実装（コアアプリ完成）:
- ゲームエンジン
- 全画面UI
- 返済記録機能
- ローカルで動作確認可能な状態

Phase 4〜7 はデプロイ先の準備が必要なため、コード準備まで:
- LINE通知のコード
- Cronエンドポイントのコード
- PWA設定ファイル
- デプロイ手順書
