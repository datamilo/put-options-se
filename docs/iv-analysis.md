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

### Swedish Market IV Panel (Top Section)

A market-wide implied volatility index computed as a cross-sectional equal-weight average across all active Swedish stocks with listed options. Functions as a Swedish VIX proxy.

**KPI Strip (6 cards):**
1. **Current IV** — Latest market IV level as a percentage
2. **IV Rank 52w / IV Rank Historical** — Where the current level sits within the 52-week or all-time range (0–100). Toggle between modes using the buttons in the panel header.
3. **1-day Δ IV** — Change from previous observation
4. **5-day Δ IV** — Change from 5 observations back
5. **N Stocks** — Number of stocks contributing to the index on the latest date
6. **N Excluded** — Number of stocks excluded as outliers by the MAD filter on the latest date

**Chart:** Single-axis line chart of daily market IV. Date range buttons: `3M` `6M` `1Y` `All` (default: 1Y). No price axis. No earnings markers.

**Outlier detection:** A dynamic MAD-based filter excludes company-specific IV spikes while preserving genuine market-wide stress events. Stocks with `IV > median + 4×MAD×1.4826` are excluded, unless exclusion would drop the pool below 30 stocks (in which case all stocks are included).

**Aggregation:** Market IV is computed as `sqrt(mean(IV²))` — aggregating in variance space ensures mathematical correctness.

**Minimum coverage:** The index requires at least 30 contributing stocks. Dates with fewer stocks show "–".

---

### IV Screening Table (Middle Section)

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

### Stock Detail Section (Bottom Section, per stock)

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
- `iv_per_stock_per_day.csv` — pipe-delimited, IV and price data per stock per day, plus one `MARKET_IV` synthetic row per date
- `Stock_Events_Volatility_Data.csv` — pipe-delimited, earnings and financial event dates

**`iv_per_stock_per_day.csv` columns relevant to the UI:**

| Column | Stock rows | MARKET_IV rows |
|--------|-----------|----------------|
| `Stock_Name` | stock ticker | `"MARKET_IV"` |
| `Date` | YYYY-MM-DD | YYYY-MM-DD |
| `Stock_Price` | stock price | — |
| `IV_30d` | constant-maturity 30d IV | equal-weight market IV |
| `N_Stocks` | — | stocks contributing to index |
| `N_Excluded` | — | stocks excluded by MAD filter |

**Data quality:**
- Frequency: daily (one row per stock per trading day, plus one MARKET_IV row)
- Completeness: every (Stock, Date) combination represented; NaN rows included
- Refresh: updated daily at market close
