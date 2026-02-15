# IV Analysis Page — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a new `/iv-analysis` page ("Implied Volatility History") that loads `iv_per_stock_per_day.csv` and displays a screening table of all stocks with IV rank metrics, plus a per-stock detail section with KPI cards and a dual-axis IV + stock price chart.

**Architecture:** Single scrolling page. Top half = sortable screening table (all 77 stocks, IV Rank toggle). Bottom half = per-stock detail (KPI strip + Recharts ComposedChart with two Y-axes). Clicking a table row scrolls to and populates the detail section.

**Tech Stack:** React 18, TypeScript, Recharts (`ComposedChart`), Tailwind CSS, shadcn/ui, PapaParse (already installed), Nordic number formatting utils.

---

## Conventions to Follow

- **Number formatting**: Always use `formatNordicNumber`, `formatNordicDecimal`, `formatNordicPercentage`, `formatNordicPercentagePoints` from `src/utils/numberFormatting.ts`
- **CSV loading pattern**: Copy the URL array approach from `src/hooks/useVolatilityData.ts` — try GitHub raw URL first, fall back to `/data/` local path
- **CSV delimiter**: The file uses `|` (pipe) — pass `delimiter: '|'` to PapaParse
- **Page structure**: Follow `src/pages/VolatilityAnalysis.tsx` for loading/error states and header layout
- **Navigation**: Add to `src/components/HorizontalNavigation.tsx` — under "Historical Performance and Volatility" dropdown (both desktop and mobile sections)
- **Route**: Add to `src/App.tsx` wrapped in `<ProtectedRoute>`
- **Page title**: Call `usePageTitle('IV Analysis')` at top of page component

---

## Task 1: TypeScript Types

**Files:**
- Create: `src/types/ivAnalysis.ts`

**Step 1: Create the types file**

```typescript
// src/types/ivAnalysis.ts

export interface IVPerStockPerDay {
  Stock_Name: string;
  Date: string;           // YYYY-MM-DD
  Stock_Price: number;
  Strike_Price: number | null;
  Implied_Volatility: number | null;
  Expiry_Date: string | null;
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

**Step 2: Commit**

```bash
git add src/types/ivAnalysis.ts
git commit -m "feat: add TypeScript types for IV per stock per day data"
```

---

## Task 2: Data Hook

**Files:**
- Create: `src/hooks/useIVPerStockPerDay.ts`

**Step 1: Write the hook**

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
          Strike_Price: row.Strike_Price && row.Strike_Price !== '' && row.Strike_Price !== 'nan'
            ? parseFloat(row.Strike_Price)
            : null,
          Implied_Volatility: row.Implied_Volatility && row.Implied_Volatility !== '' && row.Implied_Volatility !== 'nan'
            ? parseFloat(row.Implied_Volatility)
            : null,
          Expiry_Date: row.Expiry_Date && row.Expiry_Date !== '' && row.Expiry_Date !== 'nan'
            ? row.Expiry_Date.trim()
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
      const validRows = rows.filter(r => r.Implied_Volatility !== null);
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
      const currentIV = lastValid.Implied_Volatility!;
      const currentDate = lastValid.Date;

      // All-time IV values
      const allIVs = validRows.map(r => r.Implied_Volatility!);
      const ivRankAllTime = computeIVRank(currentIV, allIVs);

      // 52-week (252 trading days approx — use 365 calendar days for simplicity)
      const cutoff52w = new Date(currentDate);
      cutoff52w.setFullYear(cutoff52w.getFullYear() - 1);
      const cutoffStr = cutoff52w.toISOString().split('T')[0];
      const ivs52w = validRows
        .filter(r => r.Date >= cutoffStr)
        .map(r => r.Implied_Volatility!);
      const ivRank52w = computeIVRank(currentIV, ivs52w);

      // 1-day change: find the valid row just before the last valid row
      const prevValid = validRows.length >= 2 ? validRows[validRows.length - 2] : null;
      const ivChange1d = prevValid ? currentIV - prevValid.Implied_Volatility! : null;

      // 5-day change: find valid row 5+ positions back
      const fiveDayBack = validRows.length > 5 ? validRows[validRows.length - 6] : null;
      const ivChange5d = fiveDayBack ? currentIV - fiveDayBack.Implied_Volatility! : null;

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

**Step 2: Build check**

```bash
cd /c/Users/Gustaf/dev/put-options-se-1 && npm run build 2>&1 | tail -20
```

Expected: build succeeds (no TypeScript errors).

**Step 3: Commit**

```bash
git add src/hooks/useIVPerStockPerDay.ts src/types/ivAnalysis.ts
git commit -m "feat: add useIVPerStockPerDay hook with IV rank and delta calculations"
```

---

## Task 3: Screening Table Component

**Files:**
- Create: `src/components/iv-analysis/IVScreeningTable.tsx`

**Step 1: Create the component directory and file**

```tsx
// src/components/iv-analysis/IVScreeningTable.tsx

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { IVStockSummary } from '@/types/ivAnalysis';
import { formatNordicDecimal, formatNordicPercentagePoints } from '@/utils/numberFormatting';

type SortField = 'stockName' | 'currentIV' | 'ivRank52w' | 'ivRankAllTime' | 'ivChange1d' | 'ivChange5d' | 'currentStockPrice';
type SortDir = 'asc' | 'desc';
type RankMode = '52w' | 'allTime';

interface Props {
  summaries: IVStockSummary[];
  selectedStock: string;
  onSelectStock: (stock: string) => void;
}

function ivRankColor(rank: number | null): string {
  if (rank === null) return '';
  if (rank > 80) return 'text-red-600 dark:text-red-400 font-semibold';
  if (rank < 20) return 'text-green-600 dark:text-green-400 font-semibold';
  return 'text-muted-foreground';
}

function deltaColor(val: number | null): string {
  if (val === null) return '';
  if (val > 0) return 'text-red-600 dark:text-red-400';
  if (val < 0) return 'text-green-600 dark:text-green-400';
  return '';
}

function formatIV(val: number | null): string {
  if (val === null) return '–';
  return formatNordicDecimal(val * 100, 2) + '%';
}

function formatRank(val: number | null): string {
  if (val === null) return '–';
  return String(val);
}

function formatDelta(val: number | null): string {
  if (val === null) return '–';
  return formatNordicPercentagePoints(val * 100, 2);
}

export const IVScreeningTable: React.FC<Props> = ({ summaries, selectedStock, onSelectStock }) => {
  const [sortField, setSortField] = useState<SortField>('ivRank52w');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [rankMode, setRankMode] = useState<RankMode>('52w');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const sorted = useMemo(() => {
    return [...summaries].sort((a, b) => {
      let aVal: number | string | null = null;
      let bVal: number | string | null = null;

      switch (sortField) {
        case 'stockName': aVal = a.stockName; bVal = b.stockName; break;
        case 'currentIV': aVal = a.currentIV; bVal = b.currentIV; break;
        case 'ivRank52w': aVal = a.ivRank52w; bVal = b.ivRank52w; break;
        case 'ivRankAllTime': aVal = a.ivRankAllTime; bVal = b.ivRankAllTime; break;
        case 'ivChange1d': aVal = a.ivChange1d; bVal = b.ivChange1d; break;
        case 'ivChange5d': aVal = a.ivChange5d; bVal = b.ivChange5d; break;
        case 'currentStockPrice': aVal = a.currentStockPrice; bVal = b.currentStockPrice; break;
      }

      // Nulls always last
      if (aVal === null && bVal === null) return 0;
      if (aVal === null) return 1;
      if (bVal === null) return -1;

      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [summaries, sortField, sortDir]);

  const SortHeader = ({ field, label }: { field: SortField; label: string }) => (
    <th
      className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground select-none whitespace-nowrap"
      onClick={() => handleSort(field)}
    >
      {label}
      {sortField === field && (
        <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>
      )}
    </th>
  );

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-lg">IV Screening</CardTitle>
          <div className="flex items-center gap-1 border rounded-md p-0.5">
            <Button
              size="sm"
              variant={rankMode === '52w' ? 'default' : 'ghost'}
              className="h-7 text-xs px-2"
              onClick={() => setRankMode('52w')}
            >
              52 veckor
            </Button>
            <Button
              size="sm"
              variant={rankMode === 'allTime' ? 'default' : 'ghost'}
              className="h-7 text-xs px-2"
              onClick={() => setRankMode('allTime')}
            >
              Historisk
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <SortHeader field="stockName" label="Aktie" />
                <SortHeader field="currentIV" label="Aktuell IV" />
                <SortHeader
                  field={rankMode === '52w' ? 'ivRank52w' : 'ivRankAllTime'}
                  label={rankMode === '52w' ? 'IV Rank 52v' : 'IV Rank Hist.'}
                />
                <SortHeader field="ivChange1d" label="1-dag Δ IV" />
                <SortHeader field="ivChange5d" label="5-dag Δ IV" />
                <SortHeader field="currentStockPrice" label="Kurs" />
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                  Datum
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sorted.map(row => {
                const rank = rankMode === '52w' ? row.ivRank52w : row.ivRankAllTime;
                const isSelected = row.stockName === selectedStock;
                return (
                  <tr
                    key={row.stockName}
                    onClick={() => onSelectStock(row.stockName)}
                    className={`cursor-pointer hover:bg-muted/50 transition-colors ${
                      isSelected ? 'bg-primary/10' : ''
                    }`}
                  >
                    <td className="px-3 py-2 font-medium">{row.stockName}</td>
                    <td className="px-3 py-2 tabular-nums">{formatIV(row.currentIV)}</td>
                    <td className={`px-3 py-2 tabular-nums ${ivRankColor(rank)}`}>
                      {formatRank(rank)}
                    </td>
                    <td className={`px-3 py-2 tabular-nums ${deltaColor(row.ivChange1d)}`}>
                      {formatDelta(row.ivChange1d)}
                    </td>
                    <td className={`px-3 py-2 tabular-nums ${deltaColor(row.ivChange5d)}`}>
                      {formatDelta(row.ivChange5d)}
                    </td>
                    <td className="px-3 py-2 tabular-nums">
                      {formatNordicDecimal(row.currentStockPrice, 2)}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground text-xs">
                      {row.latestDate}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
```

**Step 2: Commit**

```bash
git add src/components/iv-analysis/IVScreeningTable.tsx
git commit -m "feat: add IVScreeningTable component with sort and IV rank toggle"
```

---

## Task 4: Dual-Axis Chart Component

**Files:**
- Create: `src/components/iv-analysis/IVDualAxisChart.tsx`

**Step 1: Create the chart component**

```tsx
// src/components/iv-analysis/IVDualAxisChart.tsx

import React, { useState, useMemo } from 'react';
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { IVPerStockPerDay } from '@/types/ivAnalysis';
import { formatNordicDecimal } from '@/utils/numberFormatting';

type DateRange = '3M' | '6M' | '1Y' | 'Allt';

interface Props {
  data: IVPerStockPerDay[];
  stockName: string;
}

function subtractMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() - months);
  return d.toISOString().split('T')[0];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="bg-background border rounded shadow-md p-2 text-xs space-y-1">
      <div className="font-medium">{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ color: p.color }}>
          {p.name === 'IV'
            ? `IV: ${p.value != null ? formatNordicDecimal(p.value * 100, 2) + '%' : '–'}`
            : `Kurs: ${p.value != null ? formatNordicDecimal(p.value, 2) : '–'}`}
        </div>
      ))}
    </div>
  );
};

export const IVDualAxisChart: React.FC<Props> = ({ data, stockName }) => {
  const [range, setRange] = useState<DateRange>('1Y');

  const sortedData = useMemo(
    () => [...data].sort((a, b) => a.Date.localeCompare(b.Date)),
    [data]
  );

  const filteredData = useMemo(() => {
    if (range === 'Allt' || sortedData.length === 0) return sortedData;
    const lastDate = sortedData[sortedData.length - 1].Date;
    const months = range === '3M' ? 3 : range === '6M' ? 6 : 12;
    const cutoff = subtractMonths(lastDate, months);
    return sortedData.filter(r => r.Date >= cutoff);
  }, [sortedData, range]);

  const chartData = filteredData.map(r => ({
    date: r.Date,
    iv: r.Implied_Volatility,           // null renders as gap
    price: r.Stock_Price,
  }));

  const ranges: DateRange[] = ['3M', '6M', '1Y', 'Allt'];

  return (
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

      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11 }}
            tickFormatter={v => v.slice(0, 7)} // YYYY-MM
            minTickGap={40}
          />
          <YAxis
            yAxisId="iv"
            orientation="left"
            tick={{ fontSize: 11 }}
            tickFormatter={v => `${Math.round(v * 100)}%`}
            width={45}
          />
          <YAxis
            yAxisId="price"
            orientation="right"
            tick={{ fontSize: 11 }}
            tickFormatter={v => formatNordicDecimal(v, 0)}
            width={60}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line
            yAxisId="iv"
            type="monotone"
            dataKey="iv"
            name="IV"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={false}
            connectNulls={false}
          />
          <Line
            yAxisId="price"
            type="monotone"
            dataKey="price"
            name="Kurs"
            stroke="hsl(var(--muted-foreground))"
            strokeWidth={1.5}
            dot={false}
            connectNulls={true}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
```

**Step 2: Commit**

```bash
git add src/components/iv-analysis/IVDualAxisChart.tsx
git commit -m "feat: add IVDualAxisChart dual-axis Recharts component with date range filter"
```

---

## Task 5: Stock Detail Section Component

**Files:**
- Create: `src/components/iv-analysis/IVDetailSection.tsx`

**Step 1: Create the component**

```tsx
// src/components/iv-analysis/IVDetailSection.tsx

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Check, ChevronsUpDown } from 'lucide-react';
import { IVStockSummary, IVPerStockPerDay } from '@/types/ivAnalysis';
import { IVDualAxisChart } from './IVDualAxisChart';
import { formatNordicDecimal, formatNordicPercentagePoints } from '@/utils/numberFormatting';

interface Props {
  selectedStock: string;
  onSelectStock: (stock: string) => void;
  stockNames: string[];
  summaries: IVStockSummary[];
  dataByStock: Map<string, IVPerStockPerDay[]>;
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

export const IVDetailSection = React.forwardRef<HTMLDivElement, Props>(
  ({ selectedStock, onSelectStock, stockNames, summaries, dataByStock }, ref) => {
    const [open, setOpen] = useState(false);

    const summary = summaries.find(s => s.stockName === selectedStock) ?? null;
    const stockData = selectedStock ? (dataByStock.get(selectedStock) ?? []) : [];

    const currentIV = summary?.currentIV != null
      ? formatNordicDecimal(summary.currentIV * 100, 2) + '%'
      : '–';

    const ivRank52w = summary?.ivRank52w != null ? `${summary.ivRank52w} / 100` : '–';
    const ivRankHist = summary?.ivRankAllTime != null ? `${summary.ivRankAllTime} / 100` : '–';

    const change1d = summary?.ivChange1d != null
      ? formatNordicPercentagePoints(summary.ivChange1d * 100, 2)
      : '–';
    const change5d = summary?.ivChange5d != null
      ? formatNordicPercentagePoints(summary.ivChange5d * 100, 2)
      : '–';

    return (
      <div ref={ref} className="space-y-4">
        {/* Stock selector */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">Välj aktie:</span>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="w-48 justify-between">
                {selectedStock || 'Välj aktie...'}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-0" align="start">
              <Command>
                <CommandInput placeholder="Sök aktie..." />
                <CommandList>
                  <CommandEmpty>Ingen aktie hittades.</CommandEmpty>
                  <CommandGroup>
                    {stockNames.map(name => (
                      <CommandItem
                        key={name}
                        value={name}
                        onSelect={() => { onSelectStock(name); setOpen(false); }}
                      >
                        <Check className={`mr-2 h-4 w-4 ${selectedStock === name ? 'opacity-100' : 'opacity-0'}`} />
                        {name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {selectedStock && (
          <>
            {/* KPI strip */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <KPICard label="Aktuell IV" value={currentIV} />
              <KPICard
                label="IV Rank 52v"
                value={ivRank52w}
                colorClass={ivRankColorClass(summary?.ivRank52w ?? null)}
              />
              <KPICard
                label="IV Rank Historisk"
                value={ivRankHist}
                colorClass={ivRankColorClass(summary?.ivRankAllTime ?? null)}
              />
              <KPICard
                label="1-dag Δ IV"
                value={change1d}
                colorClass={deltaColorClass(summary?.ivChange1d ?? null)}
              />
              <KPICard
                label="5-dag Δ IV"
                value={change5d}
                colorClass={deltaColorClass(summary?.ivChange5d ?? null)}
              />
            </div>

            {/* Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{selectedStock} — IV & Kursutveckling</CardTitle>
              </CardHeader>
              <CardContent>
                {stockData.length > 0 ? (
                  <IVDualAxisChart data={stockData} stockName={selectedStock} />
                ) : (
                  <p className="text-muted-foreground text-sm">Ingen data tillgänglig.</p>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    );
  }
);

IVDetailSection.displayName = 'IVDetailSection';
```

**Step 2: Commit**

```bash
git add src/components/iv-analysis/IVDetailSection.tsx
git commit -m "feat: add IVDetailSection with KPI cards, stock selector, and dual-axis chart"
```

---

## Task 6: Page Component

**Files:**
- Create: `src/pages/IVAnalysis.tsx`

**Step 1: Create the page**

```tsx
// src/pages/IVAnalysis.tsx

import React, { useRef, useMemo } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useIVPerStockPerDay } from '@/hooks/useIVPerStockPerDay';
import { IVScreeningTable } from '@/components/iv-analysis/IVScreeningTable';
import { IVDetailSection } from '@/components/iv-analysis/IVDetailSection';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';

export const IVAnalysis: React.FC = () => {
  usePageTitle('IV Analysis');

  const { stockSummaries, dataByStock, isLoading, error } = useIVPerStockPerDay();
  const [selectedStock, setSelectedStock] = useState<string>('');
  const detailRef = useRef<HTMLDivElement>(null);

  const stockNames = useMemo(
    () => Array.from(dataByStock.keys()).sort(),
    [dataByStock]
  );

  // Set default stock once data is loaded
  React.useEffect(() => {
    if (stockSummaries.length > 0 && !selectedStock) {
      // Default to stock with highest 52w IV rank
      const sorted = [...stockSummaries].sort((a, b) =>
        (b.ivRank52w ?? -1) - (a.ivRank52w ?? -1)
      );
      setSelectedStock(sorted[0].stockName);
    }
  }, [stockSummaries, selectedStock]);

  const handleSelectStock = (stock: string) => {
    setSelectedStock(stock);
    // Scroll to detail section
    setTimeout(() => {
      detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Laddar IV-data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Fel vid laddning</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Page header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Implied Volatility History</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-8">
        {/* Screening table */}
        <IVScreeningTable
          summaries={stockSummaries}
          selectedStock={selectedStock}
          onSelectStock={handleSelectStock}
        />

        {/* Detail section */}
        <IVDetailSection
          ref={detailRef}
          selectedStock={selectedStock}
          onSelectStock={setSelectedStock}
          stockNames={stockNames}
          summaries={stockSummaries}
          dataByStock={dataByStock}
        />
      </div>
    </div>
  );
};
```

**Step 2: Commit**

```bash
git add src/pages/IVAnalysis.tsx
git commit -m "feat: add IVAnalysis page component"
```

---

## Task 7: Wire Up Route and Navigation

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/HorizontalNavigation.tsx`

### 7A: Add Route to App.tsx

In `src/App.tsx`:

1. Add import near the other page imports:
```tsx
import { IVAnalysis } from "./pages/IVAnalysis";
```

2. Add route inside `<Routes>`, after the `/volatility-analysis` route:
```tsx
<Route path="/iv-analysis" element={<ProtectedRoute><IVAnalysis /></ProtectedRoute>} />
```

### 7B: Add to Desktop Navigation (HorizontalNavigation.tsx)

In the "Historical Performance and Volatility" `NavDropdown` items array, add a third entry:

```tsx
{
  path: "/iv-analysis",
  label: "Implied Volatility History",
  icon: TrendingUp,   // TrendingUp is already imported in the file
},
```

### 7C: Add to Mobile Navigation (HorizontalNavigation.tsx)

In the mobile `DropdownMenuContent`, inside the "Historical Performance and Volatility" group, add after the volatility-analysis item:

```tsx
<DropdownMenuItem
  onClick={() => navigate("/iv-analysis")}
  className="cursor-pointer ml-2"
>
  <TrendingUp className="mr-2 h-4 w-4" />
  Implied Volatility History
</DropdownMenuItem>
```

**Step: Build check**

```bash
cd /c/Users/Gustaf/dev/put-options-se-1 && npm run build 2>&1 | tail -20
```

Expected: build succeeds with no TypeScript errors.

**Step: Commit**

```bash
git add src/App.tsx src/components/HorizontalNavigation.tsx
git commit -m "feat: add /iv-analysis route and navigation link"
```

---

## Task 8: Final Build and Push

**Step 1: Full build**

```bash
cd /c/Users/Gustaf/dev/put-options-se-1 && npm run build 2>&1 | tail -30
```

Expected: no errors.

**Step 2: Push**

```bash
git push
```

**Step 3: Verify**

```bash
git log --oneline -8
```

Expected: see 6-7 commits for this feature.

---

## Checklist

- [ ] Types defined (`IVPerStockPerDay`, `IVStockSummary`)
- [ ] Hook loads CSV, parses NaN correctly, computes IV Rank 52w / all-time, 1d / 5d deltas
- [ ] Screening table sortable, IV Rank toggle works, row click scrolls to detail
- [ ] Dual-axis chart shows IV (left) + price (right), NaN gaps render as breaks, date range buttons work
- [ ] KPI strip shows correct colors (>80 red, <20 green for rank; sign-based for deltas)
- [ ] Route `/iv-analysis` works and is protected
- [ ] Nav link appears in "Historical Performance and Volatility" dropdown (desktop + mobile)
- [ ] All numbers use Nordic formatting
- [ ] Build passes
