# Option Recommendations

**Route:** `/recommendations`
**Component:** `AutomatedRecommendations.tsx`
**Navigation:** Method Validation → Option Recommendations

---

## Overview

The Option Recommendations page automates the investor workflow by combining six analysis factors into a single composite score. This feature helps identify optimal put option writing opportunities by integrating:

1. **Support Level Analysis** - Rolling low support levels and break patterns
2. **Probability Recovery** - Statistical advantage from historical probability peaks
3. **Monthly Seasonality** - Historical performance patterns
4. **Current Performance Context** - Underperformance vs historical averages
5. **Support Strength** - Pre-calculated robustness metrics
6. **Days Since Last Break** - Support level stability

---

## User Workflow

### 1. Configure Filters

**Expiry Date** - Select option expiration date
**Rolling Low Period** - 30, 90, 180, 270, or 365 days
**Min Days Since Last Break** - Minimum stability threshold (default: 10)
**Probability Method** - Which probability calculation to use (default: Bayesian Calibrated)
**Historical Peak Threshold** - 80%, 90%, or 95% for recovery analysis

### 2. Adjust Score Weights (Optional)

Click "Score Weights Configuration" to customize factor importance:

| Factor | Default Weight | Description |
|--------|----------------|-------------|
| Recovery Advantage | 25% | Statistical advantage from probability recovery |
| Support Strength | 20% | Pre-calculated support level robustness |
| Days Since Break | 15% | Time since support was last broken |
| Historical Peak | 15% | Recovery candidate indicator |
| Monthly Seasonality | 15% | Historical % of positive months |
| Current Performance | 10% | Underperformance suggests bounce potential |

Total must equal 100%.

### 3. Click "Analyze"

The system will:
- Filter options matching criteria
- Calculate composite scores
- Rank results from highest to lowest score
- Display recommendations in sortable table

### 4. Review Results

**Table Columns:**
- Rank, Stock Name, Option Name
- Strike Price, Current Price, Support Level
- Distance to Support %, Days Since Last Break
- Current PoW, Historical Peak PoW
- Recovery Advantage (pp)
- Monthly % Positive, Current Month Performance
- Support Strength Score, Pattern Type
- Premium, **Composite Score** (color-coded)

**Expandable Details:**
Click chevron to see score breakdown showing:
- Raw values for each factor
- Normalized scores (0-100)
- Weighted contributions to composite score
- Visual progress bars

---

## Scoring Methodology

### Score Normalization (0-100 scale)

Each factor is normalized before weighting:

#### 1. Support Strength (Already 0-100)
- Source: `support_strength_score` from `support_level_metrics.csv`
- Used directly without transformation

#### 2. Days Since Break
```
normalized = min(100, max(0, (days / avgGap) * 50))
```
- Ratio to typical gap between breaks
- Higher = more robust support

#### 3. Recovery Advantage
```
normalized = min(100, max(0, 50 + (advantage_pp * 1.67)))
```
- Advantage_pp typically ranges -10 to +50
- 0pp = 50 score, +30pp = 100, -10pp = 0

#### 4. Historical Peak
```
if (peak < threshold): return 30
drop = peak - current
normalized = min(100, 50 + (drop * 200))
```
- Bonus if option previously hit threshold (90%+) AND current probability is lower
- 10%+ drop from 90%+ peak = strong recovery candidate

#### 5. Monthly Seasonality
```
normalized = positiveRate  // Already 0-100%
if (currentDay near typicalLowDay): normalized += 10
```
- Base: % of positive months for current calendar month
- Bonus: If current day is within 3 days of typical monthly low

#### 6. Current Performance
```
underperformance = avgMonth - currentMonth
normalized = min(100, max(0, 50 + (underperformance * 10)))
```
- Higher score if stock is underperforming (potential bounce)
- 5%+ underperformance = 100 score

### Composite Score Calculation

```
compositeScore = Σ (normalizedMetric * weight / 100)
```

Example:
- Support Strength: 75 (normalized) × 0.20 = 15.0
- Days Since Break: 80 × 0.15 = 12.0
- Recovery Advantage: 90 × 0.25 = 22.5
- Historical Peak: 70 × 0.15 = 10.5
- Monthly Seasonality: 65 × 0.15 = 9.75
- Current Performance: 60 × 0.10 = 6.0
- **Total: 75.75**

---

## Data Sources

### CSV Files Used
1. **data.csv** - Options data (premium, strike, expiry)
2. **support_level_metrics.csv** - Pre-calculated support metrics
3. **probability_history.csv** - Historical probability peaks
4. **recovery_report_data.csv** - Recovery advantage statistics
5. **Stocks_Monthly_Data.csv** - Monthly seasonality patterns
6. **stock_data.csv** - Current stock prices and performance

### Hooks Composed
- `useEnrichedOptionsData` - Options with margin/IV data
- `useSupportLevelMetrics` - Support level analysis
- `useProbabilityHistory` - Probability peaks
- `useProbabilityRecoveryData` - Recovery statistics
- `useMonthlyStockData` - Monthly patterns
- `useStockData` - Current stock performance

---

## Features

### Filtering
- **Strike Position:** Only includes options with strike at or below support level
- **Days Since Break:** Filters out recently broken support levels
- **Expiry Date:** Single expiry date per analysis

### Sorting
- Click any column header to sort
- Default: Composite score descending (highest first)
- Maintains rank numbers after sorting

### Expandable Rows
- Click chevron to view detailed score breakdown
- See raw values, normalized scores, and weighted contributions
- Visual progress bars for each factor

### Color Coding
- **Composite Score:**
  - Green: ≥70 (Strong recommendation)
  - Yellow: 50-69 (Moderate)
  - Red: <50 (Weak)
- **Pattern Type:**
  - Green: never_breaks
  - Blue: exhausted_cascade
  - Red: volatile
  - Gray: other patterns

### Links
- Stock names → Open stock details in new tab
- Option names → Open option details in new tab

---

## Performance Optimization

### Data Loading
- All CSV files loaded once via singleton hooks
- Parallel loading (no sequential dependencies)
- Cached between page visits

### Computation
- Pre-built lookup Maps for O(1) access
- Filtering before scoring reduces dataset
- Memoized calculations with `useMemo`
- On-demand analysis (user clicks "Analyze")

### UI Responsiveness
- Sorting is client-side (instant)
- Table scrollable horizontally
- Progress bars animated

---

## Implementation Files

| File | Purpose |
|------|---------|
| `/src/pages/AutomatedRecommendations.tsx` | Main page component |
| `/src/hooks/useAutomatedRecommendations.ts` | Orchestration hook with scoring logic |
| `/src/types/recommendations.ts` | TypeScript interfaces |
| `/src/components/recommendations/RecommendationFilters.tsx` | Filter controls |
| `/src/components/recommendations/RecommendationsTable.tsx` | Results table with sorting |
| `/src/components/recommendations/ScoreBreakdown.tsx` | Expandable score details |

---

## Use Cases

### 1. Finding Recovery Candidates
Set **Historical Peak Threshold** to 90% to find options that previously had high probabilities but have since declined. These may be undervalued by the market.

### 2. Strong Support Levels
Set **Min Days Since Break** to 30+ and **Rolling Low Period** to 365 to find stocks with robust yearly support levels.

### 3. Seasonal Opportunities
During months like January, analyze stocks with high historical positive rates to capitalize on seasonal patterns.

### 4. Conservative Weighting
Increase **Support Strength** and **Days Since Break** weights for more conservative recommendations focused on stability.

### 5. Aggressive Weighting
Increase **Recovery Advantage** and **Historical Peak** weights to find higher-risk, higher-reward opportunities.

---

## Business Rationale

This feature automates the manual workflow described by an investor who successfully:
1. Identified Evolution AB using Support Level Options List
2. Verified support robustness via Support Level Analysis (8 clusters, 7-day avg gap, 25 days since break)
3. Found probability peaks in option history (93.6%, 96.1%)
4. Confirmed recovery advantage (81.5% vs 44.2% baseline)
5. Validated monthly seasonality (60% positive, avg +1.98%, typical low day 2)
6. Checked current performance (-1.91% for January)

By combining all factors into a composite score, investors can:
- **Save Time:** One analysis vs six manual steps
- **Find Opportunities:** Discover options matching complex criteria
- **Reduce Bias:** Systematic scoring vs subjective judgment
- **Compare Options:** Rank all candidates on consistent scale
- **Customize:** Adjust weights to match risk tolerance

---

## Future Enhancements

Potential improvements:
- Save/load custom weight profiles
- Historical backtest of scoring accuracy
- Alert notifications for high-scoring new opportunities
- Export recommendations to CSV
- Additional factors (IV rank, volume, open interest)
- Machine learning weight optimization
