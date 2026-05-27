'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { getDashboardData, recordPayment } from '@/lib/client-actions';
import { formatCurrency } from '@/lib/game-engine';
import type { Boss } from '@/lib/types';

// ---------------------------------------------------------------------------
// CSV utilities
// ---------------------------------------------------------------------------

/** Keywords that suggest a CSV row is a debt repayment */
const DEBT_KEYWORDS = [
  '返済', 'ローン', 'リボ', '奨学金',
  'アコム', 'プロミス', 'レイク', 'アイフル', 'モビット', 'SMBCモビット',
  '元金', '利息', '借入返済', 'カードローン',
  '分割払い', 'キャッシング',
];

interface CsvRow {
  /** Raw column values keyed by header name */
  [key: string]: string;
}

interface ParsedPaymentRow {
  id: number;
  date: string;       // YYYY-MM-DD
  description: string;
  amount: number;      // positive yen
  rawAmount: string;   // original string from CSV
  matchedKeyword: string;
  selected: boolean;
  bossId: string;      // the boss the user wants to map this to
}

/**
 * Decode an ArrayBuffer that may be Shift-JIS or UTF-8.
 * We first try UTF-8; if the result contains the replacement character we
 * fall back to Shift-JIS (Windows-31J).
 */
function decodeCSVBuffer(buffer: ArrayBuffer): string {
  // Try UTF-8 first
  const utf8 = new TextDecoder('utf-8').decode(buffer);
  if (!utf8.includes('�')) return utf8;

  // Fall back to Shift-JIS
  try {
    return new TextDecoder('shift-jis').decode(buffer);
  } catch {
    // If Shift-JIS decoder is not available, return UTF-8 as-is
    return utf8;
  }
}

/**
 * Minimal CSV parser that handles quoted fields and embedded commas / newlines.
 * Returns an array of rows, where each row is an array of string values.
 */
function parseCSVText(text: string): string[][] {
  const rows: string[][] = [];
  let i = 0;
  const len = text.length;

  while (i < len) {
    const row: string[] = [];
    while (i < len) {
      let value = '';
      if (text[i] === '"') {
        // Quoted field
        i++; // skip opening quote
        while (i < len) {
          if (text[i] === '"') {
            if (i + 1 < len && text[i + 1] === '"') {
              value += '"';
              i += 2;
            } else {
              i++; // skip closing quote
              break;
            }
          } else {
            value += text[i];
            i++;
          }
        }
        // skip to delimiter or end of line
        if (i < len && text[i] === ',') {
          i++;
        } else if (i < len && (text[i] === '\r' || text[i] === '\n')) {
          // will be handled below
        }
      } else {
        // Unquoted field
        while (i < len && text[i] !== ',' && text[i] !== '\r' && text[i] !== '\n') {
          value += text[i];
          i++;
        }
        if (i < len && text[i] === ',') {
          i++;
        }
      }
      row.push(value.trim());

      // Check for end of line or end of text
      if (i >= len || text[i] === '\r' || text[i] === '\n') {
        break;
      }
    }
    // Skip line endings
    if (i < len && text[i] === '\r') i++;
    if (i < len && text[i] === '\n') i++;

    if (row.length > 0 && !(row.length === 1 && row[0] === '')) {
      rows.push(row);
    }
  }
  return rows;
}

/**
 * Parse date strings that MoneyForward may produce:
 *   "2025/01/15", "2025/1/5", "2025-01-15"
 * Returns YYYY-MM-DD or empty string.
 */
function parseDateString(s: string): string {
  const m = s.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (!m) return '';
  const [, y, mo, d] = m;
  return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

/**
 * Parse a MoneyForward amount string.
 * May have commas, yen mark, negative sign, or be wrapped in quotes.
 * Returns the absolute yen value as a positive number (debt payments are
 * typically negative in MoneyForward).
 */
function parseAmount(s: string): number {
  const cleaned = s.replace(/[¥￥,、\s"]/g, '');
  const n = parseInt(cleaned, 10);
  return isNaN(n) ? 0 : Math.abs(n);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ImportPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Data from localStorage
  const [bosses, setBosses] = useState<Boss[]>([]);
  const [loading, setLoading] = useState(true);
  const [noBosses, setNoBosses] = useState(false);

  // CSV processing state
  const [fileName, setFileName] = useState('');
  const [allCsvRows, setAllCsvRows] = useState<CsvRow[]>([]);
  const [paymentRows, setPaymentRows] = useState<ParsedPaymentRow[]>([]);
  const [parseError, setParseError] = useState('');
  const [step, setStep] = useState<'upload' | 'preview' | 'done'>('upload');

  // Import result
  const [importResults, setImportResults] = useState<
    { description: string; amount: number; bossName: string; xpEarned: number; success: boolean; error?: string }[]
  >([]);
  const [importing, setImporting] = useState(false);

  // Load bosses on mount
  useEffect(() => {
    const data = getDashboardData();
    if (data) {
      const active = data.bosses.filter((b) => !b.is_defeated);
      setBosses(active);
      if (active.length === 0) setNoBosses(true);
    } else {
      setNoBosses(true);
    }
    setLoading(false);
  }, []);

  // ---- File handling ----
  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      setParseError('');
      setPaymentRows([]);
      setAllCsvRows([]);

      const file = e.target.files?.[0];
      if (!file) return;
      setFileName(file.name);

      try {
        const buffer = await file.arrayBuffer();
        const text = decodeCSVBuffer(buffer);
        const rows = parseCSVText(text);

        if (rows.length < 2) {
          setParseError('CSVに十分なデータがありません。ヘッダー行とデータ行が必要です。');
          return;
        }

        const headers = rows[0];
        const dataRows: CsvRow[] = rows.slice(1).map((cols) => {
          const obj: CsvRow = {};
          headers.forEach((h, idx) => {
            obj[h] = cols[idx] ?? '';
          });
          return obj;
        });
        setAllCsvRows(dataRows);

        // Detect which columns are date / description / amount
        const dateCol = headers.find((h) => /日付|取引日|利用日/.test(h)) || '';
        const descCol =
          headers.find((h) => /内容|摘要|取引内容|備考|項目/.test(h)) || '';
        const amountCol =
          headers.find((h) => /金額|出金|支出/.test(h)) || '';

        if (!dateCol && !descCol && !amountCol) {
          setParseError(
            'CSVのヘッダーを認識できませんでした。「日付」「内容」「金額」列が必要です。'
          );
          return;
        }

        // Filter rows that match debt keywords
        let idCounter = 0;
        const defaultBossId = bosses.length > 0 ? bosses[0].id : '';

        const matched: ParsedPaymentRow[] = [];
        for (const row of dataRows) {
          const desc = row[descCol] || '';
          const matchedKw = DEBT_KEYWORDS.find((kw) => desc.includes(kw));
          if (!matchedKw) continue;

          const date = parseDateString(row[dateCol] || '');
          const amount = parseAmount(row[amountCol] || '');
          if (amount <= 0) continue;

          matched.push({
            id: idCounter++,
            date: date || new Date().toISOString().split('T')[0],
            description: desc,
            amount,
            rawAmount: row[amountCol] || '',
            matchedKeyword: matchedKw,
            selected: true,
            bossId: defaultBossId,
          });
        }

        if (matched.length === 0) {
          setParseError(
            `${dataRows.length}行を読み込みましたが、返済に該当する行が見つかりませんでした。キーワード: ${DEBT_KEYWORDS.slice(0, 6).join('、')} 等`
          );
          return;
        }

        setPaymentRows(matched);
        setStep('preview');
      } catch (err) {
        setParseError(`ファイルの読み込みに失敗しました: ${err instanceof Error ? err.message : String(err)}`);
      }
    },
    [bosses]
  );

  // Toggle selection
  const toggleRow = (id: number) => {
    setPaymentRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, selected: !r.selected } : r))
    );
  };

  const toggleAll = () => {
    const allSelected = paymentRows.every((r) => r.selected);
    setPaymentRows((prev) => prev.map((r) => ({ ...r, selected: !allSelected })));
  };

  // Assign boss
  const assignBoss = (id: number, bossId: string) => {
    setPaymentRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, bossId } : r))
    );
  };

  const assignAllBoss = (bossId: string) => {
    setPaymentRows((prev) => prev.map((r) => ({ ...r, bossId })));
  };

  // ---- Import ----
  const handleImport = () => {
    const selected = paymentRows.filter((r) => r.selected && r.bossId);
    if (selected.length === 0) return;

    setImporting(true);
    const results: typeof importResults = [];

    for (const row of selected) {
      const boss = bosses.find((b) => b.id === row.bossId);
      try {
        const res = recordPayment({
          bossId: row.bossId,
          amount: row.amount,
          type: 'normal',
          paidAt: row.date,
          memo: `マネフォCSV: ${row.description}`,
        });
        results.push({
          description: row.description,
          amount: row.amount,
          bossName: boss?.name || '不明',
          xpEarned: res.xpEarned,
          success: true,
        });
      } catch (err) {
        results.push({
          description: row.description,
          amount: row.amount,
          bossName: boss?.name || '不明',
          xpEarned: 0,
          success: false,
          error: err instanceof Error ? err.message : '記録に失敗',
        });
      }
    }

    setImportResults(results);
    setImporting(false);
    setStep('done');

    // Refresh boss data
    const data = getDashboardData();
    if (data) setBosses(data.bosses.filter((b) => !b.is_defeated));
  };

  // Reset to start
  const resetImport = () => {
    setStep('upload');
    setFileName('');
    setAllCsvRows([]);
    setPaymentRows([]);
    setParseError('');
    setImportResults([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ---------- Render ----------

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-4xl animate-sparkle">📥</p>
      </div>
    );
  }

  const selectedCount = paymentRows.filter((r) => r.selected).length;
  const selectedTotal = paymentRows.filter((r) => r.selected).reduce((s, r) => s + r.amount, 0);

  return (
    <div className="pt-6 space-y-4 pb-8">
      {/* Header */}
      <div className="card-accent p-6 text-center">
        <p className="text-4xl mb-3">📥</p>
        <h1 className="text-2xl font-extrabold" style={{ color: '#d4a020' }}>
          マネーフォワード取込
        </h1>
        <p className="text-xs mt-1.5 font-medium" style={{ color: '#6b7280' }}>
          CSVから返済データを一括インポート
        </p>
      </div>

      {noBosses && (
        <div className="card p-5 text-center">
          <p className="text-sm font-bold mb-2" style={{ color: '#ef4444' }}>
            討伐対象のモンスターがいません
          </p>
          <p className="text-xs mb-4" style={{ color: '#6b7280' }}>
            先に設定画面でクエストを登録してください。
          </p>
          <Link href="/setup" className="btn-main inline-block !px-6">
            設定へ
          </Link>
        </div>
      )}

      {/* ==================== STEP 1: Upload ==================== */}
      {step === 'upload' && !noBosses && (
        <div className="card p-5 space-y-4">
          <div className="section-label" style={{ marginBottom: '2px' }}>
            <h2 className="text-[15px] font-extrabold" style={{ color: '#1a1a2e' }}>
              CSVファイルを選択
            </h2>
          </div>
          <p className="text-xs font-medium" style={{ color: '#6b7280' }}>
            マネーフォワードの「入出金明細」画面からCSVをダウンロードしてアップロードしてください。
            Shift-JIS / UTF-8 どちらにも対応しています。
          </p>

          <div className="space-y-3">
            <label
              className="block w-full cursor-pointer"
              style={{
                background: 'rgba(184, 148, 80, 0.08)',
                border: '2px dashed rgba(184, 148, 80, 0.3)',
                borderRadius: '12px',
                padding: '24px 16px',
                textAlign: 'center',
                transition: 'border-color 0.2s',
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <p className="text-3xl mb-2">📄</p>
              <p className="text-sm font-bold" style={{ color: '#d4a020' }}>
                {fileName || 'タップしてCSVを選択'}
              </p>
              <p className="text-[10px] mt-1" style={{ color: '#6b7280' }}>
                .csv ファイル対応
              </p>
            </label>
          </div>

          {parseError && (
            <div className="card-inner p-4">
              <p className="text-xs font-bold" style={{ color: '#ef4444' }}>
                {parseError}
              </p>
            </div>
          )}

          {/* Instructions */}
          <div className="card-inner p-4 space-y-2">
            <p className="text-[11px] font-bold" style={{ color: '#d4a020' }}>
              検出キーワード
            </p>
            <div className="flex flex-wrap gap-1.5">
              {DEBT_KEYWORDS.slice(0, 10).map((kw) => (
                <span key={kw} className="tag tag-clear">
                  {kw}
                </span>
              ))}
            </div>
            <p className="text-[10px] mt-1" style={{ color: '#6b7280' }}>
              上記キーワードを含む行を自動抽出します。
            </p>
          </div>
        </div>
      )}

      {/* ==================== STEP 2: Preview ==================== */}
      {step === 'preview' && (
        <div className="space-y-4">
          {/* Summary bar */}
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold" style={{ color: '#1a1a2e' }}>
                  {allCsvRows.length}行中{paymentRows.length}件を検出
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: '#6b7280' }}>
                  {selectedCount}件選択中 / 合計{' '}
                  <span style={{ color: '#d4a020', fontWeight: 800 }}>
                    {formatCurrency(selectedTotal)}
                  </span>
                </p>
              </div>
              <button onClick={toggleAll} className="btn-outline !py-1.5 !px-3 !text-[10px]">
                {paymentRows.every((r) => r.selected) ? '全解除' : '全選択'}
              </button>
            </div>
          </div>

          {/* Batch boss assignment */}
          {bosses.length > 1 && (
            <div className="card-inner p-3">
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#6b7280' }}>
                一括で討伐対象を設定
              </label>
              <select
                className="select-clean"
                onChange={(e) => {
                  if (e.target.value) assignAllBoss(e.target.value);
                }}
                defaultValue=""
              >
                <option value="" disabled>
                  ボスを選択...
                </option>
                {bosses.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.emoji} {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Row list */}
          <div className="space-y-2">
            {paymentRows.map((row) => {
              const boss = bosses.find((b) => b.id === row.bossId);
              return (
                <div
                  key={row.id}
                  className="card p-4"
                  style={{
                    opacity: row.selected ? 1 : 0.45,
                    borderColor: row.selected ? 'rgba(184, 148, 80, 0.2)' : undefined,
                  }}
                >
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleRow(row.id)}
                      className="mt-0.5 flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-all"
                      style={{
                        borderColor: row.selected ? '#d4a020' : 'rgba(255,255,255,0.1)',
                        background: row.selected ? 'rgba(184,148,80,0.2)' : 'transparent',
                      }}
                    >
                      {row.selected && (
                        <span className="text-xs" style={{ color: '#d4a020' }}>
                          ✓
                        </span>
                      )}
                    </button>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold truncate" style={{ color: '#1a1a2e' }}>
                          {row.description}
                        </p>
                        <p
                          className="text-sm font-extrabold flex-shrink-0 ml-2"
                          style={{ color: '#ef4444' }}
                        >
                          {formatCurrency(row.amount)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px]" style={{ color: '#6b7280' }}>
                          {row.date}
                        </span>
                        <span className="tag tag-active" style={{ fontSize: '9px', padding: '1px 6px' }}>
                          {row.matchedKeyword}
                        </span>
                      </div>

                      {/* Boss select */}
                      {row.selected && bosses.length > 0 && (
                        <div className="mt-2">
                          <select
                            value={row.bossId}
                            onChange={(e) => assignBoss(row.id, e.target.value)}
                            className="select-clean !text-[11px] !py-1.5"
                          >
                            {bosses.map((b) => (
                              <option key={b.id} value={b.id}>
                                {b.emoji} {b.name} (HP: {formatCurrency(b.current_hp)})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button onClick={resetImport} className="flex-1 btn-outline">
              やり直す
            </button>
            <button
              onClick={handleImport}
              disabled={importing || selectedCount === 0}
              className="flex-1 btn-gold"
            >
              {importing ? '取込中...' : `⚔️ ${selectedCount}件を取込`}
            </button>
          </div>
        </div>
      )}

      {/* ==================== STEP 3: Done ==================== */}
      {step === 'done' && (
        <div className="space-y-4">
          <div className="card-accent p-6 text-center">
            <p className="text-5xl mb-3">🎉</p>
            <p className="text-lg font-extrabold" style={{ color: '#1a1a2e' }}>
              取込完了！
            </p>
            <p className="text-xs mt-1" style={{ color: '#6b7280' }}>
              {importResults.filter((r) => r.success).length}件の攻撃を記録しました
            </p>
          </div>

          {/* Result summary */}
          <div className="card p-4">
            <div className="grid grid-cols-2 gap-3 text-center">
              <div>
                <p className="text-[10px] font-bold uppercase" style={{ color: '#6b7280' }}>
                  成功
                </p>
                <p className="text-xl font-extrabold" style={{ color: '#10b981' }}>
                  {importResults.filter((r) => r.success).length}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase" style={{ color: '#6b7280' }}>
                  獲得EXP
                </p>
                <p className="text-xl font-extrabold" style={{ color: '#d4a020' }}>
                  +{importResults.filter((r) => r.success).reduce((s, r) => s + r.xpEarned, 0)}
                </p>
              </div>
            </div>
          </div>

          {/* Individual results */}
          <div className="space-y-2">
            {importResults.map((r, i) => (
              <div key={i} className="card-inner p-3">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold truncate" style={{ color: '#1a1a2e' }}>
                      {r.success ? '✓' : '✗'} {r.description}
                    </p>
                    <p className="text-[10px]" style={{ color: '#6b7280' }}>
                      → {r.bossName}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className="text-xs font-extrabold" style={{ color: r.success ? '#ef4444' : '#ef4444' }}>
                      {r.success ? `-${formatCurrency(r.amount)}` : 'エラー'}
                    </p>
                    {r.success && (
                      <p className="text-[10px] font-bold" style={{ color: '#8b5cf6' }}>
                        +{r.xpEarned} EXP
                      </p>
                    )}
                    {r.error && (
                      <p className="text-[10px]" style={{ color: '#ef4444' }}>
                        {r.error}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex gap-3">
            <button onClick={resetImport} className="flex-1 btn-outline">
              続けて取込
            </button>
            <Link href="/" className="flex-1 btn-gold text-center">
              拠点へ戻る
            </Link>
          </div>
        </div>
      )}

      {/* Back link */}
      <div className="text-center pt-2">
        <Link
          href="/setup"
          className="text-xs font-bold"
          style={{ color: '#6b7280', textDecoration: 'underline', textUnderlineOffset: '3px' }}
        >
          設定に戻る
        </Link>
      </div>
    </div>
  );
}
