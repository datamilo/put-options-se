# Support Level Options List

Route: `/support-level-options`

## Overview

Filter and analyze put options based on support levels. Users can browse options filtered by rolling low periods, support break history, and strike positioning to find options positioned relative to support levels.

## Key Features

- **Rolling Low Period Selection**: Choose support timeframe (30, 90, 180, 270, or 365 days)
- **Expiry Date Filtering**: Filter options by expiration date with smart default (third Friday of next month)
- **Support Break Filtering**: Filter by days since last support break
- **Strike Position Strategies**: Position strikes at support, at median drop below support, custom % below support, or any position
- **Real-time Results**: Instantly see matching options in results table
- **Support Metrics**: Display current stock price, rolling low, distance to support, and days since break
- **Median Drop Integration**: Shows historical median drop per break for risk assessment
- **Quick Navigation**: Links to detailed option analysis and support level analysis for each result

## How It Works

### User Workflow

1. **Select Rolling Low Period**: Choose which timeframe defines the support level
   - 30 days: Short-term support
   - 90 days: Medium-term support (default)
   - 180 days: Long-term support
   - 270 days: Long-term support
   - 365 days: Annual support

2. **Select Expiry Date**: Choose the option expiration date
   - Defaults to third Friday of next month (same as main dashboard)
   - Can select any available expiry date

3. **Configure Support Filters**:
   - **Min Days Since Last Break**: Minimum days elapsed since support was last broken

4. **Select Strike Position Strategy**:
   - **At Support Level**: Strike within 2% of current rolling low
   - **At Median Drop Below Support**: Strike positioned at historical median drop percentage below support
   - **Custom % Below Support**: Strike at specific percentage below support
   - **Any Position**: No position filtering

5. **Review Results**: Table shows matching options with support metrics and links for further analysis
   - All links open in new browser tabs, keeping the Support Level Options List available for continued browsing

### Data Flow

1. For each stock in the dataset:
   - Calculate rolling low as the minimum intraday low price within the selected period (same as "Strike Price Below" filter)
   - Analyze support breaks and clusters using the same period
   - Calculate support stability (% of days without breaks)
   - Calculate median drop per break from historical clusters

2. Filter options based on:
   - Minimum days since last support break
   - Strike price must be at or below rolling low
   - Strike position relative to rolling low
   - Current stock price vs strike and support

3. Return ranked results (sorted by premium descending)

## Filter Criteria Explained

### Rolling Low Period (dropdown)
Determines which timeframe is used to calculate the support level. The rolling low is the **minimum intraday low price** from the stock's historical data within the selected period. This uses the same calculation as the "Strike Price Below" filter on the main Options Dashboard for consistency.

### Days Since Last Break (number)
Minimum number of days required since the support level was last broken. Helps identify if support is currently holding.
- 0 days = Recently broken support (risky)
- 30 days = Support holding for a month
- 90+ days = Well-established support

### Strike Position Strategies

**At Support Level**
- Strike price within 2% of rolling low
- Risky: Stock is close to support
- High probability of loss if support breaks
- Good for high-conviction trades only

**At Median Drop Below Support**
- Strike positioned at support minus the historical median drop percentage
- Based on actual historical break severity
- If median drop is 5%, strike would be ~5% below support
- Balances risk/reward based on history

**Custom % Below Support**
- Strike at specific percentage below support
- Example: 10% below would be at support × 0.90
- Flexible approach for custom strategies

**Any Position**
- No strike position filtering
- Shows all matching options regardless of strike placement

## Results Table Columns

All columns (except Support Analysis) are clickable to sort the table by that field. Click again to reverse sort direction. An arrow indicator shows the current sort field and direction.

- **Stock**: Company name (clickable - opens stock analysis in new tab, or sorts table)
- **Option**: Option identifier (clickable - opens option details in new tab, or sorts table)
- **Current Price**: Latest stock price (sortable)
- **Strike**: Put option strike price (sortable)
- **Support (Xd)**: Rolling low support level for selected period (sortable)
- **Distance to Support**: % distance from current price to support (sortable)
  - **RED (<5%)**: Critical - stock is very close to support
  - **ORANGE (5-10%)**: Warning - stock approaching support
  - **Normal text (>10%)**: Stock has distance from support
- **Strike vs Support**: % position of strike relative to support (sortable)
  - Negative (GREEN): Strike below support
  - Positive: Strike above support
  - Near 0%: Strike at support
- **Median Drop/Break**: Historical median percentage drop when support breaks (sortable)
- **Premium**: Total premium collected for 100k SEK position (sortable)
- **PoW - Bayesian Calibrated**: Probability of worthless using Bayesian calibrated model (sortable)
- **PoW - Original**: Probability of worthless using original Black-Scholes method (sortable)
- **Days to Expiry**: Days until option expiration (sortable)
- **Support Stability**: Percentage of trading days within the rolling period where the rolling low held without being broken. A tooltip (info icon) provides detailed explanation of this metric (sortable)
- **Days Since Break**: Days since last support break (sortable)
- **Support Analysis**: Link to view detailed support level analysis for the stock, including rolling low chart, break history, and stability metrics (opens in new tab)

## Configuration Examples

### Conservative Strategy (Strong Support)
- Rolling Period: 180 days
- Min Days Since Break: 60
- Strike Position: At Median Drop Below Support
- Result: Long-term support with recently-held levels; strikes positioned for worst-case historical scenarios

### Balanced Approach (Default)
- Rolling Period: 90 days
- Min Days Since Break: 30
- Strike Position: At Median Drop Below Support
- Result: Medium-term support with prudent strike positioning

### Short-Term Support
- Rolling Period: 30 days
- Min Days Since Break: 14
- Strike Position: Custom % Below Support (5-10%)
- Result: Short-term support with flexibility in strike placement

## Technical Details

### Hook: `useSupportBasedOptionFinder`
Located in `src/hooks/useSupportBasedOptionFinder.ts`

**Key Functions:**
- `calculateSupportMetrics(rollingPeriod)`: Calculates support metrics for given period
- `findOptions(criteria)`: Filters and ranks options based on criteria

**Returns:**
- `findOptions`: Function to filter options
- `isLoading`: Loading state

### Types

**SupportMetrics**
- stockName, currentPrice, rollingLow, daysSinceLastBreak
- supportStability, numBreaks
- medianDropPerBreak, avgDropPerBreak, lastBreakDate

**FilterCriteria**
- rollingPeriod: Selected period in days
- minDaysSinceBreak: Minimum days since last break
- strikePosition: Strategy for positioning strikes
- percentBelow: Custom percentage below support (optional)
- expiryDate: Optional specific expiry date filter

**SupportBasedOption**
- Option data with calculated support metrics and distances

### Page Component: `SupportBasedOptionFinder`
Located in `src/pages/SupportBasedOptionFinder.tsx`

## Data Integration

- **Support Analysis**: Uses `useConsecutiveBreaksAnalysis` hook
  - Calculates rolling low for each stock
  - Analyzes support breaks and clusters
  - Computes support stability and median drop metrics

- **Options Data**: Uses `useEnrichedOptionsData` hook
  - Loads all available put options
  - Includes strike prices, premiums, probabilities

- **Stock Data**: Uses `useStockData` hook
  - Historical OHLC data
  - Current prices

## Important Notes

- **Support Level Calculation**: Calculated on full historical data, then filtered to display range
- **Calendar Days**: Uses calendar days, not trading days, for rolling period calculations
- **Performance**: Client-side filtering handles up to thousands of options efficiently
- **Real-time Updates**: Support metrics update dynamically when rolling period changes
- **Median Drop Calculation**: Based on clusters of consecutive support breaks within the selected period

## File References
- **Page**: `src/pages/SupportBasedOptionFinder.tsx`
- **Hook**: `src/hooks/useSupportBasedOptionFinder.ts`
- **Types**: `src/types/consecutiveBreaks.ts` (SupportMetrics, FilterCriteria)
