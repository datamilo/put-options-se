# Index Page (Options Analysis Dashboard)

Route: `/`

## Overview
Main options analysis dashboard with filterable table displaying put options data with customizable underlying values and transaction costs.

## Key Components
- **OptionsTable** - Main data table with sorting, filtering, and column management
- **SettingsModal** - User preference configuration

## Data Hooks
- **useEnrichedOptionsData** - Main hook combining options data with user calculations and margin requirements
- **useMarginRequirementsData** - Loads margin requirements data from CSV (via LEFT JOIN in enrichment)
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
- **Margin & Capital**: Est. Total Margin, Est. Margin per Contract, Annualized ROM%, Risk metrics
  - **Note**: Margin fields are ESTIMATES using SRI methodology, not exact Nasdaq requirements
- User-customizable: UnderlyingValue, TransactionCost
- Total Fields: 80+ (67 base options fields + 13 margin fields)

## File References
- **Page**: `src/pages/Index.tsx`
- **Table Component**: `src/components/options/OptionsTable.tsx`
- **Settings**: `src/components/options/SettingsModal.tsx`
- **Data Hook**: `src/hooks/useEnrichedOptionsData.ts`
- **Preferences Hook**: `src/hooks/useMainPagePreferences.ts`
