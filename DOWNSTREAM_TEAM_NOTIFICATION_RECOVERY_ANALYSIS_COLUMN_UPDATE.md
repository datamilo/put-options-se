# 🚨 DOWNSTREAM NOTIFICATION: Recovery Analysis Column Name Updates

**Date**: January 11, 2026
**Impact**: Website probability recovery analysis chart
**Action Required**: Update column name references in frontend code
**Status**: Critical - Recovery report will not parse without these updates

---

## What Changed

The probability recovery analysis has **renamed 4 columns** to reflect a fundamental methodology improvement:

| Old Column Name | New Column Name | Reason |
|---|---|---|
| `Baseline_N` | `AllOptions_N` | Baseline now includes ALL options (not just non-recovery) |
| `Baseline_WorthlessCount` | `AllOptions_WorthlessCount` | Clarifies this is ALL option data |
| `Baseline_WorthlessRate_pct` | `AllOptions_WorthlessRate_pct` | Reflects ground truth (model's actual performance) |
| `Advantage_pp` | `RecoveryAdvantage_pp` | Clarifies advantage is measured vs model baseline |

---

## Why We Changed

### Old Methodology (❌ Incorrect)
- Baseline = Non-recovery candidates only
- Measured: "Are recovery candidates better than non-recovery candidates?"
- Problem: Didn't validate probability model; inflated advantages

### New Methodology (✅ Correct)
- Baseline = ALL options in same bin/DTE (ground truth)
- Measures: "Do recovery candidates outperform the model's typical accuracy?"
- Benefit: Reveals TRUE mispricing opportunities after accounting for model's normal error

**Example**:
- Old: Recovery 75% vs Non-recovery 39% = +36pp advantage (misleading)
- New: Recovery 75% vs ALL options 60% = +15pp advantage (true opportunity)

---

## What You Need to Do

### 1. Update Column References in Frontend Code

Replace all instances of old column names with new ones:

```javascript
// Recovery Advantage Analysis Chart

// OLD ❌
const baselineRate = row['Baseline_WorthlessRate_pct'];
const baselineN = row['Baseline_N'];
const advantage = row['Advantage_pp'];

// NEW ✅
const allOptionsRate = row['AllOptions_WorthlessRate_pct'];
const allOptionsN = row['AllOptions_N'];
const advantage = row['RecoveryAdvantage_pp'];
```

### 2. Update Chart Labels

```javascript
// OLD ❌
'Baseline': '#dc3545',          // Red - comparison
'Baseline (never hit threshold)'

// NEW ✅
'All Options': '#dc3545',       // Red - ground truth
'All Options (Ground Truth)'
```

### 3. Update Documentation/Tooltips

Change terminology from "baseline" to "all options" or "ground truth":

```
OLD: "Recovery candidates vs baseline options"
NEW: "Recovery candidates vs all options in same bin (ground truth)"

OLD: "Advantage: how much better recovery is than baseline"
NEW: "Advantage: how much recovery outperforms the model's typical accuracy in this bin"
```

---

## File Details

**File**: `recovery_report_data.csv`

**Format**: Pipe-delimited (|)

**Data Types**:
- `scenario` - Aggregated across all stocks
- `stock` - Per-stock breakdown

**All Column Names** (for reference):
- HistoricalPeakThreshold
- ProbMethod
- CurrentProb_Bin
- DTE_Bin
- Stock (null for scenarios)
- **RecoveryCandidate_N** (unchanged)
- **RecoveryCandidate_WorthlessCount** (unchanged)
- **RecoveryCandidate_WorthlessRate_pct** (unchanged)
- **AllOptions_N** ← CHANGED
- **AllOptions_WorthlessCount** ← CHANGED
- **AllOptions_WorthlessRate_pct** ← CHANGED
- **RecoveryAdvantage_pp** ← CHANGED

---

## Testing Checklist

After updating your code:

- [ ] Recovery Advantage Analysis chart loads without errors
- [ ] Filter by threshold, method, probability bin, stock, DTE all work
- [ ] All rates display as percentages (0-100 range)
- [ ] Advantage values show positive/negative correctly
- [ ] Sample sizes (N values) display correctly
- [ ] "All Options" label appears in legend and tooltips

---

## Questions?

Contact: [probability-analysis team]
Timeline: Update as soon as possible before deploying new recovery analysis data

---

**Status**: ✅ Upstream code ready
**Next Step**: Downstream code updates needed before data push
