# Python Implementation Guide
## Exact Replication of Automated Put Option Recommendations Algorithm

**File:** `automated_recommendations_scoring.py`

---

## Overview

This Python module provides **exact** replication of the website's scoring algorithm. It includes:

- Complete data loading from CSV files
- All 6 normalization functions with exact formulas
- Probability peaks calculation (always Bayesian)
- Recovery data structure building (aggregated only)
- Monthly stats mapping (current month only)
- Stock performance calculation (previous month baseline)
- Weight normalization (auto-scale to 100%)
- Option filtering and scoring
- Result sorting and ranking

---

## Quick Start

### 1. Prepare Your Data

Place all CSV files in a `./data/` directory:
```
./data/
  ├── data.csv
  ├── support_level_metrics.csv
  ├── probability_history.csv
  ├── recovery_report_data.csv
  ├── Stocks_Monthly_Data.csv
  └── stock_data.csv
```

**Note:** All CSV files use pipe delimiter (`|`), not comma.

### 2. Basic Usage

```python
from automated_recommendations_scoring import (
    OptionScoringEngine,
    DataLoader,
    RecommendationFilters,
    ScoreWeights,
)

# Initialize engine and loader
engine = OptionScoringEngine()
loader = DataLoader()

# Load all CSV data
loader.load_all_data(data_dir='./data')

# Build data structures
engine.load_data(loader)

# Define filters
filters = RecommendationFilters(
    expiryDate='2025-01-17',
    rollingPeriod=365,
    minDaysSinceBreak=10,
    probabilityMethod='ProbWorthless_Bayesian_IsoCal',
    historicalPeakThreshold=0.90
)

# Define weights (will be auto-normalized to 100%)
weights = ScoreWeights(
    supportStrength=20,
    daysSinceBreak=15,
    recoveryAdvantage=25,
    historicalPeak=15,
    monthlySeasonality=15,
    currentPerformance=10,
)

# Analyze
results = engine.analyze_options(filters, weights)

# Get top recommendation
if results:
    top = results[0]
    print(f"Top: {top.optionName} ({top.stockName}) - Score: {top.compositeScore:.2f}")
```

### 3. Access Results

Each result is a `RecommendedOption` with complete information:

```python
for result in results[:5]:
    print(f"{result.rank}. {result.optionName}")
    print(f"   Stock: {result.stockName}")
    print(f"   Score: {result.compositeScore:.2f}")
    print(f"   Support Strength: {result.scoreBreakdown.supportStrength.normalized:.2f}")
    print()
```

---

## Data Loading Details

### CSV Delimiter
All CSV files use pipe delimiter (`|`):
- `data.csv` → pipe delimiter
- `support_level_metrics.csv` → pipe delimiter
- `probability_history.csv` → pipe delimiter
- `recovery_report_data.csv` → pipe delimiter
- `Stocks_Monthly_Data.csv` → pipe delimiter
- `stock_data.csv` → pipe delimiter

The `DataLoader.load_csv()` function automatically handles this:
```python
loader.load_csv(filepath, delimiter='|')
```

### Data Structure Building

The engine builds 5 key data structures from raw CSV data:

#### 1. Probability Peaks Map
```python
# Structure: option_name -> maximum_bayesian_probability
peaks_map = {
    'BETB SX 2025-01-17 75.0': 0.892,
    'BETB SX 2025-01-17 80.0': 0.756,
    ...
}
```

**Key points:**
- Always uses `ProbWorthless_Bayesian_IsoCal` field
- Keeps MAXIMUM value across all history
- Keys: option names from `probability_history.csv`

#### 2. Recovery Data Structure
```python
# Structure: threshold -> method -> prob_bin -> dte_bin -> data
recovery_data = {
    '0.90': {
        'Bayesian Calibrated': {
            '60-70%': {
                '15-21': {
                    'recovery_candidate_n': 245,
                    'recovery_candidate_rate': 0.785,
                    'baseline_n': 3420,
                }
            }
        }
    }
}
```

**Key points:**
- Uses AGGREGATED data only (DataType='scenario' or Stock='')
- Stock-specific data in CSV is ignored
- Threshold formatted as string: "0.90", "0.80", "0.95"
- Recovery rates converted from percentage (0-100) to decimal (0-1)

#### 3. Monthly Stats Map
```python
# Structure: stock_name -> monthly_stats
monthly_stats_map = {
    'Betsson AB': {
        'pct_pos_return_months': 72.0,
        'return_month_mean_pct_return_month': 2.5,
        'day_low_day_of_month': 15,
        'number_of_months_available': 15,
        'open_to_low_max_pct_return_month': -8.25,
    }
}
```

**Key points:**
- Only includes data for CURRENT CALENDAR MONTH
- Month from `datetime.now().month` (1-12)
- Percentages stored as floats (e.g., 72.0 = 72%)

#### 4. Stock Performance Map
```python
# Structure: stock_name -> performance_metrics
stock_perf_map = {
    'Betsson AB': {
        'priceChangePercentMonth': 2.5,  # Month-to-date change
    }
}
```

**Key points:**
- Calculates change from last trading day of PREVIOUS MONTH to today
- Percentages (e.g., 2.5 = +2.5%)

#### 5. Support Metrics Map
```python
# Structure: (stock_name, rolling_period) -> support_metrics
support_map = {
    ('Betsson AB', 365): {
        'current_price': 95.50,
        'rolling_low': 92.0,
        'days_since_last_break': 47,
        'support_strength_score': 75.0,
        'trading_days_per_break': 30.5,
        'pattern_type': 'stable',
    }
}
```

---

## Filtering Process

Filters are applied IN THIS EXACT ORDER:

```python
def filter_options(filters: RecommendationFilters):
    for option in all_options:
        # 1. Expiry date must match exactly
        if option.ExpiryDate != filters.expiryDate:
            continue

        # 2. Support metrics must exist for stock + rolling period
        support_metric = get_support_metric(option.StockName, filters.rollingPeriod)
        if not support_metric:
            continue

        # 3. Strike price must be at or below rolling low
        if option.StrikePrice > support_metric.rolling_low:
            continue

        # 4. Days since break must exceed minimum
        if support_metric.days_since_last_break < filters.minDaysSinceBreak:
            continue

        # Option passes all filters
        filtered_options.append(option)
```

---

## Scoring Process

For each filtered option, the exact sequence is:

### Step 1: Calculate Days to Expiry (Calendar Days)
```python
expiry_date = datetime.strptime(option.ExpiryDate, '%Y-%m-%d')
days_to_expiry = floor(
    (expiry_date - datetime.now()).total_seconds() / (1000 * 60 * 60 * 24)
)
```

**Key:** Uses CALENDAR DAYS, not business days.

### Step 2: Get Current Probability
```python
current_probability = float(option[filters.probabilityMethod])
```

This reads from the selected probability method field in data.csv:
- `ProbWorthless_Bayesian_IsoCal`
- `1_2_3_ProbOfWorthless_Weighted`
- `1_ProbOfWorthless_Original`
- `2_ProbOfWorthless_Calibrated`
- `3_ProbOfWorthless_Historical_IV`

### Step 3: Get Historical Peak (Always Bayesian)
```python
historical_peak = probability_peaks_map.get(option.OptionName)
```

**Key:** Always uses Bayesian peak, regardless of selected probability method.

### Step 4: Get Recovery Advantage (Aggregated)
```python
threshold_key = f"{filters.historicalPeakThreshold:.2f}"  # "0.90"
recovery_method = map_probability_method(filters.probabilityMethod)
prob_bin = get_probability_bin(current_probability)
dte_bin = get_dte_bin(days_to_expiry)

recovery_point = (
    recovery_data_structure
    [threshold_key]
    [recovery_method]
    [prob_bin]
    [dte_bin]
)
recovery_advantage = recovery_point['recovery_candidate_rate']
```

**Key:** Uses AGGREGATED data only, NOT stock-specific.

### Step 5: Get Monthly Stats (Current Month)
```python
monthly_stats = monthly_stats_map.get(stock_name)
if monthly_stats:
    monthly_positive_rate = monthly_stats['pct_pos_return_months']
    monthly_avg_return = monthly_stats['return_month_mean_pct_return_month']
    typical_low_day = monthly_stats['day_low_day_of_month']
```

**Key:** Only has data for current month.

### Step 6: Get Stock Performance (Previous Month)
```python
stock_perf = stock_performance_map.get(stock_name)
current_month_performance = stock_perf['priceChangePercentMonth']
```

**Key:** Compares last trading day of previous month to today's close.

### Step 7: Normalize All 6 Scores

Each score is normalized to 0-100 scale:

```python
support_strength_norm = normalize_support_strength(support_metric['support_strength_score'])
days_since_break_norm = normalize_days_since_break(
    support_metric['days_since_last_break'],
    support_metric['trading_days_per_break']
)
recovery_advantage_norm = normalize_recovery_advantage(recovery_advantage)
historical_peak_norm = normalize_historical_peak(
    current_probability,
    historical_peak,
    filters.historicalPeakThreshold,
    normalized_weights['historicalPeak']  # PASS WEIGHT
)
seasonality_norm = normalize_seasonality(
    monthly_positive_rate,
    current_day,
    typical_low_day
)
current_perf_norm = normalize_current_performance(
    current_month_performance,
    monthly_avg_return
)
```

### Step 8: Calculate Weighted Scores
```python
weighted_support = support_strength_norm * (normalized_weights['supportStrength'] / 100)
weighted_days = days_since_break_norm * (normalized_weights['daysSinceBreak'] / 100)
# ... repeat for all 6 factors
```

### Step 9: Calculate Composite Score (Simple Sum)
```python
composite_score = (
    weighted_support +
    weighted_days +
    weighted_recovery +
    weighted_peak +
    weighted_seasonality +
    weighted_performance
)
```

### Step 10: Sort and Rank
```python
results.sort(key=lambda x: x.compositeScore, reverse=True)
for idx, result in enumerate(results):
    result.rank = idx + 1
```

---

## Normalization Formulas

### Support Strength
```
normalized = min(100, max(0, score))
# Already 0-100, just clamp to range
```

### Days Since Break
```
ratio = days / avgGap
normalized = min(100, max(0, ratio * 50))
# Default avgGap = 30 if not provided
```

### Recovery Advantage
```
normalized = min(100, max(0, recoveryRate * 100))
# recoveryRate is 0-1 (e.g., 0.785), multiply by 100
```

### Historical Peak
```
if weight == 0:
    normalized = 0  # Factor disabled
elif peak < threshold:
    normalized = 30  # Penalty (not a recovery candidate)
else:
    drop = peak - current
    normalized = min(100, 50 + drop * 200)
```

### Monthly Seasonality
```
score = positiveRate
if typicalLowDay and dayDiff <= 3:
    score += 10  # Bonus if near typical low
normalized = min(100, score)
```

### Current Performance
```
underperformance = avgMonth - currentMonth
normalized = min(100, max(0, 50 + underperformance * 10))
```

---

## Weight Normalization

Weights are automatically normalized to sum to 100%:

```python
def normalize_weights(weights: Dict[str, float]) -> Dict[str, float]:
    total = sum(weights.values())
    if total == 0:
        return weights
    return {key: (value / total) * 100 for key, value in weights.items()}
```

**Example:**
```
Input:   {20, 15, 25, 15, 15, 10}  (sum=100)
Output:  {20, 15, 25, 15, 15, 10}  (same)

Input:   {10, 10, 10, 10, 10, 10}  (sum=60)
Output:  {16.67, 16.67, 16.67, 16.67, 16.67, 16.67}  (normalized to 100)
```

---

## Output Structure

Each result includes:

```python
@dataclass
class RecommendedOption:
    rank: int                              # 1, 2, 3, ...
    optionName: str                        # e.g., "BETB SX 2025-01-17 75.0"
    stockName: str                         # e.g., "Betsson AB"
    strikePrice: float
    currentPrice: float
    expiryDate: str                        # "2025-01-17"
    daysToExpiry: int                      # Calendar days
    premium: float

    # Support metrics
    rollingLow: Optional[float]
    distanceToSupportPct: Optional[float]
    daysSinceLastBreak: Optional[int]
    supportStrengthScore: Optional[float]

    # Probability metrics
    currentProbability: float              # 0-1 scale
    historicalPeakProbability: Optional[float]

    # Recovery metrics
    recoveryAdvantage: Optional[float]     # 0-1 scale
    currentProbBin: str                    # "60-70%"
    dteBin: str                            # "15-21"

    # Monthly metrics
    monthlyPositiveRate: Optional[float]
    monthlyAvgReturn: Optional[float]

    # Scoring
    compositeScore: float                  # 0-100
    scoreBreakdown: ScoreBreakdown         # Detailed breakdown
```

---

## Common Pitfalls to Avoid

### 1. ❌ Using Stock-Specific Recovery Data
```python
# WRONG: Filters recovery data by stock
recovery_point = recovery_data[threshold][stock][method][prob_bin][dte_bin]

# CORRECT: Uses aggregated data (no stock in hierarchy)
recovery_point = recovery_data[threshold][method][prob_bin][dte_bin]
```

### 2. ❌ Using Wrong Probability for Peaks
```python
# WRONG: Uses selected probability method
peak = historical_peaks_by_method[filters.probabilityMethod]

# CORRECT: Always uses Bayesian
peak = probability_peaks_map[option_name]  # Always Bayesian
```

### 3. ❌ Using Business Days for DTE
```python
# WRONG: Calculates business days
business_days = count_weekdays(today, expiry_date)
dte_bin = get_dte_bin(business_days)

# CORRECT: Uses calendar days
days = (expiry_date - today).days
dte_bin = get_dte_bin(days)
```

### 4. ❌ Using Wrong Month Baseline
```python
# WRONG: Uses current year-to-date
ytd_return = (today_close - jan_1_close) / jan_1_close

# CORRECT: Uses last trading day of previous month
prev_month_return = (today_close - prev_month_last_close) / prev_month_last_close
```

### 5. ❌ Not Passing Weight to Historical Peak
```python
# WRONG: Doesn't pass weight
historical_peak_result = normalize_historical_peak(
    current_prob, peak_prob, threshold
)

# CORRECT: Passes weight
historical_peak_result = normalize_historical_peak(
    current_prob, peak_prob, threshold,
    normalized_weights['historicalPeak']
)
```

---

## Backtesting Integration

To use for backtesting:

```python
class BacktestEngine:
    def __init__(self):
        self.scoring_engine = OptionScoringEngine()

    def backtest_on_date(self, backtest_date: str):
        # Load data as of backtest_date
        loader = DataLoader()
        loader.load_all_data(data_dir=f'./historical_data/{backtest_date}')

        # Rebuild engine with historical data
        self.scoring_engine.load_data(loader)

        # Run analysis on that date
        filters = RecommendationFilters(
            expiryDate='2025-01-17',
            rollingPeriod=365,
            minDaysSinceBreak=10,
            probabilityMethod='ProbWorthless_Bayesian_IsoCal',
            historicalPeakThreshold=0.90
        )

        weights = ScoreWeights()
        results = self.scoring_engine.analyze_options(filters, weights)

        return results
```

---

## Validation

To verify your implementation matches the website:

1. **Test with identical data**
   - Use same CSV files and date as website
   - Compare results rank-by-rank
   - Check scores match to 0.01 precision

2. **Test individual components**
   - Verify probability bins: `get_probability_bin(0.755)` → `'70-80%'`
   - Verify DTE bins: `get_dte_bin(18)` → `'15-21'`
   - Verify normalization: `normalize_support_strength(75.0)` → 75.0

3. **Test weight normalization**
   - Input: {20, 15, 25, 15, 15, 10}
   - Output: {20, 15, 25, 15, 15, 10} (should be identical)
   - Input: {10, 10, 10, 10, 10, 10}
   - Output: {16.67, 16.67, 16.67, 16.67, 16.67, 16.67}

---

## Performance Notes

- Data loading: ~1-2 seconds for full dataset
- Structure building: ~0.5-1 second
- Scoring 500-2000 options: ~0.5-2 seconds
- All processing is single-threaded (Python)

For large-scale backtesting, consider:
- Caching probability peaks per run
- Batch processing multiple dates
- Parallel processing by stock

---

## Support

If results don't match the website:

1. Verify CSV files are in `./data/` directory
2. Check all delimiters are pipe (`|`), not comma
3. Verify date format is `YYYY-MM-DD`
4. Check current date matches website's date
5. Verify weights sum correctly (before normalization)
6. Run with debug logging enabled
7. Compare individual factor scores

The implementation includes detailed print statements showing:
- Data loading progress
- Structure building
- Filtering results
- Weight normalization

Use these to debug any discrepancies.
