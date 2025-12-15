# Support Level Options List

Route: `/support-level-options`

## Overview

Filter and analyze put options based on support levels with **pre-calculated advanced metrics**. This page helps investors identify the safest strike prices by analyzing historical support level behavior, break patterns, and stability trends.

**Key Investment Question**: Which put options can I write with maximum premium while minimizing assignment risk?

## Performance Architecture

**Pre-Calculated Metrics Approach:**
- All metrics are calculated offline by Python script (`generate_support_level_metrics.py`)
- Results stored in `data/support_level_metrics.csv` (62KB, 340 rows)
- Page loads instantly with zero client-side calculations
- Enables advanced pattern detection and predictive analysis not feasible in browser

## Key Features

- **Instant Performance**: Pre-calculated metrics eliminate lag, page responds immediately to all filter changes
- **Rolling Low Period Selection**: Choose support timeframe (30, 90, 180, 270, or 365 days)
- **Expiry Date Filtering**: Filter options by expiration date with smart default (third Friday of next month)
- **Support Break Filtering**: Filter by days since last support break
- **Advanced Pattern Detection**: Automatically classifies stocks into 6 strategic patterns
- **Support Strength Scoring**: 0-100 composite score combining stability, frequency, and consistency
- **Predictive Insights**: Trend analysis and break probability estimates
- **Real-time Results**: Instantly see matching options in results table
- **Quick Navigation**: Links to detailed option analysis and support level analysis for each result

## How It Works

### User Workflow

1. **Select Rolling Low Period**: Choose which timeframe defines the support level
   - 30 days: Short-term support
   - 90 days: Medium-term support (default)
   - 180 days: Long-term support
   - 270 days: Long-term support
   - 365 days: Annual support

2. **Select Expiry Date**: Choose the option expiration date
   - Defaults to third Friday of next month (same as main dashboard)
   - Can select any available expiry date

3. **Configure Support Filters**:
   - **Min Days Since Last Break**: Minimum days elapsed since support was last broken

4. **Review Results**: Table shows matching options with 26+ metrics and strategic indicators
   - All links open in new browser tabs, keeping the Support Level Options List available for continued browsing
   - Sort by any column to prioritize your criteria
   - Color-coded visuals highlight opportunities and risks

### Data Flow

**Python Script (Offline):**
1. Loads full historical stock data (~95,000 rows, 68 stocks, ~5.5 years)
2. For each stock and rolling period (340 combinations):
   - Calculates rolling low (minimum intraday low within period)
   - Detects support breaks (when rolling low decreases)
   - Clusters consecutive breaks (gaps ≤30 days)
   - Calculates 26 metrics including stability, drops, frequency, patterns
3. Outputs `support_level_metrics.csv` with all pre-calculated values

**React Frontend (Instant):**
1. Loads pre-calculated CSV on page mount (one-time 62KB download)
2. Filters options based on user criteria via simple array operations
3. Joins options data with support metrics by stock name + rolling period
4. Displays results with visual indicators and sorting

## Filter Criteria Explained

### Rolling Low Period (dropdown)
Determines which timeframe is used to calculate the support level. The rolling low is the **minimum intraday low price** from the stock's historical data within the selected period.

**Why it matters:** Longer periods identify major support levels that have held for years, while shorter periods track recent support zones.

### Days Since Last Break (number input)
Days elapsed since the rolling low support level was last broken **within the selected rolling period**.

**Investment Interpretation:**
- **Empty/N/A** = No breaks occurred in the selected rolling period (100% stability) - **SAFEST**
- **0-14 days** = Recently broken support (risky - support is unstable) - **AVOID**
- **15-60 days** = Support holding but with recent activity - **MODERATE RISK**
- **60+ days** = Support is well-established and holding - **SAFE**

**Important:** This metric is period-specific. If you select a 90-day period and see "Days Since Break: N/A", it means support never broke in the last 90 days (even if it broke 2 years ago).

### Expiry Date (dropdown)
Option expiration date. Defaults to third Friday of next month.

**Why it matters:** Ensures you're comparing options with similar time horizons. Mixing different expiry dates can distort probability and premium comparisons.

## Results Table Columns - Complete Guide

All columns (except Support Analysis) are clickable to sort. Click again to reverse sort direction. An arrow indicator shows the current sort field and direction.

### Basic Option Information

#### Stock
Company name. Click to open stock analysis page in new tab.

**Usage:** Identify which company the option is for.

#### Option
Option identifier in format: STOCK_STRIKE_EXPIRY. Click to open option details page in new tab.

**Example:** `VOLVO B_270_2025-01-17` = Volvo B-shares, 270 kr strike, expires Jan 17, 2025

#### Current Price
Latest closing price of the stock in SEK.

**Usage:** Compare to strike and support to gauge option positioning.

#### Strike
Put option strike price in SEK.

**Investment Meaning:** The price at which you're obligated to buy the stock if assigned. Lower strike = lower risk of assignment.

#### Support (Xd)
Rolling low support level for the selected period in SEK. "Xd" indicates the period (e.g., "Support (90d)" for 90-day period).

**Calculation:** Minimum intraday low price within the rolling period.

**Investment Meaning:** The price level the stock has not fallen below during this period. Acts as a historical "floor".

### Distance & Positioning Metrics

#### Distance to Support
**Negative percentage** showing how much the stock needs to fall to reach the rolling low support level.

**Formula:** `((rolling_low - current_price) / current_price) × 100`

**Example:** `-5.2%` means stock must fall 5.2% to reach support

**Investment Interpretation:**
- **-2% to 0%**: Stock is very close to support - **HIGH RISK** if support breaks
- **-5% to -2%**: Stock near support - **MODERATE RISK**
- **-10% to -5%**: Stock has cushion above support - **GOOD**
- **< -10%**: Stock well above support - **VERY SAFE**

**Why it matters:** Shows your safety margin. More negative = more cushion before support is tested.

#### Strike vs Support
Percentage position of strike relative to support level.

**Formula:** `((strike_price - rolling_low) / rolling_low) × 100`

**Interpretation:**
- **Negative (GREEN)**: Strike is below support - **EXTRA SAFETY BUFFER**
- **Near 0%**: Strike is at support - **POSITIONED AT HISTORICAL FLOOR**
- **Positive**: Strike is above support - **RISKIER** (may get assigned if support breaks)

**Why it matters:** Negative values (strike below support) provide extra protection. Even if support breaks, the stock must fall further to reach your strike.

### Historical Support Behavior

#### Median Drop/Break
Historical median percentage drop when support breaks in this period.

**Calculation:** Median of all `drop_pct` values from support breaks within clusters.

**Example:** `-1.29%` means when support broke historically, the typical drop was 1.29%

**Investment Use:**
- **> -2%**: Shallow breaker - limited downside even if support fails
- **-2% to -5%**: Moderate drops - normal volatility
- **< -5%**: Large drops - high-risk stock

**Why it matters:** If support breaks, this tells you the typical magnitude of decline. Use this to position strikes below support by this amount for extra safety.

### Option Pricing & Probabilities

#### Premium
Total premium collected for a 100,000 SEK position in SEK.

**Formula:** `(Bid price) × (100,000 / Strike price)`

**Why it matters:** Your income from writing the put. Higher premium = more profit, but often comes with higher risk.

#### PoW - Bayesian Calibrated
Probability of worthless (option expires worthless, you keep full premium) using Bayesian calibrated model.

**Range:** 0.0 to 1.0 (0% to 100%)

**Investment Interpretation:**
- **> 0.90 (90%)**: Very likely to expire worthless - **HIGH CONFIDENCE**
- **0.80 - 0.90**: Good probability - **NORMAL RISK**
- **0.70 - 0.80**: Moderate probability - **ELEVATED RISK**
- **< 0.70**: Lower probability - **AVOID** unless you want to own the stock

**Why use this:** More accurate than original Black-Scholes, calibrated to historical outcomes.

#### PoW - Original
Probability of worthless using original Black-Scholes method (uncalibrated).

**Why shown:** For comparison with Bayesian Calibrated model.

#### Days to Expiry
Days remaining until option expiration.

**Why it matters:** More days = more time for stock to move against you, but also justifies higher premium.

### Support Stability Metrics

#### Support Stability
**Percentage of trading days** within the rolling period where the rolling low held without being broken.

**Formula:** `((total_days - break_days) / total_days) × 100`

**Interpretation:**
- **100%**: Perfect support - never broke during the rolling period - **GOLD STANDARD**
- **98-99%**: Excellent support - broke on <2% of days - **VERY SAFE**
- **95-97%**: Strong support - broke on 3-5% of days - **SAFE**
- **90-94%**: Good support - broke on 6-10% of days - **MODERATE**
- **85-89%**: Moderate support - broke on 11-15% of days - **WATCH**
- **< 85%**: Weak support - broke frequently - **RISKY**

**Important:** Calculated only for the selected rolling period, not all history.

**Tooltip Available:** Hover over the info icon for detailed explanation.

#### Days Since Break
Days since the rolling low was last broken **within your selected rolling period**.

**Display:**
- **N/A**: No breaks occurred in the selected rolling period (implies 100% stability)
- **Number + d**: Days elapsed since most recent break (e.g., "73d")

**Investment Interpretation:**
- **N/A**: Perfect stability - **SAFEST CHOICE**
- **100+ days**: Long-established support - **VERY SAFE**
- **60-99 days**: Well-established support - **SAFE**
- **30-59 days**: Support holding - **MODERATE**
- **15-29 days**: Recent break activity - **CAUTION**
- **0-14 days**: Just broke - **HIGH RISK**

**Why it matters:** Longer duration since break = support is stronger and more reliable.

### Advanced Strategic Metrics (NEW)

#### Support Strength Score
**Composite score from 0-100** combining multiple factors to predict how likely support will hold.

**Formula Components:**
- Support Stability: 30% weight
- Days Since Last Break (normalized): 25% weight
- Break Frequency (trading days per break): 25% weight
- Drop Consistency (inverse of std deviation): 20% weight

**Interpretation:**
- **80-100**: Exceptional support - **WRITE PUTS CONFIDENTLY**
- **70-79**: Strong support - **VERY SAFE**
- **60-69**: Good support - **SAFE**
- **50-59**: Moderate support - **ACCEPTABLE RISK**
- **40-49**: Weak support - **ELEVATED RISK**
- **< 40**: Very weak support - **AVOID**

**Color Coding:**
- 🟢 **Green (70+)**: Strong support - prioritize these
- 🟡 **Yellow (50-69)**: Moderate support - acceptable
- 🔴 **Red (<50)**: Weak support - avoid or position strikes well below support

**Why it matters:** Single metric that combines all key factors. Use this to quickly identify safest options.

**Investment Strategy:** Focus on Support Strength Scores ≥ 60 for reliable support levels.

#### Pattern Type
**Automatic classification** of stock's historical support behavior into 6 strategic categories.

**Pattern Definitions:**

1. **never_breaks** 🟢
   - **Definition**: 99.5%+ stability over the rolling period
   - **Meaning**: Support has never or extremely rarely broken
   - **Investment Strategy**: SAFEST - write puts at or near support confidently
   - **Example**: Stock has 100% stability over 365 days

2. **exhausted_cascade** 🔵
   - **Definition**: Current consecutive breaks ≥ 80% of historical maximum
   - **Meaning**: Currently in cluster near historical worst case - may be due for rebound
   - **Investment Strategy**: REBOUND CANDIDATE - consider strikes at median drop below support
   - **Example**: Stock historically maxed at 10 consecutive breaks, currently at 8-9

3. **shallow_breaker** 🟢
   - **Definition**: Median drop per break < 2%
   - **Meaning**: Support breaks but drops are small
   - **Investment Strategy**: LOW DOWNSIDE RISK - even if assigned, limited losses
   - **Example**: Stock breaks support regularly but drops only 0.5-1.5% each time

4. **volatile** 🔴
   - **Definition**: Stability < 70% AND median drop < -5%
   - **Meaning**: Frequent breaks with large drops
   - **Investment Strategy**: HIGH RISK - avoid or position strikes far below support
   - **Example**: Stock breaks 35% of days with -8% average drops

5. **stable** 🟢
   - **Definition**: Stability ≥ 85% AND total breaks < 10
   - **Meaning**: Good stability with infrequent breaks
   - **Investment Strategy**: RELIABLE - safe to write puts near support
   - **Example**: Stock has 92% stability with only 6 breaks in 90 days

6. **predictable_cycles** ⚪
   - **Definition**: Regular patterns that don't fit above categories
   - **Meaning**: Breaks occur in predictable patterns
   - **Investment Strategy**: TIME YOUR TRADES - write after breaks, avoid before patterns suggest next break
   - **Example**: Stock breaks every 45 days on average

**Color Coding:**
- 🟢 **Green** (never_breaks, shallow_breaker, stable): Safe patterns
- 🔵 **Blue** (exhausted_cascade): Special opportunity (rebound candidate)
- 🔴 **Red** (volatile): High-risk pattern
- ⚪ **Gray** (predictable_cycles): Moderate risk

**Investment Strategies by Pattern:**
- **never_breaks**: Write puts at support for maximum premium
- **exhausted_cascade**: Write puts now - likely near worst case, rebound expected
- **shallow_breaker**: Write puts aggressively - low downside even if wrong
- **volatile**: Avoid or write puts far below support with high premium
- **stable**: Standard approach - write near support with confidence
- **predictable_cycles**: Time your entries based on break intervals

#### Stability Trend
**Direction of stability change** - is support strengthening or weakening recently?

**Calculation:** Compares support stability in first half vs second half of rolling period.

**Values:**
- **improving** 🟢 ↑: Support stability increased by >5% (second half more stable than first half)
- **stable** ⚪ →: Support stability changed by ≤5% (consistent behavior)
- **weakening** 🔴 ↓: Support stability decreased by >5% (second half less stable than first half)

**Investment Interpretation:**
- **improving ↑**: Support is strengthening over time - **INCREASINGLY SAFE** - good time to write puts
- **stable →**: Support behavior is consistent - **PREDICTABLE** - standard risk assessment applies
- **weakening ↓**: Support is deteriorating - **INCREASING RISK** - be cautious, consider waiting

**Color Coding:**
- 🟢 **Green** (improving): Support is getting stronger
- ⚪ **Gray** (stable): No significant trend
- 🔴 **Red** (weakening): Support is deteriorating

**Why it matters:** Trend tells you if risk is increasing or decreasing. An "improving" trend means support is more reliable now than it was earlier in the period.

**Investment Strategy:** Prioritize "improving" or "stable" trends. Avoid "weakening" trends unless you want to own the stock at strike price.

#### Max Consecutive Breaks
**Historical maximum** number of consecutive support breaks within any cluster (breaks separated by ≤30 days).

**Calculation:** Highest `num_breaks` value across all break clusters in full historical data.

**Example:** `9` means this stock once had 9 consecutive breaks in a short timeframe

**Investment Interpretation:**
- **0-2**: Very stable - breaks are isolated events - **LOW CASCADE RISK**
- **3-5**: Moderate clustering - breaks can cascade - **NORMAL RISK**
- **6-10**: High clustering - breaks often trigger cascades - **ELEVATED RISK**
- **11+**: Extreme clustering - very volatile during weak periods - **HIGH RISK**

**Why it matters:** Shows worst-case cascade scenario. If stock starts breaking support, this tells you how bad it could get before recovering.

**Investment Strategy:**
- Use this to assess worst-case risk
- If current consecutive breaks approach max, may be near bottom (exhausted_cascade pattern)
- Lower max = more predictable support behavior

#### Current Consecutive Breaks
**Number of consecutive breaks** in the most recent active cluster (if cluster ended ≤30 days ago).

**Calculation:** If last break cluster ended within 30 days, shows its break count. Otherwise shows 0.

**Display:**
- **0**: No active cluster - stock is stable
- **1-X** 🟠: Active cluster with X consecutive breaks

**Investment Interpretation:**
- **0**: Support is holding - **NORMAL STATE** - safe to write puts
- **1-2** 🟠: Minor break activity - **WATCH** - support being tested
- **3-5** 🟠: Active cascade - **CAUTION** - support under pressure
- **6+** 🟠: Major cascade - **HIGH RISK** - wait for stabilization

**Color Coding:**
- **Bold Orange**: Value > 0 (active cluster)
- **Normal**: 0 (no active cluster)

**Strategic Use - Identify "Exhausted Cascade" Opportunities:**
- If `Current Consecutive ≥ 0.8 × Max Consecutive`: Pattern = "exhausted_cascade"
- **Example**: Max = 10, Current = 8 → Likely near bottom, rebound candidate
- **Strategy**: Write puts now at median drop below support - high probability of mean reversion

**Why it matters:** Tells you if stock is currently in a breaking cascade. If current approaches max, cascade may be exhausting (rebound opportunity). If current is 0, support is holding normally.

### Navigation

#### Support Analysis
Link to view detailed support level analysis for the stock.

**Opens:** `/consecutive-breaks?stock={stockName}` in new tab

**Shows:**
- Plotly chart with candlesticks, rolling low line, and break markers
- Break cluster details with statistics
- Full break history table
- Configurable rolling period and max gap

**Use:** Deep dive into support behavior for this stock before writing puts.

## Configuration Examples & Investment Strategies

### Strategy 1: Maximum Safety (Conservative)
**Goal:** Minimize assignment risk, accept lower premium

**Filters:**
- Rolling Period: 180-365 days (long-term support)
- Min Days Since Break: 60+ days
- Sort by: Support Strength Score (desc) or Support Stability (desc)

**Pattern Focus:** "never_breaks", "stable", "shallow_breaker"

**Result:** Options with extremely reliable support that has held for months/years. Lowest assignment risk.

### Strategy 2: Balanced Premium/Safety (Default)
**Goal:** Good premium with acceptable risk

**Filters:**
- Rolling Period: 90 days (medium-term support)
- Min Days Since Break: 30 days
- Sort by: Premium (desc), then filter by Support Strength ≥ 60

**Pattern Focus:** "stable", "shallow_breaker", "predictable_cycles"

**Result:** Options with proven recent support and decent premium. Standard risk profile.

### Strategy 3: Rebound Plays (Opportunistic)
**Goal:** Identify stocks that have cascaded near historical max - likely to rebound

**Filters:**
- Rolling Period: 90-180 days
- Min Days Since Break: 0-30 days (recent activity)
- Sort by: Pattern (filter for "exhausted_cascade")
- Check: Current Consecutive ≥ 80% of Max Consecutive

**Pattern Focus:** "exhausted_cascade" exclusively

**Strike Positioning:** At median drop below support (e.g., if support = 100 kr and median drop = -2%, strike at 98 kr)

**Result:** Options where cascade is likely exhausted. Higher premium due to recent volatility, but good odds of rebound.

### Strategy 4: Short-Term Scalping
**Goal:** Quick premium capture on very short timeframes

**Filters:**
- Rolling Period: 30 days (short-term support)
- Min Days Since Break: 14 days
- Days to Expiry: < 30 days
- Sort by: Premium (desc)

**Pattern Focus:** "shallow_breaker", "stable"

**Result:** Near-term options where support has held recently. Higher premium due to short duration.

### Strategy 5: Shallow Breaker Focus
**Goal:** Minimize downside risk even if assigned

**Filters:**
- Pattern: "shallow_breaker" only
- Sort by: Median Drop/Break (closest to 0%)
- Check: Support Strength ≥ 50

**Strike Positioning:** At or slightly below support

**Result:** Stocks where even if support breaks, drops are minimal (< 2%). You'll likely be assigned near fair value.

### Strategy 6: High Premium Hunting (Aggressive)
**Goal:** Maximum premium, willing to accept assignment risk

**Filters:**
- Rolling Period: Any
- Min Days Since Break: 0 (include all)
- Sort by: Premium (desc)
- Secondary filter: Support Strength ≥ 40 (avoid completely unstable)

**Pattern Focus:** Include "volatile" and "predictable_cycles"

**Strike Positioning:** At or above support for maximum premium

**Warning:** Higher assignment risk. Only use if willing to own stock at strike.

## Data Source & Update Process

### Pre-Calculated Metrics File
**Location:** `data/support_level_metrics.csv`

**Size:** 62 KB (340 rows = 68 stocks × 5 rolling periods)

**Columns (26 total):**
1. stock_name
2. rolling_period (30, 90, 180, 270, or 365)
3. current_price
4. rolling_low
5. distance_to_support_pct
6. total_breaks
7. days_since_last_break
8. last_break_date
9. support_stability_pct
10. stability_trend (improving/stable/weakening)
11. median_drop_per_break_pct
12. avg_drop_per_break_pct
13. max_drop_pct
14. drop_std_dev_pct
15. avg_days_between_breaks
16. median_days_between_breaks
17. trading_days_per_break
18. num_clusters
19. max_consecutive_breaks
20. current_consecutive_breaks
21. support_strength_score (0-100)
22. pattern_type (6 categories)
23. break_probability_30d (0-1)
24. break_probability_60d (0-1)
25. last_calculated (timestamp)
26. data_through_date

### How Metrics Are Calculated

**Python Script:** `generate_support_level_metrics.py`

**Execution:** Run offline when `stock_data.csv` is updated (typically daily/weekly)

**Process:**
1. Load ~95,000 rows of historical stock data (5.5 years per stock)
2. For each of 68 stocks:
   - For each of 5 rolling periods (30, 90, 180, 270, 365 days):
     - **Calculate rolling low** - O(n²) algorithm finds minimum low within sliding window
     - **Detect breaks** - identify when rolling low decreases
     - **Cluster breaks** - group consecutive breaks (≤30 day gaps)
     - **Calculate stability** - % of days support held
     - **Analyze drops** - median, average, max, std deviation of drops
     - **Compute frequency** - avg/median days between breaks
     - **Count clusters** - total clusters, max/current consecutive
     - **Calculate support strength** - weighted composite score
     - **Classify pattern** - apply rules to assign pattern type
     - **Estimate probability** - predict 30/60-day break likelihood
     - **Determine trend** - compare first vs second half stability
3. Output 340 rows to CSV (68 stocks × 5 periods)

**Computation Time:** ~10-15 minutes (one-time)

### Update Procedure

When stock data is updated:
```bash
# Run the Python script with the virtual environment
/home/gustaf/.venv/bin/python3 generate_support_level_metrics.py

# Commit updated CSV
git add data/support_level_metrics.csv
git commit -m "Update support level metrics through [DATE]"
git push
```

The React frontend automatically loads the latest CSV from GitHub on page mount.

## Technical Implementation

### Hooks

#### `useSupportLevelMetrics`
**File:** `src/hooks/useSupportLevelMetrics.ts`

**Purpose:** Loads and provides access to pre-calculated support metrics

**Data Source:** `https://raw.githubusercontent.com/datamilo/put-options-se/main/data/support_level_metrics.csv`

**Returns:**
- `data`: Array of all 340 metric records
- `isLoading`: Loading state
- `error`: Error message if load fails
- `getMetricsForStock(stockName, rollingPeriod)`: Get metrics for specific stock/period
- `getAllMetricsForStock(stockName)`: Get all 5 periods for a stock
- `getMetricsForPeriod(rollingPeriod)`: Get all stocks for a specific period
- `getStocksByPattern(patternType, rollingPeriod?)`: Filter by pattern classification

**CSV Parsing:** Uses Papa Parse with dynamic typing and error handling

**Performance:** One-time load on mount, then instant lookups via helper functions

#### `useSupportBasedOptionFinder`
**File:** `src/hooks/useSupportBasedOptionFinder.ts`

**Purpose:** Filters options using pre-calculated metrics

**Key Function:** `findOptions(criteria)`

**Filter Criteria:**
- `rollingPeriod`: 30, 90, 180, 270, or 365
- `minDaysSinceBreak`: Minimum days (number)
- `strikePosition`: 'at_support' | 'below_median_drop' | 'percent_below' | 'any'
- `percentBelow`: Custom % below support (optional)
- `minProbOfWorthless`: Minimum PoW threshold
- `maxDaysToExpiry`: Maximum days until expiration
- `minPremium`: Minimum premium threshold
- `requireStrikeBelowLowerAtAcc`: Boolean filter
- `maxBidAskSpread`: Maximum spread threshold
- `expiryDate`: Specific expiry date (optional)
- **NEW:** `minSupportStrength`: Minimum support strength score
- **NEW:** `patternTypes`: Array of pattern types to include
- **NEW:** `maxBreakProbability30d`: Maximum 30-day break probability
- **NEW:** `stabilityTrends`: Array of trends to include

**Process:**
1. Load options data via `useEnrichedOptionsData()`
2. Load metrics data via `useSupportLevelMetrics()`
3. For each option:
   - Lookup metrics for stock + rolling period
   - Apply all filter criteria
   - Calculate distances (distance to support, strike vs support)
   - Build result object with all metrics
4. Sort results by premium (descending)
5. Return filtered array

**Performance:** Simple array operations, no calculations - instant filtering

**Returns:**
- `findOptions`: Filter function
- `isLoading`: Loading state (combines options + metrics loading)

### Page Component

**File:** `src/pages/SupportBasedOptionFinder.tsx`

**State Management:**
- `rollingPeriod`: Selected period (default: '90')
- `minDaysSinceBreak`: Filter value (default: '30')
- `selectedExpiryDate`: Expiry filter (default: third Friday of next month)
- `sortField`: Current sort column
- `sortDirection`: 'asc' or 'desc'

**Rendering:**
- Filter card with dropdowns and inputs
- Results count summary
- Scrollable table with 18+ columns
- Color-coded cells for visual indicators
- Sortable headers (click to sort, click again to reverse)
- Tooltips with detailed explanations

**Color Coding Logic:**
- Support Strength: Green (≥70), Yellow (50-69), Red (<50)
- Pattern Type: Green (safe patterns), Blue (exhausted_cascade), Red (volatile)
- Stability Trend: Green (↑), Gray (→), Red (↓)
- Current Consecutive: Orange bold if > 0
- Strike vs Support: Green if negative

## Important Notes

- **Pre-Calculated Approach**: All metrics are calculated offline by Python script, enabling advanced analysis not feasible in browser
- **Calendar Days**: Rolling periods use calendar days, not trading days (consistent with main dashboard)
- **Period-Specific Metrics**: Support Stability and Days Since Break are calculated only for the selected rolling period
- **Pattern Classification**: Automatically applied based on predefined rules in Python script
- **Support Strength Score**: Composite metric combining 4 factors with specific weights
- **Performance**: Page loads instantly (~62KB CSV), no lag on filter changes
- **Data Freshness**: Metrics reflect stock data through date shown in `data_through_date` column
- **Cluster Definition**: Consecutive breaks are grouped if separated by ≤30 days (MAX_GAP_DAYS constant)

## Investment Guidelines

**General Rules:**
1. **Focus on Support Strength ≥ 60** for reliable support levels
2. **Prioritize "stable", "shallow_breaker", and "never_breaks" patterns** for safety
3. **Watch for "exhausted_cascade" pattern** - potential rebound opportunities
4. **Avoid "weakening" stability trends** unless you want to own the stock
5. **Use "improving" trends** as confirmation of strengthening support
6. **Position strikes below support by median drop amount** for extra safety
7. **Check Max vs Current Consecutive Breaks** to gauge cascade risk

**Risk Management:**
- Always review full Support Analysis (click "View Analysis" button) before writing puts
- Consider Distance to Support - more negative = more safety margin
- Check PoW - aim for ≥ 80% probability of worthless
- Review Days Since Last Break - prefer ≥ 60 days for established support

**Pattern-Specific Strategies:**
- **never_breaks**: Write at support confidently
- **exhausted_cascade**: Wait for Current ≈ Max, then write for rebound
- **shallow_breaker**: Write aggressively - low downside
- **volatile**: Avoid or demand high premium far below support
- **stable**: Standard approach with good confidence
- **predictable_cycles**: Time entries based on break frequency

## File References

- **Page Component**: `src/pages/SupportBasedOptionFinder.tsx`
- **Primary Hook**: `src/hooks/useSupportBasedOptionFinder.ts`
- **Metrics Hook**: `src/hooks/useSupportLevelMetrics.ts`
- **Python Script**: `generate_support_level_metrics.py`
- **Data File**: `data/support_level_metrics.csv`
- **Types**: `src/types/consecutiveBreaks.ts`
- **Related Documentation**: `docs/support-level-analysis.md`, `README_Support_Level_Metrics.md`
