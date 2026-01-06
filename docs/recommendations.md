# Option Recommendations

**Route:** `/recommendations`
**Component:** `AutomatedRecommendations.tsx`
**Navigation:** Method Validation → Option Recommendations

---

## Overview

The Option Recommendations page automates the investor workflow by combining six analysis factors into a single composite score. This feature helps identify optimal put option writing opportunities by integrating:

1. **Support Level Analysis** - Rolling low support levels and break patterns
2. **Probability Recovery** - Historical worthless rate for recovery candidates
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
**Historical Peak Threshold** - 80%, 90%, or 95% for recovery analysis (determines which recovery data is queried)

### 2. Adjust Score Weights (Optional)

Click "Score Weights Configuration" to customize factor importance:

| Factor | Default Weight | Description |
|--------|----------------|-------------|
| Recovery Rate | 25% | Historical worthless rate for recovery candidates |
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
- **Rank, Stock Name, Option Name** - Option identity and ranking
- **Strike Price, Current Price, Support Level** - Price levels
- **Distance to Support %, Days Since Last Break** - Support proximity and stability
- **Current PoW, Historical Peak PoW** - Current and peak probabilities
- **Recovery Rate %** - Historical worthless rate for recovery candidates (0-100%)
- **Monthly % Positive, Current Month Performance** - Seasonality metrics
- **Strength** - Support strength robustness score
- **Premium, Composite Score** - Option value and final recommendation score (color-coded)

**Expandable Details:**
Click chevron to expand and see two panels side-by-side:

1. **Score Breakdown (Left Panel)**
   - Raw values for each factor
   - Normalized scores (0-100)
   - Weighted contributions to composite score
   - Visual progress bars for each factor

2. **Why This Option Was Recommended (Right Panel)**
   - Personalized narrative explanation of the recommendation rationale
   - Detailed context for all 6 scoring factors in readable narrative form
   - Shows how each factor (support level, recovery opportunity, seasonality, etc.) contributed to the recommendation
   - Helps investors understand the "why" behind the automated analysis

---

## Scoring Methodology

### Score Normalization (0-100 scale)

Each factor is normalized before weighting:

#### 1. Support Strength (Already 0-100)
- Source: `support_strength_score` from `support_level_metrics.csv`
- Used directly without transformation
- Higher score = more robust support level

#### 2. Days Since Break
```
normalized = min(100, max(0, (days / avgGap) * 50))
```
- Ratio to typical gap between breaks
- Higher = more robust support
- Cap at 100 for very stable supports

#### 3. Recovery Rate
```
normalized = min(100, max(0, recovery_rate * 100))
```
- Recovery rate is 0-1 (e.g., 0.785 = 78.5% historical worthless rate)
- Directly converted to 0-100 scale
- Higher rate = stronger recovery candidate

#### 4. Historical Peak
```
if (peak < threshold): return 30
drop = peak - current
normalized = min(100, 50 + (drop * 200))
```
- Bonus if option previously hit threshold AND current probability is lower
- 10%+ drop from high peak = strong recovery candidate
- Penalty if peak never reached threshold

#### 5. Monthly Seasonality
```
normalized = positiveRate  // Already 0-100%
if (currentDay near typicalLowDay): normalized += 10
```
- Base: % of positive months for current calendar month
- Bonus: If current day is within 3 days of typical monthly low
- Cap at 100

#### 6. Current Performance
```
underperformance = avgMonth - currentMonth
normalized = min(100, max(0, 50 + (underperformance * 10)))
```
- Higher score if stock is underperforming (potential bounce)
- 5%+ underperformance = 100 score
- 5%+ outperformance = 0 score

### Composite Score Calculation

```
compositeScore = Σ (normalizedMetric * weight / 100)
```

Example:
- Support Strength: 75 (normalized) × 0.20 = 15.0
- Days Since Break: 80 × 0.15 = 12.0
- Recovery Rate: 78 × 0.25 = 19.5
- Historical Peak: 70 × 0.15 = 10.5
- Monthly Seasonality: 65 × 0.15 = 9.75
- Current Performance: 60 × 0.10 = 6.0
- **Total: 72.75**

### Score Color Coding

- **Green (≥70):** Strong recommendation
- **Yellow (50-69):** Moderate recommendation
- **Red (<50):** Weak recommendation

---

## Data Sources

### CSV Files Used
1. **data.csv** - Options data (premium, strike, expiry, probability methods)
2. **support_level_metrics.csv** - Pre-calculated support metrics and strength scores
3. **probability_history.csv** - Historical probability peaks for each option
4. **recovery_report_data.csv** - Historical worthless rates for recovery candidates
5. **Stocks_Monthly_Data.csv** - Monthly seasonality patterns and statistics
6. **stock_data.csv** - Current stock prices and performance metrics

### Data Hooks Composed
- `useEnrichedOptionsData` - Options with margin/IV enrichment
- `useSupportLevelMetrics` - Support level analysis by rolling period
- `useProbabilityHistory` - Probability peaks from history
- `useProbabilityRecoveryData` - Recovery rates organized by threshold/method/probability/DTE
- `useMonthlyStockData` - Monthly statistics by stock and month
- `useStockData` - Current stock summary and performance

---

## Features

### Filtering
- **Strike Position:** Only includes options with strike at or below rolling low support level
- **Days Since Break:** Filters out recently broken support levels
- **Expiry Date:** Single expiry date per analysis
- **Probability Method:** Affects which historical peaks and recovery data are queried

### Sorting
- Click any column header to sort ascending/descending
- Default sort: Composite score descending (highest first)
- Ranks automatically adjust (always show 1, 2, 3, etc.)
- Supports multi-column sorting (each header toggles independently)

### Expandable Row Details
- Click chevron to view detailed score breakdown
- Shows raw value, normalized score (0-100), and weighted contribution for each of 6 factors
- Visual progress bars represent normalized scores
- Displays composite score at top of breakdown

### Interactive Links
- Stock names → Open stock details page in new tab
- Option names → Open option detail page in new tab

---

## Implementation Files

| File | Purpose |
|------|---------|
| `/src/pages/AutomatedRecommendations.tsx` | Main page component with filters, weights, table, and KPI cards |
| `/src/hooks/useAutomatedRecommendations.ts` | Orchestration hook with all scoring logic and data composition |
| `/src/hooks/useProbabilityRecoveryData.ts` | Loads recovery_report_data.csv and builds hierarchical data structure |
| `/src/hooks/useProbabilityHistory.ts` | Loads probability_history.csv for peak detection |
| `/src/types/recommendations.ts` | TypeScript interfaces for filters, weights, and results |
| `/src/components/recommendations/RecommendationFilters.tsx` | Filter dropdown and number input controls |
| `/src/components/recommendations/RecommendationsTable.tsx` | Sortable results table with expandable rows |
| `/src/components/recommendations/ScoreBreakdown.tsx` | Expandable detail view showing per-factor numeric breakdown |
| `/src/components/recommendations/OptionExplanation.tsx` | **NEW** - Generates personalized narrative explanation for each option |

---

## Option Explanation Feature

The **"Why This Option Was Recommended"** panel provides a detailed, personalized narrative explanation for each recommended option. When you expand a row by clicking the chevron, the right panel generates a comprehensive narrative structured around the 6 scoring factors.

### What the Explanation Includes

The narrative is standardized but personalized with each option's specific values and context:

1. **Support Level Discovery**
   - Strike price position relative to rolling low support
   - Distance to support percentage and current price
   - How the rolling low period (30/90/180/270/365 days) establishes support

2. **Support Robustness**
   - Days since last support break vs minimum threshold
   - Support strength score (0-100) with interpretation
   - Commentary on stability period (brief vs extended)

3. **Probability History & Recovery**
   - Historical peak probability found (with specific percentages)
   - Whether peak exceeds the selected threshold (80%/90%/95%)
   - Current probability and magnitude of decline from peak
   - Identification of recovery opportunity if applicable

4. **Recovery Advantage**
   - Historical worthless rate (%) for similar recovery candidates
   - Context: probability bin and days-to-expiry bin used for lookup
   - Interpretation of the rate (high/moderate/low)

5. **Monthly Seasonality**
   - Percentage of positive months during current calendar month
   - Typical monthly low day compared to current date
   - Average historical return for the month
   - Note if current date is near typical low day

6. **Current Performance**
   - Current month performance vs historical average
   - Whether stock is underperforming or outperforming
   - Commentary on potential for recovery/consolidation

7. **Composite Score Conclusion**
   - Overall score (0-100) with interpretation (strong/moderate/weak)
   - Summary of how multiple factors aligned

8. **Final Recommendation**
   - Strike price, premium, and expiry summary
   - Overall recommendation strength
   - Actionable guidance for investor decision-making

### Implementation

**Component:** `OptionExplanation.tsx` (React functional component)

**Props:**
```typescript
interface OptionExplanationProps {
  option: RecommendedOption;           // Full option data with all metrics
  filters: {
    rollingPeriod: number;             // 30/90/180/270/365
    minDaysSinceBreak: number;         // Minimum stability threshold
    probabilityMethod: string;         // Selected probability method
    historicalPeakThreshold: number;   // 0.80/0.90/0.95
  };
}
```

**Behavior:**
- Generates narrative sections dynamically based on available data
- Uses null-coalescing to handle missing metrics gracefully
- Converts numeric values to readable percentages and text
- Applies conditional logic to provide context-appropriate commentary
- Renders with bold headers for section titles

**Integration:**
- Displayed alongside ScoreBreakdown in 2-column grid (1-column on mobile)
- Only visible when user expands row
- Updates automatically if row data changes

### User Experience

When user clicks chevron to expand recommendation:
- **Left side:** Score Breakdown (numeric, factor-by-factor)
- **Right side:** Option Explanation (narrative, context-rich story)
- Both panels update with the same option data
- Mobile view stacks panels vertically for readability

This design helps investors understand not just the "what" (the score) but the "why" (the narrative explanation).

---

## Use Cases

### 1. Finding Recovery Candidates
Set **Historical Peak Threshold** to 90% to find options that previously had high probabilities but have since declined. These may be undervalued by the market. Look for high Recovery Rate % values.

### 2. Strong Support Levels
Set **Min Days Since Break** to 30+ and **Rolling Low Period** to 365 to find stocks with robust yearly support levels. Filter by high Strength scores.

### 3. Seasonal Opportunities
During months historically showing high positive rates, analyze stocks with high monthly % positive to capitalize on seasonal patterns.

### 4. Conservative Weighting
Increase **Support Strength** and **Days Since Break** weights for more conservative recommendations focused on stability over recovery potential.

### 5. Aggressive Weighting
Increase **Recovery Rate** and **Historical Peak** weights to find higher-probability recovery opportunities that may offer better risk/reward.

---

## Business Rationale

This feature automates the manual workflow of analyzing multiple factors:

1. **Support Level Analysis** - Identifies stocks with stable support levels
2. **Historical Peaks** - Finds options that previously had high probabilities
3. **Recovery Opportunity** - Quantifies how often similar recovery candidates actually succeeded
4. **Monthly Patterns** - Incorporates seasonal trading patterns
5. **Current Context** - Factors in current underperformance relative to history
6. **Support Robustness** - Evaluates break history and pattern consistency

By combining all factors into a single composite score, investors can:
- **Save Time:** One analysis replaces multiple manual steps
- **Find Opportunities:** Discover options matching complex multi-factor criteria
- **Reduce Bias:** Systematic scoring vs subjective judgment
- **Compare Options:** Rank all candidates on consistent 0-100 scale
- **Customize:** Adjust weights to match personal risk tolerance

---

## Data Structure Reference

### TypeScript Interfaces

**RecommendationFilters** (user input):
```typescript
interface RecommendationFilters {
  expiryDate: string;                      // ISO date (e.g., "2025-01-17")
  rollingPeriod: number;                   // 30 | 90 | 180 | 270 | 365
  minDaysSinceBreak: number;               // days (default: 10)
  probabilityMethod: string;               // Field name from probability_history.csv
  historicalPeakThreshold: number;         // 0.80 | 0.90 | 0.95
}
```

**ScoreWeights** (default: 100 total):
```typescript
interface ScoreWeights {
  supportStrength: number;          // 20 (%)
  daysSinceBreak: number;           // 15 (%)
  recoveryAdvantage: number;        // 25 (%)
  historicalPeak: number;           // 15 (%)
  monthlySeasonality: number;       // 15 (%)
  currentPerformance: number;       // 10 (%)
}
```

**RecommendedOption** (output):
```typescript
interface RecommendedOption {
  // Ranking
  rank: number;

  // Option/Stock identity
  optionName: string;
  stockName: string;
  strikePrice: number;
  expiryDate: string;
  daysToExpiry: number;

  // Pricing
  currentPrice: number;
  premium: number;

  // Support metrics
  rollingLow: number | null;
  distanceToSupportPct: number | null;
  daysSinceLastBreak: number | null;
  supportStrengthScore: number | null;
  patternType: string | null;  // Not displayed in table, stored for potential future use

  // Probability metrics
  currentProbability: number;
  historicalPeakProbability: number | null;
  currentProbBin: string;    // Calculated bin for recovery lookup (e.g., "50-60%")
  dteBin: string;            // Calculated DTE bin for recovery lookup (e.g., "15-21")

  // Recovery analysis
  recoveryAdvantage: number | null;  // 0-1 scale (e.g., 0.785 = 78.5% worthless rate)

  // Monthly analysis
  monthlyPositiveRate: number | null;
  monthlyAvgReturn: number | null;
  typicalLowDay: number | null;
  currentMonthPerformance: number | null;

  // Scoring
  compositeScore: number;
  scoreBreakdown: ScoreBreakdown;
}
```

**ScoreBreakdown** (per-factor detail):
```typescript
interface ScoreBreakdown {
  supportStrength: ScoreComponent;
  daysSinceBreak: ScoreComponent;
  recoveryAdvantage: ScoreComponent;
  historicalPeak: ScoreComponent;
  monthlySeasonality: ScoreComponent;
  currentPerformance: ScoreComponent;
}

interface ScoreComponent {
  raw: number | null;          // Original value (varies by factor)
  normalized: number;          // 0-100 normalized score
  weighted: number;            // normalized × weight%
}
```

### Recovery Data Structure

Built in `useProbabilityRecoveryData.ts`, organized by threshold, method, probability bin, and DTE bin:

```
chartData = {
  "0.90": {                              // Historical Peak Threshold
    "PoW - Bayesian Calibrated": {      // Probability Method
      "50-60%": {                        // Current Probability Bin
        "15-21": {                       // DTE Bin (Days to Expiry)
          recovery_candidate_n: 1245,
          recovery_candidate_rate: 0.785,   // ← 78.5% historical worthless rate
          baseline_n: 3420,
          baseline_rate: 0.542,
          advantage: 24.3                   // Legacy field (no longer used)
        }
      }
    }
  }
}
```

---

## API Reference

### Main Hook: `useAutomatedRecommendations`

**Location**: `/src/hooks/useAutomatedRecommendations.ts`

**Returns**:
```typescript
{
  analyzeOptions: (filters: RecommendationFilters, weights: ScoreWeights) => RecommendedOption[],
  isLoading: boolean
}
```

**Parameters**:
- `filters: RecommendationFilters` - User-selected filter criteria
- `weights: ScoreWeights` - Scoring weights (must sum to 100)

**Behavior**:
- Filters options by expiry date, rolling period, days since break
- Excludes options where strike > rolling low
- Composes data from 6 hooks (options, support, history, recovery, monthly, stock)
- Calculates composite score for each filtered option
- Returns array sorted by composite score (descending)

### Component: `RecommendationFilters`

**Location**: `/src/components/recommendations/RecommendationFilters.tsx`

**Controls Rendered**:
- Expiry Date dropdown (from available expirations)
- Rolling Low Period dropdown (30, 90, 180, 270, 365)
- Min Days Since Last Break input (number field)
- Probability Method dropdown (5 methods)
- Historical Peak Threshold dropdown (80%, 90%, 95%)
- Analyze button (disabled if no expiry date selected or analysis in progress)

### Component: `RecommendationsTable`

**Location**: `/src/components/recommendations/RecommendationsTable.tsx`

**Features**:
- All columns sortable (click header to toggle asc/desc)
- Expandable rows (click chevron for score breakdown)
- Color-coded composite scores (green ≥70, yellow 50-69, red <50)
- Clickable stock/option names (opens detail pages in new tab)
- Horizontal scrolling for wide tables

**Columns** (17 total):
Rank, Stock, Option, Strike, Current Price, Support Level, Distance %, Days Since, Current PoW, Peak PoW, Recovery Rate %, Monthly %, Curr Month %, Strength, Premium, Score

### Component: `ScoreBreakdown`

**Location**: `/src/components/recommendations/ScoreBreakdown.tsx`

**Displays for each of 6 factors**:
- Factor name and description
- Raw value from data
- Normalized score (0-100)
- Weighted contribution to composite
- Visual progress bar representation

---

## Edge Cases & Limitations

### Data Availability

| Situation | Behavior | Display |
|-----------|----------|---------|
| No options match filters | Empty table with message | N/A |
| Probability history missing for option | Peak PoW unavailable | "-" |
| Recovery data missing for probability bin | Recovery rate unavailable | "-" |
| Monthly stats missing for stock | Monthly metrics unavailable | "-" |
| Current stock data unavailable | Current performance unavailable | "-" |
| Support metrics not calculated | Option filtered out | Not included in results |

### Constraints

1. **One Expiry Date Per Analysis** - Must select exactly one expiry date to analyze
2. **Strike Must Be At/Below Rolling Low** - Options with strike > rolling low are filtered out
3. **Days Since Break Filter** - Options with fewer days since break than minimum are excluded
4. **Weight Total** - Score weights must sum to exactly 100% (enforced by UI)
5. **Historical Peak Threshold** - Only affects which recovery data is queried, not filtering
6. **Probability Method** - Single method per analysis (not compared across methods)

### Missing Data Handling

- **Graceful Fallback**: Any missing metric scores as neutral (50 normalized)
- **No Option Exclusion**: Missing data doesn't exclude options (unless support metrics missing)
- **Display Consistency**: "-" indicates unavailable data in all columns
- **Weighting Impact**: If factor data missing, its weighted contribution applied with neutral (50) score

### Probability Bins

Recovery data is only available for current probability bins **50-60%, 60-70%, 70-80%, 80-90%**. Options with probabilities <50% or ≥90% will show "-" for Recovery Rate % since those bins don't exist in the historical data.

### Performance Limits

- **Dataset Size**: Designed for 500-2000 options per expiry
- **Real-Time Updates**: Analysis is on-demand; data refreshes based on CSV update frequency
- **Browser Memory**: All analysis done client-side in React hooks
- **Rendering**: Table virtualization not implemented; may slow with 500+ rows on slower devices

---

## Probability Method Field Mapping

The five probability calculation methods map between dropdown labels, field names, and recovery data method names:

| Dropdown Label | CSV Field Name | Recovery Method Name | Description |
|---|---|---|---|
| PoW - Bayesian Calibrated | `ProbWorthless_Bayesian_IsoCal` | `PoW - Bayesian Calibrated` | Primary method (default), Bayesian with isotonic calibration |
| PoW - Weighted Average | `1_2_3_ProbOfWorthless_Weighted` | `PoW - Weighted Average` | Weighted average of 3 methods |
| PoW - Original Black-Scholes | `1_ProbOfWorthless_Original` | `PoW - Original Black-Scholes` | Original Black-Scholes calculation |
| PoW - Bias Corrected | `2_ProbOfWorthless_Calibrated` | `PoW - Bias Corrected` | Bias-corrected probability |
| PoW - Historical IV | `3_ProbOfWorthless_Historical_IV` | `PoW - Historical IV` | Using historical implied volatility |

---

## Binning Reference

### Probability Binning

The `getProbabilityBin(prob)` function categorizes probability values (0-1 range):

| Probability Range | Bin Name | Used For |
|-------------------|----------|----------|
| 0.00 - 0.49 | `<50%` | Recovery lookup |
| 0.50 - 0.59 | `50-60%` | Recovery lookup |
| 0.60 - 0.69 | `60-70%` | Recovery lookup |
| 0.70 - 0.79 | `70-80%` | Recovery lookup |
| 0.80 - 0.89 | `80-90%` | Recovery lookup |
| 0.90 - 1.00 | `90%+` | Recovery lookup (no data available) |

### Days to Expiry (DTE) Binning

The `getDTEBin(daysToExpiry)` function categorizes remaining days:

| Days Range | Bin Name | Used For |
|------------|----------|----------|
| 1 - 7 | `0-7` | Recovery lookup |
| 8 - 14 | `8-14` | Recovery lookup |
| 15 - 21 | `15-21` | Recovery lookup |
| 22 - 28 | `22-28` | Recovery lookup |
| 29 - 35 | `29-35` | Recovery lookup |
| 36+ | `36+` | Recovery lookup |

---

## Testing Checklist

### Manual Feature Verification

**Page Load**:
- [ ] Navigate to `/recommendations` page
- [ ] Page loads without errors
- [ ] "Option Recommendations" visible in navigation breadcrumb
- [ ] Filter panel, weights config, and table all render

**Filters**:
- [ ] Expiry Date dropdown shows available dates
- [ ] Rolling Low Period shows all 5 options
- [ ] Min Days Since Break accepts numeric input
- [ ] Probability Method shows all 5 methods
- [ ] Historical Peak Threshold shows 80%, 90%, 95%
- [ ] Analyze button disabled until expiry date selected

**Analysis**:
- [ ] Select expiry date and click Analyze
- [ ] Table populates with results (typically 50-150 options)
- [ ] Results ranked by Composite Score (descending)
- [ ] Loading state appears while analyzing

**Score Weights**:
- [ ] Click "Score Weights Configuration" to expand
- [ ] All 6 weight sliders visible and functional
- [ ] Sum of weights displays and updates
- [ ] Rerunning analysis with different weights changes results

**Table Features**:
- [ ] All columns render correctly
- [ ] Click any column header to sort
- [ ] Clicking again reverses sort direction
- [ ] Rank numbers adjust (1, 2, 3...) regardless of sort
- [ ] Stock/option names are clickable links
- [ ] Links open in new tab

**Score Colors**:
- [ ] Green for Composite Score ≥ 70
- [ ] Yellow for Composite Score 50-69
- [ ] Red for Composite Score < 50

**Expandable Rows**:
- [ ] Click chevron to expand row
- [ ] Two panels appear side-by-side:
  - [ ] Left panel: Score breakdown shows all 6 factors
  - [ ] Right panel: "Why This Option Was Recommended" explanation appears
- [ ] Score breakdown shows raw value, normalized (0-100), and weighted contribution for each factor
- [ ] Progress bars represent normalized scores
- [ ] Explanation panel shows personalized narrative text
- [ ] Explanation includes all 8 sections (Support Level, Robustness, History, Recovery, Seasonality, Performance, Score, Recommendation)
- [ ] Explanation uses option's specific values (strike, distance %, recovery %, etc.)
- [ ] On mobile, panels stack vertically (1-column layout)
- [ ] Click chevron again to collapse both panels

**KPI Cards**:
- [ ] "Total Recommendations" shows count of results
- [ ] "Average Score" shows weighted average of all composites
- [ ] "Top Score" shows highest composite score

**Data Timestamps**:
- [ ] "Data last updated" displays in format "YYYY-MM-DD HH:mm"

---

## Future Enhancements

Potential improvements:
- Save/load custom weight profiles
- Historical backtest of scoring accuracy
- Alert notifications for high-scoring new opportunities
- Export recommendations to CSV
- Additional factors (IV rank, volume, open interest)
- Machine learning weight optimization
- Pattern-based filtering/insights
