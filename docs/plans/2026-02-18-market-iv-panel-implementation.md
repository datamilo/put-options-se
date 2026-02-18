# MARKET_IV Panel Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a dedicated Swedish Market IV index panel above the IV screening table, separating the synthetic `MARKET_IV` row from per-stock data throughout the app.

**Architecture:** Split happens at the hook level — MARKET_IV rows are filtered out before `stockSummaries`/`dataByStock` are computed, so all existing components are untouched. A new `MarketIVPanel` component renders the market index with 6 KPI cards and a single-axis IV chart.

**Tech Stack:** React 18, TypeScript, Recharts (`LineChart`, `ResponsiveContainer`), shadcn/ui cards and buttons, Nordic number formatting utils.

---

## Context: Key Files

| File | Role |
|------|------|
| `src/types/ivAnalysis.ts` | Type definitions — extend here first |
| `src/hooks/useIVPerStockPerDay.ts` | Data loading + summary computation — split MARKET_IV here |
| `src/components/iv-analysis/IVDetailSection.tsx` | Reference for KPICard pattern (copy the `KPICard` component) |
| `src/components/iv-analysis/IVDualAxisChart.tsx` | Reference for date range filter + Recharts pattern |
| `src/pages/IVAnalysis.tsx` | Page that renders everything — add MarketIVPanel here |
| `src/utils/numberFormatting.ts` | Nordic formatters: `formatNordicDecimal`, `formatNordicPercentagePoints` |

## CSV Columns Reference

The `iv_per_stock_per_day.csv` is pipe-delimited (`|`). Relevant columns:

| Column | Stock rows | MARKET_IV rows |
|--------|-----------|----------------|
| `Stock_Name` | stock ticker | `"MARKET_IV"` |
| `Date` | YYYY-MM-DD | YYYY-MM-DD |
| `Stock_Price` | float | empty/NaN |
| `IV_30d` | float or empty | float (equal-weight variance avg) |
| `N_Stocks` | empty | integer |
| `N_Excluded` | empty | integer |

---

## Task 1: Update Types

**Files:**
- Modify: `src/types/ivAnalysis.ts`

**Step 1: Add fields to `IVPerStockPerDay`**

Add two nullable fields after `IV_30d`:

```ts
// src/types/ivAnalysis.ts

export interface IVPerStockPerDay {
  Stock_Name: string;
  Date: string;           // YYYY-MM-DD
  Stock_Price: number;
  IV_30d: number | null;  // null for no_data method rows
  N_Stocks: number | null;   // populated only for MARKET_IV rows
  N_Excluded: number | null; // populated only for MARKET_IV rows
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

export interface IVMarketSummary {
  latestDate: string;
  currentIV: number | null;
  ivRank52w: number | null;
  ivRankAllTime: number | null;
  ivChange1d: number | null;
  ivChange5d: number | null;
  nStocks: number | null;
  nExcluded: number | null;
}
```

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors (new fields are additive).

**Step 3: Commit**

```bash
git add src/types/ivAnalysis.ts
git commit -m "feat: add N_Stocks/N_Excluded to IVPerStockPerDay, add IVMarketSummary type"
```

---

## Task 2: Update Hook to Split MARKET_IV

**Files:**
- Modify: `src/hooks/useIVPerStockPerDay.ts`

**Step 1: Parse N_Stocks and N_Excluded from CSV rows**

In the `.map(row => ...)` block (currently lines 52–59), extend to parse the two new fields:

```ts
const parsed: IVPerStockPerDay[] = result.data.map(row => ({
  Stock_Name: row.Stock_Name?.trim() ?? '',
  Date: row.Date?.trim() ?? '',
  Stock_Price: parseFloat(row.Stock_Price) || 0,
  IV_30d: row.IV_30d && row.IV_30d !== '' && row.IV_30d !== 'nan'
    ? parseFloat(row.IV_30d)
    : null,
  N_Stocks: row.N_Stocks && row.N_Stocks !== '' && row.N_Stocks !== 'nan'
    ? parseInt(row.N_Stocks, 10)
    : null,
  N_Excluded: row.N_Excluded && row.N_Excluded !== '' && row.N_Excluded !== 'nan'
    ? parseInt(row.N_Excluded, 10)
    : null,
})).filter(row => row.Stock_Name && row.Date);
```

**Step 2: Split MARKET_IV rows from stock rows**

After `setRawData(parsed)`, split immediately:

```ts
// Replace: setRawData(parsed);
// With:
const marketRows = parsed.filter(r => r.Stock_Name === 'MARKET_IV');
const stockRows = parsed.filter(r => r.Stock_Name !== 'MARKET_IV');
setRawData(stockRows);
setMarketIVData(marketRows.sort((a, b) => a.Date.localeCompare(b.Date)));
```

**Step 3: Add state for market IV data**

Add alongside the existing `rawData` state (top of the hook, after line 19):

```ts
const [marketIVData, setMarketIVData] = useState<IVPerStockPerDay[]>([]);
```

**Step 4: Compute marketIVSummary**

Add a new `useMemo` after the `stockSummaries` memo (around line 146). It reuses the existing `computeIVRank` helper that is already defined in the file:

```ts
const marketIVSummary = useMemo((): IVMarketSummary | null => {
  const validRows = marketIVData.filter(r => r.IV_30d !== null);
  if (validRows.length === 0) return null;

  const lastValid = validRows[validRows.length - 1];
  const currentIV = lastValid.IV_30d!;
  const currentDate = lastValid.Date;

  const allIVs = validRows.map(r => r.IV_30d!);
  const ivRankAllTime = computeIVRank(currentIV, allIVs);

  const cutoff52w = new Date(currentDate);
  cutoff52w.setFullYear(cutoff52w.getFullYear() - 1);
  const cutoffStr = cutoff52w.toISOString().split('T')[0];
  const ivs52w = validRows.filter(r => r.Date >= cutoffStr).map(r => r.IV_30d!);
  const ivRank52w = computeIVRank(currentIV, ivs52w);

  const prevValid = validRows.length >= 2 ? validRows[validRows.length - 2] : null;
  const ivChange1d = prevValid ? currentIV - prevValid.IV_30d! : null;

  const fiveDayBack = validRows.length > 5 ? validRows[validRows.length - 6] : null;
  const ivChange5d = fiveDayBack ? currentIV - fiveDayBack.IV_30d! : null;

  return {
    latestDate: currentDate,
    currentIV,
    ivRank52w,
    ivRankAllTime,
    ivChange1d,
    ivChange5d,
    nStocks: lastValid.N_Stocks,
    nExcluded: lastValid.N_Excluded,
  };
}, [marketIVData]);
```

**Step 5: Add IVMarketSummary to imports**

At the top of the hook file, add `IVMarketSummary` to the import:

```ts
import { IVPerStockPerDay, IVStockSummary, IVMarketSummary } from '@/types/ivAnalysis';
```

**Step 6: Add to return value**

```ts
return {
  rawData,
  dataByStock,
  stockSummaries,
  marketIVData,
  marketIVSummary,
  isLoading,
  error,
};
```

**Step 7: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

**Step 8: Commit**

```bash
git add src/hooks/useIVPerStockPerDay.ts
git commit -m "feat: split MARKET_IV from stock rows in useIVPerStockPerDay hook"
```

---

## Task 3: Create MarketIVPanel Component

**Files:**
- Create: `src/components/iv-analysis/MarketIVPanel.tsx`

This component shows a 6-card KPI strip and a single-axis IV chart. No stock price axis. No earnings markers.

**Step 1: Create the file**

```tsx
// src/components/iv-analysis/MarketIVPanel.tsx

import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { IVPerStockPerDay, IVMarketSummary } from '@/types/ivAnalysis';
import { formatNordicDecimal, formatNordicPercentagePoints } from '@/utils/numberFormatting';

type DateRange = '3M' | '6M' | '1Y' | 'All';

interface Props {
  marketIVData: IVPerStockPerDay[];
  marketIVSummary: IVMarketSummary | null;
}

function KPICard({ label, value, colorClass }: { label: string; value: string; colorClass?: string }) {
  return (
    <Card>
      <CardContent className="pt-4 pb-3 px-4">
        <div className="text-xs text-muted-foreground mb-1">{label}</div>
        <div className={`text-xl font-semibold tabular-nums ${colorClass ?? ''}`}>{value}</div>
      </CardContent>
    </Card>
  );
}

function ivRankColorClass(rank: number | null): string {
  if (rank === null) return '';
  if (rank > 80) return 'text-red-600 dark:text-red-400';
  if (rank < 20) return 'text-green-600 dark:text-green-400';
  return '';
}

function deltaColorClass(val: number | null): string {
  if (val === null) return '';
  return val > 0 ? 'text-red-600 dark:text-red-400' : val < 0 ? 'text-green-600 dark:text-green-400' : '';
}

function subtractMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() - months);
  return d.toISOString().split('T')[0];
}

const MarketTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="bg-background border rounded shadow-md p-2 text-xs space-y-1">
      <div className="font-medium">{label}</div>
      <div style={{ color: payload[0].color }}>
        IV: {payload[0].value != null ? formatNordicDecimal(payload[0].value * 100, 2) + '%' : '–'}
      </div>
    </div>
  );
};

export const MarketIVPanel: React.FC<Props> = ({ marketIVData, marketIVSummary }) => {
  const [range, setRange] = useState<DateRange>('1Y');
  const [rankMode, setRankMode] = useState<'52w' | 'allTime'>('52w');

  const filteredData = useMemo(() => {
    if (marketIVData.length === 0) return [];
    if (range === 'All') return marketIVData;
    const lastDate = marketIVData[marketIVData.length - 1].Date;
    const months = range === '3M' ? 3 : range === '6M' ? 6 : 12;
    const cutoff = subtractMonths(lastDate, months);
    return marketIVData.filter(r => r.Date >= cutoff);
  }, [marketIVData, range]);

  const chartData = filteredData.map(r => ({ date: r.Date, iv: r.IV_30d }));

  const s = marketIVSummary;
  const currentIVStr = s?.currentIV != null ? formatNordicDecimal(s.currentIV * 100, 2) + '%' : '–';
  const rank = rankMode === '52w' ? s?.ivRank52w ?? null : s?.ivRankAllTime ?? null;
  const rankStr = rank != null ? `${rank} / 100` : '–';
  const change1dStr = s?.ivChange1d != null ? formatNordicPercentagePoints(s.ivChange1d * 100, 2) : '–';
  const change5dStr = s?.ivChange5d != null ? formatNordicPercentagePoints(s.ivChange5d * 100, 2) : '–';
  const nStocksStr = s?.nStocks != null ? String(s.nStocks) : '–';
  const nExcludedStr = s?.nExcluded != null ? String(s.nExcluded) : '–';

  const ranges: DateRange[] = ['3M', '6M', '1Y', 'All'];

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-lg">Swedish Market IV</CardTitle>
          <div className="flex items-center gap-1 border rounded-md p-0.5">
            <Button
              size="sm"
              variant={rankMode === '52w' ? 'default' : 'ghost'}
              className="h-7 text-xs px-2"
              onClick={() => setRankMode('52w')}
            >
              52 Weeks
            </Button>
            <Button
              size="sm"
              variant={rankMode === 'allTime' ? 'default' : 'ghost'}
              className="h-7 text-xs px-2"
              onClick={() => setRankMode('allTime')}
            >
              Historical
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* KPI strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <KPICard label="Current IV" value={currentIVStr} />
          <KPICard
            label={rankMode === '52w' ? 'IV Rank 52w' : 'IV Rank Historical'}
            value={rankStr}
            colorClass={ivRankColorClass(rank)}
          />
          <KPICard label="1-day Δ IV" value={change1dStr} colorClass={deltaColorClass(s?.ivChange1d ?? null)} />
          <KPICard label="5-day Δ IV" value={change5dStr} colorClass={deltaColorClass(s?.ivChange5d ?? null)} />
          <KPICard label="N Stocks" value={nStocksStr} />
          <KPICard label="N Excluded" value={nExcludedStr} />
        </div>

        {/* Chart */}
        <div className="space-y-2">
          <div className="flex items-center justify-end gap-1">
            {ranges.map(r => (
              <Button
                key={r}
                size="sm"
                variant={range === r ? 'default' : 'outline'}
                className="h-7 text-xs px-2"
                onClick={() => setRange(r)}
              >
                {r}
              </Button>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                tickFormatter={v => v.slice(0, 7)}
                minTickGap={40}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={v => `${Math.round(v * 100)}%`}
                width={45}
              />
              <Tooltip content={<MarketTooltip />} />
              <Line
                type="monotone"
                dataKey="iv"
                name="Market IV"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
```

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

**Step 3: Commit**

```bash
git add src/components/iv-analysis/MarketIVPanel.tsx
git commit -m "feat: add MarketIVPanel component with KPI cards and IV chart"
```

---

## Task 4: Wire MarketIVPanel into the Page

**Files:**
- Modify: `src/pages/IVAnalysis.tsx`

**Step 1: Add imports**

Add to the existing imports at the top of the file:

```ts
import { MarketIVPanel } from '@/components/iv-analysis/MarketIVPanel';
```

**Step 2: Destructure new values from hook**

Change the existing hook destructure (line 15) to also pull `marketIVData` and `marketIVSummary`:

```ts
const { stockSummaries, dataByStock, marketIVData, marketIVSummary, isLoading, error } = useIVPerStockPerDay();
```

**Step 3: Render MarketIVPanel between alert and screening table**

In the return JSX, insert `MarketIVPanel` after the `<Alert>` block and before the screening table div:

```tsx
{/* Market IV panel */}
<MarketIVPanel marketIVData={marketIVData} marketIVSummary={marketIVSummary} />

{/* Screening table */}
<div className="max-h-96 overflow-y-auto border rounded-lg">
  ...
```

**Step 4: Build**

```bash
npm run build
```

Expected: Build succeeds with no errors.

**Step 5: Commit and push**

```bash
git add src/pages/IVAnalysis.tsx
git commit -m "feat: render MarketIVPanel on IV Analysis page above screening table"
git push
```

---

## Verification Checklist

After all tasks are complete:

- [ ] `MARKET_IV` does not appear as a row in the IV Screening table
- [ ] `MARKET_IV` does not appear in the stock selector dropdown in the detail section
- [ ] Market IV panel shows above the screening table with 6 KPI cards
- [ ] IV Rank toggle (52w / Historical) works in the panel header
- [ ] Date range buttons (3M / 6M / 1Y / All) work in the chart
- [ ] N Stocks and N Excluded show realistic numbers (expect ~55–65 stocks, small exclusions)
- [ ] Current IV shows a reasonable percentage (expect ~16–45% range per documentation)
- [ ] Build passes cleanly
