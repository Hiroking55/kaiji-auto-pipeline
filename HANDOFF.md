# 引き継ぎドキュメント: kaiji-auto-pipeline

**作成日**: 2026-05-12
**前任者**: Claude (Anthropic)
**オーナー**: 佐野氏 (株式会社職人. オーナー、 映像制作会社経営)
**リポジトリ**: https://github.com/Hiroking55/kaiji-auto-pipeline

---

# 第1部: ビジネス問題定義 (これを理解せずに技術実装するな)

## 1.1 何のためのシステムか

**カイジ編集局 (Youtube動画編集スクール) の Meta 広告運用** を、 正確な KPI (真CV / 真CPA / 系統別 / クリエ別) でリアルタイム可視化する。

オーナーは映像制作会社経営者で、 広告データを毎朝確認しながら配信改善判断を行う。 「正確な数字が即座に見れない」 = 意思決定が遅れる = 損失。

## 1.2 配信構成: 2 系統並走 ⚠️必ず理解すること

| 系統 | 名称 | Meta アカウント (act_) | Business Manager | 運用 |
|---|---|---|---|---|
| **自社** | カイジ編集局 PR | `1487016489469570` | `1940889773201316` | 株式会社職人. (オーナー直営) |
| **外注** | カイジ編集局 | `1058312178767687` | `1048669750377264` | Circle 社 (外注先) |

→ 完全に別の Meta アカウント、 LP 群、 Lstep タグ体系を持つ。 **混同すると数字がズレる**。

## 1.3 中核問題: Meta CV ≠ 実 LINE 登録

**Meta 広告管理画面の「結果 (ウェブサイトの登録完了)」 = LIFF リンククリック時の `fbq('CompleteRegistration')` 発火回数**。 LINE app 側で「友だち追加」 を完了していないユーザーも含まれる。

実例 (2026-05-01〜05-05 UGCキム CR):
| 指標 | 値 |
|---|---|
| Meta側 CV (LIFFクリック発火) | **23件** |
| Lstep側 真CV (LINE登録完了) | **2件** |
| 完了率 | **8.7%** |

→ Meta 側だけ見ると「効率良い CR」 と誤判断。 実際は LP の登録動機が弱い。

**判断基準**: **真CPA = Cost ÷ 真CV** (Lstep の LINE 登録完了数で計算) で評価する。 Meta 側「結果の単価」 は参考値。

## 1.4 KPI 設計 (月次目標)

| 項目 | 値 |
|---|---|
| 月次真CV 目標 | **600件** (2026-04 / 05 / 06) |
| 月次予算 | **¥1,800,000** |
| 真CPA 基準 | **¥3,000** |

ダッシュボードでこれらと実績を対比表示する。

## 1.5 真CV 計算ロジック (2 系統使い分け) 🔴最重要

「真CV」 は同じ概念でも、 **集計に使う Lstep タグが用途で違う**。

### 系統① 流入経路タグ (全体合計用、「本物のCV数」)

| 用途 | タグ名 | 意味 |
|---|---|---|
| 自社 全体真CV | `11.広告(自社運用)` | 自社経由 LINE 登録 全体 |
| 外注 全体真CV | `3.広告` | 外注経由 LINE 登録 全体 |
| Google 広告 (root LP 用) | `18.グーグル検索` | Google 検索流入 (2026-05-12 追加) |

- **1 ユーザー = 1 カウント** (重複なし)
- **佐野将平 (オーナー本人) のテスト登録は自動除外** ⚠️
- **使う場所**: ダッシュボード月次サマリ / 系統別比較 / 日次推移合計 / 週次集計
- **これが「本物のCV数」**

### 系統② metaCR_xxx タグ (クリエ別用)

| 用途 | 列名 |
|---|---|
| 自社クリエ別 真CV | `metaCR_xxx` (suffix なし)、 自社運用フォルダ配下 |
| 外注クリエ別 真CV | `metaCR_xxx_circle` (末尾 `_circle`)、 広告(circle) フォルダ配下 |

- **1 ユーザーが複数 metaCR タグを持つことがある** (複数 CR に反応した場合 = 重複あり)
- **使う場所**: 集計_クリエ別 (CR 間の優劣比較)
- 合計は系統① と一致しない (これは仕様)

### ⚠️ 系統① と系統② の合計は一致しないのが正常

```
[5月実例 (2026-05-11時点)]

月次サマリ (流入経路タグ):
  自社真CV = 51
  外注真CV = 70
  合計真CV = 121  ← 「本物」 のCV数

集計_クリエ別合計 (metaCR_xxx):
  各metaCR_xxx の独立カウント合計 ≠ 121
  (重複ユーザー分、 マッピング表未収録CR分の差異)
```

両方とも「正しい」 が観点が違う。 オーナーに数字差を問われたら「集計軸が違う」 と説明。

---

## 1.6 データパイプライン全体図

```
[L1 ソース]
  Meta API (自社+外注)              Lstep CSV (全タグ込み)
        │                                  │
        ▼                                  ▼
[L2 統合スプシ] 広告統合レポート 2026         ← 旧 Apps Script の中核
   ID: 1oP41cLIJYAVPm7xYfwrkhUjnM_W4je0FN-nqigNN2iQ
   シート:
   - raw_meta_自社, raw_meta_外注 (Meta API 生データ)
   - raw_lstep (Lstep CSV 取込)
   - 集計_日次, 集計_週次, 集計_クリエ別
   - ダッシュボード (月次サマリ表)
   - マッピング表_自社LP (LP → metaCR_SUFFIX 対応)
   - params (月次目標・予算)
        │
        ▼
[L3 可視化] Notion ダッシュボード
   親ページ: 35bafb87-4028-80e9-99ac-dd07e86cf4fc
   ├ DB1 日次推移 (35bafb87-4028-819e-a6d8-f8ccc32ff21e)
   ├ DB2 クリエ別 (35bafb87-4028-811f-b28f-fed466d51ad8)
   └ 月次サマリ KPI カード (真CV / コスト / 真CPA)
```

## 1.7 自動化設計 (旧 Apps Script vs 新 Python)

### 旧 Apps Script (現役、 並行運用中)
| 時刻 | 関数 | プロジェクト | 対象 |
|---|---|---|---|
| 05:00 | `fetchAllToIntegrated` | カイジ｜Metaデータ取得API | raw_meta_自社/外注 |
| 06:00 | `aggregateCreative` (go) | 広告統合レポートNotion同期 | 集計シート + ダッシュボード |
| 07:00 | `syncAllToNotion` | 同上 | Notion DB1/DB2/KPIカード |

Lstep CSV 取込は手動 (スプシメニュー「📁 CSVインポート」 → 「③ Lstep CSV を取込」)。

### 新 Python (このリポジトリ、 Phase 1 完成)
| 時刻 | 動作 |
|---|---|
| JST 00:00 / 12:00 / 18:00 (cron) | Meta API → 集計 → Notion DB1/DB2 |
| `data/lstep/*.csv` push | 即実行 (オーナー手動 upload trigger) |
| `src/**` push | 同上 (コード変更時) |
| workflow_dispatch | 手動実行 |

⚠️ **新 Python は KPI カード未対応**、 真CV を **系統② (metaCR_xxx) しか実装していない** = 「ダッシュボードに表示すべき本物の数字」 が出ない。

---

# 第2部: 現システムのバグと残作業

## 2.1 現状達成

✅ GitHub Actions cron で安定動作
✅ Meta API 取得 + リトライ (code 1/2/4/17 対応、 60〜300秒待機)
✅ Lstep CSV 自動検出 (member_*.csv も OK)
✅ Notion DB1 (日次推移) / DB2 (クリエ別) の自動同期
✅ 60日 Meta API トークン延長

## 2.2 致命的な未達成 (引き継ぎ最優先タスク)

### 🔴 タスク1: 真CV を 系統① (流入経路タグ) ベースで計算する

**現状**: aggregate.py は metaCR_xxx 列ベースで集計 → 系統② = クリエ別用の数字。 これを系統① (流入経路タグ) に変更しないと、 DB1/ダッシュボードに「本物のCV」 が出ない。

**詳細**:
- 系統① には Lstep CSV の `11.広告(自社運用)` / `3.広告` 列が必要
- しかし現状の CSV ヘッダー (行2) には**これらの列が無い**
- 代わりに行1 (カテゴリ行) に内部 ID (タグ_9874470 等) で記述されている

**サンプル CSV 構造** (`data/lstep/member_202605120257_20260512025758.csv`):
```
行1: "登録ID","","","タグ_9874470","タグ_9874469",...,"ID","表示名","友だち追加日時","metaCR_..."
行2: (空行?)
行3+: データ
```

→ **Lstep の出力設定で「タグ名で出力」 にすれば「3.広告」 等の列名が出るはず**。
→ または Lstep 管理画面でタグ ID → タグ名のマッピング表を取得して、 Python で逆引きする。

**実装方針**:
```python
# aggregate.py を以下のように修正
# 1. CSV 行1 のカテゴリ ID と行2 のフィールド名のマッピングを作る
# 2. 系統① タグ (3.広告 / 11.広告(自社運用)) を ID で特定
# 3. 該当列が 1 のレコードをカウント
```

**または、 オーナー側で Lstep 設定変更を依頼するのが王道**:
- Lstep 管理画面 → 友だち情報 → エクスポート設定
- 「タグ名で出力」 / 「IDで出力」 のオプションを探す (恐らく存在する)

### 🔴 タスク2: ダッシュボード KPI カード更新

**現状**: Notion ページ「meta広告 管理ダッシュボード」 の月次サマリ KPI カード 3 つ (真CV / コスト / 真CPA) は旧 Apps Script の `syncKPICardsToNotion` で更新されている。 新 Python は未対応。

**詳細**:
- ダッシュボード親ページ ID: `35bafb87-4028-80e9-99ac-dd07e86cf4fc`
- KPI カードは恐らく **callout block** か **toggle block** の rich_text で表示
- または **別の DB** (例: 「KPI_カード」 DB) のページ

**実装方針**:
```python
# notion_sync.py に追加
def sync_kpi_cards(notion, page_id, summary):
    # Step 1: blocks を取得
    blocks = notion.blocks.children.list(block_id=page_id)
    # Step 2: 「月次サマリ」 配下の callout block を特定
    # Step 3: rich_text に summary['true_cv'], summary['cost'], summary['true_cpa'] を埋め込み更新
```

旧 Apps Script の `syncKPICardsToNotion` (ファイル: dashboard.gs) のコードを直接見て移植するのが最速:
- https://script.google.com/u/0/home/projects/1VXLJMEDPUQEYW_47RxuZZ-z_mzdEENF5Uz-OMl3rQNuL4G40R8ys0Vtx/edit

### 🟡 タスク3: Meta CV カウントの修正

**現状**: Notion DB1 の Meta CV 列が全行 0。

**原因仮説**: aggregate.py の `_get_lead_count` で `actions` の `action_type == "lead"` を集計しているが、 実際の API レスポンスでは `offsite_conversion.fb_pixel_complete_registration` 等の別名の可能性。

**確認方法**: meta_fetch.py 末尾に `print(rows[0].get("actions"))` を追加 → ログで実際の action_type を確認。

旧 Apps Script (コード.gs) では `resultActionType = "lead"` だが、 これでも値が取れている (旧 Notion DB1 にメタCV が入っていた)。 私の Python では取れていない理由は別途調査。

### 🟢 タスク4: 5/12 当日データ反映

**現状**: 5/12 のデータは Notion に未反映 (Meta API は `last_30d` で yesterday まで返す)。 5/13 の cron で 5/12 のメタデータが取れる。

**対処**: 当日データを取りたいなら `date_preset='today'` も並行で叩いて結合する実装に変更。 ただし当日データは Meta 側で未確定 (時間経過で数値が変動)。

---

## 2.3 私が認識ミスしていた点 (引き継ぎ AI への警告)

1. **「真CV 11件」 と報告したが、 これは系統② (クリエ別用) の合計だった**。 本来表示すべきは系統① の 121件。 オーナーは旧ダッシュボードを見比べて即座に「数字が違う」 と気づく。

2. **「自動化完成」 と早合点して報告した** が、 実際には KPI カード未更新でオーナーから「ダッシュボード変わってない」 と指摘された。 動作確認は **Notion ダッシュボード親ページ の表示数値で行う**。 DB1 の数値だけで判断するな。

3. **action_type の検証を怠った**。 旧 Apps Script のコード参照 = `resultActionType = "lead"` を信じたが、 実際の Meta API レスポンスを確認せずに実装。

---

# 第3部: 技術詳細

## 3.1 リポジトリ構造

```
.github/workflows/daily-sync.yml   # cron + push + workflow_dispatch
src/
  main.py            # オーケストレーション
  meta_fetch.py      # Meta Marketing API (リトライロジック付)
  lstep_parse.py     # CSV パース (CP932) + ファイル自動検出
  aggregate.py       # 集計 (現状: metaCR ベース真CV ← 要修正)
  notion_sync.py     # DB1/DB2 更新 (KPI カードは未実装 ← 要追加)
  slack_notify.py    # Webhook 通知 (URL 未設定で OK)
data/lstep/
  .gitkeep
  member_*.csv       # オーナーが上書きアップロード
requirements.txt
.env.template
README.md
HANDOFF.md (このファイル)
```

## 3.2 GitHub Secrets

設定済み: https://github.com/Hiroking55/kaiji-auto-pipeline/settings/secrets/actions

| Name | 値 |
|---|---|
| `FB_ACCESS_TOKEN` | 60日トークン (期限 ~2026-07-11) |
| `FB_AD_ACCOUNT_JISHA` | `1487016489469570` |
| `FB_AD_ACCOUNT_GAICHU` | `1058312178767687` |
| `NOTION_TOKEN` | Integration「広告レポート同期」 のトークン |
| `NOTION_DB_DAILY_ID` | `35bafb87-4028-819e-a6d8-f8ccc32ff21e` |
| `NOTION_DB_CREATIVE_ID` | `35bafb87-4028-811f-b28f-fed466d51ad8` |
| `SLACK_WEBHOOK_URL` | (空。 任意で追加) |

## 3.3 Meta API 関連

- App ID: `1284087023877823` (shokunin-ads-fetcher)
- App Secret: `8f144103bb6e233b1491bce7cbdcd909` (機密！)
- Permissions: `ads_read`, `business_management`
- ピクセル ID: 自社=`26086484864386731` / 外注=`1161776048865888`
- トークン取得: https://developers.facebook.com/tools/explorer/
- 60日延長: https://developers.facebook.com/tools/debug/accesstoken/
- 自動延長 (60日ごと、 ~2026-07-11 期限) はオーナー手動操作

## 3.4 Notion 関連

| ページ/DB | URL/ID |
|---|---|
| ダッシュボード親 | https://www.notion.so/35bafb87402880e999acdd07e86cf4fc |
| DB1 日次推移 | `35bafb87-4028-819e-a6d8-f8ccc32ff21e` |
| DB2 クリエ別 | `35bafb87-4028-811f-b28f-fed466d51ad8` |
| Integration | 「広告レポート同期」 (Internal、 既に DB に接続済) |
| Integration 管理 | https://www.notion.so/profile/integrations |

## 3.5 旧 Apps Script (現役、 触らない)

### プロジェクト1: カイジ｜Metaデータ取得API
- ID: `1pztW_2HUd92o-h5iKwp_LrmWFzvawQ3GLWSfY1YkpQFy83kvs-laQtbM`
- URL: https://script.google.com/u/0/home/projects/1pztW_2HUd92o-h5iKwp_LrmWFzvawQ3GLWSfY1YkpQFy83kvs-laQtbM/edit
- ファイル: コード.gs (main, fetchDailyAdInsights), report.gs (fetchAllToIntegrated)
- 自動トリガー: 毎日 12:40 → 現在 Meta API レート制限で fail 中
- Script Properties: `FB_ACCESS_TOKEN`

### プロジェクト2: 広告統合レポートNotion同期
- ID: `1VXLJMEDPUQEYW_47RxuZZ-z_mzdEENF5Uz-OMl3rQNuL4G40R8ys0Vtx`
- URL: https://script.google.com/u/0/home/projects/1VXLJMEDPUQEYW_47RxuZZ-z_mzdEENF5Uz-OMl3rQNuL4G40R8ys0Vtx/edit
- ファイル: コード.gs (onOpen, importLstep, aggregateCreative), dashboard.gs (`syncAllToNotion`, `syncKPICardsToNotion`, `syncDailyToDB`, `syncCreativeToDB`), debug.gs, refactor_phase1.gs
- 自動トリガー: 毎朝6時 (集計 + 7時 Notion 同期)
- Script Properties: Notion トークン等

### 関連スプシ: 広告統合レポート 2026
- ID: `1oP41cLIJYAVPm7xYfwrkhUjnM_W4je0FN-nqigNN2iQ`
- URL: https://docs.google.com/spreadsheets/d/1oP41cLIJYAVPm7xYfwrkhUjnM_W4je0FN-nqigNN2iQ/edit
- シート: raw_meta_自社, raw_meta_外注, raw_lstep, 集計_日次, 集計_週次, 集計_クリエ別, ダッシュボード, マッピング表_自社LP, params

## 3.6 LP (LP インフラ)

- XServer SSH: `ssh xserver-shokunin`
- 自社運用版 LP 群: `~/shokunin-movie.com/public_html/lp-jisha/`
- 外注運用版 LP 群: `~/shokunin-movie.com/public_html/lp2-*/`
- ルート LP: `~/shokunin-movie.com/public_html/index.html`

## 3.7 開発・テスト方法

```bash
# ローカル開発
cd ~/Downloads/kaiji-auto-pipeline
cp .env.template .env  # 編集 (GitHub Secrets と同じ値)
pip install -r requirements.txt
python src/main.py

# GitHub にデプロイ
git add -A
git commit -m "feat: ..."
git push
# → Actions が自動実行 (push trigger)

# 手動テスト
# https://github.com/Hiroking55/kaiji-auto-pipeline/actions/workflows/daily-sync.yml
# → 「Run workflow」 ボタン
```

---

# 第4部: オーナーとの付き合い方

## 4.1 オーナーの性格・要望

- **急いでいる**、 待つのが嫌い (「待ちくたびれた」「適当すぎない？」 等の発言あり)
- **簡潔な進捗報告** を求める。 1 メッセージで完結。
- **「達成」 と報告するなら、 自分で実際に画面確認してから**。 確認せず「完了」 と報告するとブチ切れる。
- **代行を希望** (「もう代行で全部やって」 と複数回発言)。 私 (Claude) ができる限り代行、 オーナーの操作は最小限に。
- **A/B/C の選択肢提示** は好む。 長文の説明より、 明確な選択肢。
- **数字の不一致に敏感**。 旧ダッシュボードと新システムで数字が違うと即座に指摘。

## 4.2 コミュニケーションのコツ

- 長い指示は NG、 1 ステップずつ
- スクリーンショット併用で位置を明示 (「右下のボタン」 等の曖昧表現は避ける)
- isTrusted 制限などの技術的言い訳は控えめに
- 「できない」 ではなく「これでやれる」 を提示
- 「すみません」 は時々使う (失敗時)、 ただし連発は避ける
- **完了報告は実際に確認してから** (DB に値が入った、 ダッシュボードに反映、 を目視確認)

## 4.3 直近で発生した不満

オーナーがブチ切れたポイント (改善必要):
1. 「fetchAllToIntegrated を選択してください」 と指示したが、 そのプロジェクトには存在しない関数だった (関数名を確認せず指示)
2. 「達成」 と報告した後、 オーナーが画面確認すると 5/11 / 5/12 が無かった (確認せず報告)
3. メニュー click が dispatch event で動かないのを「Google Sheets の仕様」 と長々説明 (オーナーは結論を求めていた)

---

# 第5部: Lstep CSV エクスポート手順 (オーナー用)

CSV 取込のたびにこれを実行。

## 5.1 Lstep からダウンロード

1. Lステップ管理画面 → 友だち情報 → エクスポート
2. **必須タグを全選択**:
   - 流入経路 (重要、 系統①真CVに必須):
     - `3.広告` (外注)
     - `11.広告(自社運用)` (自社)
     - `18.グーグル検索` (root LP 用、 2026-05-12 追加)
   - クリエイティブ別 (系統② に必須):
     - 自社運用フォルダ配下の `metaCR_*` (全部)
     - 広告(circle) フォルダ配下の `metaCR_*` (全部)
3. **「タグ名で出力」** オプションを ON にする (もし「ID で出力」 がデフォルトなら変更)
4. CSV ダウンロード

## 5.2 GitHub にアップロード

1. ブラウザで開く: https://github.com/Hiroking55/kaiji-auto-pipeline/upload/main/data/lstep
2. CSV ファイルをドラッグ&ドロップ (ファイル名はそのまま OK)
3. 「Commit changes」 をクリック
4. → Push 即時に GitHub Actions が走り、 数分後 Notion 更新

---

# 第6部: 関連メモリ (Claude セッション保管)

引き継ぎ AI が前任 Claude のメモリにアクセスできる場合の参照先:
`/Users/sano/.claude/projects/-Users-sano-Downloads/memory/`

| ファイル | 内容 |
|---|---|
| `project_kaiji_dashboard_pipeline.md` | 全体パイプライン図 (本書1.6 と同等) |
| `reference_kaiji_two_systems.md` | 自社/外注 二系統並走 (本書1.2 と同等) |
| `reference_integrated_report_2026.md` | スプシ構造詳細 |
| `reference_lstep_csv_export_tags.md` | Lstep CSV 必須タグ詳細 |
| `reference_lstep_csv_format.md` | CSV エンコーディング (CP932) と列構造 |
| `reference_lstep_tag_taxonomy.md` | Lstep タグ4機能 |
| `feedback_meta_cv_definition.md` | Meta CV ≠ 実LINE登録 (本書1.3 と同等) |
| `reference_real_cv_calculation_logic.md` | 真CV 計算ロジック 2系統 (本書1.5 と同等) |
| `reference_meta_api_setup.md` | Meta API トークン管理 |
| `project_kaiji_test_registrations.md` | 佐野将平のテスト登録除外 |
| `reference_kaiji_kpi_sheet.md` | KPI スプシ (自社版) |
| `reference_kaiji_gaichu_kpi.md` | KPI スプシ (外注版) |
| `reference_lp_inventory.md` | LP 一覧 |
| `reference_xserver.md` | XServer SSH 情報 |

---

# 第7部: チェックリスト (引き継ぎ AI 用)

着手前に確認:
- [ ] 第1部 (ビジネス問題定義) を全部読んだ
- [ ] 自社 = act_1487016489469570 / 外注 = act_1058312178767687 を頭に入れた
- [ ] Meta CV ≠ 真CV を理解した
- [ ] 真CV 2 系統 (流入経路 vs metaCR) の使い分けを理解した
- [ ] 月次目標 (600件 / ¥1,800,000 / ¥3,000) を頭に入れた
- [ ] 佐野将平のテスト登録は系統①で自動除外されると理解した
- [ ] 旧 Apps Script は触らない (並行運用) と理解した

実装着手:
- [ ] Lstep CSV 出力設定 (オーナーに「タグ名で出力」 の確認/変更を依頼)
- [ ] aggregate.py を 流入経路タグベース に変更 (系統① 真CV)
- [ ] notion_sync.py に KPI カード更新ロジック追加
- [ ] meta_fetch.py で actions 生データを確認 → action_type を正しいものに修正

完了確認:
- [ ] Notion ダッシュボード親ページ の「月次サマリ」 KPI カードが更新されている
- [ ] 真CV の数字が旧 Apps Script (121件付近) と概ね一致する
- [ ] Meta CV が 0 ではなく適切な数値
- [ ] オーナーに「確認してください」 と依頼、 実際に納得確認を得る

---

**Good luck. オーナーは厳しいが、 正確な仕事には満足する。 🍀**
