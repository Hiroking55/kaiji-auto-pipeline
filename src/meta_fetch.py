"""Meta Marketing API でデイリー広告データを取得"""
import os
import time
import json
import requests
from datetime import datetime, timezone, timedelta
from typing import List, Dict

GRAPH_API_VERSION = "v22.0"
JST = timezone(timedelta(hours=9))


def fetch_meta_data(account_id: str, label: str, days: int = 30) -> List[Dict]:
    """
    指定アカウントの広告インサイトを日次×広告レベルで取得。
    label: 'jisha' or 'gaichu' (集計時の識別用)

    JST 基準で 「過去 N 日 〜 昨日 (JST)」 を取得する。
    date_preset=last_30d は UTC/PDT 基準で動くため、 JST 基準でズレる。
    明示的な time_range で 5/11 (JST) も確実に取得。
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

    # JST 基準で過去 N 日 〜 昨日 (JST) を明示指定
    now_jst = datetime.now(JST)
    yesterday_jst = now_jst - timedelta(days=1)
    since = (now_jst - timedelta(days=days)).strftime("%Y-%m-%d")
    until = yesterday_jst.strftime("%Y-%m-%d")
    time_range = json.dumps({"since": since, "until": until})

    print(f"  [meta_fetch:{label}] time_range = {since} 〜 {until} (JST)")

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
