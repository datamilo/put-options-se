# Monthly Analysis

Route: `/monthly-analysis`

## Overview
Comprehensive historical performance analysis including seasonal patterns, intramonth drawdowns, and day-of-month timing patterns for stocks. Analyze which months perform well, when within the month stocks hit their lows/highs, and identify seasonality patterns.

## Page Sections

### 1. Monthly Seasonality Heatmap
Shows percentage of positive return months for each stock by calendar month. Identifies which months historically perform best/worst for each stock.

### 2. Timeline Performance Chart
Historical monthly returns over time for selected stock. Visualizes when good/bad months occurred and identifies trends.

### 3. Day-of-Month Analysis (NEW)
Analyzes timing patterns for when stocks hit their monthly lows and highs. Three complementary visualizations with auto-generated insights.

### 4. Detailed Statistics Table
Comprehensive metrics for all stock-month combinations with sorting and filtering.

## Key Components
- **MonthlyStatsTable** - Detailed statistics table with sorting/filtering
- **MonthlySeasonalityHeatmap** - Heatmap showing seasonality patterns
- **TimelinePerformanceChart** - Line chart showing historical monthly returns
- **DayOfMonthAnalysis** - Container for day-of-month analysis visualizations
- **DayDistributionHistogram** - Bar chart showing frequency distribution by day (1-31)
- **PeriodComparisonChart** - Stacked bar chart comparing weekly periods across months
- **WeeklyHeatmap** - Heatmap showing intensity patterns by week and month

## Data Hooks
- **useMonthlyStockData** - Data loading and statistics calculation

## Detailed Statistics Table Metrics

### Return Metrics
- **Pos %**: Percentage of months with positive returns (closing price went up)
- **Avg Ret %**: Average percentage return across all historical occurrences of that month
- **Avg Drawdown %**: Average intramonth drawdown (average decline from month's opening price to lowest price during that month)
- **Worst Drawdown %**: Worst-case intramonth drawdown ever recorded (most negative decline from open to low)
- **Best Drawdown %**: Best-case intramonth drawdown (smallest decline or 0% if price held above opening)

### Drawdown Definition
Drawdown measures the percentage decline from the **opening price** of the month to the **lowest price** reached during that month.
- Negative values indicate the stock declined from open to low
- 0% or positive values indicate the stock never dropped below its opening price
- Example: If a stock opened at $100 and the low was $95, the drawdown for that month is -5%

## Day-of-Month Analysis (NEW FEATURE)

### Purpose
Identifies **when within the month** stocks typically hit their lowest and highest prices (days 1-31). Surfaces actionable patterns for entry/exit timing strategies in put options trading.

### Data Source
Uses `day_low_day_of_month` and `day_high_day_of_month` fields from `Stocks_Monthly_Data.csv` containing 17,442+ historical monthly records.

### Controls

**Show Toggle**: Switch between analyzing low days and high days
- **Low Days**: When stocks hit their monthly minimum price
- **High Days**: When stocks hit their monthly maximum price

**Chart Selector**: Choose visualization type
- **Daily Distribution**: Histogram showing frequency for each day 1-31
- **Period Comparison**: Stacked bar comparing early/mid/late month patterns
- **Weekly Heatmap**: Grid showing intensity by week of month and calendar month

### Visualizations

#### 1. Daily Distribution Histogram
- **X-axis**: Day of month (1-31)
- **Y-axis**: Frequency (count of occurrences)
- **Color coding**: Red for lows, green for highs
- **Reference lines**:
  - Dashed line: Median day (50% occur before this day)
  - Darker bar: Mode day (most common day)
- **Insights**: "Day 1 is the most common low day (10.5% of all months)"

#### 2. Period Comparison Chart
- **X-axis**: Calendar months (Jan-Dec)
- **Y-axis**: Percentage (0-100%, stacked)
- **Stack segments**:
  - Blue (Days 1-7): Early week
  - Yellow (Days 8-14): Second week
  - Purple (Days 15-21): Third week
  - Pink (Days 22-31): Late month
- **Key patterns**:
  - December: 47% late-month lows vs 37% early
  - February: 55% early-month lows vs 29% late
  - June: 48% late-month lows vs 30% early

#### 3. Weekly Heatmap
- **Rows**: Calendar months (Jan-Dec)
- **Columns**: 4 weeks (Days 1-7, 8-14, 15-21, 22-31)
- **Color intensity**: Green (high frequency) to Red (low frequency)
- **Opacity**: Indicates data reliability (<5 months = faded, 10+ months = solid)
- **Use case**: Quickly identify seasonal patterns like "January lows cluster in Week 1"

### Summary Statistics

Three key metrics displayed below charts:
- **Median [Low/High] Day**: The day at which 50% of occurrences happen before
- **Most Common [Low/High] Day**: The mode day with percentage of months
- **Early-Month Tendency**: Percentage occurring in days 1-10

### Filters & Controls

#### Page-Level Filters
- **Month Filter**: View statistics for specific months or all months combined
  - When selected, period comparison and heatmap only show selected months
- **Stock Filter**: Filter by individual stock names
  - When selected, shows per-stock pattern vs aggregate benchmark
- **Min History Slider**: Minimum months of data required (1-50)
  - Ensures analysis is based on sufficient historical data
- **Top N Stocks**: Filter display in heatmap (10/25/50/100/200)
  - Does not affect Day-of-Month analysis (shows all matching stocks)

#### Section-Specific Controls
- **Analysis Type Toggle**: Switch between Low Days and High Days
- **Chart Selector**: Choose visualization type (3 options)

### Key Insights & Use Cases

#### General Market Patterns
- 43% of monthly lows occur in days 1-10 (early month)
- 22% in days 11-20 (mid month)
- 35% in days 21-31 (late month)
- Day 1 is single most common day for monthly highs/lows

#### Seasonal Patterns by Month
- **December**: Strong late-month bias for lows (late 47% vs early 37%)
- **February**: Strong early-month bias for lows (early 55% vs late 29%)
- **June**: Moderate late-month bias for lows (late 48% vs early 30%)

#### Per-Stock Trading Strategies
**Example**: "If AAK AB historically hits lows in days 28-31 of January (60% of months):"
- Consider entering put positions mid-month
- Avoid buying puts early month (already at low)
- Expected consolidation/decline in last 10 days

**Example**: "If stock ABC shows no clear pattern (high unpredictability):"
- Use other analysis tools (support levels, IV) for entry timing
- Less reliance on day-of-month timing

### Data Reliability

Opacity/fading indicates data reliability:
- **40% opacity** (<5 months): Limited data, treat pattern as preliminary
- **70% opacity** (5-10 months): Moderate data, pattern emerging
- **100% opacity** (10+ months): Reliable data, confidence in pattern

## Filters & Controls (Page-Level)
- **Month Filter**: View statistics for specific months or all months combined
- **Stock Filter**: Filter by individual stock names
- **Min History Slider**: Minimum months of historical data (1-50)
- **Top N Stocks**: Filter heatmap display (10/25/50/100/200)
- **Search**: Text-based search to find specific stocks

## Key Insights

### Seasonality
- High "Pos %" shows months historically favorable for a stock
- "Worst Drawdown %" shows maximum risk (worst month for pullback)
- "Best Drawdown %" of 0% indicates strong support at the opening level in best-case scenarios
- Comparing "Avg Ret %" with "Avg Drawdown %" shows if positive returns come with high intramonth volatility

### Day-of-Month Timing
- Stocks show consistent patterns for when they hit monthly lows/highs
- Seasonal variations exist (e.g., December lows late, February lows early)
- Individual stocks may deviate from market averages
- Use patterns to optimize entry/exit timing for options strategies

## File References

### Page & Data
- **Page**: `src/pages/MonthlyAnalysis.tsx` - Main page component
- **Hook**: `src/hooks/useMonthlyStockData.ts` - Data loading and aggregation

### Components
- **MonthlySeasonalityHeatmap**: `src/components/monthly/MonthlySeasonalityHeatmap.tsx` - Seasonality heatmap
- **TimelinePerformanceChart**: `src/components/monthly/TimelinePerformanceChart.tsx` - Historical returns timeline
- **MonthlyStatsTable**: `src/components/monthly/MonthlyStatsTable.tsx` - Detailed metrics table
- **DayOfMonthAnalysis**: `src/components/monthly/DayOfMonthAnalysis.tsx` - Day-of-month analysis container
- **DayDistributionHistogram**: `src/components/monthly/DayDistributionHistogram.tsx` - Daily frequency histogram
- **PeriodComparisonChart**: `src/components/monthly/PeriodComparisonChart.tsx` - Weekly period stacked bars
- **WeeklyHeatmap**: `src/components/monthly/WeeklyHeatmap.tsx` - Weekly intensity heatmap

### Data Source
- **CSV File**: `data/Stocks_Monthly_Data.csv` (17,442+ records)
  - Fields used: `day_low_day_of_month`, `day_high_day_of_month`, `month`, `year`, `name`
