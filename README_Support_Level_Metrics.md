# Support Level Metrics Generator

## Overview

This Python script (`generate_support_level_metrics.py`) pre-calculates comprehensive support level analysis metrics for all stocks across multiple rolling periods. The output CSV file is used by the React frontend for instant filtering and sorting without client-side calculation overhead.

## Purpose

The Support Level Options List page was experiencing performance issues due to calculating rolling lows and support metrics on-the-fly for 68 stocks. This script moves all heavy calculations to a one-time batch process, resulting in:

- **Instant page load** - No client-side rolling low calculations
- **No lag on filter changes** - Simple array filtering instead of complex computations
- **Advanced metrics** - Sophisticated analysis that would be too slow in browser
- **Consistent results** - Same calculations every time

## Output File

**Location**: `data/support_level_metrics.csv`

**Size**: ~62 KB (340 rows = 68 stocks × 5 rolling periods)

**Update Frequency**: Run this script when `stock_data.csv` is updated (typically daily/weekly)

## Calculated Metrics

The script calculates 26 metrics for each stock-period combination:

### Basic Metrics
- `stock_name` - Stock identifier
- `rolling_period` - Days in rolling period (30, 90, 180, 270, 365)
- `current_price` - Latest closing price
- `rolling_low` - Support level (minimum low in period)
- `distance_to_support_pct` - % stock must fall to reach support

### Support Break Statistics
- `total_breaks` - Number of support breaks in period
- `days_since_last_break` - Days since most recent break
- `last_break_date` - Date of last break
- `support_stability_pct` - % of days support held (100% = never broken)
- `stability_trend` - improving/stable/weakening

### Drop Magnitude Statistics
- `median_drop_per_break_pct` - Median % drop when support breaks (robust statistic)
- `avg_drop_per_break_pct` - Average % drop per break
- `max_drop_pct` - Largest single drop
- `drop_std_dev_pct` - Consistency of drops (low = predictable)

### Break Frequency Statistics
- `avg_days_between_breaks` - Average interval between breaks
- `median_days_between_breaks` - Median interval (robust statistic)
- `trading_days_per_break` - Frequency metric (higher = more stable)

### Cluster Statistics
- `num_clusters` - Number of break clusters (gaps ≤30 days)
- `max_consecutive_breaks` - Most breaks in any historical cluster
- `current_consecutive_breaks` - Breaks in active cluster (if within 30 days)

### Advanced Metrics
- `support_strength_score` - Composite score 0-100 (weighted: stability 30%, days since break 25%, frequency 25%, consistency 20%)
- `pattern_type` - Classification: never_breaks, exhausted_cascade, shallow_breaker, volatile, stable, predictable_cycles
- `break_probability_30d` - Estimated probability of break in next 30 days
- `break_probability_60d` - Estimated probability of break in next 60 days

### Metadata
- `last_calculated` - Timestamp when metrics were generated
- `data_through_date` - Latest date in stock data

## Usage

### Running the Script

```bash
# Use the virtual environment with pandas installed
/home/gustaf/.venv/bin/python3 generate_support_level_metrics.py
```

**Execution Time**: Approximately 10-15 minutes for 68 stocks × 5 periods

**Output**:
```
================================================================================
Support Level Metrics Generator
================================================================================
Loading stock data from /home/gustaf/put-options-se-1/data/stock_data.csv...
Loaded 94,992 rows for 68 stocks

Analyzing 68 stocks across 5 rolling periods...
Data through: 2025-12-12

[1/340] Analyzing AAK AB - 30 days...
...
[340/340] Analyzing Volvo, AB ser. B - 365 days...

Completed all analyses!

✓ Saved metrics to: /home/gustaf/put-options-se-1/data/support_level_metrics.csv
  Total rows: 340
  File size: 61.3 KB
```

### Pattern Classification

The script automatically classifies stocks into these patterns:

1. **never_breaks** (99.5%+ stability)
   - Support has never or extremely rarely broken
   - Safest for writing put options

2. **exhausted_cascade** (current breaks ≥ 80% of historical max)
   - Currently in cluster near historical maximum
   - May be due for rebound

3. **shallow_breaker** (median drop < 2%)
   - Support breaks but drops are small
   - Even if assigned, limited downside

4. **volatile** (stability < 70% AND median drop < -5%)
   - Frequent breaks with large drops
   - Highest risk

5. **stable** (stability ≥ 85% AND total breaks < 10)
   - Good stability with infrequent breaks
   - Moderate risk

6. **predictable_cycles** (default)
   - Regular patterns that don't fit above categories

## Summary Statistics Example

```
90-day period:
  Avg Support Strength Score: 52.5
  Avg Stability: 94.8%
  Stocks with 100% stability: 0
  Pattern distribution:
    - shallow_breaker: 61 stocks
    - predictable_cycles: 4 stocks
    - exhausted_cascade: 3 stocks
```

## Integration with React Frontend

**Next Step**: Update `useSupportBasedOptionFinder.ts` to:
1. Load `support_level_metrics.csv` instead of calculating on-the-fly
2. Simple lookups by stock name + rolling period
3. Instant filtering/sorting on pre-calculated metrics

## Technical Details

### Algorithm Complexity

- **Rolling Low Calculation**: O(n²) for each stock (nested loops over trading days)
- **Break Detection**: O(n) linear scan
- **Clustering**: O(n) single pass
- **Total**: ~340 iterations (68 stocks × 5 periods) × O(n²) per stock

This is why the script runs in Python offline rather than in the browser!

### Data Processing Flow

1. Load `stock_data.csv` (~95,000 rows)
2. For each stock (68 total):
   - For each rolling period (30, 90, 180, 270, 365 days):
     - Calculate rolling low across all historical data
     - Detect support breaks (rolling low decreases)
     - Cluster consecutive breaks (≤30 day gaps)
     - Calculate stability, drop statistics, frequency metrics
     - Classify pattern type
     - Calculate support strength score
     - Estimate break probabilities
3. Output 340 rows to CSV

### Dependencies

- Python 3.x
- pandas >= 2.0
- numpy

## Maintenance

**When to Regenerate**:
- Daily/weekly when `stock_data.csv` is updated
- After adding new stocks to the dataset
- When changing rolling period definitions or max gap days

**Script Location**: `/home/gustaf/put-options-se-1/generate_support_level_metrics.py`

**Output Location**: `/home/gustaf/put-options-se-1/data/support_level_metrics.csv`
