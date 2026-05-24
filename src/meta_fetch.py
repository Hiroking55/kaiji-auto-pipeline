"""Meta Marketing API でデイリー広告データを取得"""
import os
import time
import json
import requests
from datetime import datetime, timezone, timedelta
from typing import List, Dict

GRAPH_API_VERSION = "v22.0"
JST = timezone(timedelta(hours=9))


def fetch_meta_data(account_id: str, label: str, days: int = 30, include_today: bool = True) -> List[Dict]:
    """
    指定アカウントの広告インサイトを日次×広告レベルで取得。
    label: 'jisha' or 'gaichu' (集計時の識別用)
    include_today: True なら当日 (JST today) も取得期間に含める。
      Meta 側で当日値は時間経過で変動する暫定値だが、 進行中のペース確認に有用。

    JST 基準で 「過去 N 日 〜 (today or yesterday) (JST)」 を取得する。
    date_preset=last_30d は UTC/PDT 基準で動くため、 JST 基準でズレる。
    明示的な time_range を使う。
    """
    token = os.environ["FB_ACCESS_TOKEN"]
    base = f"https://graph.facebook.com/{GRAPH_API_VERSION}/act_{account_id}/insights"
    fields = ",".join([
        "campaign_name",
        "adset_name",
        "ad_id",
        "ad_name",
        "impressions",
        "spend",
        "actions",
        "inline_link_clicks",
        "date_start",
        "date_stop",
    ])

    # JST 基準で過去 N 日 〜 (today or yesterday) (JST) を明示指定
    now_jst = datetime.now(JST)
    until_jst = now_jst if include_today else now_jst - timedelta(days=1)
    since = (now_jst - timedelta(days=days)).strftime("%Y-%m-%d")
    until = until_jst.strftime("%Y-%m-%d")
    time_range = json.dumps({"since": since, "until": until})

    suffix = " (当日込)" if include_today else " (前日まで)"
    print(f"  [meta_fetch:{label}] time_range = {since} 〜 {until} (JST){suffix}")

    params = {
        "access_token": token,
        "fields": fields,
        "level": "ad",
        "time_range": time_range,
        "time_increment": 1,
        "limit": 500,
    }

    rows: List[Dict] = []
    url = base
    first = True
    retry = 0
    while url:
        try:
            r = requests.get(url, params=params if first else None, timeout=60)
            data = r.json()
        except Exception as e:
            if retry < 3:
                retry += 1
                time.sleep(5)
                continue
            raise

        if "error" in data:
            err = data["error"]
            # リトライ対象:
            # - is_transient: true (一時的エラー)
            # - code 1: API unknown
            # - code 2: Service temporarily unavailable
            # - code 4: Application request limit reached (レート制限)
            # - code 17: User request limit reached
            # - code 32: Page request limit reached
            # - code 613: Calls to this api have exceeded the rate limit
            is_retryable = (
                err.get("is_transient") or
                err.get("code") in (1, 2, 4, 17, 32, 613) or
                err.get("error_subcode") in (1504044,)
            )
            if is_retryable and retry < 6:
                retry += 1
                wait = min(60 * retry, 300)  # 60s, 120s, ... max 300s
                msg = err.get("message", "")[:80]
                print(f"  [meta_fetch:{label}] エラー (リトライ {retry}/6, {wait}秒待機): code={err.get('code')} {msg}")
                time.sleep(wait)
                continue
            raise RuntimeError(f"Meta API error ({label}): {err}")

        rows.extend(data.get("data", []))
        first = False
        retry = 0
        url = data.get("paging", {}).get("next")

    # L1: ページング重複の防御的除去 (= 同一 ad_id × date_start が複数回返るケース対策)
    #     cursor ページングでも稀に重複が起きる。 重複したまま合算すると spend が膨張する。
    seen = set()
    deduped = []
    dup_count = 0
    for row in rows:
        key = (row.get("ad_id"), row.get("date_start"))
        if key in seen:
            dup_count += 1
            continue
        seen.add(key)
        deduped.append(row)
    if dup_count:
        print(f"  [meta_fetch:{label}] ⚠️ 重複行 {dup_count} 件を除去 ({len(rows)}→{len(deduped)} 行)")
    rows = deduped

    # L4: 監査ログ (= 広告レベル合算 spend。 後で account_total と突合)
    total_spend = sum(float(r.get("spend") or 0) for r in rows)
    print(f"  [meta_fetch:{label}] 広告レベル合算 spend = ¥{total_spend:,.0f} ({len(rows)} 行)")

    for row in rows:
        row["system"] = label  # 'jisha' or 'gaichu'

    # 調査用: actions の action_type 出現頻度を集計してログ出力
    # (タスク3: _get_lead_count の action_type が "lead" でいいかの判定材料)
    action_type_freq: Dict[str, int] = {}
    for row in rows:
        for a in row.get("actions") or []:
            t = a.get("action_type") or "(none)"
            action_type_freq[t] = action_type_freq.get(t, 0) + 1
    if action_type_freq:
        top = sorted(action_type_freq.items(), key=lambda x: -x[1])[:15]
        print(f"  [meta_fetch:{label}] action_type 頻度 top15: {top}")
    else:
        print(f"  [meta_fetch:{label}] actions が全行で空でした")

    return rows


def fetch_account_total(account_id: str, label: str, days: int = 30, include_today: bool = True) -> float:
    """L2: アカウントレベルの総消化金額を取得 (= 広告レベル合算の整合性検証用 ground truth)。
    fetch_meta_data と同一 time_range で level=account を取得し、 単一の spend 合計を返す。
    取得失敗時は -1.0 (= 検証スキップの印)。"""
    token = os.environ["FB_ACCESS_TOKEN"]
    base = f"https://graph.facebook.com/{GRAPH_API_VERSION}/act_{account_id}/insights"
    now_jst = datetime.now(JST)
    until_jst = now_jst if include_today else now_jst - timedelta(days=1)
    since = (now_jst - timedelta(days=days)).strftime("%Y-%m-%d")
    until = until_jst.strftime("%Y-%m-%d")
    params = {
        "access_token": token,
        "fields": "spend",
        "level": "account",
        "time_range": json.dumps({"since": since, "until": until}),
        "limit": 1,
    }
    try:
        r = requests.get(base, params=params, timeout=60)
        data = r.json()
        if "error" in data:
            print(f"  [account_total:{label}] エラー: {data['error'].get('message','')[:80]}")
            return -1.0
        rows = data.get("data", [])
        total = sum(float(x.get("spend") or 0) for x in rows)
        print(f"  [account_total:{label}] アカウント実額 = ¥{total:,.0f} ({since}〜{until})")
        return total
    except Exception as e:
        print(f"  [account_total:{label}] 取得失敗: {type(e).__name__} {str(e)[:80]}")
        return -1.0
