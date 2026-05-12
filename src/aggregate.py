"""集計ロジック: Meta+Lstep → 日次合計 / 系統別 / クリエ別"""
from typing import List, Dict
from datetime import datetime
from collections import defaultdict

from lstep_parse import truthy


def _get_lead_count(row: Dict) -> int:
    """Meta API の actions から lead を抽出"""
    actions = row.get("actions") or []
    for a in actions:
        if a.get("action_type") == "lead":
            try:
                return int(a.get("value", 0))
            except (ValueError, TypeError):
                return 0
    return 0


def _parse_lstep_date(raw: str) -> str:
    """Lstep '友だち追加日時' (例: 2026/05/11 14:23:45) → 'YYYY-MM-DD'"""
    if not raw:
        return ""
    s = str(raw).strip()
    # 形式パターン候補
    for fmt in ("%Y/%m/%d %H:%M:%S", "%Y/%m/%d %H:%M", "%Y/%m/%d", "%Y-%m-%d %H:%M:%S", "%Y-%m-%d"):
        try:
            return datetime.strptime(s[:len(fmt) + 5].strip()[:19], fmt).strftime("%Y-%m-%d")
        except Exception:
            continue
    # 先頭10文字 (YYYY-MM-DD or YYYY/MM/DD) でフォールバック
    head = s[:10].replace("/", "-")
    try:
        datetime.strptime(head, "%Y-%m-%d")
        return head
    except Exception:
        return ""


def aggregate(meta_jisha: List[Dict], meta_gaichu: List[Dict], lstep: List[Dict]) -> Dict:
    """
    戻り値:
    - daily: 日次行 [{date, system(自社/外注/合計), imp, click, cost, meta_cv, true_cv, true_cpa}]
    - creative: クリエ別 [{cr_name, system, imp, click, cost, meta_cv, true_cv, true_cpa, suffix}]
    - month_summary: 当月合計 (Notion KPI カード用)
    """

    # ===== 1. 日次: Meta 数値 (system別) =====
    daily_meta = defaultdict(lambda: defaultdict(
        lambda: {"imp": 0, "click": 0, "cost": 0.0, "meta_cv": 0}
    ))
    for row in (meta_jisha + meta_gaichu):
        date = row.get("date_start")
        if not date:
            continue
        sys = row["system"]
        d = daily_meta[date][sys]
        d["imp"] += int(row.get("impressions") or 0)
        d["click"] += int(row.get("inline_link_clicks") or 0)
        d["cost"] += float(row.get("spend") or 0)
        d["meta_cv"] += _get_lead_count(row)

    # ===== 2. 日次: 真CV (Lstep データから) =====
    # 優先1: 流入経路タグ '11.広告(自社運用)' / '3.広告' (もし列にあれば)
    # 優先2: metaCR_xxx 列ベース (`_circle` 末尾=外注、 無し=自社)
    daily_truecv = defaultdict(lambda: {"jisha": 0, "gaichu": 0})
    metacr_cols = []
    if lstep:
        metacr_cols = [c for c in lstep[0].keys() if c.startswith("metaCR_")]

    has_流入経路 = bool(lstep) and (
        "11.広告(自社運用)" in lstep[0] or "3.広告" in lstep[0]
    )

    for lrow in lstep:
        date = _parse_lstep_date(lrow.get("友だち追加日時", ""))
        if not date:
            continue

        is_jisha = False
        is_gaichu = False

        if has_流入経路:
            # 流入経路タグ優先
            if truthy(lrow.get("11.広告(自社運用)")):
                is_jisha = True
            if truthy(lrow.get("3.広告")):
                is_gaichu = True
        else:
            # フォールバック: metaCR_xxx 列から判定
            for col in metacr_cols:
                if truthy(lrow.get(col)):
                    if col.endswith("_circle"):
                        is_gaichu = True
                    else:
                        is_jisha = True

        if is_jisha:
            daily_truecv[date]["jisha"] += 1
        if is_gaichu:
            daily_truecv[date]["gaichu"] += 1

    # ===== 3. 日次行を整形: 各日 3 行 (自社/外注/合計) =====
    all_dates = sorted(set(list(daily_meta.keys()) + list(daily_truecv.keys())))
    daily_rows = []
    for date in all_dates:
        jisha_meta = daily_meta[date].get("jisha", {"imp": 0, "click": 0, "cost": 0.0, "meta_cv": 0})
        gaichu_meta = daily_meta[date].get("gaichu", {"imp": 0, "click": 0, "cost": 0.0, "meta_cv": 0})
        jisha_tcv = daily_truecv[date]["jisha"]
        gaichu_tcv = daily_truecv[date]["gaichu"]

        jisha_row = {
            "date": date,
            "system": "自社",
            "imp": jisha_meta["imp"],
            "click": jisha_meta["click"],
            "cost": int(round(jisha_meta["cost"])),
            "meta_cv": jisha_meta["meta_cv"],
            "true_cv": jisha_tcv,
        }
        jisha_row["true_cpa"] = int(round(jisha_row["cost"] / jisha_tcv)) if jisha_tcv > 0 else 0

        gaichu_row = {
            "date": date,
            "system": "外注",
            "imp": gaichu_meta["imp"],
            "click": gaichu_meta["click"],
            "cost": int(round(gaichu_meta["cost"])),
            "meta_cv": gaichu_meta["meta_cv"],
            "true_cv": gaichu_tcv,
        }
        gaichu_row["true_cpa"] = int(round(gaichu_row["cost"] / gaichu_tcv)) if gaichu_tcv > 0 else 0

        total = {
            "date": date,
            "system": "合計",
            "imp": jisha_row["imp"] + gaichu_row["imp"],
            "click": jisha_row["click"] + gaichu_row["click"],
            "cost": jisha_row["cost"] + gaichu_row["cost"],
            "meta_cv": jisha_row["meta_cv"] + gaichu_row["meta_cv"],
            "true_cv": jisha_row["true_cv"] + gaichu_row["true_cv"],
        }
        total["true_cpa"] = int(round(total["cost"] / total["true_cv"])) if total["true_cv"] > 0 else 0

        daily_rows.extend([jisha_row, gaichu_row, total])

    # ===== 4. クリエ別集計 =====
    # 4-1. Meta データから ad_name 単位で集計
    creative = defaultdict(lambda: {
        "system": "",
        "imp": 0, "click": 0, "cost": 0.0, "meta_cv": 0, "true_cv": 0,
        "suffix": "",
    })
    for row in (meta_jisha + meta_gaichu):
        cr_name = (row.get("ad_name") or "").strip()
        if not cr_name:
            continue
        sys = row["system"]
        c = creative[cr_name]
        c["system"] = sys
        c["imp"] += int(row.get("impressions") or 0)
        c["click"] += int(row.get("inline_link_clicks") or 0)
        c["cost"] += float(row.get("spend") or 0)
        c["meta_cv"] += _get_lead_count(row)

    # 4-2. 真CV: Lstep の metaCR_<suffix> 列で集計
    # Lstep CSV の列名から metaCR_ で始まるものを抽出
    metacr_columns = []
    if lstep:
        for col in lstep[0].keys():
            if col.startswith("metaCR_"):
                metacr_columns.append(col)

    # metaCR_<suffix> → CR名 のマッピング: CR名 が "metaCR_xxx" を含むか、 完全に xxx と一致するか で判定
    # シンプル化: CR名末尾の英数字 (suffix) と metaCR_<suffix> をマッチング
    cr_to_metacr = {}
    for cr_name in creative.keys():
        for col in metacr_columns:
            suffix = col.replace("metaCR_", "")
            # CR名 が suffix を含む / suffix が CR名 を含む / CR名 == suffix
            if (suffix and (suffix in cr_name or cr_name in suffix or
                            suffix.lower() == cr_name.lower())):
                cr_to_metacr[cr_name] = col
                creative[cr_name]["suffix"] = suffix
                break

    # CR別 真CV カウント
    for lrow in lstep:
        for cr_name, metacr_col in cr_to_metacr.items():
            if truthy(lrow.get(metacr_col)):
                creative[cr_name]["true_cv"] += 1

    creative_rows = []
    for cr_name, data in creative.items():
        cost = int(round(data["cost"]))
        tcv = data["true_cv"]
        creative_rows.append({
            "cr_name": cr_name,
            "system": data["system"],
            "suffix": data["suffix"],
            "imp": data["imp"],
            "click": data["click"],
            "cost": cost,
            "meta_cv": data["meta_cv"],
            "true_cv": tcv,
            "true_cpa": int(round(cost / tcv)) if tcv > 0 else 0,
        })
    creative_rows.sort(key=lambda x: -x["cost"])  # コスト降順

    # ===== 5. 当月合計 (KPI カード用) =====
    now = datetime.now()
    cur_month = now.strftime("%Y-%m")
    month_rows = [r for r in daily_rows if r["system"] == "合計" and r["date"].startswith(cur_month)]
    month_summary = {
        "month": cur_month,
        "imp": sum(r["imp"] for r in month_rows),
        "click": sum(r["click"] for r in month_rows),
        "cost": sum(r["cost"] for r in month_rows),
        "meta_cv": sum(r["meta_cv"] for r in month_rows),
        "true_cv": sum(r["true_cv"] for r in month_rows),
    }
    month_summary["true_cpa"] = (
        int(round(month_summary["cost"] / month_summary["true_cv"]))
        if month_summary["true_cv"] > 0 else 0
    )

    return {
        "daily": daily_rows,
        "creative": creative_rows,
        "month_summary": month_summary,
    }
