# Stock Metrics and History

Routes: `/stock-analysis`, `/stock/:stockName`

## Overview
Individual stock historical price data and performance metrics with stock selector dropdown, OHLC candlestick charts, and comprehensive performance metrics.

## Access Methods
1. **From Horizontal Navigation** (Desktop): Click "Stock Metrics and History" button on the far right of the header
2. **From Mobile Menu**: Open hamburger menu → "Stock Metrics and History"
3. **From Options Table**: Click any stock name in the main options table to navigate directly to that stock's metrics and history
4. **Stock Selector Dropdown**: Available on all Stock Metrics and History views to switch between stocks instantly

## Key Components
- **StockDetails** - Performance metrics display and layout
- **CandlestickChart** - OHLC candlestick chart with volume overlay

## Data Hooks
- **useStockData** - Data loading, calculation logic, and `getAllStockNames()` method for dropdown

## Performance Metrics

### Period Changes
- **Today**: Compares yesterday's closing price to today's closing price
- **Current Week**: Compares last trading day of previous week to current closing price
- **Current Month**: Compares last trading day of previous month to current closing price
- **Current Year**: Compares last trading day of previous year to current closing price

### Calculation Method (Industry Standard)
All period changes use the formula: `((Current Close - Baseline Close) / Baseline Close) × 100`

**Baseline Selection Logic:**
- Week-to-date: Use last Friday's close (last trading day before current week)
- Month-to-date: Use last trading day of previous month's close
- Year-to-date: Use last trading day of previous year's close (Dec 31)

**Key Points:**
- All calculations use **closing prices** for consistency (not open, high, or low)
- Color coding: Green for positive changes, red for negative changes
- Aligns with Yahoo Finance, Bloomberg, and industry financial standards

### Additional Metrics
- **1-Year High/Low**: Maximum and minimum prices from the past 52 weeks
- **Distance from 1-Year High**: Percentage below the 52-week high
- **Distance from 1-Year Low**: Percentage above the 52-week low
- **Annualized Volatility**: Standard deviation of daily returns, annualized using √252 trading days
- **Median Volume**: Median trading volume over the past year
- **Price Range**: Difference between 52-week high and low
- **Range Ratio**: High/low ratio showing volatility relative to price

## Charts
- **OHLC Candlestick Chart**: Interactive chart with time range filters (1M, 3M, 6M, 1Y, ALL)
  - Green candles for bullish days, red for bearish days
  - Optional volume overlay
- **Price Ranges Card**: Shows price ranges for different time periods (1W, 1M, 3M, 6M, 9M, 1Y)

## Date Filtering
- **Date Range Inputs**: Custom date range selection with "From Date" and "To Date" native date inputs
- **Preset Buttons**: Quick access buttons (1M, 3M, 6M, 1Y, ALL) to set common date ranges
- **Auto-initialization**: Dates automatically set to the full available data range when a stock is selected
- **Validation**: Soft validation shows a warning if "To Date" is before "From Date", but continues to display data
- **Scope**: Date filters affect all components - summary metrics, price ranges, and candlestick chart

## File References
- **Page**: `src/pages/StockDetailsPage.tsx`
- **Component**: `src/components/stock/StockDetails.tsx`
- **Hook**: `src/hooks/useStockData.ts` (lines 137-169 for period calculations)
- **Types**: `src/types/stock.ts`
