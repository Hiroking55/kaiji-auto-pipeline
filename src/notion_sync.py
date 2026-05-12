"""Notion API で DB1 (日次) / DB2 (クリエ別) を更新"""
import os
from datetime import datetime
from notion_client import Client


WEEKDAY_JA = "月火水木金土日"


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
    """クリエ別行を Notion DB2 に投入 (title: CR名)"""
    existing = _get_existing_pages(notion, db_id, "CR名")

    created = updated = 0
    for row in creative_rows:
        cr_name = row["cr_name"]
        system_label = "自社" if row["system"] == "jisha" else ("外注" if row["system"] == "gaichu" else row["system"])

        properties = {
            "CR名": {"title": [{"text": {"content": cr_name}}]},
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


def sync_to_notion(results: dict):
    """日次 + クリエ別を Notion に同期"""
    notion = Client(auth=os.environ["NOTION_TOKEN"])

    db_daily = os.environ.get("NOTION_DB_DAILY_ID")
    db_creative = os.environ.get("NOTION_DB_CREATIVE_ID")

    if db_daily:
        sync_daily_to_db1(notion, db_daily, results["daily"])
    else:
        print("  [notion] NOTION_DB_DAILY_ID 未設定: 日次同期スキップ")

    if db_creative:
        sync_creative_to_db2(notion, db_creative, results["creative"])
    else:
        print("  [notion] NOTION_DB_CREATIVE_ID 未設定: クリエ別同期スキップ")
