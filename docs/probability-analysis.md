# Probability Analysis

Route: `/probability-analysis`

## Overview
Comprehensive probability method validation and recovery opportunity analysis for options trading.

## Features

### Calibration Analysis Section
- Validates different probability calculation methods (Weighted Average, Bayesian Calibrated, Original Black-Scholes, Bias Corrected, Historical IV)
- Scatter plot comparing predicted vs actual probabilities
- Stock-specific filtering to isolate performance by stock
- Metrics for calibration error, Brier score, and prediction accuracy

### Probability Recovery Analysis Section
- Identifies recovery opportunities where market underestimates probability of success
- Compares options that had high historical ITM probability (80%+) vs current lower probability
- Interactive Recovery Advantage Analysis chart with:
  - Historical Peak Threshold selector (0.5-0.95)
  - Probability Method selector
  - Current Probability Bin selector (30-40%, 40-50%, 50-60%, etc.)
  - Optional stock filter

## Page Layout
1. Calibration Analysis chart (top) - validates probability methods
2. Clear section separator
3. Probability Recovery Analysis header
4. Explanation text about recovery opportunities
5. Interactive Recovery Advantage Analysis chart with filters

## Data Files
- `validation_report_data.csv` - Calibration method performance data
- `recovery_report_data.csv` - Recovery analysis scenario data

## File References
- **Page**: `src/pages/ProbabilityAnalysis.tsx`
- **Hooks**: `useProbabilityValidationData.ts`, `useProbabilityRecoveryData.ts`
- **Components**: `CalibrationChart.tsx`, `RecoveryComparisonChart.tsx`
- **Types**: `probabilityValidation.ts`, `probabilityRecovery.ts`
