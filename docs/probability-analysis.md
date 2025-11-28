# Probability Analysis

Route: `/probability-analysis`

## Overview
Comprehensive probability method validation and recovery opportunity analysis for options trading. Includes three visualization sections for comparing method calibration, cross-stock method performance, and recovery opportunities.

## Features

### 1. Calibration Analysis Section
- **Purpose**: Validates different probability calculation methods by comparing predicted vs actual probabilities
- **Methods Compared**: Weighted Average, Bayesian Calibrated, Original Black-Scholes, Bias Corrected, Historical IV
- **Chart Type**: Plotly scatter plot with lines and dots
- **Perfect Calibration Reference**: Diagonal line (y=x) shown as visual reference
- **Filters**:
  - Stock selector (optional, defaults to "All Stocks")
  - Days to Expiry selector (All DTE, 0-3 days, 4-7 days, 8-14 days, 15-21 days, 22-28 days, 29-35 days, 35+ days)
  - Probability Method selector (All Methods or individual method)
- **Interactive Tooltips**:
  - Method name with color indicator
  - Predicted and Actual probabilities (format: P: X% | A: Y%)
  - Sample count (n=X)
- **Key Insight**: Points above diagonal = conservative (safer than predicted), below = overconfident (riskier than predicted)

### 2. Stock Performance by Method Section (NEW)
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
  - Days to Expiry selector (same DTE bins as Calibration Analysis)
- **Sorting**: Click any column header to sort by that method or metric
- **Data Quality**: Uses 25th percentile sample size filtering to exclude low-sample outliers
- **Color Scale**:
  - Dark Red (< -0.20): Significantly overconfident
  - Light Red (-0.10 to 0.00): Slightly overconfident
  - Light Green (0.00 to +0.10): Slightly conservative
  - Dark Green (> +0.20): Significantly conservative

### 3. Probability Recovery Analysis Section
- **Purpose**: Identifies recovery opportunities where market underestimates probability of success
- **Scenario**: Finds options that previously had high ITM probability (80%+) but have since declined in probability
- **Chart**: Bar comparison showing worthless rate for recovery candidates vs baseline
- **Hypothesis**: If green bars > red bars, recovery candidates are statistically safer (market overestimated risk)
- **Filters** (left to right):
  - Stock selector (optional, defaults to "All Stocks")
  - Probability Method selector
  - Historical Peak Threshold selector (0.5-0.95)
  - Current Probability Bin selector (30-40%, 40-50%, 50-60%, etc.)

## Page Layout & Flow
1. Page Header with back button and Probability Analysis title
2. Executive Overview Cards (Calibration Analysis, Probability Recovery)
3. **Calibration Analysis Section**
   - Explanation card ("How to Read the Chart")
   - Interactive Calibration chart with filters
4. Section Separator
5. **Stock Performance by Method Section** (NEW)
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
- `recovery_report_data.csv` - Recovery analysis scenario data

## File References
- **Page**: `src/pages/ProbabilityAnalysis.tsx`
- **Hooks**:
  - `useProbabilityValidationData.ts` - Loads and parses validation_report_data.csv
  - `useProbabilityRecoveryData.ts` - Loads recovery_report_data.csv
- **Components**:
  - `CalibrationChart.tsx` - Plotly chart for predicted vs actual validation
  - `MethodComparisonChart.tsx` (NEW) - Heatmap + table for stock-method cross-comparison
  - `RecoveryComparisonChart.tsx` - Bar chart for recovery analysis
- **Types**: `probabilityValidation.ts`, `probabilityRecovery.ts`

## Technical Implementation Notes

### Calibration Analysis (CalibrationChart.tsx)
- Uses Plotly with `hovermode: 'closest'` for precise dot-only hover detection
- Lines drawn with `activeDot={false}` to prevent line hover
- Scatter dots trigger tooltips only on direct hover
- Supports 4 data aggregation levels: aggregated, by_stock, by_dte, by_stock_and_dte
- Dynamic aggregation when specific DTE is selected (weighted average calculation)

### Stock Performance by Method (MethodComparisonChart.tsx)
- Data aggregation: Filters to `calibration_by_stock_and_dte` records only
- Weighted calculation: `sum(count × calibrationError) / sum(count)` per stock-method pair
- 25th percentile filtering applied to sample counts
- Heatmap color-coded with automatic scaling
- Table sortable by any column (stock name or any method)
- All stocks always displayed for comparison

### Data Flow
1. Hook loads CSV from GitHub raw content
2. Data parsed with pipe delimiter (`|`)
3. Split into metrics vs calibration data
4. Passed to components as `calibrationPoints` array
5. Components filter and aggregate based on user selections
6. UI updates reactively as selections change
