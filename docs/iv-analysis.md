# Implied Volatility History (`/iv-analysis`)

## Overview

The **Implied Volatility History** page displays daily implied volatility (IV) observations for stocks, spanning from April 2024 to present. This is a rolling short-term ATM (at-the-money) IV time series, updated daily as new options data is generated.

---

## Data Source and Methodology

### Constant-Maturity 30-Day IV

Each day's IV is a synthetic, constant-maturity implied volatility targeting ~21 business days (approximately 30 calendar days). Computed via variance interpolation across the available options term structure, ensuring consistent maturity across all dates.

**How it works:**
1. For each expiry date available on a given date, the at-the-money (ATM) IV is estimated via linear interpolation across available strikes.
2. ATM IVs are converted to total variance (IV² × time).
3. Variance is interpolated to the target 21-business-day maturity.
4. The result is converted back to annualized IV.

**Business days:** Calculations follow the Swedish public holiday calendar, ensuring consistent time-to-expiry across the year.

**Edge cases:**
- Two expirations bracket the 21-day target: interpolate between them.
- Only near-term or only far-term expirations exist: use the closest expiry's ATM IV.
- No valid IV data: row shows "–".

---

## Page Features

### IV Screening Table (Top Section)

Scan all stocks at a glance:

| Column | Meaning |
|---|---|
| **Stock** | Stock ticker |
| **Current IV** | Latest implied volatility as percentage |
| **IV Rank 52w / IV Rank Hist.** | Toggle between 52-week rank or all-time rank (0–100) — see below |
| **1-day Δ IV** | IV change from previous valid observation |
| **5-day Δ IV** | IV change from 5 valid observations back |
| **Price** | Current stock price |

**IV Rank explained:** Where today's IV sits within the stock's own historical range, computed as `(current_IV − min_IV) / (max_IV − min_IV) × 100`. A rank of 100 means IV is at the period high; 0 means IV is at the period low. Useful for comparing relative IV richness across stocks with different baseline volatility levels. An info tooltip (ⓘ) on the column header explains this inline.

**Rank mode toggle:** Switch between 52-week (last 365 calendar days) and all-time (full dataset history) via the buttons in the table header.

**Color coding:**
- IV Rank > 80: Red (elevated IV)
- IV Rank < 20: Green (compressed IV)
- Delta positive (IV rising): Red
- Delta negative (IV falling): Green

**Default sort:** IV Rank 52w descending

**Interaction:** Click any row to scroll to the detail section and load that stock's chart.

---

### Stock Detail Section (Bottom Section)

Deep-dive into a single stock:

**Stock Selector:** Searchable dropdown to navigate between stocks.

**KPI Strip (5 cards):**
1. **Current IV** — Latest IV value
2. **IV Rank 52w** — Where current IV sits in last 52 weeks (0–100)
3. **IV Rank Historical** — Where current IV sits in full dataset history (0–100)
4. **1-day Δ IV** — IV change from previous observation
5. **5-day Δ IV** — IV change from 5 observations back

**Dual-Axis Chart:**
- **Left axis:** Implied Volatility (%)
- **Right axis:** Stock price (SEK)
- **IV line:** Breaks where data is missing (no gap interpolation)
- **Price line:** Connects across all dates for continuity
- **Date range buttons:** `3M` `6M` `1Y` `All` (default: 1Y)

**Earnings Report Markers:**
- Amber dashed vertical lines mark dates on which the stock reported earnings
- A small amber triangle (▲) appears at the bottom of each line
- Hovering an earnings date in the tooltip shows the event type (Quarterly Report / Annual Report)
- Markers update automatically when changing the date range
- Source: `Stock_Events_Volatility_Data.csv`

---

## Technical Details

**IV Rank formula:** `(current_IV − min_IV) / (max_IV − min_IV) × 100`
- Returns 50 if all historical IVs are identical
- 52-week cutoff: last 365 calendar days from the stock's most recent data point

**Delta calculations:**
- 1-day delta: current IV minus the previous non-NaN observation
- 5-day delta: current IV minus the observation 5 rows back

**Earnings data:** Loaded from `Stock_Events_Volatility_Data.csv` via `useEarningsDates` hook. Data is cached at module level after the first fetch — no re-fetching when switching stocks.

**Data sources:**
- `iv_per_stock_per_day.csv` — pipe-delimited, IV and price data per stock per day
- `Stock_Events_Volatility_Data.csv` — pipe-delimited, earnings and financial event dates

**Data quality:**
- Frequency: daily (one row per stock per trading day)
- Completeness: every (Stock, Date) combination represented; NaN rows included
- Refresh: updated daily at market close
