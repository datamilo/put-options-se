# Option Recommendations

**Route:** `/recommendations`
**Component:** `AutomatedRecommendations.tsx`
**Navigation:** Method Validation → Option Recommendations

---

## Overview

The **Automated Put Option Recommendations** page evaluates 6 weighted analysis factors—support strength, support stability, recovery potential, historical peaks, monthly seasonality, and current performance—to identify optimal put writing opportunities.

Rather than manually analyzing multiple factors, this tool combines them into a single composite score (0-100), ranking all available options by recommendation strength. Each of the 6 factors is individually weighted (adjustable by user), normalized to 0-100, and then combined into the final score.

**The 6 Analysis Factors:**
1. **Support Strength** - Pre-calculated robustness of the support level (0-100 score)
2. **Days Since Last Break** - Time since support was last broken (normalized stability measure)
3. **Recovery Potential** - Historical worthless rate for recovery candidates
4. **Historical Peaks** - Recovery candidate identification based on past probability highs
5. **Monthly Seasonality** - Historical % of positive months for the current calendar month
6. **Current Performance** - Month-to-date underperformance vs historical average

---

## User Workflow

### 1. Configure Filters

**Expiry Date** - Select option expiration date (required for analysis)
**Rolling Low Period** - Select rolling low window: 30, 90, 180, 270, or 365 days (default: 365)
**Min Days Since Last Break** - Enter any positive integer for minimum stability threshold (default: 10). **Uses business days only (weekdays, excluding Swedish holidays).** This filters out options where the support level was broken recently. Accept any value without manual 100% balancing. Example: A support break on Friday will show as "1 business day" by the following Monday (3 calendar days).
**Probability Method** - Select probability calculation method (default: Bayesian Calibrated)
  - PoW - Bayesian Calibrated
  - PoW - Weighted Average
  - PoW - Original Black-Scholes
  - PoW - Bias Corrected
  - PoW - Historical IV
**Historical Peak Threshold** - Select threshold for recovery candidate identification (default: 90%)
  - 80%, 90%, or 95%
  - Determines which historical probability peaks qualify as "recovery candidates"
  - Lower threshold captures more recovery opportunities, higher threshold is more selective

### 2. Adjust Score Weights (Optional)

Click "Score Weights Configuration" (marked with a chevron icon to indicate it's expandable) to customize factor importance. A simple instruction appears at the top: "Adjust sliders to set relative importance between factors."

| Factor | Default Weight | Description |
|--------|----------------|-------------|
| Recovery Rate | 25% | Historical worthless rate for recovery candidates |
| Support Strength | 20% | Pre-calculated support level robustness |
| Days Since Break | 15% | Time since support was last broken |
| Historical Peak | 15% | Recovery candidate indicator |
| Monthly Seasonality | 15% | Historical % of positive months |
| Current Performance | 10% | Month-to-date underperformance vs historical average (lower weight reflects that it's a recent/short-term indicator compared to the longer-term factors) |

**Weight Normalization**: Weights are automatically normalized to 100% when you run the analysis, so you can focus on setting the **relative importance** of each factor without needing to manually balance them. For example, if you set weights to 20/20/20/10/10/10 (total 90%) or 30/25/20/15/10/5 (total 105%), the system will proportionally scale them to 100% behind the scenes.

**Note on Current Performance Weight**: This factor has the lowest default weight (10%) because it's based on only days/weeks of performance in the current month, making it a short-term indicator. The other factors (support stability, historical patterns, recovery data) represent longer time periods and are weighted more heavily. However, you can increase this weight if you believe mean reversion is particularly important for your strategy.

**Note on Zero Weights:** If you set any factor's weight to 0%, that factor will be visually marked as "Not Included" with a red badge in the Score Breakdown panel (shown when you expand a result row). Factors with 0% weight are grayed out and appear with a dashed border, making it very clear they are not contributing to the scoring calculation. This is useful for testing how recommendations change when excluding specific factors from consideration.

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

**Definition**: Composite metric measuring how reliably the support level has held historically.

**Source**: `support_strength_score` from `support_level_metrics.csv` (pre-calculated offline)
- Pre-calculated by Python analysis script for all stocks and rolling periods
- No real-time calculation in frontend
- 0-100 scale with no transformation needed

**How It's Calculated** (4 weighted components):
```
Support Strength Score =
  (Support Stability × 0.30) +
  (Days Since Break × 0.25) +
  (Break Frequency × 0.25) +
  (Drop Consistency × 0.20)
```

- **Support Stability (30%)**: Percentage of days support held without breaking
  - Formula: `((total_days - break_days) / total_days) × 100`
  - Higher % = more reliable support

- **Days Since Last Break (25%)**: How long support has been intact
  - Normalized against typical gap frequency
  - Recent breaks lower the score

- **Break Frequency (25%)**: Average trading days between breaks
  - Fewer breaks = more predictable support
  - Normalized against 200-day baseline

- **Drop Consistency (20%)**: Predictability of drop sizes when breaks occur
  - Lower variance = higher consistency = higher score
  - Helps estimate risk if support does break

**Interpretation Guidelines**:

| Score Range | Interpretation | Practical Meaning | Risk Assessment |
|---|---|---|---|
| **80-100** | Exceptional | Support held reliably with very few breaks | Very low risk |
| **70-79** | Strong | Support held reliably with occasional breaks | Low risk |
| **60-69** | Good | Support held well, some breaks occur | Moderate risk |
| **50-59** | Moderate | Support held reasonably, breaks somewhat common | Acceptable risk |
| **40-49** | Weak | Support broken frequently or inconsistently | Elevated risk |
| **<40** | Very Weak | Support unreliable, frequent/unpredictable breaks | High risk |

**Usage in Narrative**:
- Score ≥ 70 → "strong support robustness—historically held reliably with few breaks"
- Score 50-69 → "moderate support robustness—held reasonably well with occasional breaks"
- Score < 50 → "weak support robustness—broken frequently or inconsistently"

**Weight**: 20% (second-highest weight, reflecting importance of support reliability)

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

**Definition**: Compares the stock's month-to-date price performance against the historical average return for that calendar month.

**Calculation**:
- **Current Month Performance**: Price change from the last trading day of the previous month to today's closing price
  - Formula: `((todayClose - previousMonthLastClose) / previousMonthLastClose) × 100`
  - Example: If January 31 close was 100 kr and today (Jan 15) is 98 kr, current month perf = -2%
- **Historical Average**: Average return for this calendar month across all historical data in the dataset
  - Example: Historically, January has averaged +2.5% returns
- **Underperformance**: Historical Average - Current Month Performance
  - Example: 2.5% - (-2%) = 4.5% underperformance

**Rationale - Why Underperformance Matters for Put Options**:

1. **Mean Reversion**: Markets tend to correct when stocks significantly deviate from their seasonal norms. A stock underperforming its historical January average may be due for a bounce back toward normal levels.

2. **Valuation Opportunity**: Underperformance often indicates the stock is trading below its typical value for that time of year, potentially creating an oversold condition. This reduces the risk of further sharp declines.

3. **Lower Downside Risk**: If a stock has already fallen significantly below its seasonal average, the downside remaining is likely limited. This increases the probability of a put option expiring worthless (better for put writers).

4. **Negative Carry Risk Reduction**: Stocks trending sharply downward early in their seasonal cycle have less room to fall before hitting support levels.

**Scoring Examples**:
- **5%+ Underperformance** → Score = 100 (strongest opportunity)
  - Historical avg: +3%, Current: -2% → Score = 50 + (5 × 10) = 100
  - Interpretation: Stock is significantly weaker than normal for this month

- **2.5% Underperformance** → Score = 75 (good opportunity)
  - Historical avg: +3%, Current: +0.5% → Score = 50 + (2.5 × 10) = 75
  - Interpretation: Stock is moderately weaker than normal

- **0% Underperformance (Neutral)** → Score = 50
  - Historical avg: +3%, Current: +3% → Score = 50
  - Interpretation: Stock is performing exactly as expected historically

- **5%+ Outperformance** → Score = 0 (weakest opportunity)
  - Historical avg: +3%, Current: +8% → Score = 50 + (-5 × 10) = 0
  - Interpretation: Stock is significantly stronger than normal; may be overvalued

**Data Sources**:
- **Current Month Performance**: From `useStockData` hook - calculates price change from previous month's close
- **Historical Average**: From `Stocks_Monthly_Data.csv` - field `return_month_mean_pct_return_month` filtered by current calendar month

**Weight**: 10% (lowest of all factors - contributes 0-10 points to composite score of 0-100)

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

## Recovery Candidates & Research Foundation

### What is a Recovery Candidate?

A **recovery candidate** is an option that meets two conditions:
1. **Historical Peak:** The probability of worthlessness previously reached or exceeded the selected threshold (80%, 90%, or 95%)
2. **Probability Decline:** The current probability of worthlessness is lower than the historical peak

**Example:** An option that previously hit 85% probability of worthlessness but is now trading at 65% probability would be a recovery candidate with an 80% threshold.

### The Research Finding

Extensive analysis of historical options data (available on the Probability Analysis → "Probability Recovery Analysis" page) reveals that **recovery candidates expire worthless at significantly higher rates than their current probability suggests**.

#### Key Research Results

Options that meet the recovery candidate criteria show:
- **13-41 percentage points higher worthless rates** compared to baseline options with the same current probability
- **Consistency across probability methods:** The pattern holds for all five probability calculation methods (Bayesian Calibrated, Weighted Average, Original Black-Scholes, Bias Corrected, Historical IV)
- **Stronger advantage with longer time to expiry:** Options with 36+ days to expiration show up to 41pp higher worthless rates; near-expiry options show more modest advantages (13pp)

#### Why This Matters

This research suggests the market systematically **underestimates the true probability of worthlessness for recovery candidates**. For example:
- Historical data shows 78% of similar recovery candidates expire worthless
- But the option is currently priced with only 65% probability of worthlessness
- This 13 percentage point discrepancy represents potential value for put writers

#### Accessing the Research

For detailed analysis and to explore recovery data by:
- Stock
- Probability method
- Historical peak threshold
- Current probability bin
- Days to expiration

Visit: **Probability Analysis page → "Probability Recovery Analysis" section**

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
| `/src/pages/AutomatedRecommendations.tsx` | Main page component with filters, weights, table, and KPI cards; includes Score Weights Configuration with collapsible panel and chevron indicator |
| `/src/hooks/useAutomatedRecommendations.ts` | Orchestration hook with scoring logic, data composition, and weight auto-normalization implementation |
| `/src/hooks/useProbabilityRecoveryData.ts` | Loads recovery_report_data.csv and builds hierarchical data structure |
| `/src/hooks/useProbabilityHistory.ts` | Loads probability_history.csv for peak detection |
| `/src/types/recommendations.ts` | TypeScript interfaces for filters, weights, and results; includes monthsInHistoricalData and worstMonthDrawdown fields |
| `/src/components/recommendations/RecommendationFilters.tsx` | Filter dropdown and input controls; includes Min Days Since Break as text input with numeric validation |
| `/src/components/recommendations/RecommendationsTable.tsx` | Sortable results table with expandable rows |
| `/src/components/recommendations/ScoreBreakdown.tsx` | Expandable detail view showing per-factor numeric breakdown |
| `/src/components/recommendations/OptionExplanation.tsx` | Generates personalized narrative explanation with consolidated recovery sections and historical context |

---

## Option Explanation Feature

The **"Why This Option Was Recommended"** panel provides a detailed, personalized narrative explanation for each recommended option. When you expand a row by clicking the chevron, the right panel generates a comprehensive narrative structured around the 6 scoring factors.

### What the Explanation Includes

The narrative is standardized but personalized with each option's specific values and context:

1. **Support Level Discovery**
   - Strike price position relative to rolling low support (clearly states "below" or "above")
   - Current price position vs rolling low with percentage distance
   - Example: "The current price (136.40 kr) is 1.6% above the rolling low" (clear directional language)
   - How the rolling low period (30/90/180/270/365 days) establishes support

2. **Support Robustness**
   - Days since last support break vs minimum threshold
   - Support strength score (0-100) with clear interpretation:
     - Score ≥70: "strong support robustness—historically held reliably with few breaks"
     - Score 50-69: "moderate support robustness—held reasonably well with occasional breaks"
     - Score <50: "weak support robustness—broken frequently or inconsistently"
   - Commentary on stability period (brief vs extended periods since last break)

3. **Recovery Candidate Analysis** (combined probability history and historical data)
   - **If recovery candidate with data:** Single cohesive narrative that combines:
     - Historical peak probability → current probability decline (e.g., 93.5% → 70.2%)
     - Historical worthless rate for similar options (e.g., 85.4%) with specific bins (probability range, DTE)
     - Concrete comparison showing the advantage (e.g., 85.4% vs 70.2% = 15.2 percentage point edge)
     - Investment implication for put sellers (statistical edge/market inefficiency)
     - Link to Probability Analysis page for detailed research
   - **If recovery candidate without specific data:** Brief explanation of recovery status and general research finding
   - **If not recovery candidate:** Simply states peak and current probability without recovery analysis
   - **Advantage:** Eliminates repetition between probability history and historical data sections, creating one clear narrative

4. **Monthly Seasonality**
   - Month name in English (never Swedish) with percentage of positive months
   - **Number of historical months available** for this stock-month combination (helps assess data reliability)
   - Example: "Historical data shows that Betsson AB has had positive performance during 72.0% of all January months in the dataset (15 months of historical data)"
   - Typical monthly low day compared to current date
   - Average historical return for the month
   - Note if current date is near typical low day

5. **Current Performance**
   - Month name in English with current month performance vs historical average
   - Shows the specific percentage difference (e.g., "underperforming by 2.5 percentage points")
   - Whether stock is significantly underperforming (bounce potential) or outperforming (overbought risk)
   - **Worst historical intra-month drawdown** for risk context
     - Example: "Historically, the worst intra-month drawdown for January has been -8.25%, providing context for potential downside risk"
     - Helps investors understand if current decline is within historical norms or unusual
   - Commentary explaining what this means for the put option opportunity:
     - Underperformance → Suggests potential mean reversion/bounce opportunity
     - Neutral performance → Stock behaving normally
     - Outperformance → Stock may be overvalued, less attractive for put writing

6. **Composite Score Conclusion**
   - Overall score (0-100) with interpretation (strong/moderate/weak)
   - Summary of how multiple factors aligned

7. **Final Recommendation**
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

### Technical Implementation Notes

**Weight Auto-Normalization** (`useAutomatedRecommendations.ts`, lines 65-74):
```typescript
const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
const normalizedWeights = totalWeight > 0
  ? Object.fromEntries(
      Object.entries(weights).map(([key, value]) => [
        key,
        (value / totalWeight) * 100
      ])
    ) as ScoreWeights
  : weights;
```
This ensures weights are automatically proportionally scaled to 100% when analyzing, regardless of user input values. Users can set any values (e.g., 20/20/20/10/10/10 totaling 90%) and the system will scale them proportionally.

**Min Days Since Break Input Field** (`RecommendationFilters.tsx`):
- Implemented as `type="text"` with `inputMode="numeric"` and `pattern="[0-9]*"`
- Manual validation: `/^\d+$/.test(value)` to ensure only numeric input
- Handles empty string by defaulting to 0
- Avoids browser native number input behavior (auto-adding zeros, converting "3" to "03")

**New Historical Data Fields** (extracted in `useAutomatedRecommendations.ts`):
- `monthsInHistoricalData` - Count of months available for seasonality analysis
- `worstMonthDrawdown` - Worst intra-month drawdown percentage for risk context

**Narrative Consolidation**:
- "Recovery Candidate Analysis" section combines probability history and historical worthless data
- Eliminates repetition by showing single cohesive narrative: peak → decline → advantage → implication
- Uses concrete percentage point calculations (e.g., "85.4% vs 70.2% = 15.2pp edge")

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
4. **Weight Auto-Normalization** - Weights are automatically normalized to 100% when analysis runs, so you can set any values without manual balancing
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

The `getDTEBin(daysToExpiry)` function categorizes remaining **business days**:

| Business Days Range | Bin Name | Used For |
|------------|----------|----------|
| 1 - 7 | `0-7` | Recovery lookup |
| 8 - 14 | `8-14` | Recovery lookup |
| 15 - 21 | `15-21` | Recovery lookup |
| 22 - 28 | `22-28` | Recovery lookup |
| 29 - 35 | `29-35` | Recovery lookup |
| 36+ | `36+` | Recovery lookup |

**Important:** All DTE values use **business days only** (weekdays, excluding weekends and Swedish holidays). For example, 8 business days equals approximately 14 calendar days. This applies to DaysToExpiry in data.csv, DTE_Bin in recovery_report_data.csv, and all probability-related binning.

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
- [ ] Min Days Since Break accepts numeric input without auto-adding zeros
  - [ ] Type "3" and it displays as "3" (not "03")
  - [ ] Clear field and type new number works smoothly
  - [ ] Accepts any positive integer value
- [ ] Probability Method shows all 5 methods
- [ ] Historical Peak Threshold shows 80%, 90%, 95%
- [ ] Analyze button disabled until expiry date selected

**Analysis**:
- [ ] Select expiry date and click Analyze
- [ ] Table populates with results (typically 50-150 options)
- [ ] Results ranked by Composite Score (descending)
- [ ] Loading state appears while analyzing

**Score Weights**:
- [ ] Click "Score Weights Configuration" to expand (chevron icon indicates expandability)
- [ ] All 6 weight sliders visible and functional (0-50% range each)
- [ ] Instructions display at top: "Adjust sliders to set relative importance between factors"
- [ ] Weights update in real-time as sliders move
- [ ] Rerunning analysis with different weights changes results
- [ ] Weights don't need to sum to 100% - system auto-normalizes when analyzing
- [ ] Set one factor's weight to 0%
- [ ] In expanded Score Breakdown, see "Not Included" badge (red with alert icon) for that factor
- [ ] Disabled factor shows grayed-out background and dashed border
- [ ] Disabled factor contributes 0 points to composite score

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
