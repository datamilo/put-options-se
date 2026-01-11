# Put Options SE - Current Website State

**Last Updated**: January 10, 2026
**Status**: Production
**Deployment**: GitHub Pages at https://datamilo.github.io/put-options-se/

---

## System Status

| System | Status | Last Updated | Details |
|--------|--------|--------------|---------|
| **Core Application** | ✅ Active | Jan 1, 2026 | All pages operational |
| **Supabase Auth** | ✅ Active | Jun 2024 | User authentication and preferences |
| **Analytics System** | ✅ Active | Jan 1, 2026 | Usage tracking for authenticated users |
| **Data Files** | ✅ Active | Jan 5, 2026 | Stock, options, and margin requirements data current |

---

## Quick Navigation

| Page | Route | Status | Last Modified |
|------|-------|--------|---------------|
| [Options Dashboard](#options-dashboard) | `/` | ✅ Active | Jan 5, 2026 |
| [Portfolio Generator](#portfolio-generator) | `/portfolio-generator` | ✅ Active | Jun 2024 |
| [Monthly Analysis](#monthly-analysis) | `/monthly-analysis` | ✅ Active | Nov 25 |
| [Stock Metrics and History](#stock-metrics-and-history) | `/stock/:stockName` | ✅ Active | Dec 19 |
| [Support Level Analysis](#support-level-analysis) | `/consecutive-breaks` | ✅ Active | Dec 14 |
| [Support Level Options List](#support-level-options-list) | `/support-level-options` | ✅ Active | Dec 14 |
| [Probability Analysis](#probability-analysis) | `/probability-analysis` | ✅ Active | Jan 10 |
| [Lower Bound Analysis](#lower-bound-analysis) | `/lower-bound-analysis` | ✅ Active | Nov 28 |
| [Financial Reporting Volatility](#financial-reporting-volatility) | `/volatility-analysis` | ✅ Active | Oct 2024 |

---

## Page Details

### Options Dashboard
**Route**: `/`

**Latest Changes** (Jan 5, 2026):
- Added margin requirements data integration from `margin_requirements.csv`
- **New Column**: "Est. Total Margin" now displayed by default
- 13 additional margin and capital fields available via column manager
- **Important**: All margin figures are ESTIMATES using SRI methodology, not exact Nasdaq requirements

**Features**:
- Comprehensive options data table with 80+ fields (67 from options data + 13 from margin requirements)
- Margin and capital requirements analysis
- Filterable by multiple criteria
- Sortable columns
- Real-time data from CSV files
- Column visibility management

**Status**: Fully functional with margin requirements integration

---

### Portfolio Generator
**Route**: `/portfolio-generator`

**Latest Changes** (Jan 5, 2026):
- Added margin requirements data integration from `margin_requirements.csv`
- **New Column**: "Est. Total Margin" now displayed in portfolio results
- 13 additional margin and capital fields available via column manager

**Features**:
- Portfolio optimization tools with margin analysis
- Estimated total margin requirements for selected positions
- Python script support
- Settings persistence
- Column visibility management

**Status**: Fully functional with margin requirements integration

---

### Monthly Analysis
**Route**: `/monthly-analysis`

**Features**:
- Historical performance tracking
- Seasonality patterns
- Monthly aggregations

**Status**: Fully functional

---

### Stock Metrics and History
**Route**: `/stock/:stockName`

**Latest Changes** (Dec 19, 2025):
- Added custom date range filtering with "From Date" and "To Date" inputs
- Integrated date inputs directly into candlestick chart with preset time range buttons
- Set default values: From Date = 6 months ago, To Date = today
- Custom dates override preset buttons for flexible filtering

**Features**:
- Individual stock performance metrics
- Detailed analytics
- Historical data visualization
- **OHLC Candlestick Chart** with:
  - Preset time range buttons (1M, 3M, 6M, 1Y, ALL)
  - Custom date range filtering with auto-populated defaults
  - Optional volume overlay
  - Green/red candles for bullish/bearish days

**Status**: Fully functional with date filtering

---

### Support Level Analysis
**Route**: `/consecutive-breaks`

**Current Features**:
- "Median Drop per Break" metric in All Break Clusters section
- Shows statistical median of support break percentages for each cluster
- Helps users position strikes at historically realistic worst-case levels
- "Running Low Date" label in hover tooltip shows the lowest price point during the selected period

**Features**:
- Rolling low calculation (30, 90, 180, 270, 365 days)
- Support break detection and clustering
- Plotly candlestick chart with rolling low line and break markers
- Configurable time window for break clustering (1-90 days)

**Data Components**:
- **Candlestick**: Professional blue (up), muted red (down)
- **Rolling Low Line**: Slate gray dashed line
  - Tooltip: "Running Low: X.XX kr" + "Running Low Date: YYYY-MM-DD"
- **Break Markers**: Amber dots

**Status**: Fully functional

---

### Support Level Options List
**Route**: `/support-level-options`

**Features**:
- Filter and analyze put options by rolling low support levels
- Rolling Low Period Selection: 30, 90, 180, 270, or 365-day support timeframes
- Support Filters:
  - Min Support Stability: Filter by % of days support held without breaking
  - Min Days Since Last Break: Ensure support is recently stable
- Strike Position Strategies:
  - At Support Level: Strike within 2% of rolling low
  - At Median Drop Below Support: Strike positioned at historical worst-case scenario
  - Custom % Below Support: User-defined offset below support
  - Any Position: No strike filtering
- Results Table with support metrics, distance to support calculations, and median drop per break

**Technical Details**:
- Uses `useSupportBasedOptionFinder` hook
- Combines `useConsecutiveBreaksAnalysis` for support metrics
- Client-side filtering for instant results
- Support metrics recalculate dynamically when rolling period changes

**Status**: Fully functional

---

### Probability Analysis
**Route**: `/probability-analysis`

**Latest Changes** (Jan 10, 2026):
- Fixed CSV format handling for normalized method names (Jan 2026 format)
- Fixed MethodComparisonChart to correctly use pre-aggregated "All DTE" records
- Fixed KPI metrics calculation using scenarios data
- All probability method names now work with normalized format internally
- UI display unchanged - users continue to see "PoW - " prefix

**Three Main Sections**:

#### 1. Calibration Analysis
- **Chart Type**: Plotly scatter plot with lines and dots
- **Purpose**: Validate probability calculation methods
- **Filters**:
  - Stock selector (All Stocks or individual)
  - Days to Expiry (All DTE, 0-3 days, 4-7 days, 8-14 days, 15-21 days, 22-28 days, 29-35 days, 35+ days)
  - Probability Method (All Methods or individual)
- **Reference**: Perfect Calibration diagonal line (y=x)
- **Hover**: Shows method name, P% (predicted), A% (actual), n= (sample count)
- **Key Insight**: Points above diagonal = conservative, below = overconfident

#### 2. Stock Performance by Method
- **Purpose**: Compare how each of 5 probability methods performs across all ~76 stocks
- **Display**:
  - Heatmap (visual color-coding)
  - Sortable data table (precise values)
- **Metric**: Weighted average calibration error (actual - predicted)
  - Positive (Green) = Conservative (under-predicts)
  - Negative (Red) = Overconfident (over-predicts)
  - White = Well-calibrated
- **Data Organization**:
  - Rows: All stocks (~76)
  - Columns: 5 methods + Average Error
- **Filter**: DTE selector only (shows all stocks for comparison)
- **Sorting**: Click any column header
- **Data Quality**: 25th percentile sample size filtering applied

#### 3. Probability Recovery Analysis
- **Purpose**: Find recovery opportunities where options previously had high probability
- **Filters**:
  - Stock selector
  - Probability Method
  - Historical Peak Threshold (0.5-0.95)
  - Current Probability Bin (30-40%, 40-50%, etc.)
- **Chart**: Bar comparison (green = recovery candidates, red = baseline)
- **Hypothesis**: Green > red means recovery opportunities are statistically safer

**Status**: Fully functional (with NEW Stock Performance section)

---

### Lower Bound Analysis
**Route**: `/lower-bound-analysis`

**Latest Changes** (Nov 28, 2025):
- Updated hit rate trends data
- Updated expiry statistics
- Updated daily predictions

**Features**:
- IV-based prediction validation
- Prediction distribution visualization
- Breach analysis
- Stock price overlays
- Earnings event markers

**Status**: Fully functional with recent data updates

---

### Financial Reporting Volatility
**Route**: `/volatility-analysis`

**Features**:
- Financial reporting volatility analysis
- Earnings impact analysis

**Status**: Fully functional

---


## Data Sources

### Files Loaded
- `stock_data.csv` - Historical OHLC stock data
- `data.csv` - Main options data (67 fields)
- `margin_requirements.csv` - Margin and capital requirements (13 fields)
- `recovery_report_data.csv` - Probability recovery opportunities
- `validation_report_data.csv` - Probability method validation data
- `hit_rate_trends_by_stock.csv` - Lower bound monthly trends
- `all_stocks_daily_predictions.csv` - Lower bound daily predictions
- `all_stocks_expiry_stats.csv` - Lower bound expiry statistics

### Data Characteristics
- **Stocks**: 76 different stocks analyzed
- **Records**: Varies by file (15K-115K+ rows)
- **Update Frequency**: Periodic manual updates
- **Format**: CSV (pipe-delimited for validation data)

---

## Technical Architecture

### Frontend Stack
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: TanStack Query + React Context
- **Data Visualization**:
  - Recharts (charts, bar charts)
  - Plotly (financial charts, candlesticks)

### Authentication & Data
- **Auth**: Supabase with Google OAuth
- **Data Storage**: GitHub (CSV files)
- **Preferences**: Supabase (user_preferences & portfolio_preferences tables)
- **Fallback**: localStorage for guest users

### Deployment
- **Primary**: GitHub Pages (https://datamilo.github.io/put-options-se/)
- **CI/CD**: GitHub Actions (auto-build on source changes)
- **Distribution**: `/dist` folder published to gh-pages branch

---

## Known Components & Hooks

### Smart Option Finder Components & Hooks
- **SupportBasedOptionFinder.tsx** - Main page component
  - Configurable filters for rolling period, support stability, days since break
  - Strike positioning strategy selector
  - Dynamic results table with support metrics

- **useSupportBasedOptionFinder.ts** - Core hook
  - `calculateSupportMetrics(rollingPeriod)`: Calculates metrics for given period
  - `findOptions(criteria)`: Filters and ranks options
  - Returns support metrics and filtering function

### Probability Analysis Components
- **CalibrationChart.tsx** - Plotly scatter chart for method validation
  - Supports stock/DTE/method filtering
  - Precise hover detection (dots only)
  - Perfect calibration reference line

- **MethodComparisonChart.tsx** - Heatmap + table for cross-stock comparison
  - Weighted average calculations
  - Sortable table
  - Color-coded heatmap

- **RecoveryComparisonChart.tsx** - Bar chart for recovery opportunities
  - Multiple filter dimensions
  - Worthless rate comparison

### Probability Validation Data Hook
```typescript
useProbabilityValidationData()
// Returns:
// - calibrationData: All calibration records
// - metrics: Overall method performance metrics
// - getCalibrationPoints(): Filter function
// - getMethodPerformance(): Performance metrics
```

### Support Level Analysis Hook
```typescript
useConsecutiveBreaksAnalysis()
// Returns:
// - uniqueStocks: List of all stocks
// - selectedStock: Current selection
// - analyzeStock(): Analysis function
```

---

## UI/UX Patterns

### Card Sections
- Page header with back button and icon
- Overview cards at top
- Explanation cards ("How to Read")
- Main visualization cards
- Interpretation/guidance cards at bottom

### Color Schemes
- **Probability Methods** (consistent across charts, displayed as "PoW - " prefix):
  - PoW - Weighted Average: #3b82f6 (blue)
  - PoW - Bayesian Calibrated: #10b981 (green)
  - PoW - Original Black-Scholes: #f59e0b (amber)
  - PoW - Bias Corrected: #ef4444 (red)
  - PoW - Historical IV: #8b5cf6 (purple)
  - Note: PoW = Probability of Worthless

- **Calibration Error**:
  - Green: Conservative (positive error)
  - Red: Overconfident (negative error)
  - White: Well-calibrated

### Interactive Elements
- Dropdown selectors for filtering
- Sortable table columns
- Plotly hover tooltips
- Chart legends
- Section separators

---

## Performance Notes

### Data Loading
- CSVs loaded from GitHub raw content on component mount
- Cached for session duration
- Graceful fallback to local files if GitHub unavailable

### Rendering
- Large tables (76+ stocks) use efficient sorting
- Heatmaps render inline with table
- Plotly charts lazy-loaded

### Accessibility
- Semantic HTML structure
- Proper ARIA labels
- Color + pattern differentiation (not just color)
- Dark mode support throughout

---

## Next Steps / Outstanding Items

### Status: Testing Phase
- **Stock Performance by Method** section is newly implemented (Nov 28, 2025)
- User testing needed to verify:
  - Data accuracy (weighted averages)
  - Heatmap color scaling
  - Table sorting functionality
  - DTE filtering behavior

---

## Analytics System

**Status**: ✅ Active and Operational
**Added**: January 1, 2026
**Database**: Supabase (user_analytics_events, user_analytics_sessions tables)

### Overview
Comprehensive usage analytics system tracking authenticated user behavior with minimal storage impact. Automatically captures page visits, filter changes, exports, and settings modifications.

### Key Features
- **Automatic page view tracking** across all routes
- **Session management** with start/end times and duration tracking
- **Filter change tracking** (stocks, expiry dates, risk levels, strike periods)
- **Export action tracking** with row counts
- **Settings change tracking** (open/save events)
- **Event batching** (10 events or 5 seconds) for performance
- **Row-level security** ensuring user data isolation
- **90-day retention** policy with auto-cleanup

### Storage Impact
- **Estimated Usage**: ~1 MB/month for handful of users
- **Free Tier Limit**: 500 MB total
- **Usage Percentage**: <3% annually

### Database Tables
1. **user_analytics_events** - Individual event records with flexible JSONB payload
2. **user_analytics_sessions** - Aggregated session summaries with metrics

### Access
Complete documentation: [analytics.md](analytics.md)

### Querying Analytics Data
Users can view their own analytics via Supabase dashboard:
```sql
-- Most visited pages
SELECT page_path, COUNT(*) as views
FROM user_analytics_events
WHERE event_type = 'page_view'
GROUP BY page_path;

-- Session metrics
SELECT AVG(pages_visited), AVG(session_duration_seconds/60.0)
FROM user_analytics_sessions;
```

---

## Related Documentation

- [analytics.md](analytics.md) - Usage analytics system documentation
- [support-level-options.md](support-level-options.md) - Support Level Options List page documentation
- [probability-analysis.md](probability-analysis.md) - Detailed Probability Analysis page docs
- [support-level-analysis.md](support-level-analysis.md) - Support Level Analysis page docs
- [lower-bound-analysis.md](lower-bound-analysis.md) - Lower Bound Analysis page docs
- [stock-analysis.md](stock-analysis.md) - Stock Metrics and History page documentation
- [FIELD_GUIDE.md](FIELD_GUIDE.md) - Complete field definitions for all 80+ data fields (67 options + 13 margin)
- [index-page.md](index-page.md) - Options Dashboard documentation
- [portfolio-generator.md](portfolio-generator.md) - Portfolio Generator docs
