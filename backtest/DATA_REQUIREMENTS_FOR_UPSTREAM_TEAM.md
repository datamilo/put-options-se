# Data Requirements for Upstream Team

**Purpose**: Specification of historical data files needed for backtesting

**Audience**: Upstream data generation team

**Date**: January 2026

---

## Overview

To enable comprehensive backtesting of the Automated Recommendations scoring system, we need **historical snapshots** of the data currently available in the `/data` folder.

**Current State**: We have current/recent data snapshots only (mostly Dec 2025 - Jan 2026)

**Goal**: Generate historical data going back to at least **January 2020** (6 years)

---

## Priority 1: Historical Probability Data ⚠️ CRITICAL

### What We Need

Daily snapshots of probability calculations for all active options from 2020-01-01 onwards.

### File Format

**Option A** (Preferred): One large file with all historical data

**File**: `probability_history_full.csv`

**Format**:
```
OptionName|Update_date|1_2_3_ProbOfWorthless_Weighted|ProbWorthless_Bayesian_IsoCal|1_ProbOfWorthless_Original|2_ProbOfWorthless_Calibrated|3_ProbOfWorthless_Historical_IV
ERICB6U45|2020-01-02|0.7533|0.7889|0.7241|0.7612|0.7489
ERICB6U45|2020-01-03|0.7542|0.7901|0.7256|0.7621|0.7498
VOLVB6X300|2020-01-02|0.6234|0.6512|0.6001|0.6398|0.6129
VOLVB6X300|2020-01-03|0.6289|0.6567|0.6052|0.6445|0.6187
...
```

**Option B**: One file per date

**Files**: `probability_history_20200102.csv`, `probability_history_20200103.csv`, etc.

**Format**: Same as above, but each file contains only that date's data

### Required Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `OptionName` | string | Option identifier | `ERICB6U45` |
| `Update_date` | date | Date of calculation (YYYY-MM-DD) | `2020-01-02` |
| `1_2_3_ProbOfWorthless_Weighted` | float | Weighted average probability (0-1) | `0.7533` |
| `ProbWorthless_Bayesian_IsoCal` | float | Bayesian calibrated probability (0-1) | `0.7889` |
| `1_ProbOfWorthless_Original` | float | Original Black-Scholes (0-1) | `0.7241` |
| `2_ProbOfWorthless_Calibrated` | float | Bias corrected probability (0-1) | `0.7612` |
| `3_ProbOfWorthless_Historical_IV` | float | Historical IV probability (0-1) | `0.7489` |

### Coverage Requirements

- **Date Range**: 2020-01-01 to present (every trading day)
- **Options**: All active options on each date (not yet expired)
- **Completeness**: No missing dates, all options have all 5 probability methods

### Data Volume Estimate

- **6 years** × ~250 trading days/year = ~1,500 trading days
- **~500 active options** per day on average
- **Total**: ~750,000 - 1,000,000 rows

### Why This Is Critical

Without historical probability data, we **cannot calculate**:
- Historical Peak factor (15% of score)
- Recovery Advantage factor (25% of score)

This means **40% of the scoring system cannot be backtested** without this data.

---

## Priority 2: Historical Expiration Outcomes ⚠️ CRITICAL

### What We Need

A database of all expired options from 2020 onwards with their outcomes (worthless vs ITM).

### File Format

**File**: `historical_option_outcomes.csv`

**Format**:
```
OptionName,ExpiryDate,StockName,StrikePrice,FinalStockPrice,Outcome,FinalPremium
ERICB6U45,2025-01-17,ERIC B,45.0,48.50,worthless,0
ERICB6T40,2025-01-17,ERIC B,40.0,38.25,ITM,2.25
VOLVB6X300,2025-01-17,VOLV B,300.0,295.50,ITM,4.50
NOKSE6U50,2025-01-17,NOKIA SEK,50.0,52.75,worthless,0
...
```

### Required Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `OptionName` | string | Option identifier | `ERICB6U45` |
| `ExpiryDate` | date | Expiration date (YYYY-MM-DD) | `2025-01-17` |
| `StockName` | string | Stock name (match format in other files) | `ERIC B` |
| `StrikePrice` | float | Strike price in SEK | `45.0` |
| `FinalStockPrice` | float | Stock close price on expiry date | `48.50` |
| `Outcome` | string | "worthless" or "ITM" | `worthless` |
| `FinalPremium` | float | Premium on last trading day (optional) | `0` |

### Outcome Determination Logic

```
If FinalStockPrice > StrikePrice:
    Outcome = "worthless"  (Put option expires worthless - seller wins)
Else:
    Outcome = "ITM"        (Put option in-the-money - seller loses)
```

### Coverage Requirements

- **Date Range**: All options that expired from 2020-01-01 onwards
- **Completeness**: Every expired option must be included
- **Accuracy**: Stock prices must be actual close prices on expiry date

### Data Source

- `FinalStockPrice` can be extracted from `stock_data.csv` (close price on expiry date)
- Compare to `StrikePrice` to determine outcome
- Must know which options existed historically (see Priority 4)

### Data Volume Estimate

- **6 years** × ~8 expirations per year × ~300 options per expiry = ~14,400 expired options
- Actual volume may vary

### Why This Is Critical

This is the **ground truth** for backtesting. Without expiration outcomes, we cannot:
- Validate if high scores → better outcomes
- Measure hit rates by score bucket
- Determine if scoring system works

This is the **most important data file** for backtesting.

---

## Priority 3: Historical Support Metrics (Lower Priority)

### What We Need

Daily snapshots of support level metrics from 2020 onwards.

### File Format

**Option A** (Preferred): One file per date

**Files**: `support_level_metrics_20200102.csv`, `support_level_metrics_20200103.csv`, etc.

**Format**: Same as current `support_level_metrics.csv`

**Option B**: One large file with date column

**File**: `support_level_metrics_historical.csv`

Add `calculation_date` column to track when metrics were calculated.

### Required Fields

Same fields as current `support_level_metrics.csv`:

- `stock_name`
- `rolling_period` (30, 90, 180, 270, 365)
- `support_strength_score` (0-100)
- `days_since_last_break`
- `trading_days_per_break`
- `rolling_low`
- `pattern_type`
- `last_break_date`
- etc.

### Coverage Requirements

- **Date Range**: 2020-01-01 to present (every trading day)
- **Stocks**: All stocks being tracked
- **Rolling Periods**: All 5 periods (30/90/180/270/365)

### Why Lower Priority

We can **recalculate** support metrics from `stock_data.csv` (which goes back to 2020). Having pre-calculated files would save computation time but is not strictly required.

If generating these files is time-consuming, **skip this** and we'll recalculate them.

---

## Priority 4: Historical Options Universe (Helpful)

### What We Need

A list of all options that existed historically, with their lifetimes.

### File Format

**File**: `historical_options_universe.csv`

**Format**:
```
OptionName,StockName,StrikePrice,ExpiryDate,FirstSeenDate,LastSeenDate
ERICB6U45,ERIC B,45.0,2025-01-17,2024-10-15,2025-01-17
ERICB6T40,ERIC B,40.0,2025-01-17,2024-10-15,2025-01-17
VOLVB6X300,VOLV B,300.0,2025-01-17,2024-10-15,2025-01-17
...
```

### Required Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `OptionName` | string | Option identifier | `ERICB6U45` |
| `StockName` | string | Stock name | `ERIC B` |
| `StrikePrice` | float | Strike price in SEK | `45.0` |
| `ExpiryDate` | date | Expiration date (YYYY-MM-DD) | `2025-01-17` |
| `FirstSeenDate` | date | When option first appeared in data | `2024-10-15` |
| `LastSeenDate` | date | When option last appeared (= expiry or delist) | `2025-01-17` |

### Coverage Requirements

- **All options** from 2020 onwards
- Include both:
  - Options that expired normally
  - Options that were delisted early

### Why Helpful

This helps us reconstruct which options were "available for trading" on each historical date. Without it, we have to infer from probability_history.csv or other sources.

---

## Data Quality Checklist

Before delivering data files, please verify:

### Completeness
- [ ] No missing dates (gaps in time series)
- [ ] All trading days from 2020-01-01 to present covered
- [ ] All active options included for each date

### Correctness
- [ ] All probability values are 0-1 range (not 0-100)
- [ ] All expiration outcomes are either "worthless" or "ITM"
- [ ] Stock prices on expiry dates match stock_data.csv
- [ ] Support metrics are reasonable (no negative values, scores 0-100)

### Consistency
- [ ] Stock names match exactly across all files (e.g., "ERIC B" not "ERICB" or "Ericsson B")
- [ ] Option names match exactly across all files
- [ ] Dates are YYYY-MM-DD format
- [ ] Delimiters are consistent (pipe `|` or comma `,`)

### No Errors
- [ ] No null/empty values in critical fields
- [ ] No duplicate rows (same option + same date)
- [ ] No obvious data quality issues (outliers, typos)

---

## Example: Generating Historical Expiration Outcomes

Here's pseudo-code showing how to create the expiration outcomes file:

```python
import pandas as pd

# Load stock price data
stock_data = pd.read_csv('stock_data.csv', delimiter='|', parse_dates=['date'])

# Load historical options (from your database)
# This is the key data you need to provide
historical_options = get_all_historical_options()  # Your internal function

# Results list
outcomes = []

# For each option that expired from 2020 onwards
for option in historical_options:
    expiry_date = option['ExpiryDate']
    stock_name = option['StockName']
    strike_price = option['StrikePrice']

    # Get stock close price on expiry date
    stock_price_on_expiry = stock_data[
        (stock_data['name'] == stock_name) &
        (stock_data['date'] == expiry_date)
    ]['close'].values

    if len(stock_price_on_expiry) == 0:
        print(f"Warning: No stock price for {stock_name} on {expiry_date}")
        continue

    final_stock_price = stock_price_on_expiry[0]

    # Determine outcome
    if final_stock_price > strike_price:
        outcome = 'worthless'  # Put seller wins
    else:
        outcome = 'ITM'  # Put seller loses

    # Store result
    outcomes.append({
        'OptionName': option['OptionName'],
        'ExpiryDate': expiry_date,
        'StockName': stock_name,
        'StrikePrice': strike_price,
        'FinalStockPrice': final_stock_price,
        'Outcome': outcome,
        'FinalPremium': 0 if outcome == 'worthless' else calculate_premium(option)
    })

# Save to CSV
outcomes_df = pd.DataFrame(outcomes)
outcomes_df.to_csv('historical_option_outcomes.csv', index=False)
print(f"Generated {len(outcomes)} expiration outcomes")
```

---

## Delivery Format

### Recommended Approach

1. **Create a new folder**: `historical_data/`

2. **Place files in folder**:
   ```
   historical_data/
   ├── probability_history_full.csv          (Priority 1)
   ├── historical_option_outcomes.csv        (Priority 2)
   ├── historical_options_universe.csv       (Priority 4)
   └── support_level_metrics_historical.csv  (Priority 3 - optional)
   ```

3. **Compress folder**: `historical_data.zip`

4. **Share with Put Options SE team**

### Alternative: Upload to Shared Location

If files are very large (>1 GB compressed):
- Upload to shared cloud storage (Google Drive, Dropbox, etc.)
- Share link with Put Options SE team
- Include README with file descriptions

---

## Timeline Estimate

Based on data generation complexity:

| Task | Estimated Time | Priority |
|------|----------------|----------|
| Historical Probability Data | 1-2 weeks | P1 - CRITICAL |
| Historical Expiration Outcomes | 3-5 days | P2 - CRITICAL |
| Historical Options Universe | 2-3 days | P4 - Helpful |
| Historical Support Metrics | 1 week | P3 - Optional |

**Total**: 2-3 weeks for critical data (P1 + P2)

---

## Testing Before Full Delivery

### Recommend: Generate Sample Data First

To validate the data format and scripts work correctly:

1. **Generate data for 1 month** (e.g., January 2025)
   - probability_history_202501.csv
   - outcomes for options that expired in Jan 2025
   - options universe for Jan 2025

2. **Share with Put Options SE team**

3. **Run test backtest**
   ```bash
   python backtest_runner.py \
       --start-date 2025-01-01 \
       --end-date 2025-01-31 \
       --data-dir ./test_data
   ```

4. **Validate results**
   - Scripts run without errors
   - Results look reasonable
   - Data format is correct

5. **If successful, proceed with full historical data generation**

This approach reduces risk of generating large amounts of data in the wrong format.

---

## Questions & Clarifications

If you have questions about:

1. **Data Format**: Review current CSV files in `/data` folder for reference
2. **Business Logic**: See `/docs/FIELD_GUIDE.md` and `/docs/recommendations.md`
3. **Technical Implementation**: See `/backtest/README.md` and script comments
4. **Specific Requirements**: Contact Put Options SE team

---

## Summary

**What We Need (Critical)**:
1. ✅ Historical probability data (daily, 2020-present)
2. ✅ Historical expiration outcomes (all expired options from 2020)

**What Would Help**:
3. Historical options universe (all options that existed)
4. Historical support metrics (can recalculate if needed)

**Next Steps**:
1. Review this document
2. Generate sample data for 1 month (test)
3. Validate with Put Options SE team
4. Generate full historical data
5. Deliver to Put Options SE team

Once we have this data, we can run comprehensive backtesting and validate that the scoring system truly predicts successful put option outcomes.
