# IV Analysis Page — Design Document

**Date**: 2026-02-15
**Route**: `/iv-analysis`
**Page Title**: Implied Volatility History

---

## Overview

A single scrolling page that serves three use cases for professional options traders:

1. **IV Screening** — scan all 77 stocks by current IV level and rank
2. **Historical IV Research** — explore a stock's IV over time alongside its price
3. **IV Rank / Percentile** — understand where current IV sits relative to history

**Data source**: `data/iv_per_stock_per_day.csv` (pipe-delimited)
Loaded via raw.githubusercontent.com, same pattern as all other CSV files.

---

## Data File

**File**: `iv_per_stock_per_day.csv`
**Delimiter**: `|`
**Columns**:

| Column | Type | Nullable |
|---|---|---|
| `Stock_Name` | string | Never |
| `Date` | YYYY-MM-DD | Never |
| `Stock_Price` | float | Never |
| `Strike_Price` | float | Yes (NaN) |
| `Implied_Volatility` | float | Yes (NaN) |
| `Expiry_Date` | YYYY-MM-DD | Yes (NaN) |

~28,036 rows, 77 stocks, April 2024 → present. 92% of rows have valid IV.
NaN rows exist when no option expiring within 30 days was available on that date.

---

## Derived Metrics (computed in hook)

For each stock, calculate from valid-IV rows only:

- **Current IV**: Latest date's IV value (most recent non-NaN)
- **IV Rank 52w**: `(current_IV - min_52w) / (max_52w - min_52w) × 100`, clamped 0–100
- **IV Rank All-time**: Same formula over full history
- **1-day Δ IV**: `current_IV - IV_1_day_ago` (absolute pp difference)
- **5-day Δ IV**: `current_IV - IV_5_days_ago` (absolute pp difference)

NaN IV rows are excluded from rank calculations but kept in the dataset for chart continuity gaps.

---

## Page Layout

Single scrolling page, two sections:

```
┌─────────────────────────────────┐
│  Page Header                    │
├─────────────────────────────────┤
│  Screening Table (all stocks)   │
│  [click row → scroll down]      │
├─────────────────────────────────┤
│  Stock Detail Section           │
│  [KPI strip + dual-axis chart]  │
└─────────────────────────────────┘
```

---

## Section 1: Screening Table

Sortable table showing all 77 stocks. Default sort: IV Rank 52w descending.

### Columns

| Column | Format | Notes |
|---|---|---|
| Stock Name | text | Clickable row, scrolls to detail section |
| Current IV | `32,45%` | Nordic percentage |
| IV Rank 52v | `78` | 0–100 integer |
| IV Rank Historisk | `65` | 0–100 integer |
| 1-dag Δ IV | `+1,23 pp` | Nordic pp, colored by sign |
| 5-dag Δ IV | `+3,45 pp` | Nordic pp, colored by sign |
| Stock Price | `142,50` | Nordic decimal, no currency symbol |
| Datum | `2026-01-09` | Most recent data date |

### IV Rank Column Toggle

Button group above table: `[52 veckor] [Historisk]`
Toggles which IV Rank column is shown (not both simultaneously — one at a time to keep table compact).

### Color Logic for IV Rank

- > 80: red text (elevated IV)
- < 20: green text (compressed IV)
- 20–80: neutral (muted foreground)

### Row Interaction

Clicking a row:
1. Scrolls page to the detail section
2. Selects that stock in the detail section's dropdown
3. Highlights the clicked row with a subtle background

### NaN Handling

Stocks with no current valid IV show `"–"` in IV-derived columns but remain in the table.

---

## Section 2: Stock Detail Section

Appears below the screening table. Updates when a stock is selected (via row click or dropdown).

### Stock Selector

Combobox dropdown at the top of this section — same pattern as `VolatilityAnalysis.tsx`.
Allows direct navigation without using the table.

### KPI Strip

Five cards in a horizontal row:

| Card Label | Value Example | Color Logic |
|---|---|---|
| Aktuell IV | `32,45%` | Neutral |
| IV Rank 52v | `78 / 100` | >80 red, <20 green, else neutral |
| IV Rank Historisk | `65 / 100` | Same |
| 1-dag Δ IV | `+1,23 pp` | Positive green, negative red |
| 5-dag Δ IV | `+3,45 pp` | Positive green, negative red |

### Dual-Axis Line Chart

**Library**: Recharts `ComposedChart`

| Axis | Data | Format |
|---|---|---|
| Left Y | Implied Volatility | Percentage, e.g. `32%` |
| Right Y | Stock Price | Integer SEK, e.g. `142` |
| X | Date | `YYYY-MM-DD` |

**Two lines**:
- IV: primary site color
- Stock Price: muted secondary color

**Tooltip**: Shows both IV and stock price for hovered date, Nordic formatted.

**NaN gaps**: `connectNulls={false}` — line breaks where IV is NaN, no interpolation across gaps.

**Date range buttons** above chart: `[3M] [6M] [1Å] [Allt]`
Filters the chart's date window. Default: `1Å`.

---

## Navigation Placement

Add to the "Historical Performance and Volatility" dropdown in the nav, alongside Monthly Analysis and Financial Reporting Volatility.

---

## New Files to Create

| File | Purpose |
|---|---|
| `src/hooks/useIVPerStockPerDay.ts` | Load CSV, parse, compute derived metrics |
| `src/pages/IVAnalysis.tsx` | Page component |
| `src/components/iv-analysis/IVScreeningTable.tsx` | Screening table |
| `src/components/iv-analysis/IVDetailSection.tsx` | KPI strip + chart |
| `src/components/iv-analysis/IVDualAxisChart.tsx` | Recharts dual-axis chart |

---

## Files to Modify

| File | Change |
|---|---|
| `src/App.tsx` | Add `/iv-analysis` route |
| `src/components/Navigation.tsx` (or equivalent) | Add nav link |
