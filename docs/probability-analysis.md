# Probability Analysis

Route: `/probability-analysis`

## Overview
Comprehensive probability method validation and recovery opportunity analysis for options trading. Includes three visualization sections for comparing method calibration, cross-stock method performance, and recovery opportunities.

## Features

### 1. Calibration Analysis Section
- **Purpose**: Validates different probability calculation methods by comparing predicted vs actual probabilities
- **Methods Compared**: PoW - Weighted Average, PoW - Bayesian Calibrated, PoW - Original Black-Scholes, PoW - Bias Corrected, PoW - Historical IV
- **Note**: PoW = Probability of Worthless (the probability an option will expire worthless)
- **Chart Type**: Plotly scatter plot with lines and dots
- **Perfect Calibration Reference**: Diagonal line (y=x) shown as visual reference
- **Filters**:
  - Stock selector (optional, defaults to "All Stocks")
  - Days to Expiry selector (All DTE, 0-3 days, 4-7 days, 8-14 days, 15-21 days, 22-28 days, 29-35 days, 35+ days) — **calendar days**
  - Probability Method selector (All Methods or individual method)
- **Interactive Tooltips**:
  - Method name with color indicator
  - Predicted and Actual probabilities (format: P: X% | A: Y%)
  - Sample count (n=X)
- **Key Insight**: Points above diagonal = conservative (safer than predicted), below = overconfident (riskier than predicted)

### 2. Stock Performance by Method Section
- **Purpose**: Compare how each probability method performs across ALL stocks to identify which methods are consistently over/under-confident
- **Display Format**: Heatmap (visual) + Sortable Data Table (precise values)
- **Metric**: Weighted average calibration error (actual - predicted) per stock-method pair
  - Positive values (green) = Conservative (under-predicts probability)
  - Negative values (red) = Overconfident (over-predicts probability)
  - White/neutral = Well-calibrated
- **Data Organization**:
  - Rows = Individual stocks (all ~76 stocks visible)
  - Columns = The 5 probability methods + Average Error
- **Filters**:
  - Days to Expiry selector (same DTE bins as Calibration Analysis) — **calendar days**
- **Sorting**: Click any column header to sort by that method or metric
- **Data Quality**: Uses 25th percentile sample size filtering to exclude low-sample outliers
- **Color Scale**:
  - Dark Red (< -0.20): Significantly overconfident
  - Light Red (-0.10 to 0.00): Slightly overconfident
  - Light Green (0.00 to +0.10): Slightly conservative
  - Dark Green (> +0.20): Significantly conservative

### 3. Probability Recovery Analysis Section
- **Purpose**: Identifies recovery opportunities where options that peaked at high probability have since declined—and expire worthless MORE often than the probability model predicts
- **Definition**: Recovery candidates = options that previously reached high probability levels (80%+, 85%+, 90%+, 95%+) but have since dropped to lower probability levels
- **Key Finding**: Recovery candidates expire worthless **87.59%** of the time vs **74.88%** for all options—a **+12.71 percentage point advantage** that is statistically significant (p < 0.001)
- **Why It Matters**: The probability model systematically underestimates worthless rates for recovery candidates by **17.18 pp** (vs **3.01 pp** for all options), a **14.18 pp gap** proving they represent true mispricing exploitable by put sellers
- **Chart**: Bar comparison showing worthless rate for recovery candidates (green) vs all options in same bin (red)
  - Green bars > Red bars = Recovery candidates are statistically safer
  - Green bar height shows actual worthlessness rate (higher = more likely to expire worthless = better for put sellers)
  - Difference = Recovery advantage for that scenario

**When to Use Recovery Analysis:**
- **Best conditions**: 36+ days to expiry, 50-60% current probability, Weighted Average or Original Black-Scholes method (+35-40 pp advantage)
- **Good conditions**: 8-35 days to expiry, 60-80% current probability, Weighted Average method (+15-25 pp advantage)
- **Weak conditions**: 0-7 days to expiry, 80-90% current probability, Historical IV method (+0-8 pp advantage)

**Filters** (left to right):
  - Stock selector (optional, defaults to "All Stocks")—identify best-performing individual stocks
  - Probability Method selector—Weighted Average shows strongest opportunities (16.06 pp advantage)
  - Historical Peak Threshold selector (80%, 85%, 90%, 95%)—all show strong opportunities
  - Current Probability Bin selector—lower bins (50-60%) show larger advantages

**See Also**: [Recovery Analysis Findings](recovery-analysis-findings.md) for detailed statistical validation and opportunity prioritization

## Page Layout & Flow
1. Page Header with back button and Probability Analysis title
2. Executive Overview Cards (Calibration Analysis, Probability Recovery)
3. **Calibration Analysis Section**
   - Explanation card ("How to Read the Chart")
   - Interactive Calibration chart with filters
4. Section Separator
5. **Stock Performance by Method Section**
   - Explanation card
   - DTE selector
   - Heatmap visualization with all stocks
   - Sortable data table
6. Section Separator
7. **Probability Recovery Analysis Section**
   - Explanation card ("How to Read the Chart")
   - Interactive Recovery Advantage Analysis chart with filters

## Data Files
- `validation_report_data.csv` (17,733 records)
  - Structure: Pipe-delimited CSV with calibration data at 4 granularity levels
  - Records: metrics (5), calibration_aggregated (44), calibration_by_stock (2,350), calibration_by_stock_and_dte (15,334)
  - Fields: DataType, Stock, DTE_Bin, ProbMethod, Bin, PredictedProb, ActualRate, Count, CalibrationError, Brier_Score, AUC_ROC, Log_Loss, Expected_Calibration_Error
  - **ProbMethod Format**: Uses normalized method names (e.g., "Weighted Average" without "PoW - " prefix) as of January 2026
  - **Note**: Application automatically handles both old and new CSV formats via normalization layer
- `recovery_report_data.csv` - Recovery analysis scenario data
  - **ProbMethod Format**: Uses normalized method names (e.g., "Weighted Average" without "PoW - " prefix) as of January 2026

## File References
- **Page**: `src/pages/ProbabilityAnalysis.tsx`
- **Hooks**:
  - `useProbabilityValidationData.ts` - Loads and parses validation_report_data.csv
  - `useProbabilityRecoveryData.ts` - Loads recovery_report_data.csv
- **Components**:
  - `CalibrationChart.tsx` - Plotly chart for predicted vs actual validation
  - `MethodComparisonChart.tsx` - Heatmap + table for stock-method cross-comparison
  - `RecoveryComparisonChart.tsx` - Bar chart for recovery analysis
- **Types**: `probabilityValidation.ts`, `probabilityRecovery.ts`

## Technical Implementation Notes

### CSV Format Handling (January 2026)
- **Data Loading**: `useProbabilityValidationData.ts` and `useProbabilityRecoveryData.ts` automatically normalize `ProbMethod` column
- **Normalization Function**: `normalizeProbMethod()` in `src/utils/probabilityMethods.ts` converts between formats:
  - Old format: `"PoW - Weighted Average"` → New format: `"Weighted Average"`
  - Handles both formats transparently
- **Display**: `getDisplayProbMethod()` adds "PoW - " prefix for user display
- **Backward Compatibility**: Works with both old and new CSV formats without code changes

### Calibration Analysis (CalibrationChart.tsx)
- Uses Plotly with `hovermode: 'closest'` for precise dot-only hover detection
- Lines drawn with `activeDot={false}` to prevent line hover
- Scatter dots trigger tooltips only on direct hover
- Supports 4 data aggregation levels: aggregated, by_stock, by_dte, by_stock_and_dte
- Dynamic aggregation when specific DTE is selected (weighted average calculation)
- Methods stored internally in normalized format, displayed with "PoW - " prefix

### Stock Performance by Method (MethodComparisonChart.tsx)
- Data aggregation: Filters to `calibration_by_stock_and_dte` records with DTE_Bin = 'All DTE' for "All DTE" filter
- For specific DTE bins, filters directly to that DTE_Bin value
- Weighted calculation: `sum(count × calibrationError) / sum(count)` per stock-method pair
- 25th percentile filtering applied to sample counts
- Heatmap color-coded with automatic scaling
- Table sortable by any column (stock name or any method)
- All stocks always displayed for comparison
- Method names stored in normalized format, displayed with "PoW - " prefix

### Data Flow
1. Hook loads CSV from GitHub raw content
2. Data parsed with pipe delimiter (`|`)
3. **Normalization**: `ProbMethod` column values are normalized during parsing
4. Split into metrics vs calibration data
5. Passed to components as `calibrationPoints` array (with normalized method names)
6. Components convert to display format when rendering
7. UI updates reactively as selections change
