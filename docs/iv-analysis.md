# Implied Volatility History (`/iv-analysis`)

## Overview

The **Implied Volatility History** page displays daily implied volatility (IV) observations for 77 stocks, spanning from April 2024 to present. This is a rolling short-term ATM (at-the-money) IV time series, updated daily as new options data is generated.

---

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

---

## Page Features

### IV Screening Table (Top Section)

Scan all 77 stocks at a glance:

| Column | Meaning |
|---|---|
| **Aktie** | Stock ticker |
| **Aktuell IV** | Latest implied volatility as percentage |
| **IV Rank 52v / Historisk** | Toggle between 52-week rank or all-time rank (0–100, where 100 = highest IV in the period) |
| **1-dag Δ IV** | IV change from previous valid observation date |
| **5-dag Δ IV** | IV change from 5 valid observations back |
| **Kurs** | Current stock price |
| **Datum** | Date of observation |

**Color coding:**
- IV Rank > 80: Red (elevated IV, potential over-pricing)
- IV Rank < 20: Green (compressed IV, potential under-pricing)
- Delta positive (IV up): Red
- Delta negative (IV down): Green

**Default sort:** IV Rank 52w descending (highest IV rank at top)

**Interaction:** Click any row to scroll to the detail section and load that stock's chart.

---

### Stock Detail Section (Bottom Section)

Deep-dive into a single stock:

**Stock Selector:** Searchable dropdown to navigate between stocks

**KPI Strip (5 cards):**
1. **Aktuell IV** — Latest IV value
2. **IV Rank 52v** — Where current IV sits in last 52 weeks (0–100)
3. **IV Rank Historisk** — Where current IV sits in full history
4. **1-dag Δ IV** — IV change from previous observation
5. **5-dag Δ IV** — IV change from 5 observations back

**Dual-Axis Chart:**
- **Left axis (blue):** Implied Volatility (percentage)
- **Right axis (gray):** Stock price (SEK)
- **NaN handling:** IV line breaks where data is missing (no interpolation)
- **Stock price line:** Connects across all dates (including NaN IV dates) for continuity
- **Date range buttons:** [3M] [6M] [1Y] [Allt] to filter the visible window (default: 1Y)

---

## Use Cases

### For Options Traders

1. **IV Screening**: Identify stocks with unusually high or low IV relative to their own history
   - High IV rank: potential short premium opportunities (sell calls/puts)
   - Low IV rank: potential long premium opportunities (buy calls/puts)

2. **IV Trends**: Observe how a stock's short-term IV has evolved over time
   - IV spikes during volatility events
   - IV compression during periods of stability

3. **Recent IV Changes**: See 1-day and 5-day IV deltas to identify trending volatility
   - Rising IV: market participants pricing in more uncertainty
   - Falling IV: compression/stabilization

### For Risk Analysis

- Compare IV levels across your portfolio holdings
- Monitor IV percentile to understand regime context
- Identify stocks where IV behavior diverges from expectations

---

## Data Quality Notes

- **Coverage**: 77 stocks, April 2024 – present
- **Frequency**: Daily (one row per stock per trading day)
- **Total rows**: ~28,000 (92% with valid IV, 8% NaN)
- **Refresh**: Updated daily at market close when new options data is available
- **Completeness constraint**: Every (Stock, Date) combination is represented (NaN rows included)

---

## Technical Details

**Calculation rules:**
- **IV Rank formula**: `(current_IV - min_IV) / (max_IV - min_IV) × 100`
  - Clamped to 0–100
  - If all historical IVs are identical: returns 50
- **1-day delta**: Current IV minus the previous valid observation (not calendar day, but previous non-NaN IV)
- **5-day delta**: Current IV minus the valid observation 5 rows back
- **52-week cutoff**: Last 365 calendar days (approximation of 252 trading days)

**Data source**: `iv_per_stock_per_day.csv` (pipe-delimited, updated daily from upstream)
