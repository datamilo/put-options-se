# Option Recommendations

**Route:** `/recommendations`
**Component:** `AutomatedRecommendations.tsx`
**Navigation:** Method Validation → Option Recommendations

---

## CURRENT STATUS (As of Implementation)

### ✅ Working Features
- **Filter Panel** - All filters functional (Expiry Date, Rolling Period, Min Days Since Break, Probability Method, Historical Peak Threshold)
- **Score Weights Configuration** - Collapsible panel with adjustable sliders for 6 factors
- **Options Filtering** - Correctly filters options by expiry date, rolling period, days since break, and strike price vs rolling low
- **Composite Scoring** - Calculates and ranks options by composite score
- **Peak PoW Column** - Now populating correctly with historical probability peaks from `probability_history.csv`
- **Table Sorting** - All columns sortable
- **Expandable Row Details** - Score breakdown showing individual factor contributions
- **Summary KPI Cards** - Total recommendations, average score, top score
- **Data Timestamp Display** - Shows when data was last updated

### ⚠️ Partially Working
- **Recovery Advantage Column** - Shows "-" on all rows (data structure exists but lookups failing)

### 🐛 Known Issues

#### Issue: Recovery Advantage Always Shows "-"
**Status:** Debugging in progress
**Root Cause:** TBD - investigation ongoing
**Symptoms:**
- Recovery data loads successfully (confirmed in console)
- Thresholds exist: 0.80, 0.85, 0.90, 0.95
- Methods exist: 5 probability methods available
- BUT: No recovery points are being found during lookups
- Console shows NO "🎯 Found recovery point for" messages

**Debug Information Needed:**
When user checks console after running analysis, look for:
1. `🔎 Method data:` - Should show "Found X prob bins" (where X > 0)
2. `📊 Available prob bins:` - Lists actual bin names (e.g., "50-60%", "<50%", etc.)
3. `🔍 Looking for:` - Shows what prob bin we're searching for
4. `⚠️ Prob bin 'XXX' not found` or `⚠️ DTE bin 'YYY' not found` - Identifies mismatch

**Likely Causes:**
- Probability bin calculation (`getProbabilityBin()`) may be returning values that don't match recovery data keys
- DTE bin calculation (`getDTEBin()`) may be returning values that don't match recovery data keys
- Formatting mismatch between how bins are named in data vs how we calculate them

**Next Steps:**
1. User provides console output showing available prob bins and what we're looking for
2. Identify the mismatch (e.g., data has "50-60%" but we're looking for "0.5-0.6" or similar)
3. Fix the binning functions to match data format
4. Remove debug logging once issue is resolved

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
| `/src/hooks/useAutomatedRecommendations.ts` | **Orchestration hook with scoring logic + recovery data lookup** |
| `/src/hooks/useProbabilityRecoveryData.ts` | Loads recovery_report_data.csv, builds data structure |
| `/src/hooks/useProbabilityHistory.ts` | Loads probability_history.csv for peak detection |
| `/src/types/recommendations.ts` | TypeScript interfaces |
| `/src/components/recommendations/RecommendationFilters.tsx` | Filter controls |
| `/src/components/recommendations/RecommendationsTable.tsx` | Results table with sorting |
| `/src/components/recommendations/ScoreBreakdown.tsx` | Expandable score details |

---

## Recent Bug Fixes (Session History)

### Bug #1: TypeError - Cannot read properties of undefined (reading 'forEach')
**Fixed:** Added safety checks for undefined arrays before calling `.forEach()` and `.filter()`
**Files:** `useAutomatedRecommendations.ts`
**Location:** Lines 140, 156-159

### Bug #2: Historical Peak Threshold Dropdown Not Displaying Selection
**Root Cause:** Value formatting mismatch - `.toString()` converts 0.90 → "0.9", didn't match SelectItem values
**Fixed:** Changed to `.toFixed(2)` for consistent formatting
**Files:** `RecommendationFilters.tsx` line 128, `useProbabilityRecoveryData.ts` line 32

### Bug #3: Probability History Not Loading (Peak PoW Always "-")
**Root Cause:** CRITICAL - Wrong destructuring! Hook returns `allData`, but code tried to destructure `data`
**Fixed:** Changed `{ data: probabilityHistory }` to `{ allData: probabilityHistory }`
**Files:** `useAutomatedRecommendations.ts` line 121
**Impact:** This was preventing ALL probability history from loading

### Current Issue (In Progress)
**Bug #4: Recovery Advantage Always Shows "-"**
**Status:** Debugging - console logging added
**Likely Cause:** Probability bin or DTE bin value mismatch during data lookup
**Debug Logging Added:**
- Shows available probability bins in recovery data
- Shows what bins we're calculating and looking for
- Identifies if bins don't exist in data
**Location:** `useAutomatedRecommendations.ts` lines 244-277

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

## Debug Console Log Guide

When debugging the Recovery Advantage issue, the following console logs will appear:

### Data Loading Phase (on page load)
```
📥 Starting to load probability history...
📍 Trying URLs: [...]
✅ Successfully loaded CSV from: ...
✅ Probability history CSV parsed successfully!
📊 Total rows loaded: [number]
First row sample: {...}

📥 Loading Recovery CSV: recovery_report_data.csv
🔗 Trying URL: ...
✅ Successfully loaded Recovery CSV from: ...
✅ Parsed [number] recovery records
✅ Built chart data structure:
🔑 Aggregated thresholds: ['0.80', '0.85', '0.90', '0.95']
📊 Methods for threshold 0.90: ['PoW - Weighted Average', 'PoW - Bayesian Calibrated', ...]
```

### Analysis Phase (when clicking "Analyze")
```
🔍 Building probabilityPeaksMap...
probabilityHistory type: object
probabilityHistory is array: true
probabilityHistory length: [number]
✅ Built probabilityPeaksMap with [number] entries

🔍 Recovery data structure keys: ['0.80', '0.85', '0.90', '0.95']
📊 Looking for threshold: 0.90
✅ Threshold found! Methods: [...]

🔎 Method data: Found X prob bins
📊 Available prob bins: [IMPORTANT - shows actual bin names in data]

🔍 Looking for: STOCKNAME - Prob: [BIN] (current: XX.X%), DTE: [BIN] (days: XX)
[Either finds recovery point OR shows warning about missing bin]
```

### Expected vs Actual

If Recovery Advantage is to work:
1. ✅ Recovery data should load (confirmed working)
2. ✅ Peak PoW should populate (confirmed working)
3. ❌ Recovery points should be found (NOT working - no "🎯 Found recovery point" messages)

The issue is almost certainly a **bin name mismatch** between:
- What `getProbabilityBin()` calculates and returns (e.g., "50-60%")
- What's actually in the recovery data (e.g., "50-60%", "0.5-0.6", or something different)

---

## How to Continue Debugging

### When User Returns with Console Output:
1. Look at `📊 Available prob bins:` - note the exact format
2. Compare with what the first few `🔍 Looking for:` logs show
3. If they don't match exactly, the `getProbabilityBin()` function needs updating
4. Similarly check `DTE` bins against actual bin names in data

### If User Provides Logs:
- Ask specifically for lines containing:
  - `📊 Available prob bins:` (exact bin names in recovery data)
  - First 3 lines with `🔍 Looking for:` (what we're calculating)
  - Any warning messages about missing bins

### To Fix Once Root Cause Is Found:
1. Update `getProbabilityBin()` function in `useAutomatedRecommendations.ts` (around line 17-24) to match data format
2. Update `getDTEBin()` function if DTE format is also mismatched (around line 26-33)
3. Remove all debug logging (lines 140-161, 244-277)
4. Rebuild and test
5. Commit with message: "Fix recovery advantage lookup - corrected bin formatting"

---

## Binning Reference

### Probability Binning

The `getProbabilityBin(prob)` function categorizes probability values (0-1 range) into discrete bins:

| Probability Range | Bin Name | Covers |
|-------------------|----------|--------|
| 0.00 - 0.49 | `<50%` | Less than 50% probability |
| 0.50 - 0.59 | `50-60%` | 50% to 59.9% probability |
| 0.60 - 0.69 | `60-70%` | 60% to 69.9% probability |
| 0.70 - 0.79 | `70-80%` | 70% to 79.9% probability |
| 0.80 - 0.89 | `80-90%` | 80% to 89.9% probability |
| 0.90 - 1.00 | `90%+` | 90% and above |

**Implementation** (`useAutomatedRecommendations.ts` lines 17-24):
```typescript
const getProbabilityBin = (prob: number): string => {
  if (prob < 0.5) return '<50%';
  if (prob < 0.6) return '50-60%';
  if (prob < 0.7) return '60-70%';
  if (prob < 0.8) return '70-80%';
  if (prob < 0.9) return '80-90%';
  return '90%+';
};
```

### Days to Expiry (DTE) Binning

The `getDTEBin(daysToExpiry)` function categorizes remaining days into discrete bins:

| Days Range | Bin Name | Covers |
|------------|----------|--------|
| 1 - 7 | `0-7` | Less than 1 week |
| 8 - 14 | `8-14` | 1-2 weeks |
| 15 - 21 | `15-21` | 2-3 weeks |
| 22 - 28 | `22-28` | 3-4 weeks |
| 29 - 35 | `29-35` | 4-5 weeks |
| 36+ | `36+` | 5+ weeks |

**Implementation** (`useAutomatedRecommendations.ts` lines 26-33):
```typescript
const getDTEBin = (daysToExpiry: number): string => {
  if (daysToExpiry <= 7) return '0-7';
  if (daysToExpiry <= 14) return '8-14';
  if (daysToExpiry <= 21) return '15-21';
  if (daysToExpiry <= 28) return '22-28';
  if (daysToExpiry <= 35) return '29-35';
  return '36+';
};
```

---

## Probability Method Field Mapping

The five probability calculation methods available in the dropdown map to CSV column names:

| Dropdown Label | Field Name in Code/CSV | Source | Description |
|---|---|---|---|
| PoW - Bayesian Calibrated | `ProbWorthless_Bayesian_IsoCal` | `probability_history.csv` | Primary method (default), uses Bayesian with isotonic calibration |
| PoW - Weighted Average | `1_2_3_ProbOfWorthless_Weighted` | `probability_history.csv` | Weighted average of 3 methods |
| PoW - Original Black-Scholes | `1_ProbOfWorthless_Original` | `probability_history.csv` | Original Black-Scholes probability calculation |
| PoW - Bias Corrected | `2_ProbOfWorthless_Calibrated` | `probability_history.csv` | Bias-corrected probability estimate |
| PoW - Historical IV | `3_ProbOfWorthless_Historical_IV` | `probability_history.csv` | Using historical implied volatility |

**Selection in Code**: `filters.probabilityMethod` - string value must exactly match field name
**Used for**:
- Filtering probability_history.csv for peak probabilities
- Accessing recovery data nested structure (recovery_data[threshold][method])

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

**Data Sources Composed**:
1. `useEnrichedOptionsData()` - Options with margin and IV
2. `useSupportLevelMetrics()` - Support level analysis
3. `useProbabilityHistory()` - Historical probability data
4. `useProbabilityRecoveryData()` - Recovery advantage statistics
5. `useMonthlyStockData()` - Monthly seasonality patterns
6. `useStockData()` - Current stock performance

### Component: `RecommendationFilters`

**Location**: `/src/components/recommendations/RecommendationFilters.tsx`

**Props**:
```typescript
interface RecommendationFiltersProps {
  filters: RecommendationFilters;
  onFiltersChange: (filters: RecommendationFilters) => void;
  onAnalyze: () => void;
  availableExpiryDates: string[];
  isAnalyzing: boolean;
}
```

**Rendered Controls**:
- Expiry Date (Select - dropdown of available dates)
- Rolling Low Period (Select - 30, 90, 180, 270, 365)
- Min Days Since Last Break (Input - number field)
- Probability Method (Select - 5 methods)
- Historical Peak Threshold (Select - 80%, 90%, 95%)
- Analyze Button (disabled if no expiry date or analyzing)

### Component: `RecommendationsTable`

**Location**: `/src/components/recommendations/RecommendationsTable.tsx`

**Props**:
```typescript
interface RecommendationsTableProps {
  recommendations: RecommendedOption[];
  isLoading: boolean;
}
```

**Features**:
- Sortable columns (click header to sort)
- Expandable rows (click chevron for score breakdown)
- Color-coded composite scores (green ≥70, yellow 50-69, red <50)
- Clickable stock/option names (opens detail pages in new tab)

**Columns** (18+ total):
Rank, Stock, Option, Strike, Current Price, Support Level, Distance %, Days Since Break, Current PoW, Peak PoW, Recovery Advantage, Monthly % Positive, Monthly Avg Return, Current Month %, Support Strength, Pattern Type, Premium, Composite Score

### Component: `ScoreBreakdown`

**Location**: `/src/components/recommendations/ScoreBreakdown.tsx`

**Props**:
```typescript
interface ScoreBreakdownProps {
  scoreBreakdown: ScoreBreakdown;
}
```

**Displays for each of 6 factors**:
- Raw value
- Normalized score (0-100)
- Weighted contribution
- Visual progress bar

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
  patternType: string | null;

  // Probability metrics
  currentProbability: number;
  historicalPeakProbability: number | null;
  currentProbBin: string;    // Calculated bin for lookup
  dteBin: string;            // Calculated bin for lookup

  // Recovery analysis
  recoveryAdvantage: number | null;

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
  raw: number | null;          // Original value
  normalized: number;          // 0-100 normalized
  weighted: number;            // normalized * weight%
}
```

### Recovery Data Structure

Built in `useProbabilityRecoveryData.ts`, organized as:

```
chartData = {
  "0.80": {                              // Historical Peak Threshold
    "PoW - Bayesian Calibrated": {      // Probability Method
      "50-60%": {                        // Probability Bin
        "0-7": {                         // DTE Bin
          recovery_candidate_n: 45,
          recovery_candidate_rate: 78.5,
          baseline_n: 120,
          baseline_rate: 55.2,
          advantage: 23.3                // ← This is what we extract
        }
      }
    }
  }
}
```

---

## Edge Cases & Limitations

### Data Availability

| Situation | Behavior | Display |
|-----------|----------|---------|
| No options match filters | Empty table with "No recommendations found" message | "-" |
| Probability history missing for option | Peak PoW shows "-" | Falls back to neutral score (50) |
| Recovery data missing for bin | Recovery Adv shows "-" | Falls back to neutral score (50) |
| Monthly stats missing for stock | Monthly % shows "-" | Falls back to neutral score (50) |
| Current stock data unavailable | Current Performance shows "-" | Falls back to neutral score (50) |
| Support metrics not calculated | Support Strength shows "-" | Option filtered out (not included in results) |

### Constraints

1. **One Expiry Date Per Analysis** - Must select exactly one expiry date to analyze
2. **Strike Must Be At/Below Rolling Low** - Options with strike > rolling low are filtered out (per investor logic)
3. **Days Since Break Filter** - Options with fewer days since break than minimum are excluded
4. **Weight Total** - Score weights must sum to exactly 100% (enforced by slider validation)
5. **Historical Peak Threshold** - Only affects which recovery data is queried, not filtering
6. **Probability Method** - Single method per analysis (not compared across methods)

### Missing Data Handling

- **Graceful Fallback**: Any missing metric scores as neutral (50 normalized)
- **No Option Exclusion**: Missing data doesn't exclude options (unless support metrics missing)
- **Display Consistency**: "-" indicates unavailable data in all columns
- **Weighting Impact**: If factor data missing, its weighted contribution still applied but normalized to 50

### Performance Limits

- **Dataset Size**: Designed for 500-2000 options per expiry (typical for SE market)
- **Real-Time Updates**: Analysis is on-demand (not live); data refreshes based on CSV update frequency
- **Browser Memory**: All analysis done client-side in React hooks
- **Rendering**: Table virtualization not implemented; may slow with 500+ rows on slower devices

---

## Testing Checklist

### Manual Feature Verification

**Setup** (before testing):
- [ ] Navigate to `/recommendations` page
- [ ] Confirm page loads without errors
- [ ] Verify "Option Recommendations" appears in navigation (Method Validation → Option Recommendations)

**Filters**:
- [ ] Expiry Date dropdown shows available dates
- [ ] Rolling Low Period has all 5 options (30, 90, 180, 270, 365)
- [ ] Min Days Since Break accepts numeric input
- [ ] Probability Method dropdown shows all 5 methods
- [ ] Historical Peak Threshold shows 80%, 90%, 95%
- [ ] Analyze button disabled until expiry date selected
- [ ] Analyze button disabled while analyzing

**Data Loading**:
- [ ] Open browser console (F12)
- [ ] Confirm no errors on page load
- [ ] Confirm "Option Recommendations" renders without crashing

**Analysis Execution**:
- [ ] Select expiry date
- [ ] Click "Analyze"
- [ ] Table populates with results (should see 20-100 options)
- [ ] Results are ranked by Composite Score (highest first)
- [ ] Loading state shows while analyzing

**Score Weights**:
- [ ] Click "Score Weights Configuration" to expand
- [ ] All 6 weight sliders visible and draggable
- [ ] Weights display current values
- [ ] Sum of weights shows in real-time
- [ ] Rerunning analysis uses new weights (results change)

**Results Table**:
- [ ] All 18+ columns render
- [ ] Data displays in all columns (or "-" for missing)
- [ ] Stock and Option names are clickable links (blue text)
- [ ] Links open in new tab
- [ ] Composite Score column has color coding:
  - [ ] Green for scores ≥ 70
  - [ ] Yellow for scores 50-69
  - [ ] Red for scores < 50

**Sorting**:
- [ ] Click any column header to sort
- [ ] Click again to reverse sort direction
- [ ] Rank numbers update after sort (stay 1, 2, 3...)
- [ ] Multiple sorts work correctly (doesn't break)

**Expandable Rows** (Score Breakdown):
- [ ] Click chevron icon to expand row
- [ ] Score breakdown appears below row
- [ ] Shows 6 factor boxes with:
  - [ ] Factor name
  - [ ] Raw value (or "-")
  - [ ] Normalized score (0-100)
  - [ ] Weighted contribution
  - [ ] Progress bar visualization
- [ ] Click again to collapse
- [ ] Multiple rows can be expanded

**Summary KPIs**:
- [ ] "Total Recommendations" card shows result count
- [ ] "Average Score" shows weighted average
- [ ] "Top Score" shows highest composite score
- [ ] KPI values update after rerunning analysis with different filters

**Data Timestamps**:
- [ ] "Data last updated" shows in format "YYYY-MM-DD HH:mm"
- [ ] Timestamp matches actual data update time
- [ ] Timestamp updates when data refreshed

### Recovery Advantage Debugging (When Fixing Bug #4)

**Before Running Fix**:
- [ ] Open browser console (F12 → Console tab)
- [ ] Clear console history
- [ ] Select filters and click Analyze

**Check Initial Data Loading**:
- [ ] Look for "✅ Built chart data structure:" message
- [ ] Look for "🔑 Aggregated thresholds: ['0.80', '0.85', '0.90', '0.95']"
- [ ] Note the exact format of available thresholds

**Check Analysis Phase**:
- [ ] Look for "🔎 Method data: Found X prob bins" (X should be > 0)
- [ ] Look for "📊 Available prob bins:" line
- [ ] **CRITICAL**: Copy the exact bin names shown (these are the truth)
- [ ] Look for first 3-5 "🔍 Looking for:" messages
- [ ] Compare the prob bins in "Looking for" with "Available prob bins"
- [ ] Note any exact matches or differences

**If Bug #4 Still Occurs**:
- [ ] Look for "🎯 Found recovery point for" messages
- [ ] If none found, look for "⚠️ Prob bin 'XXX' not found" or "⚠️ DTE bin 'YYY' not found"
- [ ] These warnings identify the mismatch

**After Fixing**:
- [ ] Clear console and rerun analysis
- [ ] Should see "🎯 Found recovery point for [OPTION]" messages
- [ ] Recovery Adv column should show numeric values (not "-")
- [ ] Remove all console.log statements from `useAutomatedRecommendations.ts`

### Edge Case Testing

- [ ] No options match filters → Shows "No recommendations found"
- [ ] Select different rolling periods → Results change appropriately
- [ ] Increase min days since break → Fewer results (more strict)
- [ ] Change probability method → Results may change (different peaks loaded)
- [ ] Adjust individual weight to 0% → That factor's contribution becomes 0
- [ ] All weight to one factor → Only that factor matters for ranking

---

## Future Enhancements

Potential improvements:
- Save/load custom weight profiles
- Historical backtest of scoring accuracy
- Alert notifications for high-scoring new opportunities
- Export recommendations to CSV
- Additional factors (IV rank, volume, open interest)
- Machine learning weight optimization
