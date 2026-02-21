# IV Per Stock Per Day Generation - Technical Specification

**Script**: `generate_iv_per_stock_per_day.py`
**Output File**: `output/iv_per_stock_per_day.csv`
**Date Created**: February 15, 2026
**Last Updated**: February 18, 2026 (Added MARKET_IV synthetic row — Swedish equity IV index)
**Input Data**: `C:/Users/Gustaf/OneDrive/OptionsData/Implied_Volatility_Historical_ALL.parquet` (via `config_utils.py`)

---

## Purpose

Produces two types of output in a single CSV:

1. **Per-stock daily IV**: Constant-maturity 30-day implied volatility for each stock. Uses
   **VIX-style variance interpolation** across the full IV term structure to always target the
   same maturity regardless of which expiry dates are available on a given day.

2. **Market IV index**: A daily Swedish equity implied volatility index (`Stock_Name = "MARKET_IV"`)
   — one synthetic row per date representing the cross-sectional average implied volatility
   across all active Swedish stocks with listed options. Serves as a "Swedish VIX proxy."

**Why constant maturity matters**: If you pick the option expiring soonest within 30 days,
you might get a 7-day IV on one date and a 28-day IV another date — these are not
comparable. The variance interpolation approach produces a consistent "30-day" IV
every day.

---

## 0. Execution Modes

### Mode 1: Full Generation (First Run)
**Trigger**: Output file `output/iv_per_stock_per_day.csv` does not exist
**Operation**: Processes all dates in the parquet → generates complete CSV from scratch

### Mode 2: Incremental Update (Subsequent Runs)
**Trigger**: Output file exists
**Operation**:
- Strips existing `MARKET_IV` rows and `N_Stocks`/`N_Excluded` columns from the loaded CSV
  (MARKET_IV is always recomputed fresh from current stock data)
- Identifies new dates in parquet not yet in the CSV
- ALWAYS refreshes the last 3 parquet dates (even if already in CSV) — catches any parquet
  corrections or IV recalculations
- Removes old stock rows for those dates from existing CSV, appends freshly computed rows
- Recomputes MARKET_IV for all dates from the merged stock data
- Sorts and saves

**Why always refresh last 3 dates**: The IV parquet for recent dates can be corrected after
the fact (e.g., when intraday bid/ask prices are replaced with closing prices). Refreshing
the last 3 dates catches these corrections automatically.

**Why MARKET_IV is always fully recomputed**: The market index is derived from per-stock data.
Recomputing from scratch on each run is fast (pure pandas groupby, no parquet I/O) and
ensures the index is always consistent with the current stock dataset.

---

## 1. Input Data

### Source File
**Config key**: `iv_historical_parquet` in `config/paths_config.yaml`
**Resolved path**: `C:/Users/Gustaf/OneDrive/OptionsData/Implied_Volatility_Historical_ALL.parquet`
**Format**: Apache Parquet
**Current size**: ~110 MB
**Total records**: 2,417,832 rows
**Unique stocks**: 77
**Date range**: 2024-04-18 to 2026-02-17 (456 unique dates)
**NaN ImpliedVolatility**: ~11.8% — handled gracefully (skipped)

### Columns Used
| Column | Data Type | Purpose |
|--------|-----------|---------|
| `Name` | string | Stock identifier |
| `Update_date` | datetime64[ns] | IV observation date |
| `ExpiryDate` | datetime64[ns] | Option expiration date |
| `StrikePrice` | float64 | Option strike price |
| `StockPrice` | float64 | Stock price on Update_date |
| `ImpliedVolatility` | float64 | Pre-computed IV for this option |

---

## 2. Algorithm: Constant-Maturity 30-Day IV

For each `(stock, date)` group the script computes a single number: the implied volatility
that a hypothetical option expiring in exactly ~21 business days (~30 calendar days) would
have on that date.

### Target Maturity
```python
T_TARGET_BDAYS = 21          # ~30 calendar days in business days
T_TARGET_YEARS = 21 / 252    # = 0.08333...  (uses TRADING_DAYS_PER_YEAR = 252)
```

Business days are computed using `calculate_business_days_between()` from `data_loader.py`,
which applies the Swedish public holiday calendar.

---

### Step 1 — Collect Valid Options

For each `(stock, date)` group, filter to rows where `ImpliedVolatility` is not NaN.
If no valid IV rows exist → output `Method = no_data`, `IV_30d = NaN`.

---

### Step 2 — Estimate ATM IV per Expiry (`interpolate_atm_iv`)

For each expiry date in the group:

1. Sort available strikes by price.
2. Find the two strikes that bracket the stock price (`K_low ≤ S < K_high`).
3. **Linear interpolation**:
   ```
   w = (S - K_low) / (K_high - K_low)
   IV_ATM = IV_low + w × (IV_high - IV_low)
   ```
4. **Edge cases**:
   - Stock below all strikes → use lowest strike's IV
   - Stock above all strikes → use highest strike's IV
   - Only one strike with valid IV → use it directly

**Result**: One `IV_ATM` value per expiry (the at-the-money IV for that expiry).

---

### Step 3 — Convert to Total Variance

Variance scales linearly with time. For each expiry with valid `IV_ATM`:

```
T_years = business_days_to_expiry / TRADING_DAYS_PER_YEAR
total_variance = IV_ATM² × T_years
```

Any expiry with `T_years ≤ 0` (expired or expiring today) is excluded.

---

### Step 4 — Interpolate to Target Maturity

Sort all `(T_years, T_bdays, IV_ATM)` tuples by `T_years`.

Find the two expiries that bracket `T_TARGET_YEARS`:
- `T_near`: largest T ≤ T_TARGET (the nearer expiry)
- `T_far`: smallest T > T_TARGET (the farther expiry)

**Normal case — can bracket (Method = "interpolated")**:

```
var_near = IV_near² × T_near
var_far  = IV_far² × T_far

w = (T_far - T_TARGET) / (T_far - T_near)       # weight for near expiry
var_30 = w × var_near + (1 - w) × var_far        # interpolated variance

IV_30d = sqrt(var_30 / T_TARGET)
```

**Cannot bracket — only near expiries or only far expiries (Method = "nearest_expiry")**:
Use the ATM IV of whichever expiry is closest to `T_TARGET_YEARS`. No extrapolation
is performed (extrapolating variance to shorter maturities is unreliable for puts).

---

### Step 5 — Output

| Scenario | Count | Method |
|----------|-------|--------|
| Bracketing expiries found | 27,559 (92.7%) | `interpolated` |
| Only near or only far expiry | 2,105 (7.1%) | `nearest_expiry` |
| No valid IV on any expiry | 67 (0.2%) | `no_data` |

---

## 3. Output Data

### File
**Path**: `output/iv_per_stock_per_day.csv`
**Delimiter**: `|` (pipe)
**Encoding**: UTF-8
**Current size**: 2.18 MB
**Rows**: 28,324 (28,323 data rows + 1 header)

### Columns

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `Stock_Name` | string | No | Stock identifier, or `"MARKET_IV"` for the market index row |
| `Date` | date string (YYYY-MM-DD) | No | IV observation date |
| `Stock_Price` | float64 | Yes | Stock price on that date (NaN for MARKET_IV rows) |
| `IV_30d` | float64 | Yes | Constant-maturity 30-day annualized implied volatility |
| `Near_Expiry_DTE` | int / NaN | Yes | Business days to the nearer expiry used in interpolation (NaN for MARKET_IV rows) |
| `Far_Expiry_DTE` | int / NaN | Yes | Business days to the farther expiry used in interpolation (NaN for MARKET_IV rows) |
| `Method` | string | No | `interpolated`, `nearest_expiry`, `no_data`, or `market_equal_weight` |
| `N_Stocks` | int / NaN | Yes | Number of stocks contributing to MARKET_IV (NaN for stock rows) |
| `N_Excluded` | int / NaN | Yes | Number of stocks excluded as outliers by MAD filter (NaN for stock rows) |

**Notes on Near/Far Expiry DTE**:
- `interpolated`: both `Near_Expiry_DTE` and `Far_Expiry_DTE` are populated
- `nearest_expiry`: only one of the two fields is populated (near or far, depending on which side the single expiry falls)
- `no_data` and `market_equal_weight`: both are NaN

### Current Statistics
| Category | Count | Pct |
|----------|-------|-----|
| Total rows | 28,324 | 100% |
| `IV_30d` valid | 28,321 | 99.99% |
| `IV_30d` NaN | 3 | 0.01% |
| Method: interpolated | 26,312 | 92.9% |
| Method: nearest_expiry | 1,554 | 5.5% |
| Method: market_equal_weight | 456 | 1.6% |
| Method: no_data | 2 | 0.0% |

**Coverage**: 67 active stocks × 456 dates (2024-04-18 to 2026-02-17), plus 456 MARKET_IV rows

---

## 3.1 Output Filtering: Complete Stock Requirement

**Applied**: After all IV calculations, before saving to CSV

Before writing the output file, the script filters to ensure **data completeness**:

1. **Identify maximum date**: Find the most recent date in all processed data
2. **Find complete stocks**: Identify stocks that have a valid (non-NaN) `IV_30d` on the maximum date
3. **Filter output**: Remove all rows for stocks that lack data on the maximum date
4. **Result**: Output file contains ONLY stocks with current data, eliminating stale stocks

**Rationale**:
- Ensures the output file is not polluted with stocks that haven't had options quoted recently
- Downstream analyses can assume any stock in the CSV has current IV data available
- If a stock has no options on the most recent trading day, it's excluded entirely (across all historical dates)

**MARKET_IV exemption**: The max-date filter runs on real stock rows only. MARKET_IV rows are
computed after the filter and are always present for every date where ≥30 stocks reported.

**Diagnostic output**:
```
Filtering stocks to those with data on maximum date...
  Maximum date in data: 2026-02-17
  Stocks with valid IV_30d on max date: 67
  Rows before filter: 29,865
  Rows after filter: 27,868
  Rows removed: 1,997
```

**Impact**: Typically removes 6-20% of rows (stocks that haven't been actively traded recently)

---

## 3.2 MARKET_IV: Swedish Equity IV Index

**Applied**: After the max-date stock filter, before saving

A synthetic `MARKET_IV` row is appended per date, representing the cross-sectional average
implied volatility across all active Swedish stocks. This functions as a "Swedish VIX proxy."

### Algorithm

For each date:

1. **Collect valid stocks**: All real stock rows with non-NaN `IV_30d` on that date.
2. **Minimum coverage check**: If fewer than 30 stocks → `IV_30d = NaN`, `N_Stocks = actual count`.
3. **Dynamic outlier detection (MAD-based)**:
   ```
   median_iv = median of all stocks' IV_30d
   MAD = median of |IV_i - median_iv|
   threshold = median_iv + 4 × MAD × 1.4826
   ```
   Stocks with `IV_30d > threshold` are excluded (`N_Excluded` counts them).
   - If exclusion drops below 30 stocks, the exclusion is cancelled and all stocks are used.
4. **Variance averaging**:
   ```
   market_IV = sqrt(mean(IV_i²))
   ```
   Aggregating in variance space (then taking sqrt) is mathematically correct — IV² is
   proportional to expected variance, which is additive across stocks.

### Why Dynamic Outlier Detection

A fixed cap (e.g., exclude all stocks with IV > 200%) would wrongly exclude stocks during
genuine market-wide stress events when all IVs rise together. The MAD-based threshold rises
proportionally with the cross-sectional median, so:

- **Company-specific crisis**: One stock spikes to 150% while median is 25% → threshold ~55%
  → spike is excluded. Market IV reflects the other stocks correctly.
- **Market-wide stress**: All stocks rise; median reaches 45%, threshold rises to ~100% →
  a stock at 80% stays in (it reflects real market fear, not an individual crisis).

### Current Statistics (2024-04-18 to 2026-02-17, 456 dates)
| Metric | Value |
|--------|-------|
| MARKET_IV rows | 456 |
| Dates with valid MARKET_IV | 455 |
| Dates below minimum coverage | 1 |
| Market IV range | 0.165–0.446 (16.5%–44.6%) |
| Average N_Stocks per date | 59.3 |
| Total outlier exclusions (all dates) | 846 |

**Evidence**: Values validated against known market events — April 2025 tariff shock visible at
0.446 on 2025-04-07, August 2024 selloff at 0.402 on 2024-08-05 (source: run output Feb 18 2026).

### Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Weighting scheme | Equal-weight | Swedish optionable stocks cluster in mid/large cap; no market cap data dependency |
| Aggregation space | Variance (IV²) | IV² is additive (proportional to expected variance); simple IV averaging is incorrect |
| Outlier detection | Dynamic MAD | Preserves market stress events; fixed cap would wrongly exclude stocks during crashes |
| Minimum coverage | 30 stocks | ~40% of universe; below this the index is not representative |
| MAD multiplier | 4× (with 1.4826 normalizer) | Conservative; only true outliers caught (≈4σ equivalent) |

---

## 4. Parallelisation

The entire computation is parallelised using `concurrent.futures.ProcessPoolExecutor`.

```
workers = max(1, cpu_count() - 1)
executor.map(compute_single_group, groups, chunksize=50)
```

- All `(stock, date)` groups are pre-split into a list and distributed across workers
- `chunksize=50`: each worker processes 50 groups per round-trip to reduce IPC overhead
- `compute_single_group(args)` accepts a tuple `(stock_name, update_date, group_df)` to be
  picklable for inter-process transfer
- Progress is printed every 5,000 groups

**Why ProcessPoolExecutor (not multiprocessing.Pool)**:
`ProcessPoolExecutor` provides cleaner lifecycle management and integrates with `executor.map`
for ordered result collection. The GIL is bypassed because each worker runs in a separate
process.

**Performance**: Full generation of ~28K (stock, date) groups across all 456 dates completes
in approximately 2–5 minutes depending on CPU count. MARKET_IV computation adds negligible
time (pure pandas groupby on the already-loaded output DataFrame).

---

## 5. Path Configuration

The parquet input path is resolved via `config_utils.get_path_config()`:

```python
path_config = get_path_config()
iv_parquet_path = path_config.get_iv_historical_parquet()
# → C:/Users/Gustaf/OneDrive/OptionsData/Implied_Volatility_Historical_ALL.parquet
```

Fallback (if config unavailable):
```
input/backups/20260111_Implied_Volatility_Historical_ALL.parquet
```

---

## 6. Edge Cases

### No Valid IV on Any Expiry
**Trigger**: All `ImpliedVolatility` values for a `(stock, date)` are NaN
**Output**: `IV_30d = NaN`, `Method = no_data`, DTE fields NaN
**Frequency**: 67 rows (0.2%) in current data

### All Expiries Are Nearer Than Target (< 21 business days)
**Trigger**: Only short-dated options available — all expire before the 21-day target
**Output**: IV of the closest expiry used, `Method = nearest_expiry`, only `Near_Expiry_DTE` populated
**Frequency**: Part of the 7.1% nearest_expiry total

### All Expiries Are Farther Than Target (> 21 business days)
**Trigger**: Only long-dated options available — no short-dated options exist yet
**Output**: IV of the closest expiry used, `Method = nearest_expiry`, only `Far_Expiry_DTE` populated
**Frequency**: Part of the 7.1% nearest_expiry total

### Single Strike with Valid IV for an Expiry
**Trigger**: Only one option at one strike has a non-NaN IV for a given expiry
**Handling**: That strike's IV is used directly as ATM IV (no interpolation possible)

### Stock Price Outside All Strikes
**Trigger**: Stock price is below the lowest strike, or above the highest strike, for an expiry
**Handling**: IV of the nearest boundary strike is used (no extrapolation)

### New Dates in Parquet (Incremental Mode)
**Detection**: `new_dates = set(parquet_dates) - existing_dates`
**Processing**: All new dates + last 3 dates are processed; merged with retained existing rows

### MARKET_IV Below Minimum Coverage
**Trigger**: Fewer than 30 stocks have valid IV_30d on a given date
**Output**: `IV_30d = NaN`, `N_Stocks = actual count`, `N_Excluded = 0`
**Frequency**: 1 date in current data (2024-04-18, the first date with limited coverage)

### MARKET_IV Outlier Safety Override
**Trigger**: MAD-based exclusion would drop the contributing pool below 30 stocks
**Output**: All stocks used, `N_Excluded = 0` (exclusion cancelled)
**Rationale**: Prevents the safety mechanism from producing an under-representative index

---

## 7. Data Quality Notes

### IV Source Quality
The parquet `ImpliedVolatility` values are computed by `options_calculations.py` using the
Leisen-Reimer binomial model with Brent's method (3-tier fallback bounds: 0.001–3, 0.0001–5,
0.00001–10). If all three solver bounds fail, `NaN` is returned. See
`iv_solver_robustness_implementation.md` for full details.

**Important**: The moneyness-based IV fallback (`max(0.01, 0.5*(1-K/S))`) that was briefly
present in `options_calculations.py` (added Feb 10, removed Feb 16, 2026) could produce
corrupt flat-term-structure IVs when options had near-zero intraday bid prices at calculation
time. This is no longer an issue; the solver now returns `NaN` on failure.

### NaN IV Handling
Rows with `NaN ImpliedVolatility` in the parquet are silently skipped during ATM IV
estimation (per-expiry). An expiry is only included in the term structure if it has at least
one valid IV after filtering. This means a (stock, date) group can have partial expiry
coverage — e.g., 3 of 5 expiries contribute to the interpolation.

### Business Day Calendar
Swedish public holidays are excluded from business day counts via
`calculate_business_days_between()` in `data_loader.py`. This ensures consistent
time-to-expiry calculation across the project.

---

## 8. Integration

### Upstream
- `iv_historical_updater.py` — maintains and updates the IV parquet
- `run.py` — orchestrates the full pipeline

### Downstream
- `output/iv_per_stock_per_day.csv` — consumed by any analysis or visualisation that needs
  a daily IV time series per stock
- `github_config.yaml` — uploads to `data/iv_per_stock_per_day.csv` in the `put-options-se`
  GitHub repository on every `run.py` run

---

## 9. Code Structure Reference

| Symbol | Lines | Purpose |
|--------|-------|---------|
| `T_TARGET_BDAYS = 21` | 22 | Target maturity in business days |
| `T_TARGET_YEARS` | 23 | Target maturity in years (21/252) |
| `interpolate_atm_iv(exp_group, stock_price)` | 26–67 | ATM IV via linear strike interpolation for one expiry |
| `compute_single_group(args)` | 70–157 | Full constant-maturity IV computation for one (stock, date) group |
| `compute_market_iv_rows(stock_df)` | 160–226 | MARKET_IV computation: MAD outlier detection + variance averaging |
| `process_groups_parallel(iv_df, n_workers)` | 229–249 | ProcessPoolExecutor driver; pre-splits groups, maps workers |
| `main()` | 252–451 | Config loading, incremental date detection, merge, filtering, Market IV, save |
| Incremental load + MARKET_IV strip | 299–315 | Load existing CSV, strip MARKET_IV rows and N_Stocks/N_Excluded columns |
| Incremental date logic | 320–331 | new_dates ∪ last_3_dates → dates_to_process |
| Merge with existing | 354–373 | Remove refreshed dates, concat, sort |
| Output filtering | 378–398 | Filter to only stocks with data on maximum date |
| MARKET_IV append | 400–425 | Strip any residual MARKET_IV rows, add N_Stocks/N_Excluded, compute and append |

---

## 10. Reproducibility

- **Deterministic**: Results are fully deterministic for a given parquet snapshot (no random processes)
- **Rerunnability**: Safe to rerun; incremental mode refreshes last 3 dates, full reruns produce identical output
- **Python 3.10+**, required libraries: `pandas`, `numpy`, `concurrent.futures` (stdlib), `multiprocessing` (stdlib)
- **Memory**: Full parquet load ~2 GB; incremental runs load full parquet but filter immediately
