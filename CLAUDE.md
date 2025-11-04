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
- **Rolling Low Calculation**: Computes N-period rolling minimum of low prices (30, 90, 180, 270, or 365 days)
- **Support Break Detection**: Identifies when rolling low decreases, signaling a break of previous support
- **Break Clustering**: Groups consecutive support breaks within a configurable time window (1-90 days)
- **Multi-Trace Visualization**: Plotly chart with candlestick prices, rolling low line (blue dashed), and break markers (red circles)
- **Detailed Analytics**:
  - Cluster statistics (duration, gaps between breaks, total/average drops)
  - Support break history table with break details
  - Break distribution chart
  - Stability metrics and trading days per break analysis

**Data Flow:**
1. User selects stock and configures filters
2. `useConsecutiveBreaksAnalysis` hook loads stock data via `useStockData`
3. `calculateRollingLow()` computes rolling support levels
4. `analyzeSupportBreaks()` detects support breaks
5. `analyzeConsecutiveBreaks()` clusters breaks within max gap window
6. `calculateBreakStats()` generates statistics
7. Plotly chart renders with three traces (candlesticks, rolling low, breaks)
8. Tables and metrics display cluster details and statistics

**File Structure:**
- **Page**: `src/pages/ConsecutiveBreaksAnalysis.tsx` - Main dashboard with Plotly visualization
- **Hook**: `src/hooks/useConsecutiveBreaksAnalysis.ts` - Core analysis logic
- **Types**: `src/types/consecutiveBreaks.ts` - Data structure definitions (RollingLowData, SupportBreak, BreakCluster, BreakStatistics)
- **Data**: `/data/stock_data.csv` - OHLC stock price data with format `date|name|open|high|low|close|volume|pct_change_close`

**Important Notes:**
- The route uses `/consecutive-breaks` but displays as "Support Level Analysis" in navigation
- Performance optimization: Uses efficient sliding window algorithm for large period selections
- Charts use Plotly (not Recharts) for native financial charting capabilities
- All data is stored in `/data/` folder, not dependent on external APIs or services

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

## Known Issues & Limitations

### Recent Fixes & Updates Applied
- **Support Level Analysis Dashboard** (2025-11): New feature replacing Stock Price Stats
  - Analyzes how well a stock's low is holding as support level
  - Implements rolling low calculation with configurable periods (30-365 days)
  - Detects support breaks and clusters them within time windows
  - Uses Plotly for native financial chart with candlesticks, rolling low line, and break markers
  - Optimized performance algorithm for large period selections
  - Route: `/consecutive-breaks`, Menu: "Support Level Analysis"
- **OHLC Candlestick Charts** (2025-11): Implemented full OHLC data support
  - Updated StockData type to include open, high, low fields
  - Created CandlestickChart component with volume overlay toggle
  - Updated price calculations to use actual high/low values instead of close prices
  - Strike Price Below filter now uses intraday low prices for accuracy
- **Double Calculation Bug**: Fixed issue where options were being recalculated twice
- **Settings Reversion**: Resolved problem where user settings reverted after apply
- **State Management**: Improved handling of user preferences vs database sync
- **Portfolio Generator Value Reversion**: Fixed continuous Supabase reload overwriting user changes
- **Input Field Sync**: Fixed useEffect conditions preventing proper input field updates

### Current Limitations
- **Static Data**: Relies on pre-generated CSV files, not real-time market data
- **GitHub Pages Deployment**: Specific basename handling for GitHub Pages vs other environments
- **CSV Processing**: Large datasets may impact initial load performance

## Development Notes

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
- **Support Level Analysis**: Uses Plotly (not Recharts) for financial charting - native support for candlesticks and multi-trace visualization
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
1. **Data Source** → `/data/stock_data.csv` (via useStockData hook)
2. **User Configuration** → Select stock, date range, rolling period (30/90/180/270/365 days), max gap (1-90 days)
3. **useConsecutiveBreaksAnalysis Hook** → Orchestrates analysis pipeline
4. **Analysis Steps**:
   - `calculateRollingLow()` → Computes N-day rolling minimum of low prices
   - `analyzeSupportBreaks()` → Detects when rolling_low decreases
   - `analyzeConsecutiveBreaks()` → Clusters breaks within max gap window
   - `calculateBreakStats()` → Generates stability, drop, and timing metrics
5. **Output Data Structure**:
   - RollingLowData: Date + OHLC + rolling_low
   - SupportBreak: Date, prev_support, new_support, drop_pct, days_since
   - BreakCluster: ID, breaks array, statistics (duration, gaps, drops)
   - BreakStatistics: Overall metrics (stability, avg drop, trading days per break)
6. **Visualization** → Plotly chart with three traces:
   - Candlestick: OHLC price data
   - Rolling Low Line: Blue dashed line tracking support level
   - Break Markers: Red circles marking support breaks
7. **Display** → Dashboard with metrics cards, cluster distribution chart, detailed tables

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