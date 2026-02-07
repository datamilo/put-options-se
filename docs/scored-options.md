# Scored Options Recommendations

**Route:** `/scored-options`
**Component:** `ScoredOptions.tsx`
**Navigation:** Automated Analysis → Scored Options Recommendations

---

## Overview

The **Scored Options Recommendations** page provides dual-model analysis combining Probability Optimization Score predictions with TA ML Model technical analysis indicators to identify high-probability put writing opportunities. The page validates model agreement between two independent analysis approaches and filters options based on score thresholds and model consensus.

**Key Concept:** Two independent models score each option:
- **Probability Optimization Model** - Probability-based scoring using current market probability (60%), historical peak probability (30%), and support strength (10%)
- **TA ML Model** - Machine learning classifier (Random Forest) using 17 technical indicators: RSI, MACD, Bollinger Bands, ADX, ATR, Stochastic, and option Greeks (Delta, Vega, Theta)

The page emphasizes **model agreement** - when both models independently recommend an option, confidence is higher.

---

## Summary KPIs

Four key metrics provide an at-a-glance overview, with two updating dynamically based on current filter selections:

| KPI | Description |
|-----|-------------|
| **Total Options** | Total number of options analyzed across all expiry dates |
| **Avg Combined Score** | Average confidence level across filtered results (dynamically updates) |
| **Sample Size** | Historical validation sample size for the current score range (larger = more reliable) |
| **Showing** | Options currently displayed after applying all filters (percentage of total) |

### Dynamic KPI Updates

Two KPI cards update whenever you change filters:
- **Avg Combined Score** - Recalculates mean score of filtered options; color-coded by confidence level
- **Sample Size** - Shows historical sample size for the score range of your filtered results

The other two cards remain static:
- **Total Options** - Total dataset size (unchanged)
- **Showing** - Current filter result count (updated only by filter changes, not recalculated like the two above)

---

## Filtering & Configuration

### Filter Panel

**Expiry Date** (Required)
- Dropdown selector for option expiration date
- Must select an expiry date to view results

**Stocks** (Optional)
- Multi-select dropdown for individual stock filtering
- "All stocks" shows results across all available stocks
- When stocks are selected, a "Clear all stocks" button appears in the dropdown for quick reset to "All stocks"
- Dynamically populated from available data

**Model Agreement** (Optional)
- **All Options** - Show all analyzed options regardless of model agreement
- **Models Agree** - Show only options where both Probability Optimization and TA models recommend
- **Models Disagree** - Show only options where models disagree (useful for conflict analysis)

**Min Combined Score** (0-100, default: 70)
- Slider filter for overall combined score threshold
- Combined score is calculated as average of Probability Optimization and TA scores
- When set to 0: Includes options with missing combined scores
- When set > 0: Excludes options with missing combined scores
- Value range: 0-100
- Default filters to "good" quality recommendations

**Min Probability Optimization Score** (0-100, default: 0)
- Slider filter for Probability Optimization probability model score minimum
- When set to 0: Includes options with missing Probability Optimization Score values
- When set > 0: Excludes options with missing Probability Optimization Score values
- Use to focus on probability-model-favored options

**Min TA Prob** (0-100%, default: 0%)
- Slider filter for Technical Analysis probability minimum
- When set to 0%: Includes options with missing TA Probability values
- When set > 0%: Excludes options with missing TA Probability values
- Use to focus on technically-favored options

---

## Results Table

### Column Definitions

| Column | Type | Description |
|--------|------|-------------|
| **Details** | Button | Expandable row showing Probability Optimization breakdown, TA ML Model breakdown, and agreement analysis |
| **Stock** | Link | Stock ticker (linked to stock details page) |
| **Option** | Link | Option contract name (linked to option details page) |
| **Strike** | Number | Strike price of the option |
| **Expiry** | Date | Option expiration date (Swedish format: YYYY-MM-DD) |
| **DTE** | Number | Days to expiration |
| **Premium** | Currency | Current option premium in SEK |
| **Probability Score** | Number (0-100) | Probability Optimization Score (may show "-" if missing) |
| **TA Prob** | Percentage (0-100%) | TA ML Model probability (may show "-" if missing) |
| **Combined** | Score (0-100) | Average of Probability and TA scores with color coding |
| **Agree** | Symbol | ✓ (agree) or ✕ (disagree) |
| **Strength** | Text | Strong / Moderate / Weak (only when models agree) |

### Row Styling

**Combined Score Colors:**
- Green (✓): Score ≥ 80
- Amber/Orange: Score 70-79
- Red (✕): Score < 70

### Missing Value Handling

**Critical:** Probability Optimization Score and TA Probability columns may display "-" for options without calculated values.

- Options with missing Probability Optimization Score values are **included** when "Min Probability Optimization Score" is set to 0, and **excluded** when set above 0
- Options with missing TA Probability values are **included** when "Min TA Prob" is set to 0%, and **excluded** when set above 0%
- When sorting by these columns, rows with missing values sort to the bottom (after all numeric values)
- The "-" placeholder ensures data consistency and accurate filtering/sorting

---

## Expandable Row Details

### Probability Optimization Breakdown Section

Detailed Probability Optimization model calculations:
- **Probability Score** - Overall probability score (displayed as percentage, e.g., "85,5%")
- **Probability Bucket** - Risk categorization (e.g., "High", "Medium", "Low")
- **Current Probability** - Current probability of value decay (displayed as percentage, e.g., "85,50%")
- **Historical Peak** - Highest historical probability for this option (displayed as percentage, e.g., "85,50%")
- **Support Strength** - 52-week support level robustness score (displayed as percentage, e.g., "85,50%" with visual progress bar)

### TA ML Model Breakdown Section

Detailed TA ML Model metrics organized into two sections with status indicators (🟢 Favorable, 🟡 Neutral, 🔴 Unfavorable):

**Stock-Level Technical Indicators** (12 indicators analyzing stock price action):
- **TA Probability** - Overall TA recommendation strength (displayed as percentage, e.g., "85%")
- **TA Bucket** - Risk categorization
- **RSI 14** - 14-period Relative Strength Index (momentum indicator, 0-100 scale)
- **RSI Slope** - Trend direction of RSI (positive = strengthening, negative = weakening)
- **MACD Histogram** - Difference between MACD and signal line
- **MACD Slope** - Direction and strength of MACD momentum
- **Bollinger Band Position** - Price position relative to upper/lower bands (-1 to 1 scale)
- **Distance from SMA50** - Distance from 50-day moving average
- **Volume Ratio** - Current volume relative to average
- **ADX 14** - Average Directional Index (trend strength: >25 = strong, <20 = weak)
- **ADX Slope** - Trend of ADX (positive = strengthening trend, negative = weakening)
- **ATR 14** - Average True Range (volatility measure)
- **Stochastic K** - Stochastic K line (0-100 scale, <20 = oversold, >80 = overbought)
- **Stochastic D** - Stochastic D signal line (smoothed K)

**Contract-Level Indicators** (4 indicators analyzing specific option characteristics):
- **Sigma Distance** - Statistical deviation from mean (contract positioning)
- **Delta (Greeks)** - Sensitivity to stock price changes (-1 to 0 for puts, more negative = higher ITM risk)
- **Vega (Greeks)** - Sensitivity to volatility changes (positive = benefits from IV increase)
- **Theta (Greeks)** - Time decay per day (positive = benefits seller)

### Agreement Analysis Section

Summary of model consensus:
- **Models Agree** - Boolean indicator of agreement
- **Agreement Strength** - Strong / Moderate / Weak classification
- **Agreement Explanation** - Text describing basis for agreement classification

---

## Model Calibration & Accuracy

The page displays comprehensive bucket-based calibration metrics showing actual hit rates (percentage of options that expire worthless) at each predicted probability level. This replaces traditional AUC metrics with investor-friendly business metrics.

### Calibration Tables

**Two Independent Models, Side-by-Side Comparison:**

**Probability Optimization Model (V2.1):**
- Hit rates by score range from <50% to 90-100%
- Based on 934K+ expired options over 21+ months (April 2024 - January 2026)
- Shows stable 76-78% hit rate at the 70-80% optimal range

**TA Model V3 (Technical + Machine Learning):**
- Hit rates by predicted probability range
- Based on 1.59M walk-forward validated out-of-sample predictions
- Shows 77.1% hit rate at 70-80% range with tight 95% confidence intervals [77.0%-77.2%]

### Key Insight: The 70-80% Premium Zone

Both models independently confirm **77% hit rate** at the 70-80% prediction range:

| Metric | Value | Interpretation |
|--------|-------|-----------------|
| **Hit Rate** | 77% | Options expire worthless |
| **Failure Rate** | 23% | Options expire in-the-money (acceptable) |
| **Premium Multiplier** | 5-10x | Optimal risk-reward tradeoff |
| **Expected Return** | (77% × 5-10x) - (23% × Loss) | Superior to conservative ranges |
| **Sample Size** | 583K+ | Very large (TA V3 at 70-80% range) |
| **Confidence Interval** | [77.0%-77.2%] | Tight (high precision) |

### Temporal Stability Analysis

TA Model V3 calibration varies across different market periods (per-fold analysis):

- **Fold 1 (Aug-Dec 2024):** 73.8% (-3.2pp)
- **Fold 2 (Dec 2024-Mar 2025):** 64.7% (-12.3pp) - Market regime shift
- **Fold 3 (Mar-Jun 2025):** 82.0% (+7.0pp) - Strong recovery
- **Fold 4 (Jun-Sep 2025):** 79.0% (+1.9pp) - Above average
- **Fold 5 (Oct 2025-Jan 2026):** 80.8% (+3.7pp) - Recent strength

**Interpretation:** Long-term average of 77% masks period-to-period variation. Recent periods (Folds 4-5) show strength. Fold 2 underperformance reflects temporary market regime shift. Users should understand hit rates fluctuate seasonally but remain stable long-term.

### Trust Indicators

- ✓ **Dual-Model Validation** - Two independent models converge on 77% (high confidence)
- ✓ **Walk-Forward Tested** - 1.59M predictions on data models never trained on (proof of genuine ability)
- ✓ **Calibration Accuracy** - 2.4% average error between predicted and actual outcomes (excellent)
- ✓ **Large Sample Sizes** - 583K+ samples at 70-80% range (high statistical precision)

---

## Data Source

**CSV File:** `current_options_scored.csv`
**Location:** `/data/current_options_scored.csv`
**Format:** Pipe-delimited (`|`) text file
**Columns:** 33 fields including stock name, expiry date, Probability Optimization scores, 17 TA indicators (12 stock-level + 4 contract-level + sigma distance), and agreement metrics

**Enrichment:**
- Premium values are enriched from live website data (not CSV data)
- Strike price, expiry, and basic metrics are loaded from CSV
- Probability and technical analysis scores are pre-calculated and stored in CSV

---

## User Workflows

### Workflow 1: Find High-Confidence Opportunities

1. Select expiry date
2. Set "Model Agreement" to "Models Agree"
3. Set "Min Combined Score" to 70+
4. Review "Strong Agreement" options first
5. Click row to view Probability Optimization and TA breakdowns

### Workflow 2: Compare Model Disagreements

1. Select expiry date
2. Set "Model Agreement" to "Models Disagree"
3. Expand rows to see why models diverged
4. Analyze which model factors contribute to disagreement

### Workflow 3: Focus on Probability Model

1. Select expiry date
2. Set "Min Probability Optimization Score" to 60+
3. Leave "Min TA Prob" at 0%
4. Review options favored by probability model regardless of TA consensus

### Workflow 4: Focus on Technical Analysis

1. Select expiry date
2. Leave "Min Probability Optimization Score" at 0
3. Set "Min TA Prob" to 50%+
4. Review options favored by technical analysis regardless of probability consensus

---

## Export Functionality

**Export to Excel:**
- Button available when filtered results contain at least one option
- Exports currently visible filtered data
- Includes all table columns plus expanded row details
- Filename: `scored-options-YYYY-MM-DD.xlsx`

---

## Technical Notes

### Data Processing

**Probability Optimization and TA Probability Handling:**
- Missing or invalid values from CSV are converted to `null` during parsing
- `parseFloat("-")` and other invalid strings produce NaN, which is converted to null
- Null values display as "-" in the table but are handled distinctly in filtering/sorting

**Sorting Behavior:**
- Null values always sort to the bottom, regardless of sort direction
- Numeric values sort normally (ascending or descending)
- String values sort alphabetically

**Filtering Logic:**
- Minimum score filters only exclude rows with null values when the filter is set to a value greater than 0
- Example: "Min Probability Optimization Score: 0" includes rows where v21_score is null or >= 0
- Example: "Min Probability Optimization Score: 27" excludes any row where v21_score is null or < 27
- Combined Score filter is applied regardless of null values (has default 0 fallback)

### Performance Notes

- Page loads scored options CSV (currently ~5,500 options)
- Enrichment with premium data happens in-memory (no server call)
- Filtering and sorting performed client-side using React useMemo hooks
- No pagination - all filtered results display in scrollable table

---

## Related Pages

- **[recommendations.md](recommendations.md)** - Alternative "Automated Put Option Recommendations" with weighted 6-factor analysis
- **[stock-analysis.md](stock-analysis.md)** - Individual stock metrics and history
- **[probability-analysis.md](probability-analysis.md)** - Probability method validation and accuracy testing

---

## Version History

**January 31, 2026 (Latest - Calibration Metrics Redesign):**

**Major Redesign: From AUC to Bucket-Based Calibration:**
- Replaced single "Walk-Forward AUC 0.651" metric with comprehensive bucket-based calibration tables
- Removed 4 KPI cards (Walk-Forward AUC, Hit Rate, Calibration Error, Coverage) and replaced with rich CalibrationMetrics component
- Added side-by-side comparison tables showing Probability Optimization Model vs TA Model V3
- Each table displays: Score Range, Hit Rate %, Sample Size, 95% Confidence Intervals, and Notes
- Added "Key Insights" summary highlighting 70-80% premium zone convergence (both models: 77% hit rate)
- Added expandable Temporal Stability section showing per-fold variation across 5 market periods (Fold 2 underperformance noted)
- Created 4 new sub-components: BucketCalibrationTable, TemporalStabilitySection, KeyInsightsSummary, CalibrationMetrics
- Updated documentation with new "Model Calibration & Accuracy" section explaining bucket methodology
- Added 8 new tooltip sections in scoredOptionsTooltips.ts for calibration metrics
- Investor-friendly metrics: "If model predicts 70-80%, 77% actually expire worthless" replaces technical AUC terminology

**Previous Session - Transparency & Naming Updates (January 31, 2026):**

**Clarity Improvements:**
- Renamed "V2.1 Score" to "Probability Optimization Score" for better user understanding
- Renamed "TA Model V3" to "TA ML Model" to clarify it's machine learning-based
- Clarified that validation metrics (Walk-Forward AUC, Hit Rate, Calibration Error) apply to both models equally
- Updated "Total Options Available" KPI to explain daily variation (4,500-5,500) due to OTM/ATM filtering
- Improved expandable row layout for better responsiveness on lower-resolution monitors

**January 30, 2026 (TA Model V3 Integration with Full 17-Feature Set):**

**TA ML Model Enhancements:**
- Integrated TA ML Model with expanded 17-feature set as per DOWNSTREAM_TEAM_TA_MODEL_INTEGRATION_GUIDE.md
- Added 5 new stock-level technical indicators: ADX (14), ADX Slope, ATR (14), Stochastic K, Stochastic D
- Added 3 new contract-level Greeks indicators: Delta, Vega, Theta
- Organized TA breakdown into two sections: Stock-Level Indicators and Contract-Level Indicators
- Removed HV Annual field (replaced by expanded TA feature set)
- Added status interpretation (🟢 Favorable, 🟡 Neutral, 🔴 Unfavorable) for all indicators
- Updated data parsing to handle new CSV fields with proper null safety
- Updated Excel export to include all new indicators (33 total fields)

**Previous Changes (January 2026 - Complete Filtering & Formatting Fix):**

**Filtering Improvements:**
- Fixed critical issue: Options with missing values are now correctly included when all filter minimums are set to 0
- Min Probability Optimization Score: Now includes missing values when set to 0, excludes only when > 0
- Min TA Prob: Now includes missing values when set to 0%, excludes only when > 0%
- Min Combined Score: Now includes missing values when set to 0, excludes only when > 0
  - Combined score is calculated from available Probability Optimization or TA scores if missing from CSV
  - Example: Options with only TA score use TA score as combined score
- Resolved discrepancy between KPI count and displayed table rows
- Removed duplicate filtering logic that was causing inconsistent behavior

**Formatting Standardization:**
- Probability Optimization Score: Now displays as percentage (e.g., "85,5%") to match TA Probability format
- Historical Peak: Changed from decimal to percentage format (e.g., "85,50%") for consistency with Current Probability
- Support Strength: Changed from decimal to percentage format (e.g., "85,50%") to reflect 0-1 scale
- HV Annual: Changed from decimal to percentage format (e.g., "45,67%")
- Technical indicators (RSI, MACD, Bollinger Bands, etc.): Remain as decimals (appropriate for their scales)

**UI/UX Improvements:**
- Added "Clear all stocks" button to Stocks filter dropdown for easy reset to "All stocks"
- Stocks filter now shows option name next to selected count for clarity

**Previous Changes (January 2026):**
- Initial null/NaN handling in filtering and sorting
- Null values sort to bottom when clicking column headers
- Display shows "-" for missing values
