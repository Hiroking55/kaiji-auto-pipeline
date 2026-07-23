# 09. ブラウザ操作AIで広告出稿する（Playwright MCP セットアップ）

カイジ編集局の広告出稿マニュアル（DGキャンペーンをAIがブラウザ操作で代行）を、
Claude Code から実行できるようにするための設定です。
リポジトリ直下の `.mcp.json` に **Playwright MCP** サーバーを定義済み。

> この設定を入れると、Claude に「ページを開く / クリック / 入力 / スクショ」の手足が付きます。
> ただし **ログイン（パスワード・2段階）はオーナーが手動で1回だけ**行います。AIは触れません（マニュアル厳守）。

---

## 動く条件は3つ（全部そろって初めて出稿できる）

1. **ブラウザ操作の手段** … `.mcp.json` の Playwright MCP（このリポジトリで用意済み ✅）
2. **ネットワークが対象サイトに到達できる** … 下の「許可が必要なホスト」参照
3. **事前ログイン済みブラウザ** … オーナーがGoogleに1回ログイン（AIは2段階に触れない）

### ⚠️ 実行環境の選び方
- **ローカル / 個人のClaude Code = そのまま動く（推奨）**。家庭/社内ネットは自由で、実ブラウザにログインできるため。
- **claude.ai/code のweb版（クラウド実行環境）= 追加設定が要る**。ネットワークが許可リスト型で
  `ads.google.com` などが遮断されるため、環境のネットワークポリシーで下記ホストを許可する必要がある
  （環境作成時の設定 / 参照: https://code.claude.com/docs/en/claude-code-on-the-web ）。

---

## 使い方（ローカル / 個人のClaude Code）

1. このリポジトリを開いて Claude Code を起動。
2. 初回、Claude Code が `.mcp.json` の `playwright` サーバーの利用可否を確認 → 許可。
3. Claude に「Google広告を開いて」と頼むと、ヘッド付き Chrome が `./.browser-profile` プロファイルで起動。
4. **オーナーがその画面でGoogleにログイン（メール・パスワード・2段階）**。
   → 以後このプロファイルにログインが保持されるので、毎回のログインは不要。AIはログイン操作をしない。
5. ログイン済み状態で、`docs/kaiji_campaign_build_sheet.md` の作業シートを Claude に渡して出稿を進める。

> `.browser-profile/` はログインCookieを含むため **`.gitignore` 済み**。絶対にコミットしないこと。

### 代替：既に開いている自分のChromeに接続する（CDP）
既存のログイン済みChromeをそのまま使いたい場合：

```bash
# 1) 自分のChromeをデバッグポート付きで起動（普段のプロファイルでログイン済みならそのまま使える）
#    ※ 実行前に既存のChromeは一旦終了しておく
google-chrome --remote-debugging-port=9222

# 2) .mcp.json の args を CDP 接続に変更
#    "--browser","chrome" と "--user-data-dir","./.browser-profile" を外して:
#    "--cdp-endpoint","http://localhost:9222"
```

---

## 許可が必要なホスト（クラウド環境でネットワークを開ける場合）

| 用途 | ホスト |
|---|---|
| Google広告 | `ads.google.com`, `adwords.google.com`, `googleads.g.doubleclick.net` |
| Googleログイン/共通 | `accounts.google.com`, `www.google.com`, `ssl.gstatic.com`, `www.gstatic.com`, `apis.google.com` |
| YouTube Studio | `studio.youtube.com`, `www.youtube.com`, `youtube.com`, `youtubei.googleapis.com` |
| LP（本番/検証） | `studio.shokunin-movie.com`, `shokunin-movie.com` |

> 参考: このリポジトリを開いたクラウドのweb版セッションで実測したところ、`accounts.google.com`(302) 以外は
> すべて遮断(000)だった。web版で出稿するなら上記ホストの許可が前提。

---

## セキュリティ / 厳守事項（マニュアル準拠）

- **AIがやらない（オーナー専用）**：ログイン・パスワード・2段階認証・アカウント切替・支払い・
  広告"中身"保存時の本人確認・キャンペーン公開（＝課金開始）。
- `.browser-profile/`・`*.storage-state.json`・`auth.json` は**コミット禁止**（`.gitignore` 済み）。
- 新LPは公開前に必ず CV発火（`conversion/17222904600`）をブラウザ検証（マニュアル ルール6）。

---

## 関連ファイル
- `.mcp.json` … Playwright MCP サーバー定義
- `docs/kaiji_campaign_build_sheet.md` … 4キャンペーンの出稿作業シート（転記して実行する手順）
