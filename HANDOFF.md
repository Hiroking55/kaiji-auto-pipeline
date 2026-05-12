# 引き継ぎドキュメント: kaiji-auto-pipeline

**作成日**: 2026-05-12 (深夜〜夜の作業)
**前任者**: Claude (Anthropic)
**オーナー**: 佐野氏 (株式会社職人. オーナー、 映像制作会社経営)

---

## 🎯 プロジェクト目的

カイジ編集局の広告データを **完全自動でNotionダッシュボードに反映** する。
旧 Apps Script ベースのフロー (Web UI 操作必須、 関数解析バグ、 6分タイムアウト等の問題) を廃して、 GitHub Actions + Python で自走するシステムへ移行中。

---

## 📊 現状サマリ

### ✅ 達成済み (Phase 1 完成)
- GitHub Actions cron (JST 00:00 / 12:00 / 18:00) + push trigger で自動実行
- Meta Marketing API データ取得 (自社/外注 両アカウント)
- Lstep CSV 自動検出 + CP932 パース (latest.csv 強制不要)
- 集計: 日次合計 / 系統別 (自社/外注/合計) / クリエ別
- Notion DB1 (日次推移) / DB2 (クリエ別) 自動更新
- Meta API レート制限リトライ (最大6回、 60〜300秒待機、 code 1/2/4/17 対応)
- 60日 Meta API トークン延長済 (期限 ~2026-07-11)

### ❌ 未達成 (引き継ぎ要)

| # | 課題 | 影響度 |
|---|---|---|
| 1 | **ダッシュボード KPI カード未更新** | 🔴 最重要 |
| 2 | **真CV 計算の不一致** (Python 11件 vs 旧 Apps Script 121件) | 🔴 重要 |
| 3 | Notion DB1 の Meta CV が 0 表示 | 🟡 |
| 4 | 5/12 のデータ未反映 (Meta API は yesterday まで取得) | 🟢 (明日 cron で解決) |

---

## 📁 リポジトリ情報

- **URL**: https://github.com/Hiroking55/kaiji-auto-pipeline
- **GitHub user**: Hiroking55
- **Branch**: main
- **ローカル**: `~/Downloads/kaiji-auto-pipeline/`
- **Remote**: `git@github.com:Hiroking55/kaiji-auto-pipeline.git` (SSH 設定済み)
- **Visibility**: Private

### ファイル構成
```
.github/workflows/daily-sync.yml   # cron + push + workflow_dispatch
src/
  main.py            # オーケストレーション
  meta_fetch.py      # Meta Marketing API (リトライロジック付)
  lstep_parse.py     # CSV パース (CP932) + ファイル自動検出
  aggregate.py       # 集計 (現状: metaCR ベース真CV)
  notion_sync.py     # DB1 / DB2 更新 (KPI カードは未実装)
  slack_notify.py    # Webhook 通知 (URL 未設定で OK)
data/lstep/
  .gitkeep
  member_*.csv       # オーナーがアップロード
requirements.txt
.env.template
README.md
```

---

## 🔑 認証情報

### GitHub Secrets
設定済み: https://github.com/Hiroking55/kaiji-auto-pipeline/settings/secrets/actions

| Name | 値 |
|---|---|
| `FB_ACCESS_TOKEN` | 60日トークン (期限 ~2026-07-11) |
| `FB_AD_ACCOUNT_JISHA` | `1487016489469570` |
| `FB_AD_ACCOUNT_GAICHU` | `1058312178767687` |
| `NOTION_TOKEN` | Integration「広告レポート同期」 のトークン |
| `NOTION_DB_DAILY_ID` | `35bafb87-4028-819e-a6d8-f8ccc32ff21e` (日次推移) |
| `NOTION_DB_CREATIVE_ID` | `35bafb87-4028-811f-b28f-fed466d51ad8` (クリエ別) |
| `SLACK_WEBHOOK_URL` | (空。 任意で追加) |

### Meta API 関連
- App ID: `1284087023877823` (shokunin-ads-fetcher)
- Permissions: `ads_read`, `business_management`
- アカウント: act_1487016489469570 (自社), act_1058312178767687 (外注)
- トークン取得: https://developers.facebook.com/tools/explorer/
- 60日延長: https://developers.facebook.com/tools/debug/accesstoken/

### Notion
- Workspace: やまtakaさんのスペース
- Integration: 「広告レポート同期」 (Internal、 既に DB1/DB2 に接続済)
- Integration 管理: https://www.notion.so/profile/integrations

---

## 🌐 重要な Notion URL

| ページ | URL |
|---|---|
| ダッシュボード親 | https://www.notion.so/35bafb87402880e999acdd07e86cf4fc |
| DB1 日次推移 (2026-05) | https://www.notion.so/35bafb874028819ea6d8f8ccc32ff21e |
| DB2 クリエ別 | (DB ID: 35bafb87-4028-811f-b28f-fed466d51ad8) |
| (ダッシュボード内に KPI カード 3つ + 月次サマリブロック) | - |

### ダッシュボード構造 (要解析)
```
meta広告 管理ダッシュボード
├─ 🗓 日次推移 (2026-05)  ← DB1
├─ 🎯 クリエ別 (2026-05)  ← DB2
├─ 🤖[BOT-AUTO-SYNC] 更新: タイムスタンプ
└─ 📊 月次サマリ (5月)  ← ★KPI カード (未更新)
   ├─ 🎯 真CV (月次・自外合計): 121 件
   ├─ 💰 コスト (月次・自外合計): ¥747,465
   └─ 💰 真CPA (月次・自外合計): ¥6,177 (基準 ¥3,000)
```

これらの KPI 値は旧 Apps Script の `syncKPICardsToNotion` で更新されている。 新システム未対応。

---

## 🔍 既知の問題と原因分析

### 問題1: ダッシュボード KPI カード未更新

**現状**: 月次サマリのカード3つは旧 Apps Script の値のまま (2026-05-12 19:02 更新)。

**原因**: 私の Python は DB1/DB2 だけ更新。 KPI カード (Notion ページ内の callout/embed/別DB) は未対応。

**解決方針**:
```python
# Step 1: ダッシュボードページの blocks を取得
blocks = notion.blocks.children.list(block_id="35bafb87-4028-80e9-99ac-dd07e86cf4fc")

# Step 2: 「月次サマリ」 配下の block を特定 (callout 等)
# Step 3: blocks.update で rich_text を書き換え
# または 子 DB がある場合は database query → update_page
```

旧 Apps Script のコード (`syncKPICardsToNotion` 関数) は以下で見える:
- Apps Script Editor: https://script.google.com/u/0/home/projects/1VXLJMEDPUQEYW_47RxuZZ-z_mzdEENF5Uz-OMl3rQNuL4G40R8ys0Vtx/edit
- ファイル: dashboard.gs

これを Python に移植するのが最速。

### 問題2: 真CV 計算の不一致

**現状**: Python = 11件、 旧 Apps Script = 121件 (約10倍差)

**原因**: 計算ロジックが違う
- 旧 Apps Script: 流入経路タグ「3.広告」「11.広告(自社運用)」 = 1 のレコードをカウント
- Python: metaCR_xxx 列 = 1 のレコードをカウント

そして Lstep CSV の構造に問題:
- 行1: "登録ID", "", "", **"タグ_9874470"**, "タグ_9874469", ..., "ID", "表示名", "友だち追加日時", "metaCR_..."
- 行2: 行1の続き (列ヘッダー)
- 行3+: データ

つまり、 **流入経路タグは内部 ID (タグ_9874470 等) で出力されており**、 列名で「3.広告」 を直接検索できない。

**解決方針**:
A. **Lstep の出力設定変更** (オーナー操作): タグ名で出力するように Lstep 管理画面で設定
B. **タグ ID → 名前マッピング** を持つ: Apps Script では何らかのマッピングを使っている可能性
C. **metaCR_xxx ロジックを正確化**: マッピング表で「自社/外注」 を明示判定

最も実用的なのは A。 ただし Lstep の設定変更権限が必要。

### 問題3: Notion DB1 の Meta CV が 0

**現状**: DB1 の Meta CV 列が全行 0。

**原因**: aggregate.py の `_get_lead_count` で actions の `action_type == "lead"` を集計しているが、 実際の Meta API レスポンスでは別 action_type の可能性。

**確認手段**: Meta API レスポンスの actions の中身を console 出力する debug を追加。

```python
# meta_fetch.py の末尾に debug 用
if rows:
    print("DEBUG: actions sample:", rows[0].get("actions"))
```

`offsite_conversion.fb_pixel_lead` 等の name の可能性大。

---

## 📦 旧 Apps Script (現役)

### プロジェクト
1. **カイジ｜Metaデータ取得API** (Meta API 取得側)
   - URL: https://script.google.com/u/0/home/projects/1pztW_2HUd92o-h5iKwp_LrmWFzvawQ3GLWSfY1YkpQFy83kvs-laQtbM/edit
   - ファイル: コード.gs (main 関数), report.gs (fetchAllToIntegrated)
   - 自動トリガー: 毎日 12:40 (時間主導型)

2. **広告統合レポートNotion同期** (集計 + Notion 同期側)
   - URL: https://script.google.com/u/0/home/projects/1VXLJMEDPUQEYW_47RxuZZ-z_mzdEENF5Uz-OMl3rQNuL4G40R8ys0Vtx/edit
   - ファイル: コード.gs (onOpen, importLstep 等), dashboard.gs (syncAllToNotion, syncKPICardsToNotion), debug.gs, refactor_phase1.gs
   - 自動トリガー: 毎朝6時 (集計 + 7時 Notion 同期)

### 関連スプシ
- **広告統合レポート 2026**: `1oP41cLIJYAVPm7xYfwrkhUjnM_W4je0FN-nqigNN2iQ`
  - URL: https://docs.google.com/spreadsheets/d/1oP41cLIJYAVPm7xYfwrkhUjnM_W4je0FN-nqigNN2iQ/edit
  - シート: raw_meta_自社, raw_meta_外注, raw_lstep, 集計_クリエ別, 集計_日次, 集計_週次, ダッシュボード
  - カスタムメニュー: 「📁 CSVインポート」 → 「⑤ Notionへ即時同期」 等

### 移行ステータス
- 並行運用中。 新 (Python) システムが安定するまで旧も維持。
- 旧 Apps Script を停止する判断は、 新システムが完全機能 (KPI カード含む) してから。

---

## 🚀 引き継ぎ AI への作業指示

### 優先順位 (上から順に)

#### 1. KPI カード更新の実装 🔴最重要

```python
# notion_sync.py に追加
def sync_kpi_cards_to_dashboard(notion, page_id, summary):
    """ダッシュボードページの月次サマリ KPI カードを更新"""
    blocks = notion.blocks.children.list(block_id=page_id)
    # ... 月次サマリ block を特定して update
```

旧 Apps Script の dashboard.gs の `syncKPICardsToNotion` を参考に移植。

#### 2. 真CV 計算の正確化

オーナーに Lstep の出力設定変更 (タグ名出力) を依頼するか、 マッピング表を Notion DB として用意して Python で参照する。

#### 3. Meta CV の正しい計算

`actions` の生データを確認 → 正しい action_type を `_get_lead_count` で使う。

---

## 💬 オーナーの性格・要望

- **急いでいる**、 待つのが嫌い (「待ちくたびれた」「適当すぎない？」 等の発言あり)
- **簡潔な進捗報告** を求める
- **自分で確認しない** で「達成」 と報告するのを嫌う (必ず実際に画面で確認)
- **代行を希望** ("もう代行で全部やって")
- **ABの選択肢提示** は好む

### コミュニケーションのコツ
- 長い指示はNG、 1ステップずつ
- スクリーンショット併用で位置を明示
- isTrusted 制限などの技術的言い訳は控えめに

---

## 📚 関連メモリ (Claude セッション保管)

Mac のローカル: `/Users/sano/.claude/projects/-Users-sano-Downloads/memory/`

| ファイル | 内容 |
|---|---|
| `project_kaiji_dashboard_pipeline.md` | 全体パイプライン図 |
| `reference_integrated_report_2026.md` | スプシ構造 + Apps Script トリガー |
| `reference_lstep_csv_export_tags.md` | Lstep CSV 必須タグ |
| `reference_kaiji_two_systems.md` | 自社/外注 二系統並走 |
| `feedback_meta_cv_definition.md` | Meta CV ≠ 実LINE登録 |
| `reference_meta_api_setup.md` | Meta API トークン管理 |
| `reference_lstep_tag_taxonomy.md` | Lstep タグ4機能 |
| `reference_real_cv_calculation_logic.md` | 真CV 計算ロジック2系統 |

---

## 🛠 開発環境

```bash
# ローカル開発
cd ~/Downloads/kaiji-auto-pipeline
cp .env.template .env  # 編集
pip install -r requirements.txt
python src/main.py

# GitHub にデプロイ
git add -A
git commit -m "feat: ..."
git push
# → Actions が自動実行 (push trigger)

# 手動テスト
# https://github.com/Hiroking55/kaiji-auto-pipeline/actions/workflows/daily-sync.yml
# → Run workflow ボタン
```

---

## 📞 サポート連絡先

- オーナー: 佐野氏 (株式会社職人.)
- GitHub: @Hiroking55
- Notion: ururu.shohei0817@gmail.com

---

## ⚠️ 注意事項

1. **トークン情報** は GitHub Secrets / Notion Integration 設定で管理。 コードや HANDOFF.md に直書き禁止。
2. **本番 Notion DB** に直接書き込むため、 テスト時は Run workflow ボタンで慎重に。
3. **Meta API レート制限** に注意。 短時間で複数回 main 実行すると失敗する (リトライで自動復旧するが時間かかる)。
4. **旧 Apps Script は触らない** (並行運用中。 値の不一致を悪化させる)。

---

**Good luck! 🍀**
