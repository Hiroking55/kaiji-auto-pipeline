# kaiji-auto-pipeline

カイジ広告 自動データパイプライン (Meta API + Lstep CSV → Notion ダッシュボード)

## 🎯 これは何

毎日の広告データを Meta Marketing API から自動取得し、
Lstep からエクスポートした CSV と組み合わせて集計し、
Notion ダッシュボード (DB1 日次推移 / DB2 クリエ別) を自動更新するシステムです。

旧 Apps Script の役割を完全に置き換えます。

---

## 🔄 オーナーの操作手順 (Lstep CSV 取込)

### 1. Lステップから CSV エクスポート
1. Lステップ管理画面 → 友だち情報 → エクスポート
2. **必須タグを全選択**:
   - 流入経路: `3.広告` / `11.広告(自社運用)`
   - 自社運用フォルダ配下の `metaCR_*` (全部)
   - 広告(circle) フォルダ配下の `metaCR_*` (全部)
3. CSV ダウンロード

### 2. GitHub にアップロード
1. このリポジトリの `data/lstep/` を開く
2. 「Add file → Upload files」
3. ダウンロードした CSV を **`latest.csv` という名前で** ドラッグ&ドロップ
   - もし元の CSV ファイル名が違う場合は、 Web UI のファイル名欄を `latest.csv` に書換
4. 「Commit changes」 で push

→ Push 即時に GitHub Actions が走り、 数分後に Notion で **合計値・系統別・CR別** が更新されます。

---

## ⏰ 自動実行スケジュール

- **1日3回 cron**: JST 00:00 / 12:00 / 18:00 → Meta API データ取得 + Notion 更新
- **Push trigger**: `data/lstep/` 更新時に即実行
- **手動**: GitHub Actions の「Run workflow」 ボタン

Lstep CSV を新しく取り込みたい時は、 アップロード → Commit するだけ。 cron 待ちは不要。

---

## 🔧 セットアップ (初回のみ)

### 1. GitHub Secrets 設定

リポジトリの Settings → Secrets and variables → Actions → New repository secret で以下を追加:

| Secret 名 | 値 |
|---|---|
| `FB_ACCESS_TOKEN` | Meta Marketing API トークン (60日延長) |
| `FB_AD_ACCOUNT_JISHA` | `1487016489469570` (自社) |
| `FB_AD_ACCOUNT_GAICHU` | `1058312178767687` (外注) |
| `NOTION_TOKEN` | Notion Integration トークン |
| `NOTION_DB_DAILY_ID` | DB1 (日次推移) の ID |
| `NOTION_DB_CREATIVE_ID` | DB2 (クリエ別) の ID |
| `SLACK_WEBHOOK_URL` | (任意) Slack 通知 Webhook URL |

#### Notion Integration トークン取得手順
1. https://www.notion.so/my-integrations へ
2. 「New integration」 → 名前「kaiji-auto-pipeline」 → 作成
3. 「Internal Integration Token」 をコピー → `NOTION_TOKEN` に設定
4. Notion の DB1 / DB2 ページで「・・・→ Add connections → kaiji-auto-pipeline」 を選択
   - これで Integration が DB を操作可能に

#### Meta API トークン取得
- Graph API Explorer (https://developers.facebook.com/tools/explorer/) で 60日トークン発行
- 期限切れたら同様の手順で更新 (60日ごと)

### 2. 初回テスト

1. GitHub Actions タブ → Daily Sync → 「Run workflow」 をクリック
2. ログを確認
3. Notion ダッシュボードに反映されているか確認

---

## 💻 ローカル開発

```bash
# 依存インストール
pip install -r requirements.txt

# .env をコピーして編集
cp .env.template .env
# .env に各 API キーを入力

# 実行
python src/main.py
```

---

## 📁 ファイル構成

```
.
├── .github/workflows/daily-sync.yml   # GitHub Actions
├── src/
│   ├── main.py              # オーケストレーション
│   ├── meta_fetch.py        # Meta Marketing API
│   ├── lstep_parse.py       # CSV パース (CP932)
│   ├── aggregate.py         # 集計ロジック
│   ├── notion_sync.py       # Notion API 更新
│   └── slack_notify.py      # Slack 通知
├── data/lstep/
│   └── latest.csv           # ← オーナーがここに上書き push
├── requirements.txt
├── .env.template
├── .gitignore
└── README.md
```

---

## 🚀 既存 Apps Script からの移行

| 旧 (Apps Script) | 新 (このリポ) |
|---|---|
| カイジ｜Metaデータ取得API: fetchAllToIntegrated | `src/meta_fetch.py` |
| 広告統合レポートNotion同期: aggregateAllV3 | `src/aggregate.py` |
| 広告統合レポートNotion同期: syncAllToNotion | `src/notion_sync.py` |
| Apps Script トリガー (1日3回) | GitHub Actions cron |

並行運用 1 週間 → 問題なければ Apps Script トリガー停止。

---

## ⚠️ トラブルシューティング

### Meta API: "Application request limit reached"
- 一時的なレート制限。 自動リトライ済み (最大5回、 各30〜150秒待機)。
- 1時間後に手動再実行: GitHub Actions → Daily Sync → Run workflow

### Meta API: "OAuthException code:190"
- トークン期限切れ。 Graph API Explorer で 60日トークン発行 → `FB_ACCESS_TOKEN` 更新。

### Notion: "Could not find database"
- Integration が DB に接続されていない。 Notion の DB ページ → 接続を追加。

### Lstep CSV パース失敗
- エンコーディング (CP932) を確認。 ファイル名は必ず `latest.csv`。

---

## 📞 サポート

エラー時の Slack 通知:
```
❌ パイプライン失敗 (2026-05-12 12:00:00 JST)
[エラー詳細]
```

通知が無い = 成功 (Slack Webhook 未設定なら GitHub Actions の失敗メールで通知)。
