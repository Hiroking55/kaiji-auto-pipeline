#!/usr/bin/env python3
"""
カイジ広告自動パイプライン: エントリポイント
1) Meta Marketing API → 自社/外注の日次広告データ
2) data/lstep/latest.csv → Lstep 友だちタグデータ
3) 集計 (日次合計/系統別/クリエ別)
4) Notion DB1 (日次) / DB2 (クリエ別) を更新
5) Slack 通知
"""
import os
import sys
import traceback
from datetime import datetime, timezone, timedelta

# .env をローカル開発時のみ読込 (GitHub Actions では Secrets から注入)
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# src/ を import path に追加
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from meta_fetch import fetch_meta_data, fetch_account_total
from lstep_parse import parse_lstep_csv
from aggregate import aggregate
from notion_sync import sync_to_notion
from slack_notify import notify


JST = timezone(timedelta(hours=9))


def main():
    start = datetime.now(JST)
    stamp = start.strftime("%Y-%m-%d %H:%M:%S JST")
    print(f"[{stamp}] === パイプライン開始 ===")

    repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    lstep_csv = os.path.join(repo_root, "data", "lstep", "latest.csv")

    try:
        # 1. Meta API
        print("[1/4] Meta API: 自社")
        jisha = fetch_meta_data(os.environ["FB_AD_ACCOUNT_JISHA"], "jisha")
        print(f"  → {len(jisha)} 行")

        print("[1/4] Meta API: 外注")
        gaichu = fetch_meta_data(os.environ["FB_AD_ACCOUNT_GAICHU"], "gaichu")
        print(f"  → {len(gaichu)} 行")

        # L2: アカウント実額 (ground truth) を取得 — 広告レベル合算との突合に使う
        acct_total = {
            "jisha": fetch_account_total(os.environ["FB_AD_ACCOUNT_JISHA"], "jisha"),
            "gaichu": fetch_account_total(os.environ["FB_AD_ACCOUNT_GAICHU"], "gaichu"),
        }

        # 2. Lstep CSV
        print(f"[2/4] Lstep CSV: {lstep_csv}")
        lstep = parse_lstep_csv(lstep_csv)

        # 3. 集計
        print("[3/4] 集計")
        results = aggregate(jisha, gaichu, lstep)
        print(f"  → 日次 {len(results['daily'])} 行 / クリエ別 {len(results['creative'])} 行")
        ms = results["month_summary"]
        print(f"  → 当月合計({ms['month']}): Cost ¥{ms['cost']:,} / 真CV {ms['true_cv']} / 真CPA ¥{ms['true_cpa']:,}")

        # ダッシュボード 3軸(自社/外注/合計)内訳
        dash = results.get("dashboard", {})
        for scope_label, key in (("自社", "jisha"), ("外注", "gaichu"), ("合計", "total")):
            m = dash.get("monthly", {}).get(key, {})
            print(f"  → 月次{scope_label}: 真CV={m.get('true_cv',0)} / Cost=¥{m.get('cost',0):,} / 真CPA=¥{m.get('true_cpa',0):,}")

        # ===== L2: アカウント実額 vs 広告レベル合算 の整合性検証 =====
        # 乖離が大きい = 集計が実額とズレている (= ダッシュボードの数字が信用できない)
        recon_lines = []
        recon_alert = False
        cost_by_sys = results.get("creative_cost_by_system", {})
        for key, label in (("jisha", "自社"), ("gaichu", "外注")):
            agg_cost = cost_by_sys.get(key, 0)
            real = acct_total.get(key, -1.0)
            if real is None or real < 0:
                recon_lines.append(f"  {label}: 実額取得失敗 (検証スキップ) / 広告合算 ¥{agg_cost:,}")
                continue
            diff = agg_cost - real
            pct = (diff / real * 100) if real > 0 else 0
            flag = "⚠️" if abs(pct) > 2 else "✅"
            if abs(pct) > 2:
                recon_alert = True
            recon_lines.append(
                f"  {flag} {label}: 広告合算 ¥{agg_cost:,} vs アカウント実額 ¥{real:,.0f} "
                f"(乖離 {pct:+.1f}%)"
            )
        recon_text = "📊 整合性検証 (広告合算 vs Meta実額)\n" + "\n".join(recon_lines)
        print(recon_text)

        # ===== L3: 未マッチ高消化 CR 警告 =====
        unmatched = results.get("unmatched_high_cost", [])
        unmatched_text = ""
        if unmatched:
            lines = [f"  - {u['cr_name'][:40]} ({u['system']}): ¥{u['cost']:,}" for u in unmatched[:15]]
            unmatched_text = (
                f"🚨 未マッチ高消化CR {len(unmatched)}件 (= metaCR紐付け漏れ → 真CV計上されず)\n"
                + "\n".join(lines)
            )
            print(unmatched_text)

        # 4. Notion 同期
        print("[4/4] Notion 同期")
        sync_to_notion(results)

        # 完了通知
        end = datetime.now(JST)
        elapsed = (end - start).seconds
        head = "⚠️ パイプライン完了 (要確認)" if (recon_alert or unmatched) else "✅ パイプライン完了"
        msg = (
            f"{head} ({stamp}, {elapsed}秒)\n"
            f"当月: Cost ¥{ms['cost']:,} / 真CV {ms['true_cv']} / 真CPA ¥{ms['true_cpa']:,}\n"
            f"日次行: {len(results['daily'])} / クリエ別: {len(results['creative'])}\n"
            f"\n{recon_text}"
        )
        if unmatched_text:
            msg += f"\n\n{unmatched_text}"
        notify(msg)
        print(f"[{end.strftime('%Y-%m-%d %H:%M:%S JST')}] === 完了 ({elapsed}秒) ===")

    except Exception as e:
        tb = traceback.format_exc()
        err = f"❌ パイプライン失敗 ({stamp})\n```\n{tb[-1500:]}\n```"
        print(err)
        try:
            notify(err)
        except Exception:
            pass
        raise


if __name__ == "__main__":
    main()
