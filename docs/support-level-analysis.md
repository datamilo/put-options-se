# Support Level Analysis

Route: `/consecutive-breaks`

## Overview
Analyzes how well a stock's low is holding as a support level by detecting and clustering support breaks.

## Key Features
- **Rolling Low Calculation**: Computes N-period rolling minimum of low prices (30, 90, 180, 270, or 365 calendar days)
- **Support Break Detection**: Identifies when rolling low decreases, signaling a break of previous support
- **Break Clustering**: Groups consecutive support breaks within a configurable time window (1-90 days)
- **Multi-Trace Visualization**: Plotly chart with candlestick prices, rolling low line (slate gray dashed), and break markers (amber circles)

## Key Components
- **Plotly Chart** with three traces in unified hover mode:
  - **Candlestick**: OHLC price data (professional blue for up days, muted red for down days)
  - **Rolling Low Line**: Slate gray dashed line tracking support level
  - **Break Markers**: Amber circles marking support breaks

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
- Cluster detail cards with statistics (duration, gaps, drops, break tables)
- Support break history table

## Important Implementation Notes
- **Historical Lookback**: Rolling low calculated on full historical data, then filtered for display
- **Calendar Day Calculation**: Uses `date.setDate(date.getDate() - periodDays)` for calendar days
- **Performance**: Uses efficient sliding window algorithm for large period selections
- **Visualization**: Charts use Plotly for native financial charting capabilities

## File References
- **Page**: `src/pages/ConsecutiveBreaksAnalysis.tsx`
- **Hook**: `src/hooks/useConsecutiveBreaksAnalysis.ts` (rolling low calculation at lines 251-256)
- **Types**: `src/types/consecutiveBreaks.ts`
