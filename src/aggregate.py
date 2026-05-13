"""集計ロジック: Meta+Lstep → 日次合計 / 系統別 / クリエ別"""
import re
from typing import List, Dict, Tuple
from datetime import datetime, date, timedelta, timezone
from collections import defaultdict

from lstep_parse import truthy


def _normalize_for_match(s: str) -> str:
    """ad_name と metaCR_suffix を比較しやすい形に正規化。
    例: "Video_S-03_B_2026-04-21" → "s03b" / "metaCR_s-03-b" → "s03b" → 一致する。"""
    if not s:
        return ""
    s = s.lower()
    # 末尾日付削除: _20260421 / _20260420-1234 / _2026-04-21 / -2026-04-21
    s = re.sub(r'[-_]?20\d{6}-?\d*$', '', s)
    s = re.sub(r'[-_]?20\d{2}-\d{2}-\d{2}.*$', '', s)
    # バージョンタグ_v01 等を末尾から削除
    s = re.sub(r'[-_]v\d+.*$', '', s)
    # 「 - コピー」 等を削除
    s = re.sub(r'[-_\s]*-\s*コピー.*$', '', s)
    # よくあるプレフィックス削除
    s = re.sub(r'^(video|static|metacr|ノンタゲ_advantage\+_|ノンタゲ_)_?', '', s)
    # 区切り削除
    s = re.sub(r'[-_\s\.()（）]', '', s)
    return s


# 明示マッピング辞書(自動マッチで取れない外注/自社系を補完。 必要に応じて追加)
# キー: ad_name を _normalize_for_match で正規化した文字列に含まれるフラグメント
# 値: 対応する metaCR_xxx (Lstep カラム名と一致)
EXPLICIT_AD_TO_METACR = {
    # ----- 外注系 -----
    "500万再生生み出す": "metaCR_500man-business",
    "180万人が認めた": "metaCR_video-a1",
    "本気で動画編集を仕事": "metaCR_honki-yatsu",
    "熱量本気で動画編集": "metaCR_hannen-yatsu",
    "熱量本気で仕事": "metaCR_hannen-yatsu",
    "半年で動画編集を仕事": "metaCR_hannen-kakugo",
    "副業に繋がる動画編集力を6ヶ月": "metaCR_hukugyo-6m",
    "3ヶ月で未経験からプロクリエイター": "metaCR_video-b",
    "無料説明会案内3つの特徴": "metaCR_setsumeikai-3tokucho",
    "putti理由": "metaCR_putti-riyu",
    "プッチさんバナー": "metaCR_putti banner",
    # PR系(外注)
    "video_pr_a": "metaCR_pr-a",
    "video_pr_b": "metaCR_pr-b",
    "video_pr_c": "metaCR_pr-c",
    "pra案": "metaCR_pr-a",
    "pr副業": "metaCR_video-a1",
    # カイジ編集局PR.ver 系 (外注 たけまる)
    "カイジ編集局prverc": "metaCR_takemaru-c-C",
    "カイジ編集局prvera": "metaCR_takemaru-c-C",
    "カイジ編集局pr冒頭3full": "metaCR_video-c",
    "カイジ編集局pr冒頭2full": "metaCR_video-b",
    # ----- 自社系 (ノンタゲ_Advantage+_) -----
    "ai消える": "metaCR_AIkieru",
    "副業ai": "metaCR_hukugyouAI",
    "ugcキム": "metaCR_UGCkim",
    "ugcishii": "metaCR_UGCishii",
    "たけまるc": "metaCR_takemaru-c",
    "puttibanner": "metaCR_putti banner",
    # 自社 AI_PR 系
    "ai_pr_副業": "metaCR_hukugyouAI",
}

JST = timezone(timedelta(hours=9))

# KPI ダッシュボード用パラメータ (Notion 親ページの KPIカードに反映)
DEFAULT_TARGET_CV = 600       # 月次真CV 目標
DEFAULT_BUDGET = 1_800_000    # 月次予算 (¥)
DEFAULT_CPA_THRESHOLD = 3_000  # 真CPA 基準 (¥)


# 系統①(流入経路タグ): Lstep CSV のヘッダーは全角『（）』だが、
# 念のため半角『()』も許容。両方を候補としてチェックする。
JISHA_FLOW_TAG_CANDIDATES = ("11.広告（自社運用）", "11.広告(自社運用)")
GAICHU_FLOW_TAG_CANDIDATES = ("3.広告",)


def _resolve_existing_key(d: Dict, candidates) -> str:
    for k in candidates:
        if k in d:
            return k
    return ""


def _truthy_any(row: Dict, candidates) -> bool:
    for k in candidates:
        if k in row and truthy(row.get(k)):
            return True
    return False


# Meta CV (=広告管理画面「ウェブサイトの登録完了」) の action_type 候補。
# 旧 Apps Script `getCV()` と同じ優先順: complete_registration → offsite_conversion → lead。
# 実値は meta_fetch.py の頻度ログで確認可能 (生データを後から再確認するため)。
META_CV_ACTION_TYPES = (
    "complete_registration",
    "offsite_conversion.fb_pixel_complete_registration",
    "onsite_web_app_complete_registration",
    "onsite_web_complete_registration",
    "omni_complete_registration",
    "lead",
)


def _get_lead_count(row: Dict) -> int:
    """Meta API actions から Meta CV を抽出 (優先順位付き)"""
    actions = row.get("actions") or []
    by_type = {a.get("action_type"): a.get("value", 0) for a in actions if a.get("action_type")}
    for t in META_CV_ACTION_TYPES:
        if t in by_type:
            try:
                return int(float(by_type[t]))
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
    # 系統①(流入経路タグ '11.広告(自社運用)' / '3.広告') を優先。
    # CSV 行2 のヘッダーは全角カッコ『（）』だが、半角『()』も両方許容。
    # 系統② (metaCR_xxx) はクリエ別用なのでフォールバックには使わない
    # (ここで使うと佐野除外漏れ・重複カウントを招き、合計が壊れる)。
    daily_truecv = defaultdict(lambda: {"jisha": 0, "gaichu": 0})
    metacr_cols = []
    if lstep:
        metacr_cols = [c for c in lstep[0].keys() if c.startswith("metaCR_")]

    jisha_key = _resolve_existing_key(lstep[0], JISHA_FLOW_TAG_CANDIDATES) if lstep else ""
    gaichu_key = _resolve_existing_key(lstep[0], GAICHU_FLOW_TAG_CANDIDATES) if lstep else ""
    has_流入経路 = bool(jisha_key or gaichu_key)
    if lstep:
        print(f"  [aggregate] 流入経路タグ判定: 自社={jisha_key or '未検出'} / 外注={gaichu_key or '未検出'}")

    for lrow in lstep:
        date = _parse_lstep_date(lrow.get("友だち追加日時", ""))
        if not date:
            continue

        is_jisha = False
        is_gaichu = False

        if has_流入経路:
            if jisha_key and truthy(lrow.get(jisha_key)):
                is_jisha = True
            if gaichu_key and truthy(lrow.get(gaichu_key)):
                is_gaichu = True

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

    # ad_name → metaCR_xxx のマッピング (多段アプローチ):
    #   1. 正規化マッチ(日付/プレフィックス/区切り削除して比較)
    #   2. 明示辞書(EXPLICIT_AD_TO_METACR)で補完
    cr_to_metacr = {}
    unmatched_cr = []
    for cr_name in creative.keys():
        norm_cr = _normalize_for_match(cr_name)
        matched = False
        # Step 1: 正規化マッチ
        for col in metacr_columns:
            suffix = col.replace("metaCR_", "")
            norm_suffix = _normalize_for_match(suffix)
            if not norm_cr or not norm_suffix:
                continue
            # 完全一致 or 含むマッチ(短い方が4文字以上)
            if norm_cr == norm_suffix or \
               (len(norm_suffix) >= 4 and norm_suffix in norm_cr) or \
               (len(norm_cr) >= 4 and norm_cr in norm_suffix):
                cr_to_metacr[cr_name] = col
                creative[cr_name]["suffix"] = suffix
                matched = True
                break
        # Step 2: 明示辞書で補完
        if not matched:
            for keyword, target_metacr in EXPLICIT_AD_TO_METACR.items():
                if keyword in norm_cr and target_metacr in metacr_columns:
                    cr_to_metacr[cr_name] = target_metacr
                    creative[cr_name]["suffix"] = target_metacr.replace("metaCR_", "")
                    matched = True
                    break
        if not matched:
            unmatched_cr.append(cr_name)

    if unmatched_cr:
        print(f"  [aggregate] クリエ別マッチング: ad_name で metaCR 未対応 {len(unmatched_cr)} 件 (真CV=0 になります)")
        for cn in unmatched_cr[:10]:
            print(f"    - {cn[:60]}")

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

    # ===== 6. ダッシュボード KPI (Notion 親ページの KPIカード用) =====
    dashboard = _compute_dashboard(daily_rows)

    return {
        "daily": daily_rows,
        "creative": creative_rows,
        "month_summary": month_summary,
        "dashboard": dashboard,
    }


# ---------- ダッシュボード KPI 計算 ----------

def _empty_metrics() -> Dict:
    return {"imp": 0, "click": 0, "cost": 0, "meta_cv": 0, "true_cv": 0, "true_cpa": 0}


def _accumulate(rows: List[Dict]) -> Dict:
    """daily_rows のうち渡されたサブセットを合算"""
    agg = _empty_metrics()
    for r in rows:
        for k in ("imp", "click", "cost", "meta_cv", "true_cv"):
            agg[k] += r[k]
    agg["true_cpa"] = int(round(agg["cost"] / agg["true_cv"])) if agg["true_cv"] > 0 else 0
    return agg


def _current_week_range(today: date) -> Tuple[date, date]:
    """月曜始まり日曜終わりの『今週』の範囲 (月跨ぎカット)。
    月初の不完全週は (1日, 最初の月曜の前日) として 1 つの週扱いにする
    (Apps Script の仕様に合わせる)。"""
    month_start = today.replace(day=1)
    if today.month == 12:
        next_month_start = today.replace(year=today.year + 1, month=1, day=1)
    else:
        next_month_start = today.replace(month=today.month + 1, day=1)
    month_last = next_month_start - timedelta(days=1)

    if month_start.weekday() == 0:
        first_monday = month_start
    else:
        first_monday = month_start + timedelta(days=(7 - month_start.weekday()))

    if today < first_monday:
        return month_start, first_monday - timedelta(days=1)

    monday = today - timedelta(days=today.weekday())
    sunday = min(monday + timedelta(days=6), month_last)
    return monday, sunday


def _week_index_in_month(today: date) -> int:
    """月内の第何週か。月初の不完全週を第1週とし、最初の月曜以降を第2週から数える
    (Apps Script の仕様)。"""
    month_start = today.replace(day=1)
    if month_start.weekday() == 0:
        first_monday = month_start
    else:
        first_monday = month_start + timedelta(days=(7 - month_start.weekday()))

    if today < first_monday:
        return 1  # 月初の不完全週
    days_since_first_monday = (today - first_monday).days
    if first_monday == month_start:
        return days_since_first_monday // 7 + 1
    return days_since_first_monday // 7 + 2


def _month_days_remaining(today: date) -> int:
    """今日を含めない月末までの残り日数。"""
    if today.month == 12:
        next_month_start = today.replace(year=today.year + 1, month=1, day=1)
    else:
        next_month_start = today.replace(month=today.month + 1, day=1)
    return (next_month_start - today).days - 1


def _compute_dashboard(daily_rows: List[Dict]) -> Dict:
    """月次・週次・当日の KPI を 自社/外注/合計 3軸で集計。"""
    today_jst = datetime.now(JST).date()
    cur_month = today_jst.strftime("%Y-%m")

    # 当日 = 今日(JST) (include_today=True で Meta API も当日返す)
    today_disp = today_jst
    today_str = today_disp.strftime("%Y-%m-%d")

    # 週次レンジ
    week_start, week_end = _current_week_range(today_jst)
    week_idx = _week_index_in_month(today_jst)
    week_label = f"第{week_idx}週 ({week_start.strftime('%m/%d')}-{week_end.strftime('%m/%d')})"

    def filter_rows(system: str, predicate) -> List[Dict]:
        return [r for r in daily_rows if r["system"] == system and predicate(r["date"])]

    def is_in_month(d: str) -> bool:
        return d.startswith(cur_month)

    def is_in_week(d: str) -> bool:
        try:
            dd = datetime.strptime(d, "%Y-%m-%d").date()
        except ValueError:
            return False
        return week_start <= dd <= week_end

    def is_today(d: str) -> bool:
        return d == today_str

    summary = {}
    for scope, predicate in (("monthly", is_in_month),
                              ("weekly", is_in_week),
                              ("today", is_today)):
        summary[scope] = {
            "jisha": _accumulate(filter_rows("自社", predicate)),
            "gaichu": _accumulate(filter_rows("外注", predicate)),
            "total": _accumulate(filter_rows("合計", predicate)),
        }

    achieved = summary["monthly"]["total"]["true_cv"]
    achievement_rate = (achieved / DEFAULT_TARGET_CV * 100) if DEFAULT_TARGET_CV > 0 else 0
    remaining = max(0, DEFAULT_TARGET_CV - achieved)
    days_left = _month_days_remaining(today_jst)

    return {
        "today_date": today_str,                                # "2026-05-12"
        "today_label": today_disp.strftime("%m/%d") + " (" + "月火水木金土日"[today_disp.weekday()] + ")",
        "week_label": week_label,                               # "第3週 (05/11-05/17)"
        "week_start": week_start.strftime("%Y-%m-%d"),
        "week_end": week_end.strftime("%Y-%m-%d"),
        "month_days_left": days_left,
        "achievement_rate": round(achievement_rate, 1),
        "remaining_target": remaining,
        "target_cv": DEFAULT_TARGET_CV,
        "budget": DEFAULT_BUDGET,
        "cpa_threshold": DEFAULT_CPA_THRESHOLD,
        "monthly": summary["monthly"],
        "weekly": summary["weekly"],
        "today": summary["today"],
    }
