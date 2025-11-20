# Lower Bound Analysis

Route: `/lower-bound-analysis`

## Overview
Validates IV-based lower bound predictions against historical stock prices. Provides traders with quantifiable evidence that implied volatility (IV) estimates of downside risk are conservative.

## Business Rationale
The Lower Bound Analysis answers: **"How reliable are IV-based downside risk predictions?"**

- **Key Finding**: 83.62% hit rate vs 68% theoretical expectation (from 1-sigma normal distribution)
- **Insight**: IV systematically underestimates downside risk - traders can use this for more confident risk assessments
- **Data Scope**: 102,633+ historical options across 56+ stocks, April 2024 - November 2025

## User-Facing Features

### Summary Metrics Card
Overall statistics including total options analyzed, overall hit rate, total breaches, and stocks analyzed.

### Stock Selector Dropdown
Choose from 56+ stocks to analyze individual performance.

### Three Analysis Tabs

1. **Trend Analysis**:
   - Monthly hit rate evolution with dual y-axis visualization
   - Left axis: Hit rate percentage (0-100%)
   - Right axis: Number of predictions per month (volume)

2. **Distribution**:
   - Multi-trace Plotly visualization showing prediction distributions and breach analysis
   - **Black line**: Continuous daily stock price
   - **Blue violin plots**: Prediction distribution density at each expiry date
   - **Red bars**: Breach count at each expiry date (right y-axis)
   - **Green bars**: Span percentage showing prediction range width

3. **Statistics**:
   - Sortable table with detailed per-expiry metrics
   - Color-coded hit rates: green (≥85%), blue (75-85%), yellow (65-75%), red (<65%)

## Technical Architecture

### Data Flow (`src/hooks/useLowerBoundData.ts`)
1. **useAllLowerBoundData()** - Global hook that loads all three CSV files and aggregates data
2. **useLowerBoundStockData(stock)** - Stock-specific selector hook that filters global data

### Component Architecture

**LowerBoundDistributionChart** (`src/components/lower-bound/LowerBoundDistributionChart.tsx`):

*Why Plotly instead of Recharts:*
- Plotly supports financial violin plots (Recharts does not)
- Native support for subplots with independent y-axes

*Subplot Layout:*
- **Chart 1 (Main)**: Prediction distribution with breaches (top 65%)
- **Chart 2 (Secondary)**: Span percentage (bottom 30%)

*Key Implementation Details:*
- **Data Ready Check**: `isStockDataReady = !stockDataQuery.isLoading && stockDataQuery.allStockData.length > 0`
- **Stock Data Filtering**: Filter to minimum date of `'2024-05-01'` (when options data begins)
- **Plotly Violin Configuration**:
  - `hoveron: 'violins'` - Enables hover interaction with violin shapes
  - `scalemode: 'width'` - Fixed-width violins for consistent visual comparison
  - `width: 432000000` - ~5 day width in milliseconds
  - `hovertemplate: '%{x|%Y-%m-%d}<br>Prediction Range<extra></extra>'` - Single entry per violin
- **Hover Date Format**: All traces use `%{x|%Y-%m-%d}` for consistent YYYY-MM-DD format

*Trace Rendering Order:*
1. Bars first (background)
2. Violins second (middle)
3. Stock line last (foreground)

### Data Files (`/data/`)
- `hit_rate_trends_by_stock.csv` - Monthly hit rate data (1,071 rows)
- `all_stocks_daily_predictions.csv` - Daily predictions (102,633 rows)
- `all_stocks_expiry_stats.csv` - Expiry statistics (2,405 rows)

## Key Design Decisions

1. **Pass dailyPredictions as prop, not load internally** - Prevents duplicate async loading
2. **Filter stock data to 2024-05-01** - Aligns visualization with data analysis period
3. **Use Plotly for violin plots** - Recharts doesn't support violin plot type

## File References
- **Page**: `src/pages/LowerBoundAnalysis.tsx`
- **Distribution Chart**: `src/components/lower-bound/LowerBoundDistributionChart.tsx`
- **Trend Chart**: `src/components/lower-bound/LowerBoundTrendChart.tsx`
- **Table**: `src/components/lower-bound/LowerBoundExpiryTable.tsx`
- **Controls**: `src/components/lower-bound/LowerBoundControls.tsx`
- **Hook**: `src/hooks/useLowerBoundData.ts`
