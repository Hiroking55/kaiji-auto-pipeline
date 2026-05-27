# LINE通知セットアップ手順

Debt HunterからLINEに毎朝リマインダーが届くようにする設定。

## 1. LINE Developersアカウント作成

1. https://developers.line.biz/ にアクセス
2. LINEアカウントでログイン
3. 「プロバイダー」を作成（名前は何でもOK）

## 2. Messaging APIチャネル作成

1. プロバイダー内で「新規チャネル作成」→「Messaging API」
2. 以下を入力:
   - チャネル名: `Debt Hunter`
   - チャネル説明: `借金討伐リマインダー`
   - 大業種: `個人`
   - 小業種: `個人（その他）`
3. 作成したら「Messaging API設定」タブへ
4. **チャネルアクセストークン（長期）** を発行 → コピー
5. 画面下部のQRコードで **自分のLINEに友だち追加**

## 3. 自分のLINE User ID確認

1. 「チャネル基本設定」タブ
2. 「あなたのユーザーID」をコピー（U始まりの長い文字列）

## 4. GitHubにシークレット設定

1. https://github.com/Hiroking55/kaiji-auto-pipeline/settings/secrets/actions にアクセス
2. 「New repository secret」で以下を2つ追加:

| Name | Value |
|------|-------|
| `LINE_CHANNEL_TOKEN` | チャネルアクセストークン（長期） |
| `LINE_USER_ID` | あなたのユーザーID（U始まり） |

## 5. 動作確認

1. https://github.com/Hiroking55/kaiji-auto-pipeline/actions にアクセス
2. 「LINE Daily Reminder」ワークフロー → 「Run workflow」で手動実行
3. LINEにメッセージが届けばOK！

## 通知スケジュール

- **毎朝8:00（日本時間）** に自動送信
- 曜日ごとに異なるメッセージ
- アプリへのリンク付き
