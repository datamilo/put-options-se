# Put Options SE - Current Website State

**Last Updated**: December 8, 2025
**Status**: Production
**Deployment**: GitHub Pages at https://datamilo.github.io/put-options-se/

---

## Quick Navigation

| Page | Route | Status | Last Modified |
|------|-------|--------|---------------|
| [Options Dashboard](#options-dashboard) | `/` | ✅ Active | Nov 25 |
| [Portfolio Generator](#portfolio-generator) | `/portfolio-generator` | ✅ Active | Jun 2024 |
| [Monthly Analysis](#monthly-analysis) | `/monthly-analysis` | ✅ Active | Nov 25 |
| [Stock Analysis](#stock-analysis) | `/stock/:stockName` | ✅ Active | Nov 24 |
| [Support Level Analysis](#support-level-analysis) | `/consecutive-breaks` | ✅ Active | Nov 28 |
| [Probability Analysis](#probability-analysis) | `/probability-analysis` | ✅ Active | Nov 28 |
| [Lower Bound Analysis](#lower-bound-analysis) | `/lower-bound-analysis` | ✅ Active | Nov 28 |
| [Volatility Analysis](#volatility-analysis) | `/volatility-analysis` | ✅ Active | Oct 2024 |

---

## Page Details

### Options Dashboard
**Route**: `/`

**Features**:
- Comprehensive options data table with 67+ fields
- Filterable by multiple criteria
- Sortable columns
- Real-time data from CSV files

**Status**: Fully functional

---

### Portfolio Generator
**Route**: `/portfolio-generator`

**Features**:
- Portfolio optimization tools
- Python script support
- Settings persistence

**Status**: Fully functional

---

### Monthly Analysis
**Route**: `/monthly-analysis`

**Features**:
- Historical performance tracking
- Seasonality patterns
- Monthly aggregations

**Status**: Fully functional

---

### Stock Analysis
**Route**: `/stock/:stockName`

**Features**:
- Individual stock performance metrics
- Detailed analytics
- Historical data visualization

**Status**: Fully functional

---

### Support Level Analysis
**Route**: `/consecutive-breaks`

**Latest Changes** (Nov 28, 2025):
- Renamed "Last Break" label to "Running Low Date" in hover tooltip
- Clarifies that the date shown is the lowest price point during the selected period, not necessarily a break event

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

### Probability Analysis
**Route**: `/probability-analysis`

**Latest Changes** (Nov 28, 2025):
- **NEW**: Added "Stock Performance by Method" section (second of three sections)
- Converted Calibration Analysis chart from Recharts to Plotly for precise hover detection
- Added Probability Method filter to Calibration Analysis chart
- Renamed tooltip fields for clarity

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

#### 2. Stock Performance by Method (NEW)
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

### Volatility Analysis
**Route**: `/volatility-analysis`

**Features**:
- Financial reporting volatility analysis
- Earnings impact analysis

**Status**: Fully functional

---

## Recent Changes & Updates

### December 8, 2025
✅ **Probability Field Naming Standardization**
- Added "PoW - " prefix to all probability method display names across entire website
- Updated all component field mappings (OptionsTable, ColumnManager, PortfolioColumnManager, OptionsChart, ProbabilityHistoryChart, CalibrationChart, MethodComparisonChart, RecoveryComparisonChart)
- Updated CSV data files (recovery_report_data.csv, validation_report_data.csv) to use new method names

✅ **PoW Legend Implementation**
- Added PoW Legend card to main dashboard (Index.tsx) - explains "PoW = Probability of Worthless"
- Added PoW Legend card to Probability Analysis page - provides context for analysis methods
- Added PoW Legend card to Portfolio Generator page - explains selection options
- All legends list the 5 probability calculation methods with brief descriptions

✅ **Documentation Updates**
- Updated probability-analysis.md to reference "PoW - " prefixed method names
- Updated CURRENT_STATE.md with latest changes and PoW information
- Created comprehensive PROBABILITY_FIELD_NAMES.md documenting all changes

### November 28, 2025
✅ **Probability Analysis Enhancement - Stock Performance Section**
- Created new `MethodComparisonChart.tsx` component
- Added heatmap + table visualization showing method performance across all stocks
- Implemented weighted average calibration error calculation
- Added DTE-based filtering
- Integrated into Probability Analysis page as middle section

✅ **Calibration Analysis Chart Conversion**
- Converted from Recharts to Plotly for better hover precision
- Implemented `hovermode: 'closest'` to detect only dot hovers
- Added Probability Method dropdown filter
- Fixed tooltip to only show on direct dot hover (not on lines)

✅ **Tooltip Label Updates**
- Support Level Analysis: "Last Break" → "Running Low Date" (clarifies it shows lowest price, not necessarily a break)

### November 27, 2025
- Updated Lower Bound Analysis data (hit rate trends, expiry stats)

### Earlier Dates
- Lower Bound daily predictions updated
- Stock Analysis features enhanced
- Reporting day volatility data updated

---

## Data Sources

### Files Loaded
- `stock_data.csv` - Historical OHLC stock data
- `data.csv` - Main options data (67+ fields)
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

### Probability Analysis Components
- **CalibrationChart.tsx** - Plotly scatter chart for method validation
  - Supports stock/DTE/method filtering
  - Precise hover detection (dots only)
  - Perfect calibration reference line

- **MethodComparisonChart.tsx** (NEW) - Heatmap + table for cross-stock comparison
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

## Related Documentation

- [probability-analysis.md](probability-analysis.md) - Detailed Probability Analysis page docs
- [support-level-analysis.md](support-level-analysis.md) - Support Level Analysis page docs
- [lower-bound-analysis.md](lower-bound-analysis.md) - Lower Bound Analysis page docs
- [FIELD_GUIDE.md](FIELD_GUIDE.md) - Complete field definitions for all 67+ data fields
- [index-page.md](index-page.md) - Options Dashboard documentation
- [portfolio-generator.md](portfolio-generator.md) - Portfolio Generator docs
