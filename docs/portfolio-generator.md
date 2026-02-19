# Portfolio Generator

Route: `/portfolio-generator`

## Overview
Portfolio optimization tools with independent settings for generating optimized put options portfolios. Supports four optimization strategies including ML-based scored models ranking.

## Key Components
- **PortfolioOptionsTable** - Results table with clickable stock/option names, margin analysis, and expandable scored model detail rows
- **ColumnManager** - Column visibility management including margin fields
- **V21Breakdown** / **TABreakdown** - Reused from Scored Options page for expandable row detail (scored strategy only)

## Data Hooks
- **useEnrichedOptionsData** - Main hook combining options data with user calculations and margin requirements
- **useMarginRequirementsData** - Loads margin requirements data from CSV (via LEFT JOIN in enrichment)
- **useScoredOptionsData** - Loads `current_options_scored.csv` with V2.1 and TA model scores (used by Scored Models strategy)
- **usePortfolioGeneratorPreferences** - Independent settings for portfolio generator page
  - **Critical**: Uses `hasLoadedFromSupabase` flag to prevent continuous reloading and value reversion

## Optimization Strategies

### 1. Maximize Returns (`returns`)
Prioritizes highest risk-adjusted returns: `(Premium / PotentialLoss) × ProbOfWorthless`

### 2. Minimize Capital (`capital`)
Prioritizes lowest capital requirements: `capitalEfficiencyScore × (prob × 2)`

### 3. Balanced (`balanced`)
Combines both: `(riskAdjustedScore × 0.6) + (capitalEfficiencyScore × 0.4)`

### 4. Scored Models (`scored`)
Ranks options using a weighted blend of V2.1 Probability Optimization and TA V3 Technical Analysis model scores from `current_options_scored.csv`.

**Scoring formula:**
```
finalScore = (v21Weight / 100) × v21_score + ((100 - v21Weight) / 100) × (ta_probability × 100)
```

**Key behaviors:**
- Only options present in `current_options_scored.csv` are eligible
- User-configurable V2.1/TA weight via slider (default 50/50, steps of 5)
- Weight slider only visible when Scored Models strategy is selected
- Table shows scored-specific columns: selected PoW field, Combined Score, V2.1 Score, TA Probability
- Each row has an expandable detail showing V2.1 Breakdown and TA Breakdown panels

## Algorithm
1. **Data Loading** - Load options and stock data (+ scored options data for Scored Models)
2. **Recalculation** - Apply user settings (underlying value, transaction cost). All position-size-dependent SEK fields are recalculated using the portfolio's own underlying value: `LossAtBadDecline`, `LossAtWorstDecline`, `LossAt100DayWorstDecline`, `LossAt_2008_100DayWorstDecline`, `LossAt50DayWorstDecline`, `LossAt_2008_50DayWorstDecline`, `Loss_Least_Bad`, `LossAtIV2sigmaDecline`, `LossAtCVaR10pctDecline`, `PotentialLossAtLowerBound`, `EstTotalMargin`
3. **Filtering** - Apply filters: expiry date, min/max probability, strike below period, excluded stocks, and scored data availability (for Scored Models)
4. **Scoring** - Calculate score per strategy (risk metrics for returns/capital/balanced, weighted model blend for scored)
5. **Sorting** - Sort by finalScore descending
6. **Selection** - Pick top options (max one per stock) until premium target reached, respecting optional capital cap
7. **Fill Pass** - Second pass to get closer to premium target with remaining options

## Settings

| Setting | Default | Range | Notes |
|---------|---------|-------|-------|
| `totalPremiumTarget` | 500 | 500–1,000,000 SEK | Target total premium |
| `portfolioUnderlyingValue` | 100,000 | 10,000–1,000,000 SEK | Underlying value per option |
| `selectedProbabilityField` | `ProbWorthless_Bayesian_IsoCal` | 5 PoW methods | Probability field for filtering and display |
| `optimizationStrategy` | `returns` | returns, capital, balanced, scored | Optimization approach |
| `v21Weight` | 50 | 0–100 | V2.1 vs TA weight (scored strategy only) |
| `strikeBelowPeriod` | null | 7–365 days | Optional strike below period low filter |
| `minProbabilityWorthless` | null | 40–100% | Optional minimum probability floor |
| `maxProbabilityWorthless` | null | 40–100% | Optional maximum probability ceiling |
| `selectedExpiryDate` | "" | Available dates | Optional expiry date filter |
| `maxTotalCapital` | null | Unlimited | Optional cap on total underlying value |
| `excludedStocks` | [] | Per stock | Stocks to exclude from portfolio |

## Default Table Columns

**Returns / Capital / Balanced strategies:**
StockName, OptionName, ExpiryDate, DaysToExpiry, StrikePrice, Premium, NumberOfContractsBasedOnLimit, 1_2_3_ProbOfWorthless_Weighted, PotentialLossAtLowerBound, EstTotalMargin

**Scored Models strategy:**
StockName, OptionName, ExpiryDate, DaysToExpiry, StrikePrice, Premium, NumberOfContractsBasedOnLimit, [selected PoW field], Combined Score, V2.1 Score, TA Probability

All score values formatted as Nordic decimal with 1 decimal place.

## Generated Portfolio Navigation
Users can click on stock names or option names in the results table to open detail pages in new browser tabs.

## File References
- **Page**: `src/pages/PortfolioGenerator.tsx`
- **Table Component**: `src/components/options/PortfolioOptionsTable.tsx`
- **Preferences Hook**: `src/hooks/usePortfolioGeneratorPreferences.ts`
- **Scored Data Hook**: `src/hooks/useScoredOptionsData.ts` (shared with Scored Options page)
- **Expandable Detail**: `src/components/scored-options/V21Breakdown.tsx`, `src/components/scored-options/TABreakdown.tsx`
