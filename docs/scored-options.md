# Scored Options Recommendations

**Route:** `/scored-options`
**Component:** `ScoredOptions.tsx`
**Navigation:** Automated Analysis → Scored Options Recommendations

---

## Overview

The **Scored Options Recommendations** page provides dual-model analysis combining V2.1 probability predictions with technical analysis (TA) indicators to identify high-probability put writing opportunities. The page validates model agreement between two independent analysis approaches and filters options based on score thresholds and model consensus.

**Key Concept:** Two independent models score each option:
- **V2.1 Model** - Probability-based scoring using 52-week historical support, current probability, and statistical metrics
- **TA Model** - Technical analysis indicators including RSI, MACD, Bollinger Bands, and price momentum

The page emphasizes **model agreement** - when both models independently recommend an option, confidence is higher.

---

## Summary KPIs

Four key metrics provide an at-a-glance overview:

| KPI | Description |
|-----|-------------|
| **Total Options** | Total number of options analyzed across all expiry dates |
| **Models Agree** | Count of options where V2.1 and TA models both recommend (percentage of total) |
| **Strong Agreement** | Options with "Strong" agreement strength (percentage of agreements) |
| **Showing** | Options currently displayed after applying all filters (percentage of total) |

---

## Filtering & Configuration

### Filter Panel

**Expiry Date** (Required)
- Dropdown selector for option expiration date
- Must select an expiry date to view results

**Stocks** (Optional)
- Multi-select dropdown for individual stock filtering
- "All stocks" shows results across all available stocks
- Dynamically populated from available data

**Model Agreement** (Optional)
- **All Options** - Show all analyzed options regardless of model agreement
- **Models Agree** - Show only options where both V2.1 and TA models recommend
- **Models Disagree** - Show only options where models disagree (useful for conflict analysis)

**Min Combined Score** (0-100, default: 70)
- Slider filter for overall combined score threshold
- Filters by average of V2.1 and TA scores
- Value range: 0-100
- Default filters to "good" quality recommendations

**Min V2.1 Score** (0-100, default: 0)
- Slider filter for V2.1 probability model score minimum
- When set to 0: Includes options with missing V2.1 Score values
- When set > 0: Excludes options with missing V2.1 Score values
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
| **Details** | Button | Expandable row showing V2.1 breakdown, TA breakdown, and agreement analysis |
| **Stock** | Link | Stock ticker (linked to stock details page) |
| **Option** | Link | Option contract name (linked to option details page) |
| **Strike** | Number | Strike price of the option |
| **Expiry** | Date | Option expiration date (Swedish format: YYYY-MM-DD) |
| **DTE** | Number | Days to expiration |
| **Premium** | Currency | Current option premium in SEK |
| **V2.1 Score** | Number (0-100) | V2.1 probability model score (may show "-" if missing) |
| **TA Prob** | Percentage (0-100%) | Technical analysis probability (may show "-" if missing) |
| **Combined** | Score (0-100) | Average of V2.1 and TA scores with color coding |
| **Agree** | Symbol | ✓ (agree) or ✕ (disagree) |
| **Strength** | Text | Strong / Moderate / Weak (only when models agree) |

### Row Styling

**Combined Score Colors:**
- Green (✓): Score ≥ 80
- Amber/Orange: Score 70-79
- Red (✕): Score < 70

### Missing Value Handling

**Critical:** V2.1 Score and TA Probability columns may display "-" for options without calculated values.

- Options with missing V2.1 Score values are **included** when "Min V2.1 Score" is set to 0, and **excluded** when set above 0
- Options with missing TA Probability values are **included** when "Min TA Prob" is set to 0%, and **excluded** when set above 0%
- When sorting by these columns, rows with missing values sort to the bottom (after all numeric values)
- The "-" placeholder ensures data consistency and accurate filtering/sorting

---

## Expandable Row Details

### V2.1 Breakdown Section

Detailed V2.1 model calculations:
- **V2.1 Score** - Overall probability score
- **V2.1 Bucket** - Risk categorization (e.g., "High", "Medium", "Low")
- **Historical Peak** - Highest historical probability for this option
- **Support Strength** - 52-week support level robustness score

### TA Breakdown Section

Detailed technical analysis metrics:
- **TA Probability** - Overall TA recommendation strength
- **TA Bucket** - Risk categorization
- **RSI 14** - 14-period Relative Strength Index (momentum indicator)
- **RSI Slope** - Trend of RSI (positive = strengthening, negative = weakening)
- **MACD Histogram** - Difference between MACD and signal line
- **MACD Slope** - Direction of MACD momentum
- **Bollinger Band Position** - Price position relative to upper/lower bands
- **Distance from SMA50** - Distance from 50-day moving average
- **Volume Ratio** - Current volume relative to average
- **Sigma Distance** - Statistical deviation from mean
- **HV Annual** - Annualized historical volatility percentage

### Agreement Analysis Section

Summary of model consensus:
- **Models Agree** - Boolean indicator of agreement
- **Agreement Strength** - Strong / Moderate / Weak classification
- **Agreement Explanation** - Text describing basis for agreement classification

---

## Data Source

**CSV File:** `current_options_scored.csv`
**Location:** `/data/current_options_scored.csv`
**Format:** Pipe-delimited (`|`) text file
**Columns:** 25+ fields including stock name, expiry date, V2.1 scores, TA indicators, and agreement metrics

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
5. Click row to view V2.1 and TA breakdowns

### Workflow 2: Compare Model Disagreements

1. Select expiry date
2. Set "Model Agreement" to "Models Disagree"
3. Expand rows to see why models diverged
4. Analyze which model factors contribute to disagreement

### Workflow 3: Focus on Probability Model

1. Select expiry date
2. Set "Min V2.1 Score" to 60+
3. Leave "Min TA Prob" at 0%
4. Review options favored by probability model regardless of TA consensus

### Workflow 4: Focus on Technical Analysis

1. Select expiry date
2. Leave "Min V2.1 Score" at 0
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

**V2.1 and TA Probability Handling:**
- Missing or invalid values from CSV are converted to `null` during parsing
- `parseFloat("-")` and other invalid strings produce NaN, which is converted to null
- Null values display as "-" in the table but are handled distinctly in filtering/sorting

**Sorting Behavior:**
- Null values always sort to the bottom, regardless of sort direction
- Numeric values sort normally (ascending or descending)
- String values sort alphabetically

**Filtering Logic:**
- Minimum score filters only exclude rows with null values when the filter is set to a value greater than 0
- Example: "Min V2.1 Score: 0" includes rows where v21_score is null or >= 0
- Example: "Min V2.1 Score: 27" excludes any row where v21_score is null or < 27
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

**January 2026 (Latest):**
- Fixed missing value filter logic: options with missing V2.1 Score or TA Probability values are now included when filters are set to 0
- Previously: Missing values were always excluded regardless of filter setting
- Now: Missing values only excluded when minimum threshold is set to a value greater than 0
- Null values continue to sort to bottom when clicking column headers
- Display continues to show "-" consistently for missing values

**January 2026 (Earlier):**
- Fixed null/NaN handling in filtering and sorting
- Null values now consistently sort to bottom when clicking column headers
- Updated display to show "-" consistently for missing values
