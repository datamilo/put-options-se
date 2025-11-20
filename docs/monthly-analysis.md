# Monthly Analysis

Route: `/monthly-analysis`

## Overview
Historical performance analysis with seasonal patterns and drawdown metrics for stocks across different months.

## Key Components
- **MonthlyStatsTable** - Detailed statistics table with sorting/filtering
- **MonthlySeasonalityHeatmap** - Heatmap showing seasonality patterns

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

## Filters & Controls
- **Month Filter**: View statistics for specific months or all months combined
- **Stock Filter**: Filter by individual stock names
- **Search**: Text-based search to find specific stocks
- **Sortable Columns**: Click column headers to sort by any metric

## Key Insights
- High "Pos %" shows months historically favorable for a stock
- "Worst Drawdown %" shows maximum risk (worst month for pullback)
- "Best Drawdown %" of 0% indicates strong support at the opening level in best-case scenarios
- Comparing "Avg Ret %" with "Avg Drawdown %" shows if positive returns come with high intramonth volatility

## File References
- **Page**: `src/pages/MonthlyAnalysis.tsx`
- **Table Component**: `src/components/monthly/MonthlyStatsTable.tsx`
- **Hook**: `src/hooks/useMonthlyStockData.ts`
- **Visualization**: `src/components/monthly/MonthlySeasonalityHeatmap.tsx`
