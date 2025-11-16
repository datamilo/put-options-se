# Put Options SE - Project Summary for Claude Code

---
## ⚠️ CRITICAL WORKFLOW RULE - READ THIS FIRST ⚠️

**MANDATORY GIT WORKFLOW - NO EXCEPTIONS:**

After making ANY changes to this project, you MUST immediately:
1. Run `npm run build` to test the build
2. Run `git add -A` to stage all changes
3. Run `git commit -m "descriptive message"` to commit
4. Run `git push` to sync with GitHub
5. Verify the push succeeded

**DO NOT:**
- ❌ Continue to other tasks without committing
- ❌ Accumulate multiple changes before committing
- ❌ Skip the push step
- ❌ Forget to verify the push succeeded

**This is not optional. Every code change MUST be immediately committed and pushed to GitHub.**

---

## Project Overview
Put Options SE is a comprehensive financial analysis web application focused on put options trading and stock market analysis. The application provides sophisticated tools for analyzing put options data, calculating potential returns, and visualizing market trends with customizable parameters.

## Project Goals
- **Options Analysis**: Provide detailed analysis of put options with customizable underlying values and transaction costs
- **Risk Assessment**: Calculate potential returns, probabilities, and risk metrics for options trading
- **Data Visualization**: Interactive charts and heatmaps for seasonal analysis and market trends
- **Portfolio Generation**: Tools for generating optimized put options portfolios
- **Monthly Analysis**: Historical performance analysis with seasonal patterns
- **User Customization**: Personalized settings with database persistence

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling and development
- **Tailwind CSS** for styling with custom design system
- **shadcn/ui** component library with Radix UI primitives
- **React Router Dom** for navigation
- **TanStack Query** for data fetching and caching
- **Recharts** for data visualization
- **Next Themes** for dark/light mode support

### Backend & Data
- **Supabase** for authentication and user preferences storage
- **CSV Data Processing** with Papa Parse
- **Static Data Files** (CSV format) for options and stock data
- **Local Storage** fallback for unauthenticated users

### Development Tools
- **ESLint** for code linting
- **TypeScript** for type safety
- **Lucide React** for icons

## Key Application Structure

### Core Pages
- **Index** (`/`) - Main options analysis dashboard with filterable table
- **Portfolio Generator** (`/portfolio-generator`) - Portfolio optimization tools with independent settings
- **Monthly Analysis** (`/monthly-analysis`) - Historical performance, seasonality, and drawdown metrics
- **Financial Reporting Volatility** (`/volatility-analysis`) - Stock event volatility tracking
- **Support Level Analysis** (`/consecutive-breaks`) - Stock support level strength and break analysis (formerly Stock Price Stats)
- **Stock Analysis** (`/stock-analysis`, `/stock/:stockName`) - Individual stock performance with stock selector dropdown
- **Option Details** (`/option/:optionId`) - Detailed individual option analysis
- **Authentication** (`/auth`, `/auth/callback`) - User login/signup

### Key Components

#### Data Management Hooks
- **useEnrichedOptionsData** - Main hook combining options data with user calculations
- **useRecalculatedOptions** - Applies user settings to option calculations
- **useOptionsData** - Fetches and parses options CSV data
- **useStockData** - Fetches and parses stock price data (OHLC format with volume), provides `getAllStockNames()` for stock selector dropdown
- **useMonthlyStockData** - Historical stock performance data
- **useVolatilityData** - Stock event volatility data
- **useProbabilityHistory** - Historical probability tracking
- **useIVData** - Implied volatility potential decline data
- **useConsecutiveBreaksAnalysis** - Support level analysis with rolling lows and break detection
- **useUserPreferences** - Supabase integration for main page user settings
- **usePortfolioGeneratorPreferences** - Independent settings for portfolio generator page
- **useMainPagePreferences** - Main page-specific preferences
- **useTimestamps** - Data file timestamp tracking

#### UI Components
- **OptionsTable** - Main data table with sorting, filtering, and column management
- **OptionsChart** - Interactive price/volume charts
- **CandlestickChart** - OHLC candlestick chart with volume overlay for stock analysis
- **StockChart** - Legacy line chart component (replaced by CandlestickChart)
- **MonthlySeasonalityHeatmap** - Seasonal performance visualization
- **SettingsModal** - User preference configuration
- **NavigationMenu** - App navigation with dropdown menu

#### Settings & Context
- **SettingsContext** - Global state for underlying value and transaction costs
- **AuthProvider** - Supabase authentication wrapper

## Data Structure

### Options Data Fields
- Basic option info: Symbol, OptionName, StrikePrice, ExpiryDate
- Market data: LastPrice, Volume, OpenInterest, ImpliedVolatility
- Calculated metrics: PotentialReturn, BreakEven, ProbabilityITM
- User-customizable: UnderlyingValue, TransactionCost

### Stock Data (OHLC Format)
- **OHLC Fields**: open, high, low, close prices for each trading day
- **Volume Data**: Daily trading volume
- **Date**: Trading date for each data point
- **Percentage Change**: Daily close price change percentage
- Historical data used for price range calculations and chart visualization

## Key Features

### 1. Dynamic Calculations
- Real-time recalculation based on user settings
- Customizable underlying portfolio value
- Adjustable transaction costs
- Probability calculations and risk metrics

### 2. Advanced Filtering
- Date range selection for option expiry
- Minimum volume/open interest filters
- Stock symbol filtering
- **Strike Price Below Filter**: Uses actual intraday low prices (not close) for accurate filtering
- Column visibility management

### 3. Data Visualization
- **OHLC Candlestick Charts**: Full price action visualization with open, high, low, close data
  - Green candlesticks for bullish days (close ≥ open)
  - Red candlesticks for bearish days (close < open)
  - Optional volume overlay with dual Y-axis
  - Time range filters (1M, 3M, 6M, 1Y, ALL)
- Interactive charts with Recharts
- Seasonality heatmaps
- Risk/return scatter plots
- Performance ranking charts

### 4. User Preferences
- Persistent settings via Supabase
- localStorage fallback for guest users
- Column visibility preferences
- Calculation parameter storage

### 5. Monthly Analysis & Seasonality
The Monthly Analysis page (`/monthly-analysis`) provides historical performance data and seasonality patterns for stocks across different months.

**Detailed Statistics Table Metrics:**

**Return Metrics:**
- **Pos %**: Percentage of months with positive returns (closing price went up)
- **Avg Ret %**: Average percentage return across all historical occurrences of that month
- **Avg Drawdown %**: Average intramonth drawdown (average decline from month's opening price to lowest price during that month)
- **Worst Drawdown %**: Worst-case intramonth drawdown ever recorded (most negative decline from open to low)
- **Best Drawdown %**: Best-case intramonth drawdown (smallest decline or 0% if price held above opening)

**Drawdown Definition:**
Drawdown measures the percentage decline from the **opening price** of the month to the **lowest price** reached during that month.
- Negative values indicate the stock declined from open to low
- 0% or positive values indicate the stock never dropped below its opening price
- Example: If a stock opened at $100 and the low was $95, the drawdown for that month is -5%

**Filters & Controls:**
- **Month Filter**: View statistics for specific months or all months combined
- **Stock Filter**: Filter by individual stock names
- **Search**: Text-based search to find specific stocks
- **Sortable Columns**: Click column headers to sort by any metric

**Key Insights:**
- High "Pos %" shows months historically favorable for a stock
- "Worst Drawdown %" shows maximum risk (worst month for pullback)
- "Best Drawdown %" of 0% indicates strong support at the opening level in best-case scenarios
- Comparing "Avg Ret %" with "Avg Drawdown %" shows if positive returns come with high intramonth volatility

**File References:**
- **Page**: `src/pages/MonthlyAnalysis.tsx` - Main page layout
- **Component**: `src/components/monthly/MonthlyStatsTable.tsx` - Detailed statistics table with sorting/filtering
- **Hook**: `src/hooks/useMonthlyStockData.ts` - Data loading and statistics calculation
- **Visualization**: `src/components/monthly/MonthlySeasonalityHeatmap.tsx` - Heatmap showing seasonality patterns

### 6. Responsive Design
- Mobile-optimized layouts
- Dark/light theme support
- Collapsible navigation
- Touch-friendly interactions

### 7. Stock Analysis & Performance Metrics
The Stock Analysis page (`/stock-analysis`, `/stock/:stockName`) provides comprehensive performance metrics and historical analysis for individual stocks with multiple access methods.

**Access Methods:**
1. **From Navigation Menu**: Click menu → "Stock Analysis" to access the page with a default stock and dropdown selector
2. **From Options Table**: Click any stock name in the main options table to navigate directly to that stock's analysis with "Back to Options" button
3. **Stock Selector Dropdown**: Available on all Stock Analysis views to switch between stocks instantly

**Performance Metrics Displayed:**
- **Today**: Compares yesterday's closing price to today's closing price
- **Current Week**: Compares last trading day of previous week to current closing price
- **Current Month**: Compares last trading day of previous month to current closing price
- **Current Year**: Compares last trading day of previous year to current closing price

**Calculation Method (Industry Standard):**
All period changes use the formula: `((Current Close - Baseline Close) / Baseline Close) × 100`

**Key Points:**
- All calculations use **closing prices** for consistency (not open, high, or low)
- Week baseline: Last Friday's close before current trading week
- Month baseline: Last trading day of previous month (e.g., Dec 31 for January)
- Year baseline: Last trading day of previous year (e.g., Dec 31, 2024 for 2025)
- Color coding: Green for positive changes, red for negative changes
- This approach aligns with Yahoo Finance, Bloomberg, and industry financial standards

**Additional Metrics:**
- **1-Year High/Low**: Maximum and minimum prices from the past 52 weeks
- **Distance from 1-Year High**: Percentage below the 52-week high
- **Distance from 1-Year Low**: Percentage above the 52-week low
- **Annualized Volatility**: Standard deviation of daily returns, annualized using √252 trading days
- **Median Volume**: Median trading volume over the past year
- **Price Range**: Difference between 52-week high and low
- **Range Ratio**: High/low ratio showing volatility relative to price

**Charts:**
- **OHLC Candlestick Chart**: Interactive chart showing open, high, low, close data with volume overlay
  - Time range filters: 1M, 3M, 6M, 1Y, ALL
  - Green candles for bullish days, red for bearish days
- **Price Ranges Card**: Shows price ranges for different time periods (1W, 1M, 3M, 6M, 9M, 1Y)

**Stock Selector Dropdown:**
- Displays all available stocks from the data source
- Sorted alphabetically for easy navigation
- Selecting a stock automatically updates the URL and displays that stock's analysis
- Available when accessed via `/stock-analysis` (default to first stock) or `/stock/:stockName` (shows current stock)
- "Back to Options" button only visible when accessed from options table navigation

**File References:**
- **Page**: `src/pages/StockDetailsPage.tsx` (lines 1-230) - Route handler for both `/stock-analysis` and `/stock/:stockName` routes
- **Component**: `src/components/stock/StockDetails.tsx` - Performance metrics display and layout
- **Hook**: `src/hooks/useStockData.ts` - Data loading, calculation logic for period changes, and `getAllStockNames()` method for dropdown
- **Navigation**: `src/components/NavigationMenu.tsx` - Adds "Stock Analysis" link to dropdown menu
- **Router**: `src/App.tsx` - Routes for `/stock-analysis` and `/stock/:stockName`
- **Types**: `src/types/stock.ts` - StockData and StockSummary interfaces

### 8. Support Level Analysis
The Support Level Analysis dashboard analyzes how well a stock's low is holding as a support level by detecting and clustering support breaks.

**Key Features:**
- **Rolling Low Calculation**: Computes N-period rolling minimum of low prices (30, 90, 180, 270, or 365 calendar days)
  - Uses full historical data to ensure proper calendar day lookback for all periods
  - Each day's rolling low = minimum low of all trading days within the rolling period window
- **Support Break Detection**: Identifies when rolling low decreases, signaling a break of previous support
- **Break Clustering**: Groups consecutive support breaks within a configurable time window (1-90 days)
- **Multi-Trace Visualization**: Plotly chart with candlestick prices, rolling low line (blue dashed), and break markers (red circles)
- **Detailed Analytics**:
  - Metric cards showing total breaks, clusters, multi-break cluster count, and max breaks in a cluster
  - Cluster statistics cards (duration, gaps between breaks, total/average drops) for each cluster
  - Support break history table with detailed break information
  - Stability metrics and trading days per break analysis

**Data Flow:**
1. User selects stock and configures filters (rolling period: 30/90/180/270/365 calendar days)
2. `useConsecutiveBreaksAnalysis` hook loads stock data via `useStockData`
3. **Calculate on Full History**: `calculateRollingLow()` computes rolling low on entire stockData
   - Ensures all periods have sufficient historical lookback
   - Works correctly for 270-day and 365-day periods
4. **Filter to Display Range**: Results filtered to match requested dateFrom/dateTo range
5. `analyzeSupportBreaks()` detects support breaks (when rolling_low decreases)
6. `analyzeConsecutiveBreaks()` clusters breaks within configurable max gap window
7. `calculateBreakStats()` generates stability and timing statistics
8. Plotly chart renders with three traces (candlesticks, rolling low, breaks)
9. Tables and metrics display cluster details and statistics

**File Structure:**
- **Page**: `src/pages/ConsecutiveBreaksAnalysis.tsx` - Main dashboard with Plotly visualization
- **Hook**: `src/hooks/useConsecutiveBreaksAnalysis.ts` - Core analysis logic (rolling low calculation on full stockData at lines 251-256)
- **Types**: `src/types/consecutiveBreaks.ts` - Data structure definitions
- **Data**: `/data/stock_data.csv` - OHLC stock price data with format `date|name|open|high|low|close|volume|pct_change_close`

**Important Implementation Notes:**
- The route uses `/consecutive-breaks` but displays as "Support Level Analysis" in navigation
- **Historical Lookback**: Rolling low calculated on full historical data, then filtered for display
  - This ensures 365-day periods can look back 365 calendar days even if user only views recent dates
- **Calendar Day Calculation**: Rolling low uses `date.setDate(date.getDate() - periodDays)` which operates on calendar days, not trading days
- **Performance**: Uses efficient sliding window algorithm for large period selections
- **Visualization**: Charts use Plotly for native financial charting capabilities (candlestick support, multi-trace unified hover)
- **Data Independence**: All data stored in `/data/` folder, not dependent on external APIs or services

## Authentication & User Management
- **Supabase Auth** for user management
- **Protected Routes** for authenticated features
- **Guest Mode** with localStorage persistence
- **Row Level Security** for user data isolation

## Data Sources
- Static CSV files in `/data` (tracked in git)
- Python scripts for data generation (`portfolio_generator.py`)
- Automated data updates with timestamps

## Settings & Preferences Architecture

### Two Independent Settings Systems
The application maintains **two separate settings systems** to avoid conflicts:

1. **Main Page Settings** (Index page)
   - Managed by `useMainPagePreferences` hook
   - Controls: underlyingValue, transactionCost, column visibility
   - Stored in Supabase `user_preferences` table
   - Falls back to localStorage for guest users

2. **Portfolio Generator Settings** (Portfolio Generator page)
   - Managed by `usePortfolioGeneratorPreferences` hook
   - Controls: portfolioUnderlyingValue, transactionCost, filtering criteria, generated portfolio data
   - Stored in Supabase `portfolio_preferences` table
   - Falls back to localStorage for guest users
   - **Critical**: Uses `hasLoadedFromSupabase` flag to prevent continuous reloading and value reversion

### Settings Persistence Flow
1. User modifies value in UI
2. Local state updates immediately
3. Value saved to localStorage
4. If authenticated, value upserted to Supabase
5. On page reload, settings load from Supabase (if authenticated) or localStorage (if guest)

## Current Application State

### Fully Functional Features
The application is fully functional with all major features implemented and working correctly.

### Current Limitations
- **Static Data**: Relies on pre-generated CSV files, not real-time market data
- **GitHub Pages Deployment**: Specific basename handling for GitHub Pages vs other environments
- **CSV Processing**: Large datasets may impact initial load performance

## Development Notes

### Documentation Standards
**CRITICAL**: This documentation reflects the **current state of the project only**.
- Only document how the application **currently works**, not how it used to work
- Remove past fixes, troubleshooting, and historical issues once they're resolved
- When fixing bugs or implementing features, update documentation to reflect the current implementation
- Delete outdated troubleshooting sections and historical context
- This keeps documentation focused, accurate, and prevents confusion about what's actually working

### Git & GitHub Workflow - MANDATORY PROCESS

⚠️ **CRITICAL: This workflow is non-negotiable. Every code change follows these steps in order.**

**STEP 1: Make code changes**
- Edit files and save

**STEP 2: Build and test locally**
```bash
npm run build
```
- Ensure no errors in build output
- Test locally to verify changes work

**STEP 3: Stage and commit changes**
```bash
git add .
git commit -m "$(cat <<'EOF'
Brief summary of changes

- Detailed bullet points of what was added/modified
- Include file paths and component names
- Mention any breaking changes or important notes

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

**STEP 4: PUSH TO GITHUB (DO NOT SKIP THIS STEP)**
```bash
git push
```
- This step is mandatory and must run every time
- If you skip this, your work is NOT complete

**STEP 5: Verify on GitHub**
- Visit https://github.com/datamilo/put-options-se
- Confirm your changes appear in the repository
- Confirm your commit message is visible in the commit log

⚠️ **CRITICAL REMINDER: DO NOT STOP AFTER STEP 3**
- Committing without pushing is incomplete work
- Always finish the full workflow: Step 1 → 2 → 3 → 4 → 5
- If `git status` shows `ahead of origin/main`, you skipped the push

**Verification Checklist:**
- [ ] Code changes made and tested locally
- [ ] `npm run build` completed with no errors
- [ ] `git commit` completed with clear message
- [ ] `git push` completed successfully
- [ ] `git status` shows `Your branch is up to date with 'origin/main'`
- [ ] GitHub repository reflects the changes when visited

**Why this is non-negotiable:**
- The remote repository MUST always reflect the current state of the codebase
- Changes must be properly tracked and documented in git history
- Prevents merge conflicts and makes debugging easier
- Keeps the repository clean and organized
- User expects changes to be on GitHub immediately

### Important Patterns
- Use `useEnrichedOptionsData` for options table data (already includes recalculations)
- Avoid calling `useRecalculatedOptions` on already enriched data
- **Main Page vs Portfolio Generator**: Maintain separate settings systems - never mix them
- Settings context handles both authenticated and guest user scenarios
- Always use semantic tokens from design system, never direct colors
- When creating new preference hooks, use `hasLoadedFromSupabase` flag to prevent continuous reloading
- Input fields should sync with settings via useEffect, but avoid infinite loops
- **OHLC Data**: Always use `low` field for period lows and `high`/`low` for ranges (not close prices)
- **Stock Charts**: Use CandlestickChart component for stock detail pages (shows OHLC data visually)
- **Stock Period Changes**: Calculate percentage changes using previous period's closing price as baseline
  - Week-to-date: Use last Friday's close (last trading day before current week)
  - Month-to-date: Use last trading day of previous month's close
  - Year-to-date: Use last trading day of previous year's close (Dec 31)
  - Formula: `((current - baseline) / baseline) × 100`
  - Always use `.close` field for consistency with financial industry standards
- **Support Level Analysis**:
  - Uses Plotly (not Recharts) for financial charting - native support for candlesticks and multi-trace visualization
  - **Critical**: Calculate rolling low on FULL historical stockData, not filtered date range
  - Rolling low uses calendar days (not trading days) in lookback window via `date.setDate(date.getDate() - periodDays)`
  - Always pass full stockData to `calculateRollingLow()`, then filter results for display
  - This ensures all periods (30/90/180/270/365 days) have sufficient historical lookback
  - Example: For 365-day rolling low, need up to 365 days of history before display date - full data calculation provides this
- **Performance**: Support Level Analysis uses optimized sliding window algorithm - avoid nested loops that iterate over all historical data for large periods

### File Organization
- `/src/hooks` - Custom React hooks for data fetching and calculations
  - Data fetching hooks: `useOptionsData`, `useStockData`, `useMonthlyStockData`, etc.
  - Calculation hooks: `useRecalculatedOptions`, `useEnrichedOptionsData`, `useConsecutiveBreaksAnalysis`
  - Preference hooks: `useUserPreferences`, `usePortfolioGeneratorPreferences`, `useMainPagePreferences`
- `/src/components` - Reusable UI components organized by feature
  - `/options` - Options table, charts, and details
  - `/stock` - Stock charts and details
  - `/monthly` - Monthly analysis visualizations
  - `/volatility` - Volatility analysis components
  - `/probability` - Probability analysis components (recovery & validation)
- `/src/pages` - Route components
- `/src/types` - TypeScript interfaces
- `/src/contexts` - React context providers (SettingsContext, AuthProvider)
- `/src/auth` - Authentication components and protected routes
- `/data` - Static CSV data files (source of truth, tracked in git)
  - `stock_data.csv` - OHLC format stock data
  - `data.csv` - Options data
  - `recovery_report_data.csv` - Probability recovery analysis data
  - `validation_report_data.csv` - Probability validation data
  - Other CSV files for volatility, monthly, and historical data
- `/src/components/ui` - shadcn/ui component library

### Design System
- Custom HSL color tokens in `index.css`
- Tailwind config with semantic color mapping
- Component variants for different states
- Consistent spacing and typography scales

## Data Flow Architecture

### Options Data Pipeline
1. **CSV Files** → `/data/data.csv` (options) and `/data/stock_data.csv` (OHLC format)
2. **useOptionsData** → Fetches and parses CSV with Papa Parse
3. **useStockData** → Fetches and parses OHLC stock data (open, high, low, close, volume)
4. **useEnrichedOptionsData** → Combines options + stock data + user settings
5. **useRecalculatedOptions** → Applies calculation formulas (used internally by useEnrichedOptionsData)
6. **Components** → Consume enriched data for display

### Stock Data Pipeline (OHLC)
1. **CSV Source** → GitHub raw CSV from `/data/stock_data.csv`
2. **Format** → Pipe-delimited: `date|name|open|high|low|close|volume|pct_change_close`
3. **useStockData Hook** → Parses all OHLC fields as numeric values
4. **Price Calculations**:
   - `getLowPriceForPeriod()` → Uses `low` field for accurate period lows
   - `getPriceRangeForPeriod()` → Uses `high` and `low` fields for true ranges
   - `getStockSummary()` → Calculates 52-week high/low from OHLC data
5. **Visualization** → CandlestickChart component renders OHLC data with optional volume

### Stock Period Change Calculations
The Stock Details page calculates percentage changes for different time periods using industry-standard methodology:

**Period Change Formula:** `((Current Close - Baseline Close) / Baseline Close) × 100`

**Baseline Selection Logic:**
1. **Current Week Baseline**:
   - Identifies start of current trading week (Monday)
   - Searches for last trading day BEFORE Monday
   - Uses that day's closing price as baseline
   - Formula: `((latestData.close - previousWeekData.close) / previousWeekData.close) × 100`

2. **Current Month Baseline**:
   - Identifies 1st day of current month
   - Searches for last trading day BEFORE month 1st
   - Uses that day's closing price as baseline
   - Example: January uses Dec 31 close
   - Formula: `((latestData.close - previousMonthData.close) / previousMonthData.close) × 100`

3. **Current Year Baseline**:
   - Identifies Jan 1st of current year
   - Searches for last trading day BEFORE Jan 1st
   - Uses that day's closing price as baseline
   - Example: 2025 uses Dec 31, 2024 close
   - Formula: `((latestData.close - previousYearData.close) / previousYearData.close) × 100`

**Implementation Details:**
- **useStockData Hook** (src/hooks/useStockData.ts lines 137-169):
  - `getStockSummary()` function calculates all period changes
  - Uses `.close` field consistently for all calculations
  - Filters stock data for period boundaries using date comparisons
  - Returns `priceChangePercentWeek`, `priceChangePercentMonth`, `priceChangePercentYear` in StockSummary
- **Data Accuracy**:
  - Compares actual closing prices (not estimated values)
  - Respects market calendars (skips weekends/holidays automatically)
  - Handles year/month boundaries correctly
- **Standards Compliance**:
  - Matches Yahoo Finance WTD (week-to-date) calculation method
  - Matches Bloomberg MTD (month-to-date) calculation method
  - Matches financial industry YTD (year-to-date) standard

### Support Level Analysis Data Pipeline
1. **Data Source** → `/data/stock_data.csv` (via useStockData hook, OHLC format)
2. **User Configuration** → Select stock, date range, rolling period (30/90/180/270/365 calendar days), max gap (1-90 days)
3. **useConsecutiveBreaksAnalysis Hook** → Orchestrates analysis pipeline:
   - Loads full historical stock data for selected stock
   - Filters data for validation purposes
4. **Rolling Low Calculation** → `calculateRollingLow(stockData, periodDays)`:
   - **Critical**: Operates on FULL stockData (not just date-filtered range)
   - For each trading day, calculates: minimum low of all trading days within N calendar days
   - Uses `date.setDate(date.getDate() - periodDays)` for calendar day lookback
   - First N days will have NULL rolling_low until sufficient history is available
   - Result: Full rolling low dataset covering entire historical period
5. **Filter to Display Range** → `filterDataByDate(rollingLowData, fromDate, toDate)`:
   - Filters the calculated rolling low results to show only requested date range
   - Ensures display matches user's selected date range
   - But rolling low values are calculated with full historical lookback
6. **Analysis Steps**:
   - `analyzeSupportBreaks()` → Detects when rolling_low decreases (skips NULL values)
   - `analyzeConsecutiveBreaks()` → Clusters breaks within configurable max gap window
   - `calculateBreakStats()` → Generates stability, drop, and timing metrics
7. **Output Data Structure**:
   - RollingLowData: Date + OHLC + rolling_low (null for first N rows until lookback is satisfied)
   - SupportBreak: Date, prev_support, new_support, drop_pct, days_since
   - BreakCluster: ID, breaks array, statistics (duration, gaps, drops)
   - BreakStatistics: Overall metrics (stability, avg drop, trading days per break)
8. **UI Display**:
   - **Plotly Chart** with three traces in unified hover mode:
     - **Candlestick**: OHLC price data (filtered to date range) with default Plotly hover format showing Open, High, Low, Close values
     - **Rolling Low Line**: Blue dashed line tracking support level (calculated from full history, displayed in date range) with custom hover showing Rolling Low value and Last Break date
     - **Break Markers**: Red circles marking support breaks with hover info showing support level and drop percentage
     - **Unified Hover**: Combined tooltip shows Date, OHLC values, Rolling Low value, and Last Break date
   - **Dashboard Sections**:
     - Metrics cards (total breaks, clusters, multi-break clusters, max breaks)
     - Cluster detail cards with statistics (duration, gaps, drops, break tables)

**Hover Implementation Note:**
- Uses Plotly's default candlestick hover format (not custom hovertemplate) because custom templates don't work with unified hover mode for candlestick traces
- Rolling Low and Break Markers use custom hovertemplates to show specific values
- Date is shown once at the top in unified mode, avoiding redundancy

### Settings Data Flow
1. **User Input** → Component state (e.g., underlyingValueInput)
2. **onBlur/onChange** → Triggers save function
3. **Preference Hook** → Updates state + localStorage + Supabase
4. **Page Reload** → Loads from Supabase (auth) or localStorage (guest)

### Portfolio Generator Algorithm
1. **Data Loading** → Load options and stock data
2. **Recalculation** → Apply user settings (underlying value, transaction cost)
3. **Filtering** → Apply multiple filters (date, probability, strike price, volume, etc.)
4. **Risk Metrics** → Calculate Expected Value, EV per Capital, Risk-Adjusted Score
5. **Sorting** → Sort by selected strategy (EV, EV per Capital, Risk-Adjusted)
6. **Selection** → Pick top options (max one per stock) until premium target reached
7. **Statistics** → Calculate portfolio-level metrics

### Portfolio Generator Generated Portfolio Navigation
**Feature**: Users can click on stock names or option names in the "Generated Portfolio" results table to open detail pages in new browser tabs.

**Implementation**:
- **Click Handlers**: `handleOptionClick()` and `handleStockClick()` in `src/pages/PortfolioGenerator.tsx` (lines 424-439)
- **Behavior**: Clicking opens stock/option details in new tabs (`window.open(..., '_blank')`) while keeping the portfolio generator open
- **URL Construction**: Dynamically detects base path from current URL:
  - GitHub Pages: `/put-options-se` base path detected from `window.location.pathname`
  - Direct deployments: `/` base path used
  - Constructs full URL: `${window.location.origin}${basePath}/stock/...` or `/option/...`
- **Pass-through Props**: `onRowClick` and `onStockClick` props passed to `PortfolioOptionsTable` component
- **Visual Indicators**:
  - Stock names and option names are clickable with cursor and hover effects
  - Color coding maintained (orange for FinancialReport='Y', red for X-Day='Y')

**File References**:
- **Page**: `src/pages/PortfolioGenerator.tsx` - Lines 424-439 contain click handlers
- **Table Component**: `src/components/options/PortfolioOptionsTable.tsx` - Lines 454-470 handle cell rendering with click events

## Deployment
- **Primary**: Lovable.dev hosting
- **GitHub Pages**: Alternative deployment with basename handling
- **Environment Detection**: Automatic hostname-based configuration
- **Data Loading**: CSV files loaded directly from GitHub's `/data/` folder via raw.githubusercontent.com URLs

## Supabase Database Schema

### Tables
- **user_preferences** - Main page settings (underlying_value, transaction_cost, column_preferences)
- **portfolio_preferences** - Portfolio generator settings (all portfolio-specific settings)

### Row Level Security (RLS)
- All tables have RLS enabled
- Users can only access their own preferences
- Policies enforce user_id = auth.uid()

This application represents a sophisticated financial analysis tool with modern React patterns, comprehensive data visualization, and robust user experience features.