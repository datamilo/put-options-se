# Put Options SE - Comprehensive Platform Functionality Guide

**Prepared for:** Investment Analysts Specializing in Put Options Trading
**Last Updated:** January 5, 2026
**Version:** 1.0

---

## Table of Contents

1. [Platform Overview](#platform-overview)
2. [Core Pages & Features](#core-pages--features)
3. [Key Concepts & Terminology](#key-concepts--terminology)
4. [Data & Calculations](#data--calculations)
5. [Analysis Methods & Validation](#analysis-methods--validation)

---

## Platform Overview

### Purpose
Put Options SE is a financial analysis platform designed for professional put options writers. The platform provides:

- **Real-time put options data** across 60+ Swedish stocks (Nasdaq Stockholm)
- **Advanced filtering and analysis tools** for identifying optimal strike prices
- **Probability and risk analysis** for premium optimization
- **Historical pattern recognition** for timing optimization
- **Support level analysis** for assignment risk mitigation
- **Portfolio optimization** for balanced risk/return allocation

### Core Investment Philosophy
The platform helps answer the central question for put writers: **"Which put options can I write to collect maximum premium while minimizing assignment risk?"**

---

## Core Pages & Features

### 1. OPTIONS DASHBOARD (Main Page)

**Route:** `/`

**Purpose:**
Central hub for browsing and filtering put options with customizable calculations.

**What You Can Do:**
- View 67+ data fields for all available put options
- Filter options by:
  - Date range (expiration dates)
  - Strike price (actual intraday low filtering for accuracy)
  - Volume and open interest thresholds
  - Stock symbols
- **Customize calculations** for your specific situation:
  - **Underlying Portfolio Value** - Set the capital you'll allocate per position
  - **Transaction Costs** - Adjust for broker commissions and fees
  - **All metrics recalculate automatically** based on your settings
- Sort by any metric (potential return, margin requirement, probability, etc.)
- Configure which columns to display
- View detailed timestamps showing when data was last updated

**Key Metrics Displayed:**
- **Basic Info:** Symbol, Strike Price, Expiration Date
- **Market Data:** Last Price, Bid/Ask, Volume, Open Interest, Implied Volatility
- **Returns & Risk:**
  - Potential Return (%)
  - Return per Day Until Expiry
  - Break-Even Price
- **Assignment & Probability:**
  - Probability of worthless (multiple methods: Bayesian Calibrated, Original Black-Scholes, Bias-Corrected, Weighted Average)
  - Probability In-The-Money (ITM)
- **Capital & Margin:** (SRI-based estimates, not exact broker requirements)
  - Estimated Total Margin required
  - Margin per contract
  - Return on Margin (annualized)
  - Safety-Risk Index (SRI)
- **User Settings:** Transaction Cost, Underlying Value

**Integration with Other Pages:**
- Click any stock name to jump to detailed stock metrics and historical analysis
- Click column header to sort instantly
- Drag column borders to adjust widths

---

### 2. PORTFOLIO GENERATOR

**Route:** `/portfolio-generator`

**Purpose:**
Automatically optimize a diversified put options portfolio to balance premium collection with risk management.

**What It Does:**
The algorithm automatically builds a portfolio by:
1. Filtering options based on your criteria
2. Calculating risk-adjusted metrics (Expected Value, EV per Capital, Risk-Adjusted Score)
3. Selecting top-ranked options (maximum one per stock) until reaching your premium target
4. Providing detailed statistics on the generated portfolio

**How to Use:**
1. **Set your constraints:**
   - Target total premium (SEK) - algorithm stops when target is reached
   - Minimum probability of worthless threshold
   - Date range filters
   - Volume/open interest requirements
   - Strike price constraints
2. **Choose optimization strategy:**
   - Maximize Expected Value (overall profit potential)
   - Maximize EV per Capital (efficiency - return per krona deployed)
   - Maximize Risk-Adjusted Score (accounts for margin requirements)
3. **Review results:**
   - Generated Portfolio table shows selected options
   - Portfolio statistics: Total Premium, Average Probability, Total Margin Required
   - Click stock/option names to open detailed analysis in new tabs

**Advantages Over Manual Selection:**
- Removes emotional bias from selection
- Ensures mathematical optimization of your constraints
- Instantly shows portfolio-level statistics
- One-click navigation to deep analysis of each selected option

**Independent Settings:**
Portfolio generator has its own settings separate from the main dashboard, allowing you to:
- Test different underlying portfolio values
- Adjust transaction cost assumptions
- Compare different optimization strategies

---

### 3. SUPPORT LEVEL ANALYSIS

**Route:** `/consecutive-breaks`

**Purpose:**
Understand how well each stock's historical low is holding as a support level, and detect when support is breaking.

**What This Reveals:**
- **Rolling Low Calculation:** The minimum intraday low price over the past N days (30, 90, 180, 270, or 365 days)
- **Support Breaks:** When the rolling low decreases (support is being tested and broken)
- **Clustering Patterns:** Groups of consecutive breaks within short timeframes
- **Stability Metrics:** What percentage of days the support held without breaking

**Visualization:**
Interactive Plotly chart showing:
- **Candlestick chart** - OHLC price action
- **Rolling low line** (slate gray dashed) - The support level being tracked
- **Break markers** (amber dots) - Exact dates when support broke

**Key Metrics Per Support Level:**
- Total number of breaks
- Clusters of breaks (consecutive breaks within 30 days)
- Multi-break clusters (clusters with 3+ breaks)
- **Median drop per break** - Typical percentage loss when support breaks
- Break stability percentage
- Days since last break
- Average and worst-case drawdowns

**Strategic Use:**
This analysis is the foundation for all other support-based strategies on the platform. Understanding support strength helps you:
- Position strike prices relative to support
- Assess assignment risk
- Identify when support is weakening vs strengthening

**URL Parameters:**
You can link directly to specific stocks and periods:
- `?stock=VOLVO%20B&period=90` - Pre-selects Volvo B with 90-day support

---

### 4. SUPPORT LEVEL OPTIONS LIST

**Route:** `/support-level-options`

**Purpose:**
Filter and rank all available put options based on the strength of their underlying stock's support levels. Find the safest strike prices by analyzing historical support behavior.

**Key Innovation:**
All complex support metrics are **pre-calculated offline** by a Python analysis script, enabling:
- **Instant performance** - page responds immediately to all filters
- **Advanced analytics** - calculations infeasible in a web browser
- **Predictive insights** - pattern classification and break probability estimates

**How to Use It:**

**Step 1: Select Rolling Period**
- Choose which timeframe defines support: 30, 90, 180, 270, or 365 days
- Longer periods = major structural support that's held for months/years
- Shorter periods = recent trading range lows

**Step 2: Configure Filters**
- **Expiration Date** - Which options to include (defaults to third Friday of next month)
- **Days Since Last Break** - Minimum number of days since support was last broken (e.g., "30 days" = support hasn't broken in 30 days)

**Step 3: Review & Analyze Results**
- Table automatically shows matching options
- Click to expand any row for detailed metrics breakdown
- Sort by any column

**Understanding the Results Table:**

**Basic Info:**
- **Stock** - Company name (clickable to stock analysis)
- **Option** - Identifier like "VOLVO B_270_2025-01-17" (clickable to option details)
- **Current Price** - Latest stock price in SEK
- **Strike** - Put strike price
- **Support (Xd)** - Rolling low support level for selected period

**Distance & Positioning:**
- **Distance to Support** - Negative % showing how far stock is below support
  - Example: "-5.2%" = stock must fall 5.2% to reach support
  - **Higher negative = safer** (more cushion above support)
  - "-2% or closer" = HIGH RISK (very close to support)
  - "< -10%" = VERY SAFE (well above support)
- **Strike vs Support** - Whether strike is positioned above or below support
  - **Negative (GREEN)** = Strike is BELOW support (extra safety buffer)
  - **Positive** = Strike is ABOVE support (riskier)

**Historical Behavior:**
- **Median Drop/Break** - Typical percentage loss when support historically breaks
  - Example: "-1.29%" = when support broke before, typical drop was 1.29%
  - **Use this to:** Position strikes below support by this amount for extra safety

**Probability & Returns:**
- **Premium** - Total SEK collected for a standard 100,000 SEK position
- **PoW - Bayesian Calibrated** - Probability the option expires worthless
  - 0-1 scale (0% to 100%)
  - **> 0.90** = Very high confidence
  - **0.70-0.80** = Moderate risk
  - **< 0.70** = Lower probability, assignment more likely
- **Days to Expiry** - Time remaining until expiration

**Support Quality Metrics:**

- **Support Stability** - Percentage of trading days the support held without breaking
  - **100%** = Perfect support (GOLD STANDARD)
  - **95-99%** = Excellent support (VERY SAFE)
  - **85-94%** = Good/moderate support (WATCH)
  - **< 85%** = Weak support (RISKY)

- **Days Since Break** - How long support has held since last being broken
  - **N/A** = Never broke in selected period (SAFEST)
  - **100+ days** = Long-established (VERY SAFE)
  - **60-99 days** = Well-established (SAFE)
  - **15-29 days** = Recent activity (CAUTION)
  - **0-14 days** = Just broke (HIGH RISK)

- **Support Strength Score** (0-100)
  - **Composite metric** combining multiple factors to predict support reliability
  - **80-100** = Exceptional (WRITE PUTS CONFIDENTLY)
  - **70-79** = Strong (VERY SAFE)
  - **60-69** = Good (SAFE)
  - **50-59** = Moderate (ACCEPTABLE)
  - **< 50** = Weak (AVOID)
  - **Color coded:** Green (70+), Yellow (50-69), Red (<50)

**Pattern Classification:**
Automatically assigns each stock to one of 6 strategic patterns:

1. **never_breaks** 🟢 - Support never/almost never breaks (99.5%+ stability)
   - Strategy: Write puts at or near support confidently

2. **stable** 🟢 - Good stability with infrequent breaks (≥85% stability, <10 breaks)
   - Strategy: Standard approach with confidence

3. **shallow_breaker** 🟢 - Breaks frequently but with minimal drops (< 2% typical drop)
   - Strategy: Write aggressively, low downside even if assigned

4. **predictable_cycles** ⚪ - Breaks in predictable patterns
   - Strategy: Time your trades based on break intervals

5. **exhausted_cascade** 🔵 - Currently in severe break cluster (near historical worst case)
   - Strategy: **Rebound candidate** - write now, expect recovery

6. **volatile** 🔴 - Frequent breaks with large drops (< 70% stability, > -5% typical drops)
   - Strategy: Avoid or demand high premium far below support

**Trend Indicators:**
- **improving** 🟢 ↑ - Support stability increased recently
- **stable** ⚪ → - Consistent behavior
- **weakening** 🔴 ↓ - Support stability deteriorating

**Expandable Row Details:**
Click any row's chevron to see detailed breakdowns:
- **Support Strength Score Components** - Visual breakdown of how the score was calculated
- **Pattern Classification Logic** - Step-by-step rule evaluation
- **Stability Trend** - First half vs second half comparison
- **Consecutive Breaks Analysis** - Current vs historical maximum
- **Data Summary** - All key metrics for reference

**Investment Strategies by Pattern:**
- **Never Breaks:** Write at support → maximum premium
- **Exhausted Cascade:** Write now → likely at bottom, rebound expected
- **Shallow Breaker:** Write aggressively → low downside
- **Stable:** Standard approach → write near support with confidence
- **Predictable Cycles:** Time after breaks → wait for next cycle

---

### 5. STOCK METRICS AND HISTORY

**Route:** `/stock-analysis`, `/stock/:stockName`

**Purpose:**
View comprehensive historical price data and performance metrics for individual stocks.

**How to Access:**
- Click "Stock Metrics and History" in navigation menu
- Click any stock name in the options table (jumps directly to that stock)
- Use the stock selector dropdown to switch between stocks

**Candlestick Chart:**
Interactive OHLC chart showing:
- **Candlesticks** - Green (up days), Red (down days)
- **Volume overlay** (optional) - Trading volume on right axis
- **Date range controls:**
  - Quick preset buttons: 1M, 3M, 6M, 1Y, ALL
  - Custom date pickers for precise ranges
  - Default range: 6 months back to today

**Performance Metrics:**
Automatically calculates changes for specific periods using industry-standard methods (aligns with Yahoo Finance, Bloomberg):

- **Today** - Yesterday's close to today's close
- **Current Week** - Last Friday's close to today
- **Current Month** - Last trading day of previous month to today
- **Current Year** - Last day of previous year to today

**Additional Metrics:**
- **1-Year High/Low** - 52-week price range
- **Distance from 1-Year High** - % below 52-week high
- **Distance from 1-Year Low** - % above 52-week low
- **Annualized Volatility** - Standard deviation of daily returns (annualized)
- **Median Volume** - Typical daily trading volume
- **Price Range** - 52-week high minus low
- **Range Ratio** - High/Low ratio (volatility indicator)

**Strategic Use:**
- Understand long-term trends and volatility patterns
- Identify where stock is in its 52-week range (near lows = safer puts)
- Assess typical trading liquidity
- Compare volatility across different time periods

---

### 6. MONTHLY ANALYSIS

**Route:** `/monthly-analysis`

**Purpose:**
Analyze historical seasonal patterns and day-of-month timing patterns to optimize entry/exit timing for put options.

**Section 1: Monthly Seasonality Heatmap**
Shows which months historically perform well vs poorly for each stock.
- **Rows** = Stocks
- **Columns** = Calendar months (Jan-Dec)
- **Color intensity** = Percentage of positive return months
- **Key insight:** Identify seasonal weakness (red months) for entry timing

**Section 2: Timeline Performance Chart**
Historical monthly returns over time for a selected stock.
- **Line chart** showing when good/bad months occurred
- **Use to:** Identify trends and cyclical patterns
- **Example:** "Stock XYZ had negative returns every January for 3 years"

**Section 3: Day-of-Month Analysis (Advanced)**
Analyzes WHEN during the month stocks hit their lowest and highest prices.

**Why This Matters for Put Writers:**
Most investors don't realize stocks have consistent patterns for when they hit monthly lows/highs. Understanding these patterns helps with:
- **Entry Timing** - Write puts after the stock typically hits its low
- **Exit Timing** - Close puts before the stock typically hits its high
- **Strike Positioning** - Adjust strikes based on expected intramonth volatility

**Three Complementary Visualizations:**

1. **Daily Distribution Histogram**
   - X-axis: Day of month (1-31)
   - Y-axis: Frequency (count of occurrences)
   - Shows: Which day is most common for stock to hit monthly low/high
   - Example: "Day 1 is the most common low day (10.5% of all months)"

2. **Period Comparison Chart**
   - X-axis: Calendar months (Jan-Dec)
   - Y-axis: Stacked percentage breakdown
   - Shows: Does stock hit lows early/mid/late month, by month?
   - Example: "December shows 47% late-month lows vs 37% early"

3. **Weekly Heatmap**
   - Rows: Calendar months
   - Columns: 4 weeks of the month
   - Color intensity: Frequency (green = common, red = rare)
   - Opacity: Data reliability (faded = <5 months data, solid = 10+ months)
   - Use to: Quickly spot seasonal patterns like "January lows cluster in Week 1"

**Summary Statistics Displayed:**
- **Median Low/High Day** - Day at which 50% of occurrences happen before
- **Most Common Low/High Day** - Mode day with percentage of months
- **Early-Month Tendency** - % occurring in days 1-10

**Key Patterns Observed:**
- 43% of monthly lows occur early (days 1-10)
- 22% occur mid-month (days 11-20)
- 35% occur late (days 21-31)
- December favors late-month lows (47% late vs 37% early)
- February favors early-month lows (55% early vs 29% late)

**Page-Level Filters:**
- **Month Filter** - View patterns for specific months or all months
- **Stock Filter** - Compare individual stock patterns vs aggregate
- **Min History Slider** - Exclude patterns with insufficient data
- **Top N Stocks** - Adjust heatmap density (10/25/50/100/200 stocks)

**Investment Use Cases:**
- "If VOLVO typically hits lows on days 28-31 in January (60% of months), write puts mid-month"
- "June shows late-month low bias - avoid early-month puts, favor mid/late entries"
- "Stock ABC shows no clear pattern - rely on support level analysis instead"

**Data Reliability Note:**
Data with <5 months of observations shown with reduced opacity. Patterns with 10+ months are highly reliable for strategy development.

---

### 7. PROBABILITY ANALYSIS

**Route:** `/probability-analysis`

**Purpose:**
Validate different probability calculation methods to understand which ones are most accurate and reliable. Compare prediction accuracy across stocks and trading scenarios.

**Section 1: Calibration Analysis**
**What it answers:** "Which probability method is most accurate?"

Visual scatter plot comparing different probability calculation methods:
- **X-axis:** Predicted probability (what the model predicts)
- **Y-axis:** Actual probability (what historically occurred)
- **Reference line:** Diagonal line (y=x) = perfect calibration
- **Points above diagonal** = Conservative (safer than predicted)
- **Points below diagonal** = Overconfident (riskier than predicted)

**Methods Compared:**
1. PoW - Bayesian Calibrated (recommended)
2. PoW - Original Black-Scholes
3. PoW - Weighted Average
4. PoW - Bias Corrected
5. PoW - Historical IV

**Interactive Filters:**
- Stock selector (all stocks or specific)
- Days-to-expiry selector (all DTE, then bins: 0-3d, 4-7d, 8-14d, 15-21d, 22-28d, 29-35d, 35+d)
- Method selector (individual or all methods)

**Key Insight:**
Points that cluster near the diagonal are well-calibrated (accurate). Points consistently above the line suggest the method is being too conservative (good risk management). Points consistently below suggest overconfidence (dangerous).

**Section 2: Stock Performance by Method**
**What it answers:** "Which stocks do specific probability methods fail on?"

Heatmap + sortable table showing weighted calibration error for each stock-method combination.
- **Positive values (GREEN)** = Conservative under-predicting
- **Negative values (RED)** = Overconfident over-predicting
- **Rows** = All ~76 stocks
- **Columns** = The 5 probability methods

**Use to:**
- Identify which methods fail systematically on certain stocks
- Avoid methods that are consistently overconfident on your target stocks
- Allocate higher position sizes to stocks where your chosen method is proven accurate

**Section 3: Probability Recovery Analysis**
**What it answers:** "Are there situations where the market significantly underestimates recovery probability?"

Identifies options that:
- Previously had very high ITM probability (80%+)
- Have since declined in probability
- Might represent an opportunity if market has over-estimated risk

**Visualization:**
Bar chart comparing "worthless rate" for recovery candidates vs baseline.
- **Green bars > Red bars** = Recovery candidates are statistically safer
- Hypothesis: Market may have overestimated the risk of these options

**Data Analyzed:**
- 17,733 calibration records across all stocks
- Multiple granularity levels: overall, by stock, by days-to-expiry
- Weighted calculations to account for sample size differences

---

### 8. LOWER BOUND ANALYSIS

**Route:** `/lower-bound-analysis`

**Purpose:**
Validate whether implied volatility (IV) estimates of downside risk are conservative or overconfident.

**Business Question Answered:**
"How reliable are IV-based downside risk predictions? Should I trust IV when estimating potential losses?"

**Key Finding:**
- **83.62% hit rate** vs 68% theoretical expectation (from 1-sigma normal distribution)
- **Conclusion:** IV systematically underestimates downside risk - traders can be confident in IV-based risk assessments
- **Data Scope:** 115,000+ predictions across 56+ stocks (April 2024 through future expirations)

**Three Analysis Tabs:**

1. **Trend Analysis**
   - Monthly hit rate evolution over time
   - Dual-axis chart:
     - **Left axis:** Hit rate % (0-100%)
     - **Right axis:** Number of predictions per month (volume)
   - Shows whether IV prediction accuracy is improving/declining over time

2. **Distribution Analysis**
   - Comprehensive visualization of prediction ranges and outcomes
   - **Components:**
     - **Black line** = Daily stock price (historical data only)
     - **Blue violin plots** = Prediction distribution density at each expiry
     - **Red bars** = Number of times price breached lower bound (historical only)
     - **Green bars** = Prediction range width percentage
   - Shows how "wide" or "narrow" IV predictions are
   - Shows where breaches actually occurred vs predicted

3. **Statistics Table**
   - Detailed per-expiry metrics
   - **Hit Rate** color-coded:
     - Green ≥ 85% = Excellent
     - Blue 75-85% = Good
     - Yellow 65-75% = Fair
     - Red < 65% = Poor
   - Sortable by any metric

**Data Files:**
- `all_stocks_daily_predictions.csv` - 115,000+ daily predictions
- `hit_rate_trends_by_stock.csv` - 1,071 monthly trend records
- `all_stocks_expiry_stats.csv` - 2,681 expiry statistics

**Strategic Use:**
- Confirms that IV-based risk estimates are conservative (83% hit rate > 68% theory)
- Validates using IV as a basis for position sizing and margin calculations
- Shows which stocks have reliable vs unreliable IV predictions
- Helps fine-tune strike placement relative to IV-predicted lows

---

### 9. FINANCIAL REPORTING VOLATILITY

**Route:** `/volatility-analysis`

**Purpose:**
Track and analyze stock volatility patterns associated with financial reporting events (earnings, dividend dates, etc.).

**Current Status:**
This page is available in the platform navigation and tracks:
- Earnings-related volatility
- Dividend announcement volatility
- Other major corporate events

**Strategic Use:**
- Adjust put option strategies around earnings dates
- Avoid or increase margin around dividend events
- Understand event-driven volatility for better strike selection

---

## Key Concepts & Terminology

### Support Level Analysis Concepts

**Rolling Low**
The minimum intraday low price within a selected time period (30, 90, 180, 270, or 365 days).
- **Example:** If you select "90 days," the rolling low is the lowest price the stock reached during the past 90 days
- **Used as:** The "support level" - the price level the stock hasn't gone below

**Support Break**
When the rolling low decreases, meaning the stock has fallen below its previous support level.
- **Example:** If the 90-day rolling low was 250 SEK last week and is now 248 SEK, support has broken

**Break Cluster**
A group of consecutive support breaks within a short timeframe (30-day window).
- **Interpretation:** Multiple breaks close together suggest the stock is volatile and testing support repeatedly
- **Strategic significance:** If breaks cluster, you may be in a cascade period

**Support Stability**
The percentage of trading days where the rolling low held without breaking.
- **Calculation:** (Trading days - Break days) / Total trading days × 100
- **100%** = Perfect support (never broke during the period)
- **95%** = Excellent (broke on only 5% of days)

**Median Drop per Break**
The typical percentage loss when support historically breaks.
- **Example:** "-1.29%" means when support broke previously, the typical next drop was 1.29%
- **Use:** Position strike below support by this amount for "worst-case protection"

---

### Probability Concepts

**Probability of Worthless (PoW)**
The probability that an option expires worthless (you keep 100% of the premium).
- **Range:** 0 to 1 (0% to 100%)
- **For put writers:** Higher PoW is better (you want options to expire worthless)
- **Interpretation:**
  - 0.90 (90%) = Very likely to expire worthless
  - 0.75 (75%) = Moderate likelihood
  - 0.60 (60%) = You'll likely be assigned
  - 0.50 (50%) = Coin flip

**Probability In-The-Money (ITM)**
The probability that an option expires with intrinsic value (stock below strike at expiration).
- **For put writers:** Lower ITM probability is better (means fewer assignments)
- **Relationship:** PoW + ITM probability ≈ 100% (simplified)

**Calibration**
How well a probability model's predictions match actual historical outcomes.
- **Well-calibrated:** Predictions align with outcomes (points cluster near diagonal line)
- **Overconfident:** Model overestimates probability of success (points below diagonal)
- **Conservative:** Model underestimates probability of success (points above diagonal)

**Bayesian Calibrated vs Original Black-Scholes**
- **Original Black-Scholes:** Theoretical model, doesn't account for real market behavior
- **Bayesian Calibrated:** Adjusted based on actual historical outcomes, more accurate in practice

---

### Margin & Capital Concepts

**Estimated Total Margin (Est. Total Margin)**
Estimated capital required by the broker to hold the put position.
- **Important Note:** These are SRI-based (Synthetic Risk Interval) estimates
- **Not exact:** Actual Nasdaq Stockholm margin requirements may differ
- **Calculated as:** Est. Margin per Contract × Number of Contracts
- **For a 100,000 SEK position:** Number of contracts = 100,000 / Strike Price

**Safety-Risk Index (SRI)**
A regulatory measure combining:
- **Safety component** - Distance from current price to strike
- **Risk component** - Implied volatility and time decay
- **Used by:** Regulatory bodies and brokers to calculate margin requirements

**Return on Margin (ROM)**
Premium collected divided by margin required, expressed as annual return.
- **Formula:** (Premium / Margin) × (365 / Days to Expiry) × 100%
- **Interpretation:** How much you earn per krona of capital tied up
- **100% ROM** = 100% annualized return (excellent, rare)
- **50% ROM** = 50% annualized return (good)
- **10% ROM** = 10% annualized return (modest)

---

### Performance Metrics

**Potential Return**
Percentage profit if the option expires worthless and you keep the full premium.
- **Formula:** (Premium / Underlying Value) × 100
- **Example:** 500 SEK premium on 100,000 SEK position = 0.5% return
- **Annualized:** Return per day × 365 days

**Break-Even Price**
The stock price at which you neither profit nor lose when assigned.
- **Formula:** Strike Price - Premium Received
- **Example:** Strike 100, Premium 2, Break-Even = 98
- **Interpretation:** If assigned, you need stock price to stay above this for profit

---

## Data & Calculations

### Data Update Frequency

**Three Timestamp Fields Track:**
1. **Options Data** - When put options prices were last downloaded (typically daily)
2. **Stock Data** - When stock OHLC data was last updated (typically daily)
3. **Analysis Completed** - When all calculations and analyses finished (typically daily)

**Data Quality Notes:**
- Data sourced from Nasdaq Stockholm
- Historical data spans multiple years
- Monthly, daily, and intraday data available
- Geographic focus: Swedish stocks (primarily)

### Calculation Methods

**Strike Price Below Filter**
- Uses **actual intraday low prices**, not closing prices
- Most accurate way to filter for strike prices below recent support
- Ensures strikes are truly below actual market prices seen intraday

**Period Change Calculations (Week/Month/Year)**
- Uses **closing prices** for consistency
- Baseline = previous period's last trading day close
- Example: YTD = (Today's Close - Last Day of Previous Year's Close) / Last Day of Previous Year's Close

**Volatility Calculations**
- Standard deviation of daily returns
- Annualized using √252 trading days factor
- Reflects actual price movements, not theoretical models

---

## Analysis Methods & Validation

### Support Level Methodology

**Why Support Levels Matter**
- Support levels are where stocks historically bounce
- Writing puts at support = higher probability of profit without assignment
- Support stability = confidence in that support level holding

**How Rolling Lows Work**
1. Define a rolling period (30, 90, 180, 270, or 365 days)
2. For each day, find the **minimum intraday low** within that period
3. Plot this line over time - this is your "rolling low"
4. When rolling low decreases = support breaks

**Why Pre-Calculated Metrics?**
- Complex rolling window calculations impossible in web browser
- Support pattern analysis requires analyzing years of historical data
- Break clustering and probability estimation require advanced algorithms
- Solution: Calculate offline once, deliver instant results in browser

**Pattern Classification Rules**
- **never_breaks** (99.5%+ stability) = Most reliable
- **stable** (≥85% stability, <10 breaks) = Very reliable
- **shallow_breaker** (median drop <2%) = Safe because drops are small
- **predictable_cycles** (regular break patterns) = Timing-dependent
- **exhausted_cascade** (current ≥80% of max consecutive breaks) = Likely to rebound soon
- **volatile** (<70% stability, >5% drops) = High risk

### Probability Model Validation

**How Models are Validated**
1. **Historical backtesting** - Model predicts PoW for past options
2. **Actual outcomes** - Check if those options actually expired worthless
3. **Calibration comparison** - Compare prediction to actual rate
4. **Cross-stock analysis** - Does accuracy vary by stock?
5. **DTE analysis** - Does accuracy vary by days-to-expiry?

**Why Multiple Methods?**
Different methods have strengths and weaknesses:
- **Black-Scholes** - Theoretically sound but ignores market behavior
- **Bayesian Calibrated** - Adjusts for actual outcomes (recommended)
- **Weighted Average** - Combines multiple methods
- **Bias Corrected** - Removes systematic over/under-estimation
- **Historical IV** - Uses past volatility instead of implied volatility

**Recommendation:**
Use **Bayesian Calibrated** model as primary guide. Cross-check against other methods for important decisions.

### IV-Based Risk Prediction (Lower Bound Analysis)

**What IV Tells You**
Implied volatility (IV) estimates the market's expectation of future price movement.
- **High IV** = Market expects big moves (wider prediction bands)
- **Low IV** = Market expects small moves (narrow prediction bands)

**Lower Bound Concept**
IV-based models can estimate: "There's an 84% chance the stock won't fall below this price by expiration."

**Validation Finding**
This estimate is actually **conservative**:
- Model predicts 84% hit rate
- Actual historical hit rate: 83.6%
- Theoretical expectation: 68%
- **Conclusion:** IV models are slightly conservative (safer than expected)

**Implication for Put Writers**
You can confidently use IV-based estimates for risk management. Strike prices positioned one IV-band below current price have >80% probability of holding (based on 115,000+ historical predictions).

---

## Summary: Recommended Workflow

### For New Users

1. **Start on Options Dashboard**
   - Set your underlying portfolio value
   - Adjust transaction costs to match your broker
   - Browse available options
   - Note which stocks appear frequently

2. **Explore Stock Details**
   - Click a stock to see historical performance
   - Check 52-week range and annualized volatility
   - Understand volatility patterns

3. **Run Support Level Analysis**
   - Choose a stock
   - Select 90-day rolling period (default/balanced)
   - See where support levels are
   - Note break clusters and stability %

4. **Use Support Level Options List**
   - Filter by 90-day rolling period
   - Sort by Support Strength Score
   - Focus on "stable" and "never_breaks" patterns
   - Review Support Strength ≥ 60

5. **Check Monthly Analysis**
   - Understand seasonal patterns
   - Learn when stock typically hits monthly lows
   - Plan entry timing around patterns

### For Active Portfolio Management

1. **Daily: Options Dashboard**
   - Check for new opportunities
   - Monitor probability changes
   - Adjust filters as conditions change

2. **Weekly: Support Level Options List**
   - Update rolling low period if needed
   - Monitor Days Since Break
   - Watch for "exhausted_cascade" patterns (rebound opportunities)

3. **Pre-Earnings: Financial Reporting Volatility**
   - Check event calendar
   - Adjust position sizes around earnings
   - Consider IV expansion opportunities

4. **Monthly Review: Probability Analysis**
   - Check which methods are accurate for your stocks
   - Verify PoW predictions align with actual outcomes
   - Adjust confidence in probability estimates

5. **Monthly: Monthly Analysis**
   - Review seasonal patterns
   - Plan next month's entry timing
   - Check for trend changes

### For Portfolio Optimization

1. **Set Premium Target**
   - In Portfolio Generator, specify total premium you want to collect

2. **Choose Strategy**
   - EV = Maximum total profit
   - EV per Capital = Maximum efficiency
   - Risk-Adjusted = Account for margin requirements

3. **Generate Portfolio**
   - Algorithm selects top options
   - Maximum one per stock
   - Until premium target is reached

4. **Review Diversification**
   - Check how many stocks selected
   - Verify margin requirements
   - Review average probability

5. **Refine if Needed**
   - Adjust filters
   - Try different strategy
   - Compare results

---

## Technical Notes for Analysts

### Data Files Used

- **data.csv** - Main options data (67+ fields, thousands of options)
- **stock_data.csv** - Daily OHLC stock data for 68 stocks
- **Stocks_Monthly_Data.csv** - Monthly aggregated data for seasonality analysis
- **support_level_metrics.csv** - Pre-calculated support metrics (62 KB, 340 rows)
- **all_stocks_daily_predictions.csv** - IV-based predictions (115,000+ rows)
- **hit_rate_trends_by_stock.csv** - Monthly hit rate tracking (1,071 rows)
- **all_stocks_expiry_stats.csv** - Expiry-level statistics (2,681 rows)
- **validation_report_data.csv** - Probability calibration data (17,733 records)
- **recovery_report_data.csv** - Probability recovery opportunities
- **margin_requirements.csv** - SRI-based margin estimates (68 stocks, 13 fields)

### Field Standardization

The platform uses consistent field naming across all pages:
- **Probability fields** aligned across all analysis pages
- **Support metrics** consistent between Support Level Analysis and Support Level Options List
- **Stock fields** unified across Stock Metrics, Monthly Analysis, and all analysis pages

### Performance Optimization

**Why Pre-Calculated Metrics?**
- Support level metrics: 26 fields pre-calculated offline
- 340 metric records (68 stocks × 5 periods) = 62 KB
- Instant filtering vs 10-15 minute calculation time
- Enables advanced pattern detection and probability estimation

**Caching Strategy:**
- Market data cached and bundled with releases
- Support metrics updated via Python script when stock data changes
- Frontend loads CSV on page mount, then instant lookups
- No external API calls after initial data load

---

## Conclusion

Put Options SE provides comprehensive tools for professional put options writers to:

✓ **Filter and analyze** 67+ metrics for thousands of put options
✓ **Understand support levels** through rolling low analysis
✓ **Assess assignment risk** via proven probability models
✓ **Optimize portfolio allocation** through automated selection
✓ **Time entries/exits** using historical seasonal patterns
✓ **Validate risk estimates** with IV-based predictions
✓ **Monitor market conditions** across earnings, dividends, and events

The platform combines rigorous financial analysis with practical investment decision-making tools, enabling data-driven put options trading strategies aligned with your risk tolerance and return objectives.

---

**For Questions or Feedback:**
Contact the development team through the platform's support channels.

**Last Updated:** January 5, 2026
**Version:** 1.0
