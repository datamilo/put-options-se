# Scored Options Recommendations - Investigation & Fixes

## FIX 1: Dist_SMA50 Indicator Formatting ✅ FIXED

**Issue:** Distance to 50-day MA displayed as decimal instead of percentage

**Finding:** Research confirmed distance from moving average should display as percentage

**Solution:** Updated `getIndicatorFormat()` in `TABreakdown.tsx`
- Added specific formatting rule for Dist_SMA50
- Now uses `formatNordicPercentage(value, 2)` 
- Display changes: "2,15" → "2,15%"

**Status:** ✅ FIXED (Commit: TBD)

**Other indicators verified:**
- RSI, Stochastic K/D, ADX: Correctly displayed as decimals (0-100 scale, NOT percentage) ✓

---

## FIX 2: "Models Agree" Logic Investigation 🔍 REQUIRES CLARIFICATION

### Current State:
- CSV has `models_agree` (boolean) and `agreement_strength` (Strong/Moderate/Weak) fields
- Values are pre-calculated in the CSV
- App simply reads these values as-is (no recalculation)

### The Problem:
User says current logic is wrong:
- **Current definition:** "Models Agree" = Both scores above certain threshold
- **Correct definition:** "Models Agree" = Scores are SIMILAR (within ±N percentage points)

### Questions to Answer:

1. **Where should the fix be?**
   - Option A: Change CSV generation logic (upstream)
   - Option B: Recalculate in the app (override CSV values)
   - Which approach?

2. **What's the threshold for "agreement"?**
   - How many percentage points is acceptable? (±5%? ±10%?)
   - Current code shows difference calculation exists (line 164 in AgreementAnalysis.tsx)
   - Should Strong = ±5%, Moderate = ±10%, Weak = ±15%?

3. **What about score direction?**
   - Example scenario:
     - Prob Score = 85, TA Score = 80
     - Difference = 5 points (should be "Strong Agreement"?)
     - Or is this still "disagreement" because one is bullish, one bearish?

### Related Code:

**Where agreement is displayed:**
- `src/components/scored-options/AgreementAnalysis.tsx` - Shows scores and difference
- `src/components/scored-options/ScoredOptionsTable.tsx` - Filter by agreement
- Line 164 already calculates difference: `Math.abs(option.v21_score - option.ta_probability * 100)`

**Where agreement is filtered:**
- `src/components/scored-options/ScoredOptionsTable.tsx` (lines 52-55)
- Filter options: "All Options", "Models Agree", "Models Disagree"

### Proposed Fix (waiting for clarification):

Once you clarify the definition, we need to:
1. Decide if we recalculate in the app or change CSV generation
2. Implement new logic: `Math.abs(prob_score - ta_score) <= threshold`
3. Update Agreement Strength thresholds
4. Update filter logic if needed
5. Update tooltips to explain new definition

---

## FIX 3: Update Tooltips & Filters

### Tooltips to Review/Update:
- Agreement Analysis section tooltips
- Filter tooltips for "Model Agreement"
- Explanation of what "agreement" means

**Location:** `src/utils/scoredOptionsTooltips.ts`
- `agreement.modelsAgreeField`
- `agreement.agreementStrengthField`
- `filterTooltips.modelAgreement`

### Filter UI:
- `src/components/scored-options/ScoredOptionsFilters.tsx`
- Currently shows: "All Options", "Models Agree", "Models Disagree"
- May need different naming if we change the logic

---

## Action Items

### Done ✅
- [x] Fix Dist_SMA50 formatting to percentage
- [x] Verify other indicators are correct
- [x] Identify where models_agree comes from (CSV)
- [x] Locate all related code

### Pending (User Input Needed) ⏳
- [ ] Clarify new "agreement" definition and thresholds
- [ ] Decide: recalculate in app or change CSV generation?
- [ ] Define exact thresholds for Strong/Moderate/Weak
- [ ] Update Agreement Strength calculation logic
- [ ] Update tooltips and filter descriptions
- [ ] Test new logic with real data

---

## Files Involved

**Already Modified:**
- `src/components/scored-options/TABreakdown.tsx` - Added Dist_SMA50 percentage formatting

**Need to Modify (pending fix):**
- `src/components/scored-options/AgreementAnalysis.tsx` - May need to recalculate agreement
- `src/components/scored-options/ScoredOptionsTable.tsx` - Filter logic may change
- `src/hooks/useScoredOptionsData.ts` - May recalculate models_agree here
- `src/utils/scoredOptionsTooltips.ts` - Update tooltips

**CSV-Related:**
- `current_options_scored.csv` - May need to change generation logic upstream
- `src/types/scoredOptions.ts` - Type definitions may need updates

