"""Meta Marketing API でデイリー広告データを取得"""
import os
import time
import requests
from typing import List, Dict

GRAPH_API_VERSION = "v22.0"


def fetch_meta_data(account_id: str, label: str, days: int = 30) -> List[Dict]:
    """
    指定アカウントの広告インサイトを日次×広告レベルで取得。
    label: 'jisha' or 'gaichu' (集計時の識別用)
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

    params = {
        "access_token": token,
        "fields": fields,
        "level": "ad",
        "date_preset": f"last_{days}d",
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
