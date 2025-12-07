# Probability Field Name Alignment

**Date**: December 7, 2025
**Summary**: Standardized all probability method display names across the website to use canonical names from the Probability Analysis page.

## Canonical Field Names

All probability methods now display consistently using these canonical names:

| Field Key | Canonical Display Name | Previous Names |
|-----------|------------------------|-----------------|
| `1_2_3_ProbOfWorthless_Weighted` | **Weighted Average** | (no change) |
| `ProbWorthless_Bayesian_IsoCal` | **Bayesian Calibrated** | "Bayesian IsoCal", "Bayesian Iso Cal" |
| `1_ProbOfWorthless_Original` | **Original Black-Scholes** | "Original" |
| `2_ProbOfWorthless_Calibrated` | **Bias Corrected** | "Calibrated" |
| `3_ProbOfWorthless_Historical_IV` | **Historical IV** | (no change) |

## Changes by Component

### 1. OptionsTable.tsx
**File**: `src/components/options/OptionsTable.tsx`
**Lines**: 103-122
**Change Type**: Added field name mappings in `formatColumnName()` function

**Details**:
- Added `fieldMappings` object with 5 probability field entries
- Ensures table column headers display canonical names
- Applies to: Main dashboard table columns

**Before**:
```javascript
// Raw field names displayed: "1 2 3 Prob Of Worthless Weighted", etc.
```

**After**:
```javascript
const fieldMappings: { [key: string]: string } = {
  '1_2_3_ProbOfWorthless_Weighted': 'Weighted Average',
  'ProbWorthless_Bayesian_IsoCal': 'Bayesian Calibrated',
  '1_ProbOfWorthless_Original': 'Original Black-Scholes',
  '2_ProbOfWorthless_Calibrated': 'Bias Corrected',
  '3_ProbOfWorthless_Historical_IV': 'Historical IV'
};
```

**Affected Areas**: Main dashboard table column headers

---

### 2. ColumnManager.tsx
**File**: `src/components/options/ColumnManager.tsx`
**Lines**: 54-72
**Change Type**: Added probability field mappings in `formatColumnName()` function

**Details**:
- Added probability field mappings in column selection dialog
- Used when users customize visible columns on main dashboard
- Applies to: Column manager dialog on main dashboard

**Affected Areas**: Column customization dialog on main dashboard

---

### 3. PortfolioColumnManager.tsx
**File**: `src/components/options/PortfolioColumnManager.tsx`
**Lines**: 55-73
**Change Type**: Added probability field mappings in `formatColumnName()` function

**Details**:
- Added probability field mappings in column selection dialog
- Used when users customize visible columns on Portfolio Generator page
- Applies to: Column manager dialog on Portfolio Generator page

**Affected Areas**: Column customization dialog on Portfolio Generator page

---

### 4. PortfolioGenerator.tsx
**File**: `src/pages/PortfolioGenerator.tsx`
**Lines**: 108-114
**Change Type**: Updated `probabilityFieldOptions` array labels

**Changes**:
- Line 111: `"Original"` → `"Original Black-Scholes"`
- Line 112: `"Calibrated"` → `"Bias Corrected"`

**Before**:
```javascript
const probabilityFieldOptions = [
  { value: "ProbWorthless_Bayesian_IsoCal", label: "Bayesian Calibrated" },
  { value: "1_2_3_ProbOfWorthless_Weighted", label: "Weighted Average" },
  { value: "1_ProbOfWorthless_Original", label: "Original" },
  { value: "2_ProbOfWorthless_Calibrated", label: "Calibrated" },
  { value: "3_ProbOfWorthless_Historical_IV", label: "Historical IV" },
];
```

**After**:
```javascript
const probabilityFieldOptions = [
  { value: "ProbWorthless_Bayesian_IsoCal", label: "Bayesian Calibrated" },
  { value: "1_2_3_ProbOfWorthless_Weighted", label: "Weighted Average" },
  { value: "1_ProbOfWorthless_Original", label: "Original Black-Scholes" },
  { value: "2_ProbOfWorthless_Calibrated", label: "Bias Corrected" },
  { value: "3_ProbOfWorthless_Historical_IV", label: "Historical IV" },
];
```

**Affected Areas**: Probability method dropdown on Portfolio Generator page

---

### 5. OptionsChart.tsx
**File**: `src/components/options/OptionsChart.tsx`
**Lines**: 27-33
**Change Type**: Updated `probabilityFields` array labels

**Changes**:
- All 5 fields updated from raw field names to canonical display names
- Line 28: `'1_2_3_ProbOfWorthless_Weighted'` label changed from `'1_2_3_ProbOfWorthless_Weighted'` → `'Weighted Average'`
- Line 29: `'ProbWorthless_Bayesian_IsoCal'` label changed from `'ProbWorthless_Bayesian_IsoCal'` → `'Bayesian Calibrated'`
- Line 30: `'1_ProbOfWorthless_Original'` label changed from `'1_ProbOfWorthless_Original'` → `'Original Black-Scholes'`
- Line 31: `'2_ProbOfWorthless_Calibrated'` label changed from `'2_ProbOfWorthless_Calibrated'` → `'Bias Corrected'`
- Line 32: `'3_ProbOfWorthless_Historical_IV'` label changed from `'3_ProbOfWorthless_Historical_IV'` → `'Historical IV'`

**Before**:
```javascript
const probabilityFields = [
  { value: '1_2_3_ProbOfWorthless_Weighted', label: '1_2_3_ProbOfWorthless_Weighted' },
  { value: 'ProbWorthless_Bayesian_IsoCal', label: 'ProbWorthless_Bayesian_IsoCal' },
  { value: '1_ProbOfWorthless_Original', label: '1_ProbOfWorthless_Original' },
  { value: '2_ProbOfWorthless_Calibrated', label: '2_ProbOfWorthless_Calibrated' },
  { value: '3_ProbOfWorthless_Historical_IV', label: '3_ProbOfWorthless_Historical_IV' },
];
```

**After**:
```javascript
const probabilityFields = [
  { value: '1_2_3_ProbOfWorthless_Weighted', label: 'Weighted Average' },
  { value: 'ProbWorthless_Bayesian_IsoCal', label: 'Bayesian Calibrated' },
  { value: '1_ProbOfWorthless_Original', label: 'Original Black-Scholes' },
  { value: '2_ProbOfWorthless_Calibrated', label: 'Bias Corrected' },
  { value: '3_ProbOfWorthless_Historical_IV', label: 'Historical IV' },
];
```

**Affected Areas**: Probability method selector in scatter/bar chart on main dashboard

---

### 6. ProbabilityHistoryChart.tsx
**File**: `src/components/options/ProbabilityHistoryChart.tsx`
**Lines**: 21-47
**Change Type**: Updated `PROBABILITY_LINES` constant display names

**Changes**:
- Line 29: `'Bayesian IsoCal'` → `'Bayesian Calibrated'`
- Line 34: `'Original'` → `'Original Black-Scholes'`
- Line 39: `'Calibrated'` → `'Bias Corrected'`

**Before**:
```javascript
const PROBABILITY_LINES = [
  { key: '1_2_3_ProbOfWorthless_Weighted', name: 'Weighted Average', color: '#2563eb' },
  { key: 'ProbWorthless_Bayesian_IsoCal', name: 'Bayesian IsoCal', color: '#dc2626' },
  { key: '1_ProbOfWorthless_Original', name: 'Original', color: '#16a34a' },
  { key: '2_ProbOfWorthless_Calibrated', name: 'Calibrated', color: '#ca8a04' },
  { key: '3_ProbOfWorthless_Historical_IV', name: 'Historical IV', color: '#9333ea' }
];
```

**After**:
```javascript
const PROBABILITY_LINES = [
  { key: '1_2_3_ProbOfWorthless_Weighted', name: 'Weighted Average', color: '#2563eb' },
  { key: 'ProbWorthless_Bayesian_IsoCal', name: 'Bayesian Calibrated', color: '#dc2626' },
  { key: '1_ProbOfWorthless_Original', name: 'Original Black-Scholes', color: '#16a34a' },
  { key: '2_ProbOfWorthless_Calibrated', name: 'Bias Corrected', color: '#ca8a04' },
  { key: '3_ProbOfWorthless_Historical_IV', name: 'Historical IV', color: '#9333ea' }
];
```

**Affected Areas**: Legend labels in probability history chart (Option Details page)

---

### 7. OptionDetails.tsx
**File**: `src/components/options/OptionDetails.tsx`
**Line**: 376
**Change Type**: Updated card title

**Change**:
- Card title updated: `"Probability of Worthless Bayesian IsoCal Monte Carlo Simulation"` → `"Probability of Worthless Bayesian Calibrated Monte Carlo Simulation"`

**Before**:
```html
<CardTitle>Probability of Worthless Bayesian IsoCal Monte Carlo Simulation</CardTitle>
```

**After**:
```html
<CardTitle>Probability of Worthless Bayesian Calibrated Monte Carlo Simulation</CardTitle>
```

**Affected Areas**: Section heading on Option Details page

---

## Pages & Features Affected

### Main Dashboard (Index.tsx)
- ✓ Options table column headers (OptionsTable.tsx)
- ✓ Column manager dialog (ColumnManager.tsx)
- ✓ Chart probability method selector (OptionsChart.tsx)

### Portfolio Generator (PortfolioGenerator.tsx)
- ✓ Probability method dropdown (PortfolioGenerator.tsx)
- ✓ Column manager dialog (PortfolioColumnManager.tsx)

### Option Details Page
- ✓ Probability history chart legend (ProbabilityHistoryChart.tsx)
- ✓ Section title (OptionDetails.tsx)

### Probability Analysis Page
- ✓ Already using canonical names (no changes needed)

---

## Git Commits

Three commits were created for this alignment:

1. **Commit**: `3136f1f`
   **Message**: "Align probability field names across all sites to match Probability Analysis page"
   **Files**: ProbabilityHistoryChart.tsx, OptionDetails.tsx

2. **Commit**: `b40f4df`
   **Message**: "Update probability method display names on main page to match Probability Analysis page"
   **Files**: PortfolioGenerator.tsx, OptionsChart.tsx

3. **Commit**: `4b59b0e` & `8ca8cdc`
   **Message**: "Add probability field display name mappings to OptionsTable column headers"
   **Files**: OptionsTable.tsx, ColumnManager.tsx, PortfolioColumnManager.tsx

---

## Backward Compatibility

- **No breaking changes**: All changes are display-only; underlying data field names remain unchanged
- **No CSV updates required**: Data files use field names, not display labels
- **No database migrations needed**: All field names in data storage are unchanged
- **User settings preserved**: Existing column preferences reference field names (not labels), so they continue working

---

## Testing Notes

Display name changes should be verified on:
- [ ] Main dashboard table headers
- [ ] Column customization dialogs (both main page and Portfolio Generator)
- [ ] Chart probability method selectors
- [ ] Probability history chart legend
- [ ] Option details card titles

All field names should now show:
- "Weighted Average" (not "1 2 3 Prob Of Worthless Weighted")
- "Bayesian Calibrated" (not "Bayesian IsoCal" or raw field name)
- "Original Black-Scholes" (not "Original")
- "Bias Corrected" (not "Calibrated")
- "Historical IV" (unchanged)
