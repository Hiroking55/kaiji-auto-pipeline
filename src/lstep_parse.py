"""Lstep CSV (CP932) パース"""
import csv
import os
from typing import List, Dict


def parse_lstep_csv(path: str) -> List[Dict]:
    """
    Lステップ CSV 構造:
    - 行1: カテゴリ (大区分; 流入経路 / クリエ別 等)
    - 行2: フィールド名 (3.広告, 11.広告(自社運用), metaCR_xxx, 友だち追加日時 等)
    - 行3〜: データ行

    CSV はデフォルト CP932 (Shift-JIS) 出力。
    """
    if not os.path.exists(path):
        print(f"  [lstep_parse] {path} が存在しません。 空配列を返します。")
        return []

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
