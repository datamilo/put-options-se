# Portfolio Generator

Route: `/portfolio-generator`

## Overview
Portfolio optimization tools with independent settings for generating optimized put options portfolios.

## Key Components
- **PortfolioOptionsTable** - Results table with clickable stock/option names

## Data Hooks
- **usePortfolioGeneratorPreferences** - Independent settings for portfolio generator page
  - **Critical**: Uses `hasLoadedFromSupabase` flag to prevent continuous reloading and value reversion

## Algorithm
1. **Data Loading** - Load options and stock data
2. **Recalculation** - Apply user settings (underlying value, transaction cost)
3. **Filtering** - Apply multiple filters (date, probability, strike price, volume, etc.)
4. **Risk Metrics** - Calculate Expected Value, EV per Capital, Risk-Adjusted Score
5. **Sorting** - Sort by selected strategy (EV, EV per Capital, Risk-Adjusted)
6. **Selection** - Pick top options (max one per stock) until premium target reached
7. **Statistics** - Calculate portfolio-level metrics

## Generated Portfolio Navigation
Users can click on stock names or option names in the "Generated Portfolio" results table to open detail pages in new browser tabs.

**Implementation**:
- **Click Handlers**: `handleOptionClick()` and `handleStockClick()` in `src/pages/PortfolioGenerator.tsx` (lines 424-439)
- **Behavior**: Opens stock/option details in new tabs (`window.open(..., '_blank')`)
- **URL Construction**: Dynamically detects base path from current URL for GitHub Pages compatibility

## File References
- **Page**: `src/pages/PortfolioGenerator.tsx`
- **Table Component**: `src/components/options/PortfolioOptionsTable.tsx`
- **Preferences Hook**: `src/hooks/usePortfolioGeneratorPreferences.ts`
