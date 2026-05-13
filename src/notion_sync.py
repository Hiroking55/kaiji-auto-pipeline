"""Notion API で DB1 (日次) / DB2 (クリエ別) / KPI カードを更新"""
import os
import time
from datetime import datetime, timezone, timedelta
from notion_client import Client
from notion_client.errors import RequestTimeoutError, HTTPResponseError, APIResponseError

JST = timezone(timedelta(hours=9))


WEEKDAY_JA = "月火水木金土日"

# Notion API は不安定で timeout/レート上限が出やすい。GitHub Actions の outbound 接続も
# 遅延することがあるので timeout を伸ばす + 各呼び出しにリトライを噛ませる。
NOTION_TIMEOUT_MS = 60_000  # 60 秒
NOTION_RETRY_MAX = 4
NOTION_RETRY_WAIT_BASE = 3  # 3, 6, 9, 12 秒で再試行


def _notion_call(fn, *args, **kwargs):
    """Notion API 呼び出しを timeout/HTTP エラー時にリトライ付きで実行。"""
    last_err = None
    for attempt in range(NOTION_RETRY_MAX):
        try:
            return fn(*args, **kwargs)
        except (RequestTimeoutError, HTTPResponseError) as e:
            last_err = e
            wait = NOTION_RETRY_WAIT_BASE * (attempt + 1)
            print(f"  [notion] {type(e).__name__} retry {attempt+1}/{NOTION_RETRY_MAX} (wait {wait}s): {str(e)[:80]}")
            time.sleep(wait)
        except APIResponseError as e:
            # 429 (rate limit) など、Notion からの構造化エラー
            last_err = e
            wait = NOTION_RETRY_WAIT_BASE * (attempt + 1)
            print(f"  [notion] APIResponseError code={e.code} retry {attempt+1}/{NOTION_RETRY_MAX} (wait {wait}s)")
            time.sleep(wait)
    raise last_err

# 親ページ ID (ダッシュボード "meta広告 管理ダッシュボード")
# 旧 Apps Script の syncKPICardsToNotion が更新していた KPI カード群がここに居る。
DEFAULT_NOTION_PARENT_PAGE_ID = "35bafb87-4028-80e9-99ac-dd07e86cf4fc"



def _get_existing_pages(notion: Client, db_id: str, title_prop_name: str = "日付") -> dict:
    """既存ページを title (日付) で索引化"""
    existing = {}
    cursor = None
    while True:
        kwargs = {"database_id": db_id, "page_size": 100}
        if cursor:
            kwargs["start_cursor"] = cursor
        resp = notion.databases.query(**kwargs)
        for page in resp["results"]:
            prop = page["properties"].get(title_prop_name, {})
            title = prop.get("title", [])
            if title:
                key = title[0].get("plain_text", "").strip()
                existing[key] = page["id"]
        if not resp.get("has_more"):
            break
        cursor = resp.get("next_cursor")
    return existing


def sync_daily_to_db1(notion: Client, db_id: str, daily_rows: list):
    """日次合計行のみ Notion DB1 に投入"""
    existing = _get_existing_pages(notion, db_id, "日付")

    total_rows = [r for r in daily_rows if r["system"] == "合計"]
    created = updated = 0

    for row in total_rows:
        date_obj = datetime.strptime(row["date"], "%Y-%m-%d")
        weekday = WEEKDAY_JA[date_obj.weekday()]
        title_text = f"{date_obj.strftime('%m/%d')} ({weekday})"
        month_str = date_obj.strftime("%Y-%m")

        properties = {
            "日付": {"title": [{"text": {"content": title_text}}]},
            "Click": {"number": row["click"]},
            "Cost": {"number": row["cost"]},
            "Imp": {"number": row["imp"]},
            "Meta CV": {"number": row["meta_cv"]},
            "真CV": {"number": row["true_cv"]},
            "真CPA": {"number": row["true_cpa"]},
            "月": {"select": {"name": month_str}},
        }

        try:
            if title_text in existing:
                notion.pages.update(page_id=existing[title_text], properties=properties)
                updated += 1
            else:
                notion.pages.create(parent={"database_id": db_id}, properties=properties)
                created += 1
        except Exception as e:
            print(f"  [notion DB1] {title_text} 失敗: {e}")

    print(f"  [notion DB1] 新規 {created} / 更新 {updated} / 合計 {len(total_rows)} 件")


def sync_creative_to_db2(notion: Client, db_id: str, creative_rows: list):
    """クリエ別行を Notion DB2 に投入。
    DB2 の title プロパティ名は「広告名」 (旧コードは「CR名」 で誤索引化 → 重複量産)。"""
    existing = _get_existing_pages(notion, db_id, "広告名")

    created = updated = 0
    for row in creative_rows:
        cr_name = row["cr_name"]
        system_label = "自社" if row["system"] == "jisha" else ("外注" if row["system"] == "gaichu" else row["system"])

        properties = {
            "広告名": {"title": [{"text": {"content": cr_name}}]},
            "系統": {"select": {"name": system_label}},
            "Imp": {"number": row["imp"]},
            "Click": {"number": row["click"]},
            "Cost": {"number": row["cost"]},
            "Meta CV": {"number": row["meta_cv"]},
            "真CV": {"number": row["true_cv"]},
            "真CPA": {"number": row["true_cpa"]},
        }

        try:
            if cr_name in existing:
                notion.pages.update(page_id=existing[cr_name], properties=properties)
                updated += 1
            else:
                notion.pages.create(parent={"database_id": db_id}, properties=properties)
                created += 1
        except Exception as e:
            print(f"  [notion DB2] {cr_name} 失敗: {e}")

    print(f"  [notion DB2] 新規 {created} / 更新 {updated} / 合計 {len(creative_rows)} 件")


# ========== KPI カード 同期 ==========

def _parse_kpi_label(label: str):
    """callout ラベルから (period, scope, metric) を抽出。
    特殊ラベル (達成率/残り目標) は ('special', None, name)。
    対応不可は None。"""
    if "達成率" in label:
        return ("special", None, "achievement_rate")
    if "残り目標" in label:
        return ("special", None, "remaining_target")

    if "当日" in label:
        period = "today"
    elif "週次" in label:
        period = "weekly"
    elif "月次" in label:
        period = "monthly"
    else:
        return None

    if "自外合計" in label:
        scope = "total"
    elif "自社" in label:
        scope = "jisha"
    elif "外注" in label:
        scope = "gaichu"
    else:
        return None

    if "真CPA" in label:
        metric = "true_cpa"
    elif "真CV" in label:
        metric = "true_cv"
    elif "コスト" in label:
        metric = "cost"
    else:
        return None

    return (period, scope, metric)


def _format_kpi_value(metric: str, value) -> str:
    if metric == "true_cv":
        return f"{value:,} 件"
    if metric in ("cost", "true_cpa"):
        return f"¥{value:,}"
    if metric == "achievement_rate":
        return f"{value}%"
    if metric == "remaining_target":
        return f"(あと{value:,}リスト)"
    return str(value)


def _get_kpi_value(parsed, dashboard: dict):
    period, scope, metric = parsed
    if period == "special":
        return _format_kpi_value(metric, dashboard.get(metric, 0))
    data = dashboard.get(period, {}).get(scope)
    if not data:
        return None
    return _format_kpi_value(metric, data.get(metric, 0))


def _rich_text_of(block: dict) -> str:
    t = block.get("type", "")
    rt = block.get(t, {}).get("rich_text", [])
    return "".join(r.get("plain_text", "") for r in rt)


def sync_kpi_cards(notion: Client, page_id: str, dashboard: dict):
    """親ページ配下の KPIカード (heading_1 値) を更新。
    構造: heading_2 (月次/週次セクション) → column_list → column → callout → heading_1。
    callout のラベルから (period, scope, metric) を推定して heading_1 の rich_text を上書き。
    各 Notion API 呼び出しはリトライ付き (_notion_call) で実行。"""
    children = _notion_call(notion.blocks.children.list, block_id=page_id)

    # 1. heading_2 でセクション境界を識別、column_list ID を集める
    sections_column_lists = []
    current_section = None
    for b in children["results"]:
        t = b["type"]
        if t == "heading_2":
            text = _rich_text_of(b)
            if "月次サマリ" in text:
                current_section = "monthly"
            elif "週次サマリ" in text:
                current_section = "weekly"
            else:
                current_section = None
        elif t == "column_list" and current_section:
            sections_column_lists.append(b["id"])

    updated = 0
    skipped = 0
    failed = 0
    for col_list_id in sections_column_lists:
        cols = _notion_call(notion.blocks.children.list, block_id=col_list_id)
        for col in cols["results"]:
            callouts = _notion_call(notion.blocks.children.list, block_id=col["id"])
            for c in callouts["results"]:
                if c["type"] != "callout":
                    continue
                label = _rich_text_of(c)
                parsed = _parse_kpi_label(label)
                if not parsed:
                    skipped += 1
                    continue
                new_value = _get_kpi_value(parsed, dashboard)
                if new_value is None:
                    skipped += 1
                    continue

                # callout 配下の heading_1 を更新
                nested = _notion_call(notion.blocks.children.list, block_id=c["id"])
                for n in nested["results"]:
                    if n["type"] != "heading_1":
                        continue
                    try:
                        _notion_call(
                            notion.blocks.update,
                            block_id=n["id"],
                            heading_1={
                                "rich_text": [{"type": "text", "text": {"content": new_value}}],
                            },
                        )
                        updated += 1
                    except Exception as e:
                        print(f"  [KPI] {label!r} 更新失敗: {type(e).__name__} {str(e)[:100]}")
                        failed += 1

    # 更新マーカーの callout を最新時刻に
    try:
        for b in children["results"]:
            if b["type"] == "callout" and "BOT-AUTO-SYNC" in _rich_text_of(b):
                stamp = datetime.now().strftime("%Y-%m-%d %H:%M")
                _notion_call(
                    notion.blocks.update,
                    block_id=b["id"],
                    callout={
                        "rich_text": [
                            {"type": "text", "text": {"content": f"🤖[BOT-AUTO-SYNC] 更新: {stamp}"}},
                        ],
                    },
                )
                break
    except Exception as e:
        print(f"  [KPI] 更新マーカー失敗: {e}")

    print(f"  [KPI] カード更新 {updated} / スキップ {skipped} / 失敗 {failed}")


def sync_to_notion(results: dict):
    """日次 + クリエ別 + KPIカード を Notion に同期"""
    # Notion API は GitHub Actions の outbound 接続経由だと timeout しやすいので
    # client の timeout を明示的に伸ばす (デフォルトは短い)。
    notion = Client(auth=os.environ["NOTION_TOKEN"], timeout_ms=NOTION_TIMEOUT_MS)

    db_daily = os.environ.get("NOTION_DB_DAILY_ID")
    db_creative = os.environ.get("NOTION_DB_CREATIVE_ID")
    parent_page = os.environ.get("NOTION_PARENT_PAGE_ID", DEFAULT_NOTION_PARENT_PAGE_ID)

    if db_daily:
        sync_daily_to_db1(notion, db_daily, results["daily"])
    else:
        print("  [notion] NOTION_DB_DAILY_ID 未設定: 日次同期スキップ")

    if db_creative:
        sync_creative_to_db2(notion, db_creative, results["creative"])
    else:
        print("  [notion] NOTION_DB_CREATIVE_ID 未設定: クリエ別同期スキップ")

    dashboard = results.get("dashboard")
    if not dashboard or not parent_page:
        print("  [notion] dashboard データ無し or PAGE_ID 未設定: KPIカード同期スキップ")
        return

    # 安全弁: 月次コストが 0 のときは KPIカード書き込みをスキップ。
    # ローカルテストや CSV だけのドライランで Notion 正解値を 0 で塗りつぶさないため。
    monthly_cost = dashboard.get("monthly", {}).get("total", {}).get("cost", 0)
    if monthly_cost <= 0:
        print(f"  [notion] 月次コスト=¥{monthly_cost} (Meta API データ未取得?): KPIカード書き込みをスキップ")
        return

    # DB1/DB2 で大量に書き込んだ直後はレート制限で API レスポンスが遅延する。
    # KPIカード書き込みに入る前に小休止して回避。
    time.sleep(3)
    sync_kpi_cards(notion, parent_page, dashboard)
