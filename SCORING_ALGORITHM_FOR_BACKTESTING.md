# Automated Put Option Recommendations - Exact Scoring Algorithm
## Complete Documentation for Python Backtesting Implementation

**Generated:** January 15, 2026
**Source:** Put Options SE - Automated Recommendations Feature
**Purpose:** Exact replication of scoring logic for backtesting

---

## Table of Contents

1. [Overview](#overview)
2. [6 Scoring Factors](#6-scoring-factors)
3. [Normalization Formulas](#normalization-formulas)
4. [Composite Score Calculation](#composite-score-calculation)
5. [Data Structure](#data-structure)
6. [Default Weights](#default-weights)
7. [Implementation Steps](#implementation-steps)
8. [Edge Cases & Missing Data](#edge-cases--missing-data)
9. [Python Implementation Reference](#python-implementation-reference)

---

## Overview

The Automated Put Option Recommendations scoring system evaluates 6 weighted factors to generate a composite score (0-100) for each put option:

1. **Recovery Advantage** (default weight: 25%) - Historical worthless rate for recovery candidates
2. **Support Strength** (default weight: 20%) - Pre-calculated support level robustness
3. **Days Since Break** (default weight: 15%) - Time since support was last broken
4. **Historical Peak** (default weight: 15%) - Recovery candidate indicator based on probability peaks
5. **Monthly Seasonality** (default weight: 15%) - Historical % of positive months for current calendar month
6. **Current Performance** (default weight: 10%) - Month-to-date underperformance vs historical average

**Total Weight:** 100% (weights are auto-normalized to 100% before scoring)

**Output:** Recommendations sorted by composite score (highest first)

---

## 6 Scoring Factors

### Factor 1: Recovery Advantage (Raw: 0-1 scale → Normalized: 0-100)

**Definition:** Historical percentage of recovery candidates that expired worthless

**Data Source:** `recovery_report_data.csv`

**Lookup Key:** `recoveryData[threshold][method][probBin][dteBin].recovery_candidate_rate`

**Normalization Formula:**
```
normalized = min(100, max(0, rawValue * 100))
```

**Example:**
- Raw value: 0.785 (78.5% worthless rate from historical data)
- Normalized: 78.5/100 = 0.785 * 100 = 78.5

**Interpretation:**
- 0.80+ (80%+) = Strong recovery candidate (score: 80+)
- 0.50-0.80 (50-80%) = Moderate recovery (score: 50-80)
- <0.50 (<50%) = Weak recovery (score: <50)

---

### Factor 2: Support Strength (Raw: 0-100 scale → Normalized: 0-100)

**Definition:** Pre-calculated composite metric measuring support level reliability

**Data Source:** `support_level_metrics.csv` field `support_strength_score`

**Pre-calculated Components (already done offline):**
```
Support Strength Score =
  (Support Stability × 0.30) +
  (Days Since Last Break × 0.25) +
  (Break Frequency × 0.25) +
  (Drop Consistency × 0.20)
```

**Where:**
- **Support Stability (30%):** `((total_days - break_days) / total_days) × 100`
- **Days Since Last Break (25%):** Normalized against typical gap frequency
- **Break Frequency (25%):** Average trading days between breaks, normalized against 200-day baseline
- **Drop Consistency (20%):** Consistency of drop sizes when breaks occur (lower variance = higher score)

**Normalization Formula:**
```
normalized = min(100, max(0, rawValue))
```
(No transformation - already 0-100 scale)

**Interpretation Guidelines:**
- **80-100:** Exceptional - support held reliably with very few breaks
- **70-79:** Strong - support held reliably with occasional breaks
- **50-69:** Moderate - support held well, some breaks occur
- **40-49:** Weak - support broken frequently or inconsistently
- **<40:** Very Weak - support unreliable, frequent/unpredictable breaks

**Usage in Narrative:**
- Score ≥ 70: "strong support robustness—historically held reliably with few breaks"
- Score 50-69: "moderate support robustness—held reasonably well with occasional breaks"
- Score < 50: "weak support robustness—broken frequently or inconsistently"

---

### Factor 3: Days Since Break (Raw: integer days → Normalized: 0-100)

**Definition:** Time elapsed since support level was last broken/tested

**Data Source:** `support_level_metrics.csv` field `days_since_last_break`

**Normalization Formula:**
```
avgGap = support_level_metrics.trading_days_per_break OR 30 (default)
ratio = days / avgGap
normalized = min(100, max(0, ratio * 50))
```

**Examples:**
- If `days = 60` and `avgGap = 30`:
  - ratio = 60 / 30 = 2.0
  - normalized = min(100, 2.0 × 50) = 100

- If `days = 15` and `avgGap = 30`:
  - ratio = 15 / 30 = 0.5
  - normalized = 0.5 × 50 = 25

- If `days = 30` and `avgGap = 30`:
  - ratio = 30 / 30 = 1.0
  - normalized = 1.0 × 50 = 50

**Interpretation:**
- >avgGap × 2 (often reaches 100) = Support has held much longer than typical
- ~avgGap (score ≈50) = Support held for typical duration
- <avgGap/2 (score <25) = Support recently tested

---

### Factor 4: Historical Peak (Raw: 0-1 scale → Normalized: 0-100)

**Definition:** Recovery candidate indicator based on whether probability peaked above threshold

**Data Sources:**
- `probability_history.csv` field `ProbWorthless_Bayesian_IsoCal` (highest probability ever recorded)
- Threshold parameter: 0.80, 0.90, or 0.95

**Normalization Formula:**
```
if (peakProbability < threshold):
  normalized = 30  // Penalty: peak never reached threshold

else:
  drop = peakProbability - currentProbability
  normalized = min(100, 50 + (drop * 200))
```

**Examples:**

1. **Peak below threshold (no recovery candidate):**
   - Historical peak: 0.75, Threshold: 0.90
   - Result: normalized = 30

2. **Peak above threshold with moderate drop:**
   - Historical peak: 0.92, Current: 0.85, Threshold: 0.90
   - drop = 0.92 - 0.85 = 0.07
   - normalized = 50 + (0.07 × 200) = 50 + 14 = 64

3. **Peak above threshold with large drop:**
   - Historical peak: 0.95, Current: 0.70, Threshold: 0.90
   - drop = 0.95 - 0.70 = 0.25
   - normalized = 50 + (0.25 × 200) = 50 + 50 = 100 (capped)

**Interpretation:**
- Score 80-100: Strong recovery candidate (peaked high, declined significantly)
- Score 50-79: Moderate recovery candidate (peaked above threshold)
- Score 30-49: Weak recovery candidate (peaked but not by much)
- Score <30: Not a recovery candidate (never peaked above threshold)

---

### Factor 5: Monthly Seasonality (Raw: 0-100% scale → Normalized: 0-100)

**Definition:** Historical percentage of positive months for the current calendar month

**Data Source:** `Stocks_Monthly_Data.csv`

**Fields:**
- `pct_pos_return_months` (0-100%) - % of historical months with positive returns
- `day_low_day_of_month` (1-31) - Typical day of month when lows occur
- Filtered by: `month = current_calendar_month` (1-12)

**Normalization Formula:**
```
score = positiveRate  // Already 0-100%

// Bonus if current date is near typical low day
if (currentDay is within 3 days of typicalLowDay):
  score += 10

normalized = min(100, score)
```

**Examples:**

1. **Typical case:**
   - Positive rate: 65%, Current day: 15, Typical low day: 10
   - Day diff = |15 - 10| = 5 days (not within 3 days)
   - normalized = 65

2. **Near typical low:**
   - Positive rate: 65%, Current day: 12, Typical low day: 10
   - Day diff = |12 - 10| = 2 days (within 3 days)
   - normalized = min(100, 65 + 10) = 75

3. **Very high positive rate:**
   - Positive rate: 95%, Current day: 15, Typical low day: 10
   - Day diff = 5 days (not within 3 days)
   - normalized = 95

**Interpretation:**
- 80-100: Very strong seasonal pattern (high % positive, possibly near typical low)
- 60-79: Good seasonal pattern
- 40-59: Moderate seasonal pattern
- <40: Weak seasonal pattern

---

### Factor 6: Current Performance (Raw: percentage → Normalized: 0-100)

**Definition:** Month-to-date performance compared to historical average for the current calendar month

**Data Sources:**
- Current month performance: `stock_data.csv` (price change from last trading day of previous month to today)
- Historical average: `Stocks_Monthly_Data.csv` field `return_month_mean_pct_return_month`

**Calculation:**
```
currentMonthPerformance = ((todayClose - previousMonthLastClose) / previousMonthLastClose) × 100

underperformance = historicalAvgReturn - currentMonthPerformance

normalized = min(100, max(0, 50 + (underperformance × 10)))
```

**Examples:**

1. **Strong underperformance (best case for put sellers):**
   - Historical avg: +2.5%, Current: -2.5%
   - underperformance = 2.5 - (-2.5) = 5%
   - normalized = 50 + (5 × 10) = 100

2. **Moderate underperformance:**
   - Historical avg: +3%, Current: +0.5%
   - underperformance = 3 - 0.5 = 2.5%
   - normalized = 50 + (2.5 × 10) = 75

3. **Neutral performance:**
   - Historical avg: +3%, Current: +3%
   - underperformance = 3 - 3 = 0%
   - normalized = 50 + (0 × 10) = 50

4. **Strong outperformance (worst case for put sellers):**
   - Historical avg: +3%, Current: +8%
   - underperformance = 3 - 8 = -5%
   - normalized = max(0, 50 + (-5 × 10)) = 0

**Why Underperformance Matters:**
1. **Mean Reversion:** Markets correct when stocks deviate from seasonal norms
2. **Valuation Opportunity:** Underperformance indicates potential oversold condition
3. **Lower Risk:** Stock already weak reduces further downside
4. **Better Probabilities:** Underperforming stocks more likely to expire worthless

**Interpretation:**
- Score 80-100: Stock significantly underperforming seasonal norms (strong opportunity)
- Score 50-79: Stock moderately underperforming or neutral
- Score 0-49: Stock outperforming seasonal norms (weaker opportunity)

---

## Normalization Formulas Summary Table

| Factor | Raw Value Range | Normalization Formula | Output Range |
|--------|-----------------|----------------------|--------------|
| Recovery Advantage | 0.0-1.0 (decimal) | `rawValue × 100` | 0-100 |
| Support Strength | 0-100 | `min(100, max(0, rawValue))` | 0-100 |
| Days Since Break | Integer | `min(100, max(0, (days/avgGap) × 50))` | 0-100 |
| Historical Peak | 0.0-1.0 (decimal) | If peak<threshold: 30, Else: `min(100, 50+(drop×200))` | 0-100 |
| Monthly Seasonality | 0-100 (%) | `min(100, positiveRate + bonus)` | 0-100 |
| Current Performance | -100 to +100 (%) | `min(100, max(0, 50+(underperf×10)))` | 0-100 |

---

## Composite Score Calculation

### Step 1: Auto-Normalize Weights

User-provided weights are automatically scaled to sum to 100%:

```python
def normalize_weights(weights):
    """
    Auto-normalize weights to 100% regardless of user input.

    Args:
        weights: dict with keys: supportStrength, daysSinceBreak, recoveryAdvantage,
                 historicalPeak, monthlySeasonality, currentPerformance

    Returns:
        dict: weights scaled to sum to 100%
    """
    total_weight = sum(weights.values())
    if total_weight == 0:
        return weights  # Edge case: all zero weights

    return {
        key: (value / total_weight) * 100
        for key, value in weights.items()
    }
```

**Example:**
```
User Input Weights:
  supportStrength: 20
  daysSinceBreak: 15
  recoveryAdvantage: 25
  historicalPeak: 15
  monthlySeasonality: 15
  currentPerformance: 10
  Total: 100

Normalized (same in this case):
  supportStrength: 20%
  daysSinceBreak: 15%
  recoveryAdvantage: 25%
  historicalPeak: 15%
  monthlySeasonality: 15%
  currentPerformance: 10%
```

**Another Example (User doesn't need to balance):**
```
User Input Weights:
  supportStrength: 20
  daysSinceBreak: 15
  recoveryAdvantage: 30
  historicalPeak: 15
  monthlySeasonality: 15
  currentPerformance: 5
  Total: 100 (user didn't need to balance)

Normalized (same):
  All weights: same values
```

**Third Example (Unbalanced input):**
```
User Input Weights:
  supportStrength: 20
  daysSinceBreak: 15
  recoveryAdvantage: 30
  historicalPeak: 20
  monthlySeasonality: 20
  currentPerformance: 10
  Total: 115

Normalized:
  supportStrength: (20/115) × 100 = 17.39%
  daysSinceBreak: (15/115) × 100 = 13.04%
  recoveryAdvantage: (30/115) × 100 = 26.09%
  historicalPeak: (20/115) × 100 = 17.39%
  monthlySeasonality: (20/115) × 100 = 17.39%
  currentPerformance: (10/115) × 100 = 8.70%
```

### Step 2: Calculate Weighted Score

```python
def calculate_composite_score(normalized_scores, normalized_weights):
    """
    Calculate composite score from 6 normalized factors.

    Args:
        normalized_scores: dict with keys: supportStrength, daysSinceBreak,
                          recoveryAdvantage, historicalPeak, monthlySeasonality,
                          currentPerformance (all 0-100 values)
        normalized_weights: dict with same keys (all values sum to 100)

    Returns:
        float: composite score 0-100
    """
    composite = (
        normalized_scores['supportStrength'] * (normalized_weights['supportStrength'] / 100) +
        normalized_scores['daysSinceBreak'] * (normalized_weights['daysSinceBreak'] / 100) +
        normalized_scores['recoveryAdvantage'] * (normalized_weights['recoveryAdvantage'] / 100) +
        normalized_scores['historicalPeak'] * (normalized_weights['historicalPeak'] / 100) +
        normalized_scores['monthlySeasonality'] * (normalized_weights['monthlySeasonality'] / 100) +
        normalized_scores['currentPerformance'] * (normalized_weights['currentPerformance'] / 100)
    )
    return composite
```

### Complete Example

```
Given:
- supportStrength normalized: 75
- daysSinceBreak normalized: 80
- recoveryAdvantage normalized: 78
- historicalPeak normalized: 70
- monthlySeasonality normalized: 65
- currentPerformance normalized: 60

With default weights (normalized to 100%):
- supportStrength: 20%
- daysSinceBreak: 15%
- recoveryAdvantage: 25%
- historicalPeak: 15%
- monthlySeasonality: 15%
- currentPerformance: 10%

Calculation:
  (75 × 0.20) = 15.0
  (80 × 0.15) = 12.0
  (78 × 0.25) = 19.5
  (70 × 0.15) = 10.5
  (65 × 0.15) = 9.75
  (60 × 0.10) = 6.0
  ────────────────
  Total         = 72.75

Composite Score: 72.75/100
```

### Score Color Coding

- **Green (≥70):** Strong recommendation
- **Yellow (50-69):** Moderate recommendation
- **Red (<50):** Weak recommendation

---

## Data Structure

### Input: RecommendationFilters

```python
class RecommendationFilters:
    expiryDate: str                    # ISO date (e.g., "2025-01-17")
    rollingPeriod: int                 # 30, 90, 180, 270, or 365 days
    minDaysSinceBreak: int            # Minimum stability threshold (days)
    probabilityMethod: str             # Field name from data (see mapping below)
    historicalPeakThreshold: float     # 0.80, 0.90, or 0.95
```

### Probability Method Field Mapping

| CSV Field Name | Display Name | Recovery Method Name |
|---|---|---|
| `ProbWorthless_Bayesian_IsoCal` | PoW - Bayesian Calibrated | `Bayesian Calibrated` |
| `1_2_3_ProbOfWorthless_Weighted` | PoW - Weighted Average | `Weighted Average` |
| `1_ProbOfWorthless_Original` | PoW - Original Black-Scholes | `Original Black-Scholes` |
| `2_ProbOfWorthless_Calibrated` | PoW - Bias Corrected | `Bias Corrected` |
| `3_ProbOfWorthless_Historical_IV` | PoW - Historical IV | `Historical IV` |

**Note:** Recovery data CSV uses normalized method names (without "PoW - " prefix as of Jan 2026)

### Input: ScoreWeights

```python
class ScoreWeights:
    supportStrength: float          # 0-100, default: 20
    daysSinceBreak: float           # 0-100, default: 15
    recoveryAdvantage: float        # 0-100, default: 25
    historicalPeak: float           # 0-100, default: 15
    monthlySeasonality: float       # 0-100, default: 15
    currentPerformance: float       # 0-100, default: 10
    # Note: Must sum to 100% (auto-normalized if not)
```

### Output: RecommendedOption

```python
class RecommendedOption:
    # Ranking
    rank: int

    # Identity
    optionName: str
    stockName: str
    strikePrice: float
    expiryDate: str
    daysToExpiry: int

    # Pricing
    currentPrice: float
    premium: float

    # Support Metrics
    rollingLow: float | None
    distanceToSupportPct: float | None
    daysSinceLastBreak: int | None
    supportStrengthScore: float | None
    patternType: str | None

    # Probability Metrics
    currentProbability: float        # 0-1 scale (e.g., 0.75 = 75%)
    historicalPeakProbability: float | None

    # Recovery Metrics
    recoveryAdvantage: float | None  # 0-1 scale
    currentProbBin: str              # "50-60%", "60-70%", etc.
    dteBin: str                      # "0-7", "8-14", "15-21", etc.

    # Monthly Metrics
    monthlyPositiveRate: float | None
    monthlyAvgReturn: float | None
    typicalLowDay: int | None
    currentMonthPerformance: float | None
    monthsInHistoricalData: int | None
    worstMonthDrawdown: float | None

    # Scoring
    compositeScore: float            # 0-100
    scoreBreakdown: ScoreBreakdown
```

### ScoreBreakdown

```python
class ScoreComponent:
    raw: float | None              # Original value
    normalized: float              # 0-100 normalized
    weighted: float                # normalized × (weight / 100)
    hasData: bool                  # Whether data was available
    dataStatus: str                # 'available', 'insufficient', 'unavailable'

class ScoreBreakdown:
    supportStrength: ScoreComponent
    daysSinceBreak: ScoreComponent
    recoveryAdvantage: ScoreComponent
    historicalPeak: ScoreComponent
    monthlySeasonality: ScoreComponent
    currentPerformance: ScoreComponent
```

---

## Default Weights

```python
DEFAULT_WEIGHTS = {
    'supportStrength': 20,          # 20%
    'daysSinceBreak': 15,           # 15%
    'recoveryAdvantage': 25,        # 25% (HIGHEST - research finding)
    'historicalPeak': 15,           # 15%
    'monthlySeasonality': 15,       # 15%
    'currentPerformance': 10,       # 10% (LOWEST - short-term indicator)
}
```

**Rationale:**
- **Recovery Advantage (25%):** Highest weight due to strong historical research showing 13-41pp advantage
- **Support Strength (20%):** Second highest - fundamental to strategy
- **Days Since Break (15%):** Medium-high - stability indicator
- **Historical Peak (15%):** Medium - recovery candidate indicator
- **Monthly Seasonality (15%):** Medium - longer-term seasonal pattern
- **Current Performance (10%):** Lowest - based on only days/weeks of data

---

## Implementation Steps

### Step 1: Load Data Sources

Required CSV files:
- `data.csv` - Options data with probability fields
- `support_level_metrics.csv` - Support level calculations by rolling period
- `probability_history.csv` - Historical probability peaks
- `recovery_report_data.csv` - Recovery candidate statistics
- `Stocks_Monthly_Data.csv` - Monthly statistics by stock and month
- `stock_data.csv` - Current stock prices and performance

### Step 2: Filter Options

Apply these filters in order:

```python
def filter_options(options, filters):
    """
    Filter options based on user criteria.
    """
    filtered = []

    for option in options:
        # Filter 1: Expiry date must match
        if option['ExpiryDate'] != filters['expiryDate']:
            continue

        # Filter 2: Get support metrics for rolling period
        support_metric = get_support_metrics(
            option['StockName'],
            filters['rollingPeriod']
        )
        if not support_metric:
            continue

        # Filter 3: Strike must be at or below rolling low
        if option['StrikePrice'] > support_metric['rolling_low']:
            continue

        # Filter 4: Days since break must exceed minimum
        if support_metric['days_since_last_break'] < filters['minDaysSinceBreak']:
            continue

        filtered.append(option)

    return filtered
```

### Step 3: Score Each Option

```python
def score_option(option, filters, support_metric, all_data_maps):
    """
    Calculate composite score for a single option.

    Returns: RecommendedOption with all scoring details
    """

    # Get current probability
    current_prob = option[filters['probabilityMethod']]

    # Get days to expiry (business days)
    days_to_expiry = calculate_business_days(
        from_date=date.today(),
        to_date=option['ExpiryDate']
    )

    # Get historical peak probability
    peak_prob = all_data_maps['probability_peaks'].get(
        option['OptionName']
    )

    # Calculate normalized scores
    support_strength_norm = normalize_support_strength(
        support_metric['support_strength_score']
    )

    days_since_break_norm = normalize_days_since_break(
        support_metric['days_since_last_break'],
        support_metric['trading_days_per_break']
    )

    recovery_advantage = lookup_recovery_rate(
        prob=current_prob,
        dte=days_to_expiry,
        threshold=filters['historicalPeakThreshold'],
        method=filters['probabilityMethod']
    )
    recovery_advantage_norm = normalize_recovery_advantage(
        recovery_advantage
    )

    historical_peak_norm = normalize_historical_peak(
        current_prob=current_prob,
        peak_prob=peak_prob,
        threshold=filters['historicalPeakThreshold']
    )

    monthly_data = all_data_maps['monthly_stats'].get(
        (option['StockName'], current_month)
    )
    seasonality_norm = normalize_seasonality(
        positive_rate=monthly_data['pct_pos_return_months'],
        current_day=date.today().day,
        typical_low_day=monthly_data['day_low_day_of_month']
    )

    stock_perf = all_data_maps['stock_performance'].get(
        option['StockName']
    )
    current_perf_norm = normalize_current_performance(
        current_month_pct=stock_perf['priceChangePercentMonth'],
        avg_month_pct=monthly_data['return_month_mean_pct_return_month']
    )

    # Create score breakdown
    score_breakdown = {
        'supportStrength': {
            'raw': support_metric['support_strength_score'],
            'normalized': support_strength_norm,
            'weighted': support_strength_norm * (weights['supportStrength'] / 100)
        },
        # ... repeat for other factors
    }

    # Calculate composite score
    composite_score = sum(
        component['weighted']
        for component in score_breakdown.values()
    )

    return RecommendedOption(
        rank=0,  # Will be set after sorting
        optionName=option['OptionName'],
        stockName=option['StockName'],
        strikePrice=option['StrikePrice'],
        currentPrice=support_metric['current_price'],
        expiryDate=option['ExpiryDate'],
        daysToExpiry=days_to_expiry,
        premium=option['Premium'],
        # ... other fields
        compositeScore=composite_score,
        scoreBreakdown=score_breakdown
    )
```

### Step 4: Sort and Rank

```python
def finalize_recommendations(scored_options):
    """
    Sort by composite score and assign ranks.
    """
    # Sort descending by composite score
    sorted_options = sorted(
        scored_options,
        key=lambda x: x.compositeScore,
        reverse=True
    )

    # Assign ranks
    for idx, option in enumerate(sorted_options):
        option.rank = idx + 1

    return sorted_options
```

---

## Edge Cases & Missing Data

### Binning Functions

**Probability Binning:**
```python
def get_probability_bin(probability: float) -> str:
    """
    Bin probability values for recovery data lookup.
    Range: 0.0-1.0 scale
    """
    if probability < 0.5:
        return '<50%'
    elif probability < 0.6:
        return '50-60%'
    elif probability < 0.7:
        return '60-70%'
    elif probability < 0.8:
        return '70-80%'
    elif probability < 0.9:
        return '80-90%'
    else:
        return '90%+'
```

**DTE Binning (Business Days Only):**
```python
def get_dte_bin(days_to_expiry: int) -> str:
    """
    Bin business days to expiry for recovery data lookup.
    Note: Uses business days only (weekdays + Swedish holidays excluded)
    """
    if days_to_expiry <= 7:
        return '0-7'
    elif days_to_expiry <= 14:
        return '8-14'
    elif days_to_expiry <= 21:
        return '15-21'
    elif days_to_expiry <= 28:
        return '22-28'
    elif days_to_expiry <= 35:
        return '29-35'
    else:
        return '36+'
```

### Missing Data Handling

| Situation | Handling |
|-----------|----------|
| No support metrics for stock | Option filtered out (not included in results) |
| Probability history missing | Historical peak = None, normalized = 0 |
| Recovery data missing for bin | Recovery advantage = None, normalized = 0 |
| Monthly stats missing | Monthly metrics = None, normalized = 0 |
| Stock price data missing | Current performance = None, normalized = 0 |
| Zero weight on factor | Factor marked as "Not Included", contributes 0 points |

### Recovery Data Lookup

Recovery data is hierarchically organized:

```
recoveryData[threshold][method][probBin][dteBin]
  = {
      recovery_candidate_n: int,
      recovery_candidate_rate: float (0-1),
      baseline_n: int,
      baseline_rate: float (0-1) | None,
      advantage: float | None
    }
```

**Example Lookup:**
```python
threshold = "0.90"  # 90% historical peak threshold
method = "Bayesian Calibrated"  # From probability method mapping
prob_bin = "60-70%"  # Current probability
dte_bin = "15-21"   # Days to expiry

recovery_point = recovery_data[threshold][method][prob_bin][dte_bin]
recovery_rate = recovery_point['recovery_candidate_rate']  # e.g., 0.785
```

### Probability Method Normalization

If CSV contains old format (with "PoW - " prefix), normalize it:

```python
def normalize_prob_method(method_name: str) -> str:
    """
    Normalize probability method names from CSV.
    Converts old format with "PoW - " prefix to new format.
    """
    # Remove old prefix if present
    if method_name.startswith('PoW - '):
        return method_name.replace('PoW - ', '')
    return method_name

# Mapping from field names to normalized recovery method names
method_map = {
    'ProbWorthless_Bayesian_IsoCal': 'Bayesian Calibrated',
    '1_2_3_ProbOfWorthless_Weighted': 'Weighted Average',
    '1_ProbOfWorthless_Original': 'Original Black-Scholes',
    '2_ProbOfWorthless_Calibrated': 'Bias Corrected',
    '3_ProbOfWorthless_Historical_IV': 'Historical IV',
}

recovery_method = method_map[field_name]
```

---

## Original TypeScript Implementation

The complete original implementation is available in the codebase:

### Main Scoring Hook
**File:** `src/hooks/useAutomatedRecommendations.ts`
- All 6 normalization functions (lines 48-216)
- Weight auto-normalization (lines 65-74 in AutomatedRecommendations.tsx)
- Composite score calculation (lines 485-492)
- Recovery data lookup (lines 348-400)
- Probability bin and DTE bin functions (lines 17-33)

### Type Definitions
**File:** `src/types/recommendations.ts`
- ScoreComponent interface (lines 18-24)
- ScoreBreakdown interface (lines 26-33)
- RecommendedOption interface (lines 35-76)
- RecommendationFilters interface (lines 1-7)
- ScoreWeights interface (lines 9-16)
- DEFAULT_FILTERS and DEFAULT_WEIGHTS (lines 78-93)

### Page Component
**File:** `src/pages/AutomatedRecommendations.tsx`
- Weight auto-normalization implementation (lines 65-76)
- Weight slider configuration (lines 173-263)
- KPI calculations (lines 107-113)

### Supporting Components
**File:** `src/components/recommendations/ScoreBreakdown.tsx`
- Score breakdown display with raw and normalized values
- Visual representation of weighted contributions

**File:** `src/components/recommendations/OptionExplanation.tsx`
- Narrative explanation generation (see lines 18-193 for business logic)

### Supporting Hooks
**File:** `src/hooks/useProbabilityRecoveryData.ts`
- Recovery data loading and hierarchical structure building (lines 26-76)

---

## Quick Reference for Implementation

### 1. Data Structure Lookup Order
```
Recovery Data Lookup:
recoveryData[threshold][method][probBin][dteBin]
  → recovery_candidate_rate (0-1 scale)
  → recovery_candidate_n
  → baseline_rate
  → baseline_n

Example:
threshold = "0.90"
method = "Bayesian Calibrated" (mapped from CSV field name)
probBin = "60-70%"
dteBin = "15-21"
```

### 2. Probability Method Mapping
```
CSV Field → Recovery Data Method Name
ProbWorthless_Bayesian_IsoCal → Bayesian Calibrated
1_2_3_ProbOfWorthless_Weighted → Weighted Average
1_ProbOfWorthless_Original → Original Black-Scholes
2_ProbOfWorthless_Calibrated → Bias Corrected
3_ProbOfWorthless_Historical_IV → Historical IV
```

### 3. Filtering Pipeline
1. Match expiry date
2. Get support metrics for rolling period
3. Check strike ≤ rolling low
4. Check days since break ≥ minimum
5. Score remaining options

### 4. Normalization Order
Apply these normalization functions to raw values:
1. Support Strength: `min(100, max(0, rawScore))`
2. Days Since Break: `min(100, max(0, (days/avgGap) × 50))`
3. Recovery Advantage: `min(100, max(0, rawRate × 100))`
4. Historical Peak: `if(peak<threshold) 30 else min(100, 50+(drop×200))`
5. Monthly Seasonality: `min(100, positiveRate + bonus)`
6. Current Performance: `min(100, max(0, 50+(underperf×10)))`

### 5. Composite Score Calculation
```
For each option:
  normalized_weights = normalize_to_100_percent(user_weights)

  composite_score = Σ (
    normalized_factor[i] × (normalized_weights[i] / 100)
  ) for i in [1..6]
```

---

## Files Used

| File | Purpose |
|------|---------|
| `data.csv` | Options data with probability methods |
| `support_level_metrics.csv` | Support metrics by rolling period |
| `probability_history.csv` | Historical probability peaks |
| `recovery_report_data.csv` | Recovery candidate statistics |
| `Stocks_Monthly_Data.csv` | Monthly seasonality data |
| `stock_data.csv` | Current stock prices and performance |

---

## Questions?

For questions about this algorithm, refer to:
- **Web UI Implementation:** `/src/hooks/useAutomatedRecommendations.ts`
- **Complete Documentation:** `docs/recommendations.md`
- **Type Definitions:** `/src/types/recommendations.ts`

This document provides everything needed to replicate the exact scoring in Python for backtesting purposes.
