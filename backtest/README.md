

# Automated Recommendations Backtest Package

**Purpose**: Python scripts that replicate the exact scoring logic from the Put Options SE website to enable historical backtesting.

**Audience**: Upstream data team responsible for generating CSV files

**Date**: January 2026

---

## Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Run backtest on available data (Dec 2025 - Jan 2026)
python backtest_runner.py \
    --start-date 2025-12-01 \
    --end-date 2026-01-17 \
    --data-dir ../data \
    --output-dir ./results
```

---

## Package Contents

| File | Purpose |
|------|---------|
| `scoring_engine.py` | Core scoring logic (matches website exactly) |
| `data_loader.py` | Utilities to load CSV data files |
| `backtest_runner.py` | Main backtest execution script |
| `requirements.txt` | Python dependencies |
| `README.md` | This file |

---

## Overview

This package contains Python scripts that **exactly replicate** the scoring logic used by the Put Options SE website's Automated Recommendations feature.

The scripts:
1. **Load data from CSV files** in the `../data/` directory
2. **Calculate composite scores** for options using the same 6-factor methodology as the website
3. **Track options to expiration** and determine outcomes (worthless vs ITM)
4. **Analyze results** to validate if high scores → better outcomes

---

## Scoring Methodology (Matches Website Exactly)

### The 6 Factors

Each option is scored using 6 weighted factors:

| Factor | Default Weight | Description |
|--------|----------------|-------------|
| **Recovery Advantage** | 25% | Historical worthless rate for recovery candidates |
| **Support Strength** | 20% | Pre-calculated support level robustness (0-100) |
| **Days Since Break** | 15% | Time since support level last broken |
| **Historical Peak** | 15% | Whether option previously peaked above threshold |
| **Monthly Seasonality** | 15% | Historical % of positive months |
| **Current Performance** | 10% | Month-to-date underperformance vs average |

### Calculation Process

1. **Normalize** each factor to 0-100 scale
2. **Apply weights** (sum of weights = 100%)
3. **Sum weighted scores** to get composite score (0-100)

### Score Interpretation

- **≥70 (Green)**: Strong recommendation
- **50-69 (Yellow)**: Moderate recommendation
- **<50 (Red)**: Weak recommendation

---

## How to Use These Scripts

### Step 1: Install Dependencies

```bash
pip install -r requirements.txt
```

**Requirements**:
- Python 3.8+
- pandas >= 2.0.0
- numpy >= 1.24.0

### Step 2: Prepare Data Files

Ensure these CSV files exist in `../data/`:

- `data.csv` - Options data (pipe-delimited)
- `support_level_metrics.csv` - Support metrics (comma-delimited)
- `probability_history.csv` - Probability history (pipe-delimited)
- `recovery_report_data.csv` - Recovery rates (pipe-delimited)
- `Stocks_Monthly_Data.csv` - Monthly statistics (pipe-delimited)
- `stock_data.csv` - Daily stock prices (pipe-delimited)

### Step 3: Run Backtest

```bash
python backtest_runner.py \
    --start-date 2025-12-01 \
    --end-date 2026-01-17 \
    --rolling-period 365 \
    --min-days-since-break 10 \
    --probability-method ProbWorthless_Bayesian_IsoCal \
    --historical-peak-threshold 0.90 \
    --data-dir ../data \
    --output-dir ./results
```

**Parameters**:
- `--start-date`: Start date for backtest (YYYY-MM-DD)
- `--end-date`: End date for backtest (YYYY-MM-DD)
- `--rolling-period`: Support level rolling period (30/90/180/270/365, default: 365)
- `--min-days-since-break`: Minimum days since support break (default: 10)
- `--probability-method`: Which probability method to use (default: Bayesian)
- `--historical-peak-threshold`: Recovery threshold (0.80/0.90/0.95, default: 0.90)
- `--data-dir`: Path to data directory (default: ../data)
- `--output-dir`: Path to output directory (default: ./results)

### Step 4: Review Results

The script generates:

1. **`backtest_results_YYYY-MM-DD_YYYY-MM-DD.csv`** - Raw results
   - Columns: date, option_name, stock_name, composite_score, outcome, etc.
   - One row per option per date scored

2. **`hit_rates_YYYY-MM-DD_YYYY-MM-DD.csv`** - Analysis
   - Hit rates by score bucket (90-100, 80-90, 70-80, etc.)
   - Shows: Do high scores → higher % worthless?

---

## Current Data Availability (January 2026)

### What We Have

✅ **Stock Prices** (`stock_data.csv`)
- Daily OHLC data back to **January 2020** (6 years)
- Can recalculate support metrics historically

✅ **Monthly Statistics** (`Stocks_Monthly_Data.csv`)
- Monthly data back to **2006** (20 years)
- Seasonality factor fully supported

✅ **Support Metrics** (`support_level_metrics.csv`)
- Current snapshot only
- **But can be recalculated** from stock_data.csv for any historical date

### What We're Missing (Critical for Backtesting)

❌ **Historical Probability Data** (`probability_history.csv`)
- Only covers **December 2025 - January 2026** (1.5 months)
- Affects Historical Peak (15%) and Recovery Advantage (25%) factors
- **40% of scoring cannot be backtested** before Dec 2025

❌ **Historical Option Expiration Outcomes**
- Need to know which options expired worthless vs ITM
- This is the **ground truth** for validation
- Can be reconstructed from stock_data.csv if we know which options existed

---

## What the Upstream Team Needs to Provide

To enable comprehensive backtesting, the upstream team needs to generate **historical snapshots** of the following data:

### Priority 1: Historical Probability Data (CRITICAL)

**File**: `probability_history_YYYYMMDD.csv` (one file per date)

**Format**: Same as current `probability_history.csv`

```
OptionName|Update_date|1_2_3_ProbOfWorthless_Weighted|ProbWorthless_Bayesian_IsoCal|...
ERICB6U45|2024-01-15|0.75|0.78|0.72|0.76|0.74
```

**What We Need**:
- Daily snapshots for **every trading day** from at least Jan 2020 onwards
- All 5 probability methods for each option
- Complete coverage (no gaps)

**Why**: Without this, we cannot calculate Historical Peak or Recovery Advantage factors (40% of score)

### Priority 2: Historical Expiration Outcomes (CRITICAL)

**File**: `historical_option_outcomes.csv`

**Format**: New file with option expiration results

```
OptionName,ExpiryDate,StockName,StrikePrice,FinalStockPrice,Outcome,FinalPremium
ERICB6U45,2025-01-17,ERIC B,45.0,48.50,worthless,0
ERICB6T40,2025-01-17,ERIC B,40.0,38.25,ITM,2.25
```

**Fields**:
- `OptionName`: Option identifier
- `ExpiryDate`: When option expired (YYYY-MM-DD)
- `StockName`: Which stock
- `StrikePrice`: Strike price
- `FinalStockPrice`: Stock close price on expiry date
- `Outcome`: "worthless" (stock > strike) or "ITM" (stock ≤ strike)
- `FinalPremium`: Premium on last trading day (optional)

**What We Need**:
- All expired options from **2020 onwards**
- Complete coverage (every option that expired)

**Why**: This is the ground truth for validation. Without it, we cannot determine if high scores actually led to successful outcomes.

### Priority 3: Historical Support Metrics (Lower Priority)

**Files**: `support_level_metrics_YYYYMMDD.csv` (one file per date)

**Format**: Same as current `support_level_metrics.csv`

**What We Need**:
- Daily snapshots from 2020 onwards
- OR: We can recalculate these from `stock_data.csv`

**Why**: Can be recalculated, so lower priority. But having pre-calculated files would save computation time.

### Priority 4: Historical Options Universe

**File**: `historical_options_universe.csv`

**Format**: New file listing all options that existed historically

```
OptionName,StockName,StrikePrice,ExpiryDate,FirstSeenDate,LastSeenDate
ERICB6U45,ERIC B,45.0,2025-01-17,2024-10-15,2025-01-17
```

**Fields**:
- `OptionName`: Option identifier
- `StockName`: Which stock
- `StrikePrice`: Strike price
- `ExpiryDate`: Expiration date
- `FirstSeenDate`: When option first appeared in data
- `LastSeenDate`: When option was last seen (= expiry date or delisting)

**What We Need**:
- Complete list of all options from 2020 onwards
- Include options that expired or were delisted

**Why**: Need to know which options existed on each historical date to properly reconstruct the "options universe" for backtesting.

---

## Detailed Instructions for Upstream Team

### Task 1: Generate Historical Probability Data

**Goal**: Create daily probability snapshots going back as far as possible (ideally to 2020).

**Steps**:

1. **For each trading day from 2020-01-01 to present**:
   - Extract all active options on that date
   - Calculate all 5 probability methods:
     - `ProbWorthless_Bayesian_IsoCal`
     - `1_2_3_ProbOfWorthless_Weighted`
     - `1_ProbOfWorthless_Original`
     - `2_ProbOfWorthless_Calibrated`
     - `3_ProbOfWorthless_Historical_IV`

2. **Save to CSV**:
   - Format: `probability_history_YYYYMMDD.csv` (one per date)
   - OR: Single large `probability_history_full.csv` with all dates
   - Delimiter: pipe (`|`)

3. **Validate**:
   - Check no missing dates (gaps)
   - Check all options have all 5 methods
   - Check values are 0-1 range

**Expected Output**:
- ~1,500 files (one per trading day from 2020-2026)
- OR: One large file with ~2-3 million rows

### Task 2: Generate Historical Expiration Outcomes

**Goal**: Create a database of all expired options with their outcomes.

**Steps**:

1. **For each option that expired from 2020 to present**:
   - Look up stock close price on expiry date in `stock_data.csv`
   - Compare to strike price
   - Determine outcome:
     - `worthless` if stock_close > strike_price (put seller wins)
     - `ITM` if stock_close ≤ strike_price (put seller loses)

2. **Save to CSV**:
   - Format: `historical_option_outcomes.csv`
   - Include all fields listed in Priority 2 above
   - Delimiter: comma or pipe

3. **Validate**:
   - Check every expired option is included
   - Check outcomes are correct (spot-check a few)
   - Check no duplicates

**Expected Output**:
- One file with ~50,000-100,000 rows (estimate)
- Covers all expired options from 2020-2026

### Task 3: Generate Historical Options Universe (Optional but Helpful)

**Goal**: Create a list of all options that existed historically.

**Steps**:

1. **Extract option metadata**:
   - From your options database or historical data
   - For each option: name, stock, strike, expiry, first/last seen dates

2. **Save to CSV**:
   - Format: `historical_options_universe.csv`
   - Include fields listed in Priority 4 above

**Expected Output**:
- One file with all historical options

### Task 4: Validate Data Quality

**Checklist**:
- [ ] No missing dates (gaps in time series)
- [ ] All files use consistent delimiters (pipe `|` or comma `,`)
- [ ] All probability values are 0-1 range
- [ ] All expiration outcomes are "worthless" or "ITM"
- [ ] Stock names match between files (e.g., "ERIC B" not "ERICB" or "Ericsson B")
- [ ] Dates are YYYY-MM-DD format
- [ ] No null values in critical fields

---

## Running Extended Backtest (Once Data Available)

Once the upstream team provides historical data, run extended backtest:

```bash
# Full 6-year backtest (2020-2026)
python backtest_runner.py \
    --start-date 2020-01-01 \
    --end-date 2026-01-17 \
    --data-dir ../data \
    --output-dir ./results

# This will:
# 1. Load all historical data
# 2. Calculate scores for every option on every date
# 3. Track options to expiration
# 4. Analyze hit rates by score bucket
# 5. Generate comprehensive results
```

**Expected Runtime**:
- With 6 years of data: ~30-60 minutes
- Depends on CPU and data volume

**Expected Output**:
- `backtest_results_2020-01-01_2026-01-17.csv` (~5-10 million rows)
- `hit_rates_2020-01-01_2026-01-17.csv` (summary analysis)

---

## Modifying the Scripts

### Changing Weights

To test different weight configurations, edit `scoring_engine.py`:

```python
# In ScoringEngine class
DEFAULT_WEIGHTS = {
    'support_strength': 30,      # Increased from 20
    'days_since_break': 10,      # Decreased from 15
    'recovery_advantage': 25,
    'historical_peak': 15,
    'monthly_seasonality': 15,
    'current_performance': 5     # Decreased from 10
}
```

Or pass custom weights when creating the engine:

```python
custom_weights = {
    'support_strength': 30,
    'days_since_break': 10,
    'recovery_advantage': 25,
    'historical_peak': 15,
    'monthly_seasonality': 15,
    'current_performance': 5
}

engine = ScoringEngine(weights=custom_weights)
```

### Adding New Factors

To add a new scoring factor:

1. Add normalization function in `scoring_engine.py`
2. Update `ScoringEngine.calculate_score()` to include new factor
3. Update `DEFAULT_WEIGHTS` to include new factor
4. Update `data_loader.py` to load any new data required

### Testing Individual Components

```python
# Test scoring engine
from scoring_engine import ScoringEngine, normalize_support_strength

engine = ScoringEngine()

# Test normalization
result = normalize_support_strength(75.0)
print(f"Normalized: {result.normalized}, Has data: {result.has_data}")

# Test full scoring
score, breakdown = engine.calculate_score(
    support_strength_score=75.0,
    days_since_last_break=45,
    trading_days_per_break=30.0,
    current_probability=0.70,
    historical_peak_probability=0.85,
    historical_peak_threshold=0.90,
    recovery_advantage=0.78,
    monthly_positive_rate=72.0,
    monthly_avg_return=2.5,
    typical_low_day=15,
    current_day=10,
    current_month_performance=-1.5
)

print(f"Composite Score: {score:.1f}")
print(f"Interpretation: {engine.get_score_interpretation(score)}")
```

---

## Expected Backtest Results

### Success Criteria

A successful backtest should show:

1. **Score Discrimination**
   - High scores (90-100) → significantly higher % worthless
   - Low scores (<50) → lower % worthless
   - Example: 90-100 score → 85%+ worthless, <50 score → 55% worthless

2. **Statistical Significance**
   - Difference between high/low scores is statistically significant
   - p-value < 0.05 in logistic regression

3. **Consistent Across Time**
   - Pattern holds in different market conditions
   - Not just working in one specific period

### Example Output (Hypothetical)

```
HIT RATES BY SCORE BUCKET
================================================================================

Score  90-100:  87.2% worthless (n= 523)
Score  80-90:   82.5% worthless (n=1245)
Score  70-80:   76.1% worthless (n=2134)
Score  60-70:   68.3% worthless (n=1876)
Score  50-60:   61.2% worthless (n= 987)
Score     <50:   54.8% worthless (n= 456)

OVERALL STATISTICS
================================================================================

Overall hit rate: 72.5%
Average composite score: 68.3

Top 25% of scores: 84.1% worthless (n=1750)
Bottom 25% of scores: 58.3% worthless (n=1750)
Difference: +25.8 percentage points
```

**Interpretation**: This would be a **successful validation** - the scoring system clearly discriminates between good and bad options.

---

## Troubleshooting

### Issue: "FileNotFoundError: Data directory not found"

**Solution**: Ensure you're running from the `backtest/` directory and data files exist in `../data/`

```bash
cd backtest
ls ../data  # Should show CSV files
python backtest_runner.py ...
```

### Issue: "No options with outcomes found"

**Solution**: Options haven't expired yet within the backtest period, or outcome data is missing.

- Check that `end_date` is after option expiry dates
- Verify `stock_data.csv` has prices on expiry dates
- Check for data quality issues

### Issue: "KeyError: ProbWorthless_Bayesian_IsoCal"

**Solution**: Probability field missing from data.csv

- Check that `data.csv` includes all 5 probability methods
- Verify field names match exactly (case-sensitive)
- Try different `--probability-method` parameter

### Issue: Scores are all 0 or very low

**Solution**: Data missing for key factors

- Check that all data files are loaded correctly
- Verify support metrics exist for stocks being scored
- Check for null values in data files

---

## Contact & Support

If you have questions or need assistance:

1. Review the comprehensive requirements document: `/docs/BACKTEST_REQUIREMENTS.md`
2. Check the website documentation: `/docs/recommendations.md`
3. Examine the frontend source code: `/src/hooks/useAutomatedRecommendations.ts`

The Python scripts in this package are designed to **exactly match** the frontend logic, so any discrepancies should be reported.

---

## Next Steps for Upstream Team

**Immediate (Week 1-2)**:
1. Review this README and backtest requirements document
2. Assess feasibility of generating historical probability data
3. Create sample historical data files for one month (test format)
4. Run test backtest to validate scripts work correctly

**Short-Term (Month 1)**:
1. Generate historical probability data (Priority 1)
2. Generate historical expiration outcomes (Priority 2)
3. Deliver to Put Options SE team
4. Coordinate on running full backtest

**Medium-Term (Months 2-3)**:
1. Run comprehensive backtest on 6 years of data
2. Analyze results and share findings
3. Recommend weight adjustments if needed
4. Document any data quality issues discovered

---

## Summary

This package provides everything needed to backtest the Automated Recommendations scoring system. The scripts **exactly replicate** the website logic and can be run once the upstream team provides:

1. **Historical probability data** (daily snapshots from 2020+)
2. **Historical expiration outcomes** (which options expired worthless vs ITM)
3. **Historical options universe** (which options existed on each date)

Once this data is available, we can:
- Validate that high scores → better outcomes
- Optimize factor weights
- Identify which factors are most predictive
- Provide data-driven recommendations for improving the scoring system

The results will give us confidence that the recommendations shown to users are truly backed by historical evidence.
