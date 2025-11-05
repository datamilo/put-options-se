# Put Options SE - Project Summary for Claude Code

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
- **Monthly Analysis** (`/monthly-analysis`) - Historical performance and seasonality
- **Financial Reporting Volatility** (`/volatility-analysis`) - Stock event volatility tracking
- **Support Level Analysis** (`/consecutive-breaks`) - Stock support level strength and break analysis (formerly Stock Price Stats)
- **Option Details** (`/option/:optionId`) - Detailed individual option analysis
- **Stock Details** (`/stock/:stockName`) - Individual stock performance
- **Authentication** (`/auth`, `/auth/callback`) - User login/signup

### Key Components

#### Data Management Hooks
- **useEnrichedOptionsData** - Main hook combining options data with user calculations
- **useRecalculatedOptions** - Applies user settings to option calculations
- **useOptionsData** - Fetches and parses options CSV data
- **useStockData** - Fetches and parses stock price data (OHLC format with volume)
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

### 5. Responsive Design
- Mobile-optimized layouts
- Dark/light theme support
- Collapsible navigation
- Touch-friendly interactions

### 6. Support Level Analysis
The Support Level Analysis dashboard analyzes how well a stock's low is holding as a support level by detecting and clustering support breaks.

**Key Features:**
- **Rolling Low Calculation**: Computes N-period rolling minimum of low prices (30, 90, 180, 270, or 365 calendar days)
  - Uses full historical data to ensure proper calendar day lookback for all periods
  - Fixed to work correctly for 270-day (9-month) and 365-day (1-year) periods
  - Each day's rolling low = minimum low of all trading days within the rolling period window
- **Support Break Detection**: Identifies when rolling low decreases, signaling a break of previous support
- **Break Clustering**: Groups consecutive support breaks within a configurable time window (1-90 days)
- **Multi-Trace Visualization**: Plotly chart with candlestick prices, rolling low line (blue dashed), and break markers (red circles)
- **Detailed Analytics**:
  - Cluster statistics (duration, gaps between breaks, total/average drops)
  - Support break history table with break details
  - Break distribution chart
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
  - Fixes issue where longer periods appeared identical to shorter periods
- **Calendar Day Calculation**: Rolling low uses `date.setDate(date.getDate() - periodDays)` which operates on calendar days, not trading days
- **Performance**: Uses efficient sliding window algorithm for large period selections
- **Visualization**: Charts use Plotly (not Recharts) for native financial charting capabilities
- **Data Independence**: All data stored in `/data/` folder, not dependent on external APIs or services

## Authentication & User Management
- **Supabase Auth** for user management
- **Protected Routes** for authenticated features
- **Guest Mode** with localStorage persistence
- **Row Level Security** for user data isolation

## Data Sources
- Static CSV files in `/data` and `/public/data`
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

### Git & GitHub Workflow
**CRITICAL**: Always commit changes immediately after making them. Follow this workflow:
1. Make code changes
2. Build and test locally (`npm run build`)
3. **Commit changes immediately** with descriptive messages (`git commit`)
4. Push to GitHub (`git push`)
5. Verify changes are reflected on GitHub

**IMPORTANT**: Do not accumulate uncommitted changes. Commit after each significant change or fix is complete. This ensures:
- The remote repository always reflects the current state of the codebase
- Changes are properly tracked and documented in git history
- Prevents merge conflicts and makes debugging easier
- Keeps the repository clean and organized

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
  - `/support-levels` - Support Level Analysis components (if needed in future)
- `/src/pages` - Route components (includes ConsecutiveBreaksAnalysis.tsx for Support Level Analysis)
- `/src/types` - TypeScript interfaces (includes consecutiveBreaks.ts for Support Level Analysis types)
- `/src/contexts` - React context providers (SettingsContext, AuthProvider)
- `/src/auth` - Authentication components and protected routes
- `/data` - Static CSV data files (source files)
  - `stock_data.csv` - Used by Support Level Analysis (OHLC format)
  - Other CSV files for options, volatility, and monthly data
- `/public/data` - Public CSV data files (deployed files, copied from `/data` at build time)
- `/src/components/ui` - shadcn/ui component library
- `/scripts` - Build and deployment scripts

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
1. **CSV Source** → GitHub raw CSV or local `/public/data/stock_data.csv`
2. **Format** → Pipe-delimited: `date|name|open|high|low|close|volume|pct_change_close`
3. **useStockData Hook** → Parses all OHLC fields as numeric values
4. **Price Calculations**:
   - `getLowPriceForPeriod()` → Uses `low` field for accurate period lows
   - `getPriceRangeForPeriod()` → Uses `high` and `low` fields for true ranges
   - `getStockSummary()` → Calculates 52-week high/low from OHLC data
5. **Visualization** → CandlestickChart component renders OHLC data with optional volume

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
8. **UI Display** → Plotly chart with three traces in unified hover mode:
   - **Candlestick**: OHLC price data (filtered to date range) with default Plotly hover format showing Open, High, Low, Close values
   - **Rolling Low Line**: Blue dashed line tracking support level (calculated from full history, displayed in date range) with custom hover showing Rolling Low value and Last Break date
   - **Break Markers**: Red circles marking support breaks with hover info showing support level and drop percentage
   - **Unified Hover**: Combined tooltip shows Date (top), OHLC values (from candlestick), Rolling Low value, and Last Break date
   - Dashboard with metrics cards, cluster distribution chart, detailed tables

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

## Deployment
- **Primary**: Lovable.dev hosting
- **GitHub Pages**: Alternative deployment with basename handling
- **Environment Detection**: Automatic hostname-based configuration
- **Build Scripts**: Prebuild script copies data files from `/data` to `/public/data`

## Supabase Database Schema

### Tables
- **user_preferences** - Main page settings (underlying_value, transaction_cost, column_preferences)
- **portfolio_preferences** - Portfolio generator settings (all portfolio-specific settings)

### Row Level Security (RLS)
- All tables have RLS enabled
- Users can only access their own preferences
- Policies enforce user_id = auth.uid()

This application represents a sophisticated financial analysis tool with modern React patterns, comprehensive data visualization, and robust user experience features.