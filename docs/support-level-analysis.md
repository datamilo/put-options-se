# Support Level Analysis

Route: `/consecutive-breaks`

## Overview
Analyzes how well a stock's low is holding as a support level by detecting and clustering support breaks.

## Key Features
- **Rolling Low Calculation**: Computes N-period rolling minimum of low prices (30, 90, 180, 270, or 365 calendar days)
- **Support Break Detection**: Identifies when rolling low decreases, signaling a break of previous support
- **Break Clustering**: Groups consecutive support breaks within a configurable time window (1-90 days)
- **Multi-Trace Visualization**: Plotly chart with candlestick prices, rolling low line (slate gray dashed), and break markers (amber dots)

## Key Components
- **Plotly Chart** with three traces in unified hover mode:
  - **Candlestick**: OHLC price data (professional blue for up days, muted red for down days)
  - **Rolling Low Line**: Slate gray dashed line tracking support level
    - Hover tooltip shows: "Running Low: X.XX kr" and "Running Low Date: YYYY-MM-DD"
    - Running Low Date = the date when the lowest price in the selected period occurred
  - **Break Markers**: Amber dots marking support breaks

## Data Hooks
- **useConsecutiveBreaksAnalysis** - Core analysis logic
- **useStockData** - Stock data loading

## Data Flow
1. User selects stock and configures filters (rolling period, max gap)
2. `useConsecutiveBreaksAnalysis` hook loads full historical stock data
3. **Calculate on Full History**: `calculateRollingLow()` computes rolling low on entire stockData
   - Ensures all periods have sufficient historical lookback
   - Uses calendar days (not trading days) via `date.setDate(date.getDate() - periodDays)`
4. **Filter to Display Range**: Results filtered to match requested dateFrom/dateTo range
5. `analyzeSupportBreaks()` detects support breaks (when rolling_low decreases)
6. `analyzeConsecutiveBreaks()` clusters breaks within configurable max gap window
7. `calculateBreakStats()` generates stability and timing statistics

## Page Sections
- Metrics cards (total breaks, clusters, multi-break clusters, max breaks)
- Cluster detail cards with statistics:
  - Duration, gaps, total drop
  - **Avg Drop per Break**: Average percentage decline when support breaks
  - **Median Drop per Break**: Median percentage decline when support breaks (more robust than average)
  - Break tables with dates and price movements
- Support break history table

## Important Implementation Notes
- **Historical Lookback**: Rolling low calculated on full historical data, then filtered for display
- **Calendar Day Calculation**: Uses `date.setDate(date.getDate() - periodDays)` for calendar days
- **Performance**: Uses efficient sliding window algorithm for large period selections
- **Visualization**: Charts use Plotly for native financial charting capabilities

## Integration with Support Level Options List

The Support Level Analysis data is the foundation for the **Support Level Options List** page (`/support-level-options`). That page filters put options based on support levels using the same rolling low calculations and metrics available here.

Key metrics from this analysis used by Support Level Options List:
- Rolling low for each stock
- Support stability percentage
- Days since last break
- Median drop per break (used to position strikes at historical worst-case scenarios)

## File References
- **Page**: `src/pages/ConsecutiveBreaksAnalysis.tsx`
- **Hook**: `src/hooks/useConsecutiveBreaksAnalysis.ts` (rolling low calculation at lines 251-256)
- **Types**: `src/types/consecutiveBreaks.ts`
