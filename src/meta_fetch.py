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
            # レート制限: is_transient=true なら待機して再試行
            if err.get("is_transient") and retry < 5:
                retry += 1
                wait = 30 * retry
                print(f"  [meta_fetch:{label}] レート制限。 {wait}秒待機後リトライ ({retry}/5)")
                time.sleep(wait)
                continue
            raise RuntimeError(f"Meta API error ({label}): {err}")

        rows.extend(data.get("data", []))
        first = False
        retry = 0
        url = data.get("paging", {}).get("next")

    for row in rows:
        row["system"] = label  # 'jisha' or 'gaichu'

    return rows
