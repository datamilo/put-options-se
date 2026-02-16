# IV Analysis Page — Constant-Maturity Update

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Update the IV Analysis page to use the new constant-maturity 30-day IV data (variance interpolation) instead of single-option selection.

**Architecture:** The upstream CSV has changed from picking single options (Strike_Price, Expiry_Date columns) to computing synthetic 30-day IV via variance interpolation (IV_30d column). Hook, types, and documentation are updated; components and UI remain structurally identical. Info alert explains the new methodology.

**Tech Stack:** React 18, TypeScript, PapaParse (CSV parsing), Nordic number formatting.

---

## Task 1: Update TypeScript Types

**Files:**
- Modify: `src/types/ivAnalysis.ts`

**Step 1: Read the file**

```bash
cat /c/Users/Gustaf/dev/put-options-se-1/src/types/ivAnalysis.ts
```

**Step 2: Replace with new types**

Old interface `IVPerStockPerDay` had: `Stock_Name`, `Date`, `Stock_Price`, `Strike_Price`, `Implied_Volatility`, `Expiry_Date`.

New interface should have: `Stock_Name`, `Date`, `Stock_Price`, `IV_30d`.

```typescript
// src/types/ivAnalysis.ts

export interface IVPerStockPerDay {
  Stock_Name: string;
  Date: string;           // YYYY-MM-DD
  Stock_Price: number;
  IV_30d: number | null;  // null for 67 rows with no_data method
}

export interface IVStockSummary {
  stockName: string;
  latestDate: string;
  currentIV: number | null;
  currentStockPrice: number;
  ivRank52w: number | null;   // 0-100
  ivRankAllTime: number | null; // 0-100
  ivChange1d: number | null;  // absolute pp difference
  ivChange5d: number | null;  // absolute pp difference
}
```

**Step 3: Commit**

```bash
git add src/types/ivAnalysis.ts
git commit -m "feat: update IV types for constant-maturity data structure (IV_30d instead of single-option)"
```

---

## Task 2: Rewrite Data Hook

**Files:**
- Modify: `src/hooks/useIVPerStockPerDay.ts`

**Step 1: Read the file**

```bash
cat /c/Users/Gustaf/dev/put-options-se-1/src/hooks/useIVPerStockPerDay.ts
```

**Step 2: Replace hook with new implementation**

Key changes:
- Parse `IV_30d` instead of `Strike_Price` and `Implied_Volatility`
- Skip `Near_Expiry_DTE`, `Far_Expiry_DTE`, `Method` columns (ignore them)
- IV Rank formula stays identical, applied to `IV_30d` values
- 1-day/5-day delta logic stays identical

```typescript
// src/hooks/useIVPerStockPerDay.ts

import { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
import { IVPerStockPerDay, IVStockSummary } from '@/types/ivAnalysis';

const GITHUB_URL = 'https://raw.githubusercontent.com/datamilo/put-options-se/main/data/iv_per_stock_per_day.csv';
const LOCAL_URL = '/data/iv_per_stock_per_day.csv';

function computeIVRank(currentIV: number, values: number[]): number | null {
  if (values.length === 0) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return 50;
  return Math.round(((currentIV - min) / (max - min)) * 100);
}

export const useIVPerStockPerDay = () => {
  const [rawData, setRawData] = useState<IVPerStockPerDay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);

        let csvText = '';
        for (const url of [GITHUB_URL, LOCAL_URL]) {
          try {
            const response = await fetch(url.includes('github') ? `${url}?${Date.now()}` : url);
            if (response.ok) {
              csvText = await response.text();
              break;
            }
          } catch {
            // try next
          }
        }

        if (!csvText) {
          throw new Error('Could not load IV data from GitHub or local source.');
        }

        const result = Papa.parse<Record<string, string>>(csvText, {
          header: true,
          skipEmptyLines: true,
          delimiter: '|',
        });

        const parsed: IVPerStockPerDay[] = result.data.map(row => ({
          Stock_Name: row.Stock_Name?.trim() ?? '',
          Date: row.Date?.trim() ?? '',
          Stock_Price: parseFloat(row.Stock_Price) || 0,
          IV_30d: row.IV_30d && row.IV_30d !== '' && row.IV_30d !== 'nan'
            ? parseFloat(row.IV_30d)
            : null,
        })).filter(row => row.Stock_Name && row.Date);

        setRawData(parsed);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  // Pre-group data by stock for efficient lookups
  const dataByStock = useMemo(() => {
    const map = new Map<string, IVPerStockPerDay[]>();
    for (const row of rawData) {
      if (!map.has(row.Stock_Name)) map.set(row.Stock_Name, []);
      map.get(row.Stock_Name)!.push(row);
    }
    // Sort each stock's rows by date ascending
    for (const rows of map.values()) {
      rows.sort((a, b) => a.Date.localeCompare(b.Date));
    }
    return map;
  }, [rawData]);

  // Compute summary metrics for all stocks
  const stockSummaries = useMemo((): IVStockSummary[] => {
    const summaries: IVStockSummary[] = [];

    for (const [stockName, rows] of dataByStock.entries()) {
      const validRows = rows.filter(r => r.IV_30d !== null);
      if (validRows.length === 0) {
        // Stock has no valid IV at all — still include with nulls
        const last = rows[rows.length - 1];
        summaries.push({
          stockName,
          latestDate: last?.Date ?? '',
          currentIV: null,
          currentStockPrice: last?.Stock_Price ?? 0,
          ivRank52w: null,
          ivRankAllTime: null,
          ivChange1d: null,
          ivChange5d: null,
        });
        continue;
      }

      const lastValid = validRows[validRows.length - 1];
      const currentIV = lastValid.IV_30d!;
      const currentDate = lastValid.Date;

      // All-time IV values
      const allIVs = validRows.map(r => r.IV_30d!);
      const ivRankAllTime = computeIVRank(currentIV, allIVs);

      // 52-week (365 calendar days for simplicity)
      const cutoff52w = new Date(currentDate);
      cutoff52w.setFullYear(cutoff52w.getFullYear() - 1);
      const cutoffStr = cutoff52w.toISOString().split('T')[0];
      const ivs52w = validRows
        .filter(r => r.Date >= cutoffStr)
        .map(r => r.IV_30d!);
      const ivRank52w = computeIVRank(currentIV, ivs52w);

      // 1-day change: find the valid row just before the last valid row
      const prevValid = validRows.length >= 2 ? validRows[validRows.length - 2] : null;
      const ivChange1d = prevValid ? currentIV - prevValid.IV_30d! : null;

      // 5-day change: find valid row 5+ positions back
      const fiveDayBack = validRows.length > 5 ? validRows[validRows.length - 6] : null;
      const ivChange5d = fiveDayBack ? currentIV - fiveDayBack.IV_30d! : null;

      summaries.push({
        stockName,
        latestDate: currentDate,
        currentIV,
        currentStockPrice: lastValid.Stock_Price,
        ivRank52w,
        ivRankAllTime,
        ivChange1d,
        ivChange5d,
      });
    }

    return summaries;
  }, [dataByStock]);

  return {
    rawData,
    dataByStock,
    stockSummaries,
    isLoading,
    error,
  };
};
```

**Step 3: Build check**

```bash
cd /c/Users/Gustaf/dev/put-options-se-1 && npm run build 2>&1 | tail -20
```

Expected: Build succeeds (no TypeScript errors).

**Step 4: Commit**

```bash
git add src/hooks/useIVPerStockPerDay.ts
git commit -m "feat: update hook for constant-maturity IV_30d data structure"
```

---

## Task 3: Update Page Info Alert

**Files:**
- Modify: `src/pages/IVAnalysis.tsx`

**Step 1: Read the file**

```bash
cat /c/Users/Gustaf/dev/put-options-se-1/src/pages/IVAnalysis.tsx | head -80
```

**Step 2: Update the alert text**

Find the Alert component that currently says:
```
"IV values are from the option with strike price closest to the current stock price, expiring within 30 days..."
```

Replace AlertDescription content with:

```jsx
<AlertDescription>
  <strong>Data source:</strong> Each day's IV is a constant-maturity 30-day implied volatility computed via variance interpolation across the options term structure, targeting ~21 business days (following the Swedish holiday calendar). Dates with no valid IV data show as "–".
</AlertDescription>
```

**Step 3: Commit**

```bash
git add src/pages/IVAnalysis.tsx
git commit -m "docs: update IV alert to explain constant-maturity variance interpolation methodology"
```

---

## Task 4: Add Scrollable Container to Screening Table

**Files:**
- Modify: `src/pages/IVAnalysis.tsx`

**Step 1: Wrap IVScreeningTable in scrollable div**

Find the `<IVScreeningTable ... />` component in the render. Wrap it like:

```jsx
<div className="max-h-96 overflow-y-auto border rounded-lg">
  <IVScreeningTable
    summaries={stockSummaries}
    selectedStock={selectedStock}
    onSelectStock={handleSelectStock}
  />
</div>
```

**Step 2: Commit**

```bash
git add src/pages/IVAnalysis.tsx
git commit -m "feat: add scrollable container to IV screening table (max-h-96)"
```

---

## Task 5: Update Documentation

**Files:**
- Modify: `docs/iv-analysis.md`

**Step 1: Read the current file**

```bash
cat /c/Users/Gustaf/dev/put-options-se-1/docs/iv-analysis.md
```

**Step 2: Replace "Data Source and Methodology" section**

Old section explained single-option selection. Replace with:

```markdown
## Data Source and Methodology

### Constant-Maturity 30-Day IV

Each day's IV is a synthetic, constant-maturity implied volatility targeting ~21 business days (approximately 30 calendar days). This is computed via variance interpolation across the available options term structure, ensuring consistent maturity across all dates.

**How it works:**
1. For each expiry date available on a given date, the at-the-money (ATM) IV is estimated via linear interpolation across available strikes.
2. These ATM IVs are converted to total variance (IV² × time).
3. Variance is interpolated to the target 21-business-day maturity.
4. The result is converted back to annualized IV.

**Why constant-maturity matters:** If you picked the nearest-expiry option on different dates, you might get a 7-day IV one day and a 28-day IV another—not comparable. Constant-maturity ensures all IVs represent the same time horizon.

**Business days:** Calculations follow the Swedish public holiday calendar (not calendar days), ensuring consistent time-to-expiry across the year.

**Edge cases:**
- If two expirations bracket the 21-day target: interpolate between them.
- If only near-term or only far-term expirations exist: use the closest expiry's ATM IV.
- If no valid IV data: row shows "–".
```

Also update the "Columns" table in the page features section (remove references to Strike_Price and Expiry_Date, keep only Stock_Name, Date, Stock_Price, IV_30d).

**Step 3: Commit**

```bash
git add docs/iv-analysis.md
git commit -m "docs: update IV analysis documentation for constant-maturity methodology"
```

---

## Task 6: Add Explanation Principle to CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

**Step 1: Read the file**

```bash
cat /c/Users/Gustaf/dev/put-options-se-1/CLAUDE.md | grep -A 20 "Audience & Tone"
```

**Step 2: Add new principle after "Audience & Tone" section**

Add this new subsection:

```markdown
### Explanation Principle

**Explain only what IS (current facts and methodology).** Never explain what WAS (previous versions) or what COULD HAVE BEEN (alternatives). Avoid comparative language ("rather than", "instead of", "unlike the old", "improved from"). Professional investors want facts, not rationale.

**Example — BAD:**
- "This new IV metric is better than picking single options because it ensures consistent maturity."
- "The screening now uses constant-maturity IV rather than the old single-strike approach."

**Example — GOOD:**
- "Each day's IV is a constant-maturity 30-day implied volatility computed via variance interpolation."
```

**Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: add explanation principle to CLAUDE.md (facts only, no comparisons)"
```

---

## Task 7: Final Build and Push

**Step 1: Full build**

```bash
cd /c/Users/Gustaf/dev/put-options-se-1 && npm run build 2>&1 | tail -30
```

Expected: No errors.

**Step 2: Git log**

```bash
git log --oneline -8
```

Expected: See ~6 commits for this feature.

**Step 3: Push**

```bash
git push
```

Expected: All commits pushed to main.

---

## Checklist

- [ ] Types updated: `IV_30d` instead of `Strike_Price`, `Implied_Volatility`
- [ ] Hook rewritten: parses `IV_30d`, computes ranks/deltas same way
- [ ] Info alert: explains constant-maturity, variance interpolation, business days
- [ ] Scrollable container: `max-h-96 overflow-y-auto` around screening table
- [ ] Documentation: updated data source section with methodology
- [ ] CLAUDE.md: explanation principle added
- [ ] Build passes
- [ ] All commits pushed
