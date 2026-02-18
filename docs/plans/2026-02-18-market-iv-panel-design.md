# Design: MARKET_IV Panel on IV Analysis Page

**Date**: 2026-02-18
**Status**: Approved

---

## Context

The upstream `iv_per_stock_per_day.csv` now includes a synthetic `MARKET_IV` row per trading date — a cross-sectional equal-weight average of all active Swedish stocks' 30-day implied volatility, functioning as a "Swedish VIX proxy." It uses MAD-based outlier detection to exclude company-specific spikes while preserving genuine market-wide stress events.

`MARKET_IV` is not a stock. It must be handled separately from the per-stock data.

---

## What Changes

### 1. Types — `src/types/ivAnalysis.ts`

Add two nullable fields to `IVPerStockPerDay`:

```ts
N_Stocks: number | null;   // populated only for MARKET_IV rows
N_Excluded: number | null; // populated only for MARKET_IV rows
```

Add new interface `IVMarketSummary`:

```ts
export interface IVMarketSummary {
  latestDate: string;
  currentIV: number | null;
  ivRank52w: number | null;
  ivRankAllTime: number | null;
  ivChange1d: number | null;
  ivChange5d: number | null;
  nStocks: number | null;   // from most recent MARKET_IV row
  nExcluded: number | null; // from most recent MARKET_IV row
}
```

---

### 2. Hook — `src/hooks/useIVPerStockPerDay.ts`

After parsing, split rows by `Stock_Name === 'MARKET_IV'`:

- **MARKET_IV rows** → `marketIVData: IVPerStockPerDay[]` (sorted by date ascending)
- **Stock rows** → existing pipeline unchanged (`dataByStock`, `stockSummaries`)

Compute `marketIVSummary: IVMarketSummary` from `marketIVData`:
- IV rank and change calculations are identical to per-stock logic (reuse `computeIVRank`)
- `nStocks` and `nExcluded` come from the most recent row's `N_Stocks` / `N_Excluded` fields

Return both `marketIVData` and `marketIVSummary` alongside the existing return values.

Parse `N_Stocks` and `N_Excluded` from CSV (they are integers or empty/`nan` for stock rows).

---

### 3. New Component — `src/components/iv-analysis/MarketIVPanel.tsx`

Props:
```ts
marketIVData: IVPerStockPerDay[]
marketIVSummary: IVMarketSummary
```

**Layout** (top to bottom):

**KPI row** — 6 cards:
| Card | Value | Notes |
|------|-------|-------|
| Current IV | `28,34%` | Nordic decimal format |
| IV Rank | `62` (0–100) | With 52w ↔ Historical toggle (same as screening table) |
| 1-day Δ IV | `+0,45 pp` | Red if positive, green if negative |
| 5-day Δ IV | `-1,20 pp` | Red if positive, green if negative |
| N Stocks | `62` | Stocks contributing to index on latest date |
| N Excluded | `3` | Outliers removed by MAD filter on latest date |

**Chart** — single Y-axis Recharts `LineChart`:
- X-axis: dates
- Y-axis: IV % (left)
- No stock price axis (MARKET_IV has no price)
- Date range buttons: 3M / 6M / 1Y / All (same pattern as `IVDualAxisChart`)
- No earnings markers
- Tooltip shows date + IV %

---

### 4. Page — `src/pages/IVAnalysis.tsx`

Insert `MarketIVPanel` between the methodology alert and the screening table.

`MARKET_IV` never appears in the screening table or per-stock detail section — it is fully separated at the hook level.

---

## What Does NOT Change

- `IVScreeningTable` — unchanged
- `IVDetailSection` / `IVDualAxisChart` — unchanged
- `stockSummaries` and `dataByStock` — unchanged (MARKET_IV filtered out before these are computed)
- Default stock selection logic — unchanged

---

## Files Touched

1. `src/types/ivAnalysis.ts` — add fields + new interface
2. `src/hooks/useIVPerStockPerDay.ts` — split MARKET_IV, compute summary
3. `src/components/iv-analysis/MarketIVPanel.tsx` — new component
4. `src/pages/IVAnalysis.tsx` — render MarketIVPanel
