# Scored Options Recommendations - Formatting & Logic Issues

## ISSUE 1: Sample Size Card - Text Suffix (FIXED)
**Problem:** Shows "72K predictions" instead of just "72K"
**Status:** ✅ FIXED - Text removed

---

## ISSUE 2: Indicator Formatting - Percentage vs Decimal Mismatch

### Affected Indicators:

1. **Dist_SMA50** (Distance to 50-day Moving Average)
   - Tooltip says: "typically -10% to +10%"
   - Current display: Decimal (e.g., "2,15")
   - Should display: Percentage (e.g., "2,15%")
   - Current format function: `formatNordicDecimal(value, 2)`
   - Required: `formatNordicPercentage(value, 2)`

2. **RSI_14** (Relative Strength Index)
   - Tooltip says: "0-100 scale"
   - Current display: Decimal (e.g., "75,32")
   - Should display: Percentage (e.g., "75,32%")
   - Current format function: `formatNordicDecimal(value, 2)`
   - Required: `formatNordicPercentage(value, 0)`

3. **Stochastic_K** (Stochastic K line)
   - Tooltip says: "0-100 scale"
   - Current display: Decimal (e.g., "75,3")
   - Should display: Percentage (e.g., "75,3%")
   - Current format function: `formatNordicDecimal(value, 1)`
   - Required: `formatNordicPercentage(value, 1)`

4. **Stochastic_D** (Stochastic D signal line)
   - Tooltip says: "0-100 scale"
   - Current display: Decimal (e.g., "65,5")
   - Should display: Percentage (e.g., "65,5%")
   - Current format function: `formatNordicDecimal(value, 1)`
   - Required: `formatNordicPercentage(value, 1)`

5. **ADX_14** (Average Directional Index)
   - Tooltip says: "0-100 (typically 10-50)"
   - Current display: Decimal (e.g., "32,15")
   - Should display: Percentage (e.g., "32,15%")
   - Current format function: `formatNordicDecimal(value, 2)`
   - Required: `formatNordicPercentage(value, 0)`

**Location:** `src/components/scored-options/TABreakdown.tsx` - function `getIndicatorFormat()`

**Fix Strategy:** Add specific formatting rules for percentage-scale indicators

---

## ISSUE 3: "Models Agree" Logic is Incorrect

**Current Logic:**
- "Models Agree" = Both Probability Score ≥ threshold AND TA Score ≥ threshold
- This measures if BOTH models recommend, not if they AGREE
- Example: Prob=85, TA=65 = disagree (even though both might be positive)

**Correct Logic Should Be:**
- "Models Agree" = Scores are SIMILAR (within ±N percentage points)
- Should measure CONSENSUS between models, not absolute quality
- Example: Prob=85, TA=83 = strong agreement (close scores)
- Example: Prob=85, TA=65 = disagreement (different predictions)

**Where to Investigate:**
- `src/types/scoredOptions.ts` - `models_agree` field
- `src/hooks/useScoredOptionsData.ts` - Where `models_agree` is calculated from CSV
- Look at how CSV data sets this field
- Check if it's in current_options_scored.csv

**Affected UI:**
- Details row shows "Models Agree" and "Agreement Strength"
- Column filter "Model Agreement"
- Possibly the old KPI card (now removed)

**Question:** Is this field pre-calculated in the CSV, or calculated in the app?

---

## ISSUE 4: Other Potential Inconsistencies

### Checked and OK:
- **Vol_Ratio** (Volume Ratio): "typically around 1.0" - decimal format correct ✓
- **BB_Position** (Bollinger Band Position): "-1 to 1 scale" - decimal format correct ✓
- **MACD_Hist**: "typically -2 to +2" - decimal format correct ✓
- **MACD_Slope**: "typically -1 to +1" - decimal format correct ✓
- **RSI_Slope**: "typically -5 to +5" - decimal format correct ✓
- **ADX_Slope**: "typically -2 to +2" - decimal format correct ✓
- **ATR_14** (Average True Range): "depends on stock price" - decimal format correct ✓
- **Greeks_Delta**: Small decimals - correct format ✓
- **Greeks_Vega**: "typically 0.01 to 0.2" - decimal format correct ✓
- **Greeks_Theta**: "typically -0.1 to +0.1" - decimal format correct ✓
- **Sigma_Distance**: "typically -3 to +3 std devs" - decimal format correct ✓

---

## Summary of Required Fixes

### Priority 1 (Format Corrections):
- [ ] Dist_SMA50: Switch to `formatNordicPercentage`
- [ ] RSI_14: Switch to `formatNordicPercentage`
- [ ] Stochastic_K: Switch to `formatNordicPercentage`
- [ ] Stochastic_D: Switch to `formatNordicPercentage`
- [ ] ADX_14: Switch to `formatNordicPercentage`

### Priority 2 (Logic Fix):
- [ ] Investigate "Models Agree" calculation
- [ ] Determine if field is CSV-provided or app-calculated
- [ ] Change logic to measure similarity (±N%) instead of absolute threshold
- [ ] Update Agreement Strength calculation accordingly

### Priority 3 (Documentation):
- [ ] Update tooltips if logic changes for "Models Agree"
- [ ] Update filter descriptions

