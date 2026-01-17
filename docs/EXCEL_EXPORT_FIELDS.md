# Excel Export Field Specification - Automated Put Option Recommendations

**Last Updated**: January 17, 2026
**Total Fields**: 51 (27 Base Fields + 24 Score Breakdown Fields)
**File Format**: XLSX with Nordic number formatting

---

## Base Fields (27 Columns)

### Identification Fields

| # | Field Name | Data Type | Description |
|---|---|---|---|
| 1 | Rank | Integer | Position in ranked recommendation list (1 = top recommendation) |
| 2 | Stock Name | Text | Company ticker/name (e.g., "ERIC B", "ABB") |
| 3 | Option Name | Text | Unique option contract identifier (e.g., "ERICB6U45") |

### Pricing & Expiry Fields

| # | Field Name | Data Type | Description |
|---|---|---|---|
| 4 | Strike Price | Decimal (2 decimals) | Strike price in SEK - you keep premium if stock stays above this |
| 5 | Current Price | Decimal (2 decimals) | Current stock price in SEK |
| 6 | Expiry Date | Date (YYYY-MM-DD) | Last day the option is valid |
| 7 | Days To Expiry | Integer | Number of calendar days until expiration |
| 8 | Premium | Integer | Total SEK received for selling this position (sized to ~100,000 SEK) |

### Support Level Fields

| # | Field Name | Data Type | Description |
|---|---|---|---|
| 9 | Rolling Low | Decimal (2 decimals) | Lowest price in rolling period (support level) |
| 10 | Distance To Support Pct | Decimal (1 decimal) | How far stock is above support: (Current - Low) / Low × 100 (%) |
| 11 | Days Since Last Break | Integer | Business days since support level was last broken below |
| 12 | Support Strength Score | Integer | Score 0-100 indicating robustness of support level |
| 13 | Pattern Type | Text | Support level pattern classification (e.g., "ascending", "descending", "stable") |

### Probability Fields (Current & Historical)

| # | Field Name | Data Type | Description |
|---|---|---|---|
| 14 | Current Probability | Decimal (1 decimal) | Current probability (PoW %) that option expires worthless - selected method |
| 15 | Historical Peak Probability | Decimal (1 decimal) | Highest historical probability this option has reached (%) |
| 16 | Recovery Advantage | Decimal (1 decimal) | % advantage from probability recovery potential |
| 17 | Current Prob Bin | Text | Probability bucket: <50%, 50-60%, 60-70%, 70-80%, 80-90%, 90%+ |
| 18 | DTE Bin | Text | Days to Expiry bucket: 0-7, 8-14, 15-21, 22-28, 29-35, 36+ |

### Monthly Seasonality Fields

| # | Field Name | Data Type | Description |
|---|---|---|---|
| 19 | Monthly Positive Rate | Decimal (1 decimal) | % of historical months where stock showed positive performance |
| 20 | Monthly Avg Return | Decimal (2 decimals) | Average monthly return for this stock's current month |
| 21 | Typical Low Day | Integer | Typical day of month when stock hits monthly low |
| 22 | Current Month Performance | Decimal (2 decimals) | Current month performance vs historical average (%) |
| 23 | Months In Historical Data | Integer | Number of historical months available for seasonality analysis |
| 24 | Worst Month Drawdown | Decimal (2 decimals) | Worst historical intra-month drawdown open-to-low (%) |

### Event Fields

| # | Field Name | Data Type | Description |
|---|---|---|---|
| 25 | Financial Report | Text | "Y" if earnings/financial report expected before expiry, empty otherwise |
| 26 | X Day | Text | "Y" if ex-dividend date falls before expiry, empty otherwise |

### Composite Score

| # | Field Name | Data Type | Description |
|---|---|---|---|
| 27 | Composite Score | Decimal (1 decimal) | Final weighted recommendation score (0-100) combining all 6 factors |

---

## Score Breakdown Fields (24 Columns)

Each of the 6 scoring factors is exported with 4 sub-fields: raw, normalized, weighted, and data availability.

### Support Strength Factor (Columns 28-31)

| # | Field Name | Data Type | Description |
|---|---|---|---|
| 28 | Support Strength - Raw | Decimal (2 decimals) | Raw support strength score before normalization (%) |
| 29 | Support Strength - Normalized | Decimal (2 decimals) | Support strength normalized to 0-100 scale |
| 30 | Support Strength - Weighted | Decimal (2 decimals) | Weighted contribution to composite score (depends on weight setting) |
| 31 | Support Strength - Has Data | Text | "Yes" if data available, "No" if unavailable |

### Days Since Break Factor (Columns 32-35)

| # | Field Name | Data Type | Description |
|---|---|---|---|
| 32 | Days Since Break - Raw | Decimal (2 decimals) | Days since support last broken (%) normalized |
| 33 | Days Since Break - Normalized | Decimal (2 decimals) | Normalized to 0-100 scale |
| 34 | Days Since Break - Weighted | Decimal (2 decimals) | Weighted contribution to composite score |
| 35 | Days Since Break - Has Data | Text | "Yes" if data available, "No" if unavailable |

### Recovery Advantage Factor (Columns 36-39)

| # | Field Name | Data Type | Description |
|---|---|---|---|
| 36 | Recovery Advantage - Raw | Decimal (2 decimals) | Recovery advantage from probability recovery (%) |
| 37 | Recovery Advantage - Normalized | Decimal (2 decimals) | Normalized to 0-100 scale |
| 38 | Recovery Advantage - Weighted | Decimal (2 decimals) | Weighted contribution to composite score |
| 39 | Recovery Advantage - Has Data | Text | "Yes" if data available, "No" if unavailable |

### Historical Peak Factor (Columns 40-43)

| # | Field Name | Data Type | Description |
|---|---|---|---|
| 40 | Historical Peak - Raw | Decimal (2 decimals) | Historical peak probability advantage (%) |
| 41 | Historical Peak - Normalized | Decimal (2 decimals) | Normalized to 0-100 scale |
| 42 | Historical Peak - Weighted | Decimal (2 decimals) | Weighted contribution to composite score |
| 43 | Historical Peak - Has Data | Text | "Yes" if data available, "No" if unavailable |

### Monthly Seasonality Factor (Columns 44-47)

| # | Field Name | Data Type | Description |
|---|---|---|---|
| 44 | Monthly Seasonality - Raw | Decimal (2 decimals) | Monthly seasonality score based on historical patterns (%) |
| 45 | Monthly Seasonality - Normalized | Decimal (2 decimals) | Normalized to 0-100 scale |
| 46 | Monthly Seasonality - Weighted | Decimal (2 decimals) | Weighted contribution to composite score |
| 47 | Monthly Seasonality - Has Data | Text | "Yes" if data available, "No" if unavailable |

### Current Performance Factor (Columns 48-51)

| # | Field Name | Data Type | Description |
|---|---|---|---|
| 48 | Current Performance - Raw | Decimal (2 decimals) | Current month performance vs historical average (%) |
| 49 | Current Performance - Normalized | Decimal (2 decimals) | Normalized to 0-100 scale |
| 50 | Current Performance - Weighted | Decimal (2 decimals) | Weighted contribution to composite score |
| 51 | Current Performance - Has Data | Text | "Yes" if data available, "No" if unavailable |

---

## Data Type Specifications

### Text Fields
- Empty cells displayed as blank
- Max length: No limit
- Examples: "ERIC B", "ERICB6U45", "Yes", "No"

### Integer Fields
- No decimal places
- Empty cells are truly blank (not 0)
- Examples: 1, 45, 365

### Decimal Fields
- **1 decimal**: Distance To Support Pct, Current Probability, Historical Peak Probability, Recovery Advantage, Monthly Positive Rate
- **2 decimals**: Strike Price, Current Price, Monthly Avg Return, Current Month Performance, Worst Month Drawdown, all Score Breakdown fields
- Empty cells are truly blank (displayed as blank cells, not zero)
- Uses period (.) as decimal separator in Excel

### Date Fields
- Format: YYYY-MM-DD
- Example: 2026-02-28

### Empty Data Handling
- Null/undefined values: Displayed as blank cells (not "-" or "NaN")
- Makes Excel filtering and calculations work correctly

---

## Score Breakdown Field Explanations

The Score Breakdown fields show how each of the 6 scoring factors contributes to the final Composite Score.

### Raw Value
- Original calculated score for that factor
- May be on 0-1 scale (probabilities), 0-100 scale, or other ranges
- Converted to percentage display (multiplied by 100 if on 0-1 scale)

### Normalized Value
- Raw value scaled to 0-100 scale for comparison
- Allows direct comparison between factors with different original scales

### Weighted Value
- Normalized score multiplied by the weight setting for that factor
- User sets weights in "Score Weights Configuration" panel (0-50% each)
- Sum of all 6 weighted values = Composite Score

### Has Data
- "Yes": Data was available to calculate this factor
- "No": Data was insufficient/unavailable; score defaulted to neutral (50)
- Useful for understanding which options have complete analysis vs partial

---

## Composite Score Calculation

**Formula**: Sum of all 6 weighted score breakdown values

**Example**:
```
Support Strength - Weighted:    15.20
Days Since Break - Weighted:    10.45
Recovery Advantage - Weighted:  18.75
Historical Peak - Weighted:     8.90
Monthly Seasonality - Weighted: 9.35
Current Performance - Weighted: 5.20
─────────────────────────────────────
Composite Score:               67.85
```

**Interpretation**:
- 0-33: Weaker recommendation
- 34-67: Moderate recommendation
- 68-100: Strong recommendation

---

## Notes

1. **Missing Data**: Empty cells (null) are preserved in Excel for accurate analysis and filtering
2. **Formatting**: All numeric values use standard decimal notation (period as decimal separator)
3. **Filtering**: Stock filter selections are respected - export includes only selected stocks
4. **Filename**: `option-recommendations_YYYY-MM-DD.xlsx` (includes export date)
5. **Row Order**: Sorted by Composite Score descending (best recommendations first)
6. **Recalculation**: User can change weights and click "Analyze" again - new export reflects new weights
