# Probability Field Name Alignment

**Last Updated**: January 10, 2026

**Summary**: All probability method display names use the "PoW - " prefix across the website (e.g., "PoW - Weighted Average") to clearly indicate these are Probability of Worthless calculations. Internally, data uses normalized names without the prefix. An automatic normalization layer maintains backward compatibility with older CSV formats.

## Important: Understanding "PoW"

**PoW = Probability of Worthless**

All five probability calculation methods shown on the website are different ways of calculating the probability that an option will expire worthless (worthless rate). The "PoW - " prefix indicates this relationship.

---

## Canonical Field Names (Current)

All probability methods now display with the "PoW - " prefix to clarify they are all calculating Probability of Worthless:

| Field Key | Canonical Display Name | Previous Names |
|-----------|------------------------|-----------------|
| `1_2_3_ProbOfWorthless_Weighted` | **PoW - Weighted Average** | "Weighted Average" |
| `ProbWorthless_Bayesian_IsoCal` | **PoW - Bayesian Calibrated** | "Bayesian Calibrated", "Bayesian IsoCal" |
| `1_ProbOfWorthless_Original` | **PoW - Original Black-Scholes** | "Original Black-Scholes", "Original" |
| `2_ProbOfWorthless_Calibrated` | **PoW - Bias Corrected** | "Bias Corrected", "Calibrated" |
| `3_ProbOfWorthless_Historical_IV` | **PoW - Historical IV** | "Historical IV" |

---

## Changes by Component

### 1. OptionsTable.tsx
**File**: `src/components/options/OptionsTable.tsx`
**Lines**: 117-121
**Change Type**: Updated field name mappings in `formatColumnName()` function

**Current Field Mappings** (January 2026):
- All 5 probability field mappings display with "PoW - " prefix

```javascript
'1_2_3_ProbOfWorthless_Weighted': 'PoW - Weighted Average',
'ProbWorthless_Bayesian_IsoCal': 'PoW - Bayesian Calibrated',
'1_ProbOfWorthless_Original': 'PoW - Original Black-Scholes',
'2_ProbOfWorthless_Calibrated': 'PoW - Bias Corrected',
'3_ProbOfWorthless_Historical_IV': 'PoW - Historical IV'
```

**Affected Areas**: Main dashboard table column headers

---

### 2. ColumnManager.tsx
**File**: `src/components/options/ColumnManager.tsx`
**Lines**: 57-61
**Change Type**: Updated probability field mappings in `formatColumnName()` function

**Changes**:
- All 5 probability fields updated with "PoW - " prefix

**Affected Areas**: Column customization dialog on main dashboard

---

### 3. PortfolioColumnManager.tsx
**File**: `src/components/options/PortfolioColumnManager.tsx`
**Lines**: 58-62
**Change Type**: Updated probability field mappings in `formatColumnName()` function

**Changes**:
- All 5 probability fields updated with "PoW - " prefix

**Affected Areas**: Column customization dialog on Portfolio Generator page

---

### 4. PortfolioGenerator.tsx
**File**: `src/pages/PortfolioGenerator.tsx`
**Lines**: 109-113
**Change Type**: Updated `probabilityFieldOptions` array labels

**Current Field Configuration** (January 2026):
- All 5 probability method dropdown labels display with "PoW - " prefix

```javascript
const probabilityFieldOptions = [
  { value: "ProbWorthless_Bayesian_IsoCal", label: "PoW - Bayesian Calibrated" },
  { value: "1_2_3_ProbOfWorthless_Weighted", label: "PoW - Weighted Average" },
  { value: "1_ProbOfWorthless_Original", label: "PoW - Original Black-Scholes" },
  { value: "2_ProbOfWorthless_Calibrated", label: "PoW - Bias Corrected" },
  { value: "3_ProbOfWorthless_Historical_IV", label: "PoW - Historical IV" },
];
```

**Affected Areas**: Probability method dropdown on Portfolio Generator page

---

### 5. OptionsChart.tsx
**File**: `src/components/options/OptionsChart.tsx`
**Lines**: 28-32
**Change Type**: Updated `probabilityFields` array labels

**Current Configuration** (January 2026):
- All 5 probability fields display with "PoW - " prefixed labels

```javascript
const probabilityFields = [
  { value: '1_2_3_ProbOfWorthless_Weighted', label: 'PoW - Weighted Average' },
  { value: 'ProbWorthless_Bayesian_IsoCal', label: 'PoW - Bayesian Calibrated' },
  { value: '1_ProbOfWorthless_Original', label: 'PoW - Original Black-Scholes' },
  { value: '2_ProbOfWorthless_Calibrated', label: 'PoW - Bias Corrected' },
  { value: '3_ProbOfWorthless_Historical_IV', label: 'PoW - Historical IV' },
];
```

**Affected Areas**: Probability method selector in scatter/bar chart on main dashboard

---

### 6. ProbabilityHistoryChart.tsx
**File**: `src/components/options/ProbabilityHistoryChart.tsx`
**Lines**: 24, 29, 34, 39, 44
**Change Type**: Updated `PROBABILITY_LINES` constant display names

**Current Configuration** (January 2026):
- All 5 probability method names display with "PoW - " prefix in the legend

```javascript
{ key: '1_2_3_ProbOfWorthless_Weighted', name: 'PoW - Weighted Average', ... },
{ key: 'ProbWorthless_Bayesian_IsoCal', name: 'PoW - Bayesian Calibrated', ... },
{ key: '1_ProbOfWorthless_Original', name: 'PoW - Original Black-Scholes', ... },
{ key: '2_ProbOfWorthless_Calibrated', name: 'PoW - Bias Corrected', ... },
{ key: '3_ProbOfWorthless_Historical_IV', name: 'PoW - Historical IV', ... }
```

**Affected Areas**: Legend labels in probability history chart (Option Details page)

---

### 7. CalibrationChart.tsx
**File**: `src/components/probability/CalibrationChart.tsx`
**Lines**: 25, 27-33
**Change Type**: Updated `METHODS` constant and `COLORS` object

**Changes**:
- `METHODS` array updated with "PoW - " prefix for all method names
- `COLORS` object keys updated to match new method names with prefix

**Affected Areas**: Calibration method selector and chart on Probability Analysis page

---

### 8. MethodComparisonChart.tsx
**File**: `src/components/probability/MethodComparisonChart.tsx`
**Lines**: 26, 29-35
**Change Type**: Updated `METHODS` constant and `COLORS` object

**Changes**:
- `METHODS` array updated with "PoW - " prefix for all method names
- `COLORS` object keys updated to match new method names with prefix

**Affected Areas**: Stock performance comparison on Probability Analysis page

---

### 9. RecoveryComparisonChart.tsx
**File**: `src/components/probability/RecoveryComparisonChart.tsx`
**Line**: 76
**Change Type**: Updated fallback method name

**Changes**:
- Default fallback method changed from `'Weighted Average'` to `'PoW - Weighted Average'`

**Affected Areas**: Recovery analysis chart on Probability Analysis page

---

### 10. Data Files & CSV Format Change (January 2026)
**Files**:
- `data/recovery_report_data.csv`
- `data/validation_report_data.csv`

**CSV Format (January 2026 Onwards)**: The CSV files use **normalized method names** (without "PoW - " prefix) in the `ProbMethod` column:

```
ProbMethod|...
Weighted Average|...
Bayesian Calibrated|...
Original Black-Scholes|...
Bias Corrected|...
Historical IV|...
```

**Backward Compatibility**: The website includes a normalization layer (`src/utils/probabilityMethods.ts`) that automatically handles both current and legacy CSV formats. This ensures:
- Seamless compatibility if older CSV files are loaded
- Consistent internal data representation
- Consistent "PoW - " prefix display to users

**Affected Areas**: All Probability Analysis page charts and data displays continue showing "PoW - " to users while internally using normalized names

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

### Probability Analysis Page
- ✓ Calibration chart method selector (CalibrationChart.tsx)
- ✓ Stock performance comparison (MethodComparisonChart.tsx)
- ✓ Recovery analysis chart (RecoveryComparisonChart.tsx)

---

## Git Commits

Multiple commits created for this alignment:

1. **Previous commits** (before PoW prefix)
   - Aligned field names across components
   - Created initial documentation

2. **Latest commit**: `dfc23bd`
   - **Message**: "Add 'PoW - ' prefix to all probability of worthless method display names"
   - **Files**: 11 files changed (component code and CSV data)
   - Added "PoW - " prefix across all components and data files

---

## Backward Compatibility

### CSV Format Handling (January 2026)
- **Automatic Normalization**: The application includes a normalization layer that automatically converts between old and new CSV formats
- **Forward Compatible**: Works seamlessly with both old "PoW - " format and new normalized format CSV files
- **No User Impact**: Users see the same "PoW - " display names regardless of CSV format
- **Transparent Conversion**: Data loading hooks automatically normalize method names on CSV parse

### Component Changes
- **No breaking changes**: All changes are display-only; underlying data field names remain unchanged
- **No database migrations needed**: All field names in stored preferences are unchanged
- **User settings preserved**: Existing column preferences reference field names (not labels), so they continue working
- **Charts Updated**: All chart components internally use normalized method names with "PoW - " display prefix

---

## User Communication

Consider displaying a legend on pages showing probability methods:

```
Legend:
PoW = Probability of Worthless
(The probability that an option will expire worthless)
```

Recommended placement:
- Near probability method dropdowns
- In probability chart headers
- In tooltips (info icon)
- In help/documentation sections

---

## Testing Checklist

Display name changes should be verified on:
- [ ] Main dashboard table headers (all 5 methods should show "PoW - " prefix)
- [ ] Column customization dialogs (both main page and Portfolio Generator)
- [ ] Chart probability method selectors
- [ ] Probability history chart legend
- [ ] Calibration analysis chart
- [ ] Stock performance comparison table
- [ ] Recovery analysis chart
- [ ] Option details probability history

All field names should now show with "PoW - " prefix:
- "PoW - Weighted Average"
- "PoW - Bayesian Calibrated"
- "PoW - Original Black-Scholes"
- "PoW - Bias Corrected"
- "PoW - Historical IV"
