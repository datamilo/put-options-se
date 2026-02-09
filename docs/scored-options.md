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

The page emphasizes **model agreement** - measured by proximity between model scores. When both models predict SIMILAR probabilities (within ±5% relative difference), confidence is higher. This is different from just "both models high" - it's about consensus (agreement) between models, not absolute score levels.

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
- **Models Agree** - Show only options where both models predict SIMILAR probabilities (within ±5% relative difference)
- **Models Disagree** - Show only options where models predict divergent probabilities (useful for conflict analysis)

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

The Agreement Analysis section displays how closely the two independent models align on their probability predictions. Agreement is measured by **proximity** (similarity) of scores, NOT by absolute score levels.

#### How Agreement is Calculated

Agreement uses a **relative difference formula** to measure score proximity:

```
relative_diff = |V2.1_Score - (TA_Probability × 100)| / average_score
models_agree = relative_diff ≤ 0.05 (5%)
```

**Example:**
- V2.1 Score: 75%
- TA Probability: 77%
- Difference: |75 - 77| = 2
- Average: (75 + 77) / 2 = 76
- Relative difference: 2 / 76 = 0.026 (2.6%)
- Result: **Models Agree** ✓ (2.6% < 5%)

This approach measures **consensus** between models, not "both models high." A V2.1 score of 55% and TA Probability of 57% would also agree (2% relative difference), while a V2.1 score of 75% and TA Probability of 73% would disagree (2.6% is close but relative difference matters more than absolute difference).

#### Agreement Fields in Expandable Row

- **Models Agree** - Boolean (✓/✕): Indicates whether relative difference ≤ 5%
- **Agreement Strength** - Classification: Only displayed when models agree
  - **Strong**: Relative difference ≤ 2% (very similar predictions)
  - **Moderate**: Relative difference 2-5% (reasonably similar predictions)
  - **Weak**: Relative difference > 5% (models disagree)
- **Agreement Explanation** - Descriptive text: Explains basis for classification and shows calculated relative difference percentage

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

Both models independently score highly at the 70-80% prediction range:

| Metric | V2.1 | TA Model V3 |
|--------|------|-----------|
| **Hit Rate (70-80%)** | 83.8% | 72.42% |
| **Sample Size** | 19,830 | 1,425,565 |
| **Confidence Interval** | [83.3%-84.3%] | [72.34%-72.49%] |
| **Note** | Stable across all expirations | Varies by DTE (see below) |

**Important:** TA Model V3 hit rate of 72.42% is a **weighted average** across all expiration dates. Performance varies dramatically by days to expiration—see critical DTE cliff finding below.

### 🚨 CRITICAL: DTE Performance Cliff

TA Model V3 performance drops sharply beyond 35 days to expiration:

| DTE Range | Hit Rate (70-80% bucket) | Sample Size | Performance Level |
|---|---|---|---|
| **0-35 days** | **77%** | 2,096,987 | ✅ Excellent for put selling |
| **36+ days** | **54%** | 6,724,614 | ⚠️ Below threshold |

**What This Means:**
- **Short-dated options (0-35 DTE):** 77% hit rate—excellent accuracy for put writing strategies
- **Far-dated options (36+ DTE):** 54% hit rate—barely above baseline, insufficient confidence for trading recommendations
- **Production Reality:** 76% of all options in production are 36+ DTE (6.7M of 8.8M total)

**Why It Happens:**
- Momentum indicators (RSI, MACD, Bollinger Bands) are calibrated for shorter-term trading patterns
- Time decay behavior differs fundamentally between short and far-dated options
- Technical signals become less predictive for options with months to expiration

**Observation:** The 36-day expiration boundary reflects a fundamental shift in how technical indicators behave. When both V2.1 and TA Model V3 independently predict 70%+ probability, the historical data shows higher empirical accuracy than either model alone. This provides evidence for why analyzing model agreement can be valuable.

### Temporal Stability Analysis

TA Model V3 calibration varies across different market periods (per-fold analysis):

- **Fold 1 (Aug-Dec 2024):** 73.8% (-3.2pp)
- **Fold 2 (Dec 2024-Mar 2025):** 64.7% (-12.3pp) - Market regime shift
- **Fold 3 (Mar-Jun 2025):** 82.0% (+7.0pp) - Strong recovery
- **Fold 4 (Jun-Sep 2025):** 79.0% (+1.9pp) - Above average
- **Fold 5 (Oct 2025-Jan 2026):** 80.8% (+3.7pp) - Recent strength

**Interpretation:** Long-term average of 77% masks period-to-period variation. Recent periods (Folds 4-5) show strength. Fold 2 underperformance reflects temporary market regime shift. Users should understand hit rates fluctuate seasonally but remain stable long-term.

### Loss Analysis - Risk-Adjusted Returns

Beyond predicting success rates, both models demonstrate **risk-adjusted scoring**: higher confidence predictions not only achieve higher success rates but also fail with smaller losses when predictions are wrong.

#### Loss Validation Results

**V2.1 Loss Analysis by Confidence Level:**
- **Highest confidence (80-100% score):** 4,64% average loss when wrong
- **Medium confidence (70-80% score):** 5,94% average loss when wrong
- **Lowest confidence (<50% score):** 11,63% average loss when wrong
- **Loss Ratio:** 2,51x (low-confidence losses are 2.5 times higher than high-confidence losses)

**TA Model V3 Loss Analysis by Confidence Level:**
- **Highest confidence (90%+ predicted):** 6,44% average loss when wrong
- **Medium confidence (70-80% predicted):** 6,64% average loss when wrong
- **Lowest confidence (<50% predicted):** 12,16% average loss when wrong
- **Loss Ratio:** 1,89x (low-confidence losses are 1.9 times higher than high-confidence losses)

**Interpretation:** Both models correctly identify which predictions are risky. The model's confidence level predicts not just success rate but also loss severity when failures occur. Lower confidence predictions fail more frequently AND with larger losses—demonstrating consistent risk calibration.

#### Expected Return Analysis

When selling puts with a fixed premium (e.g., 2,5%), expected return combines:
- **Profit from successes:** (Hit Rate) × (Premium Collected)
- **Loss from failures:** (Failure Rate) × (Average Loss When Wrong)

**V2.1 Expected Returns by Score Bucket (assuming 2,5% premium):**

| Score Bucket | Hit Rate | Avg Loss When Wrong | Expected Return | Trading Recommendation |
|---|---|---|---|---|
| 80-100% | 72,32% | 4,64% | **+0,52%** | ✅ Profitable |
| 70-80% | 62,51% | 5,94% | **-0,66%** | ⚠️ Marginal loss (requires 3%+ premium) |
| 60-70% | 51,43% | 7,45% | **-2,57%** | ❌ Significant loss |
| 50-60% | 38,93% | 9,12% | **-3,68%** | ❌ High loss—avoid |
| <50% | 23,80% | 11,63% | **-8,27%** | ❌ Avoid entirely |

**TA Model V3 Expected Returns by Score Bucket (assuming 2,5% premium):**

| Predicted Range | Hit Rate | Avg Loss When Wrong | Expected Return | Trading Recommendation |
|---|---|---|---|---|
| 90%+ | 85,82% | 6,44% | **+1,23%** | ✅ Best profit opportunity |
| 80-90% | 76,92% | 6,21% | **+0,39%** | ✅ Profitable |
| 70-80% | 70,16% | 6,64% | **-0,23%** | ⚠️ Break-even (requires premium >2,5%) |
| 60-70% | 57,37% | 7,89% | **-1,65%** | ❌ Loss |
| 50-60% | 39,73% | 9,64% | **-3,94%** | ❌ High loss—avoid |
| <50% | 15,80% | 12,16% | **-9,84%** | ❌ Avoid entirely |

**Critical Insight - Premium Requirement:** At 2,5% premium, only the highest confidence buckets generate positive expected returns:
- **V2.1:** Only 80-100% bucket is profitable
- **TA Model V3:** Only 80-90% and 90%+ buckets are profitable

#### Expected Return Analysis: Factual Observations

At 2,5% premium collected, the models show the following expected returns by confidence level:

**V2.1 Model Expected Returns by Score Bucket:**

| Score Bucket | Hit Rate | Avg Loss When Wrong | Expected Return |
|---|---|---|---|
| 80-100% | 72,32% | 4,64% | +0,52% |
| 70-80% | 62,51% | 5,94% | -0,66% |
| 60-70% | 51,43% | 7,45% | -2,57% |
| 50-60% | 38,93% | 9,12% | -3,68% |
| <50% | 23,80% | 11,63% | -8,27% |

**TA Model V3 Expected Returns by Score Bucket:**

| Predicted Range | Hit Rate | Avg Loss When Wrong | Expected Return |
|---|---|---|---|
| 90%+ | 85,82% | 6,44% | +1,23% |
| 80-90% | 76,92% | 6,21% | +0,39% |
| 70-80% | 70,16% | 6,64% | -0,23% |
| 60-70% | 57,37% | 7,89% | -1,65% |
| 50-60% | 39,73% | 9,64% | -3,94% |
| <50% | 15,80% | 12,16% | -9,84% |

**Key Observation:** At 2,5% premium, buckets with negative expected returns show losses that are only offset by premiums higher than 2,5%.

#### Loss Magnitude Data

**Maximum and Median Losses Observed:**
- **V2.1 Model:** Maximum loss 73,48%, Median loss (70-80% bucket) 3,87%
- **TA Model V3:** Maximum loss 67,59%, Median loss (70-80% bucket) 4,62%

**Loss Distribution by Confidence Level:**
- Higher confidence predictions (80%+): Average loss when wrong 4,6-6,6%
- Lower confidence predictions (<50%): Average loss when wrong 11,6-12,2%
- Loss increases systematically as prediction confidence decreases

### Model Comparison: V2.1 vs TA Model V3

| Metric | V2.1 | TA Model V3 | Interpretation |
|--------|------|-----------|--------|
| **Hit Rate (70-80%)** | **83.8%** | **72.42%** | Both well-calibrated; different market coverage scope |
| **Sample Size (70-80%)** | 19,830 | 1,425,565 | 72x larger sample for TA; tighter precision |
| **Total Tested** | 72,469 options | 8,821,601 options | TA V3 covers entire production distribution |
| **Confidence Interval** | 83.3%-84.3% | 72.34%-72.49% | Both highly precise ±0.15-0.5pp |
| **Data Coverage** | Deep tracking on 3.9% of options | Works on 100% of options | V2.1 specialized; TA V3 universal |
| **DTE Stability** | Consistent across all expirations | 77% (0-35 DTE) vs 54% (36+ DTE) | V2.1 reliable; TA V3 DTE-dependent |
| **Calibration Error** | 2.4% mean | 2.2% mean (ECE) | Both excellently calibrated |

**Key Insight:** V2.1 achieves higher hit rate on its specialized tracking subset (83.8%). TA Model V3 achieves solid hit rate on universal coverage (72.42%). Different data sources provide genuinely independent perspectives. When both models predict 70%+ probability, combined confidence is higher than either alone.

### Trust Indicators

- ✓ **Dual-Model Validation** - Two independent analytical approaches (probability-based vs. technical) provide confirmation
- ✓ **Large Sample Sizes** - TA V3: 1.4M options at 70-80% range; V2.1: 19.8K deeply tracked options (high precision)
- ✓ **Comprehensive Testing** - TA V3: 8.8M historical options; V2.1: 72.5K with known outcomes (21+ months)
- ✓ **Calibration Accuracy** - 2.4% mean error between predicted and actual outcomes (excellent)

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

**February 9, 2026 (Latest - Comprehensive TA Model V3 Update with Loss Analysis):**

**Major Update: New 8.8M Sample Backtesting Results & Risk Analysis:**
- Updated TA Model V3 calibration data from 1.59M predictions to comprehensive 8.8M historical options analysis
- TA Model V3 (70-80% bucket): Hit rate updated from 76.6% to **72.42%** with tighter confidence intervals [72.34%-72.49%]
- All TA Model V3 buckets recalculated with new sample sizes:
  - 90%+: 98.24% (587,666 samples)
  - 80-90%: 85.25% (1,766,411 samples)
  - 70-80%: 72.42% (1,425,565 samples)
  - 60-70%: 62.85% (1,126,329 samples)
  - 50-60%: 54.32% (915,790 samples)
  - <50%: 31.04% (2,999,840 samples)
- **CRITICAL: Added DTE Performance Cliff Finding:**
  - Short-dated options (0-35 DTE): 77% hit rate ✅
  - Far-dated options (36+ DTE): 54% hit rate ⚠️ (below threshold)
  - Action: Require V2.1 model agreement for far-dated options
- **NEW: Comprehensive Loss Analysis Section:**
  - V2.1: 4.64% average loss (high confidence) to 11.63% (low confidence); 2.51x loss ratio
  - TA Model V3: 6.44% to 12.16% average losses; 1.89x loss ratio
  - Expected return analysis by bucket at 2.5% premium
  - Capital allocation framework (Tiers 1-4 based on expected returns)
  - Risk management: 15-20% capital reserve for worst-case scenarios
  - Maximum observed losses: V2.1 73.48%, TA Model V3 67.59%
- Updated Model Comparison section with new metrics and DTE considerations
- Added "Models Agree" validation criteria and confluence analysis
- Updated "Trust Indicators" with new sample size and testing scope metrics
- Updated Temporal Stability Analysis with context about period-to-period variation

Source: INVESTOR_GUIDE_SCORING_ENGINE_PERFORMANCE.md (February 9, 2026)

---

**January 31, 2026 (Calibration Metrics Redesign):**

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
