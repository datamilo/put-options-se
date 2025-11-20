# Index Page (Options Analysis Dashboard)

Route: `/`

## Overview
Main options analysis dashboard with filterable table displaying put options data with customizable underlying values and transaction costs.

## Key Components
- **OptionsTable** - Main data table with sorting, filtering, and column management
- **SettingsModal** - User preference configuration

## Data Hooks
- **useEnrichedOptionsData** - Main hook combining options data with user calculations
- **useRecalculatedOptions** - Applies user settings to option calculations
- **useOptionsData** - Fetches and parses options CSV data
- **useMainPagePreferences** - Main page-specific preferences

## Features

### Dynamic Calculations
- Real-time recalculation based on user settings
- Customizable underlying portfolio value
- Adjustable transaction costs
- Probability calculations and risk metrics

### Advanced Filtering
- Date range selection for option expiry
- Minimum volume/open interest filters
- Stock symbol filtering
- **Strike Price Below Filter**: Uses actual intraday low prices (not close) for accurate filtering
- Column visibility management

## Options Data Fields
- Basic option info: Symbol, OptionName, StrikePrice, ExpiryDate
- Market data: LastPrice, Volume, OpenInterest, ImpliedVolatility
- Calculated metrics: PotentialReturn, BreakEven, ProbabilityITM
- User-customizable: UnderlyingValue, TransactionCost

## File References
- **Page**: `src/pages/Index.tsx`
- **Table Component**: `src/components/options/OptionsTable.tsx`
- **Settings**: `src/components/options/SettingsModal.tsx`
- **Data Hook**: `src/hooks/useEnrichedOptionsData.ts`
- **Preferences Hook**: `src/hooks/useMainPagePreferences.ts`
