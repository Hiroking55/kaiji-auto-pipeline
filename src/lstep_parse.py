"""Lstep CSV (CP932) パース"""
import csv
import glob
import os
from typing import List, Dict


def _resolve_csv_path(path: str) -> str:
    """指定パスが無い場合、 同じディレクトリの最新 .csv を探す"""
    if os.path.exists(path):
        return path
    # data/lstep/ 内の任意の .csv を fallback (ファイル名がタイムスタンプ含むケース対応)
    dir_path = os.path.dirname(path) or "."
    candidates = sorted(
        glob.glob(os.path.join(dir_path, "*.csv")),
        key=os.path.getmtime,
        reverse=True,
    )
    if candidates:
        print(f"  [lstep_parse] {path} 未検出 → 代替ファイル使用: {candidates[0]}")
        return candidates[0]
    return ""


def parse_lstep_csv(path: str) -> List[Dict]:
    """
    Lステップ CSV 構造:
    - 行1: カテゴリ (大区分; 流入経路 / クリエ別 等)
    - 行2: フィールド名 (3.広告, 11.広告(自社運用), metaCR_xxx, 友だち追加日時 等)
    - 行3〜: データ行

    CSV はデフォルト CP932 (Shift-JIS) 出力。
    ファイル名は latest.csv 推奨だが、 member_*.csv 等タイムスタンプ付きも自動検出。
    """
    resolved = _resolve_csv_path(path)
    if not resolved:
        print(f"  [lstep_parse] {path} および {os.path.dirname(path)}/ 内に .csv が見つかりません。 空配列を返します。")
        return []
    path = resolved

    # CP932 で開く。失敗したら UTF-8 にフォールバック
    encoding = "cp932"
    try:
        with open(path, "r", encoding=encoding, errors="replace") as f:
            f.read(1024)
    except UnicodeDecodeError:
        encoding = "utf-8-sig"

    with open(path, "r", encoding=encoding, errors="replace", newline="") as f:
        reader = csv.reader(f)
        try:
            category_row = next(reader)
            header_row = next(reader)
        except StopIteration:
            return []

        # ヘッダー名重複を suffix で解消
        seen = {}
        unique_headers = []
        for h in header_row:
            h = h.strip()
            if h in seen:
                seen[h] += 1
                unique_headers.append(f"{h}__{seen[h]}")
            else:
                seen[h] = 0
                unique_headers.append(h)

        rows: List[Dict] = []
        for line in reader:
            if not any(line):
                continue
            row = dict(zip(unique_headers, line))
            rows.append(row)

    print(f"  [lstep_parse] {len(rows)} 件読込 (encoding={encoding})")
    return rows


def truthy(v) -> bool:
    """Lstep CSV のタグセル値が '真' を示すか判定"""
    if v is None:
        return False
    s = str(v).strip()
    return s in ("1", "true", "True", "TRUE", "有")
