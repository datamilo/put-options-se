# ⚠️ BREAKING CHANGE NOTICE: ProbMethod Label Format Update

**Date**: January 10, 2026
**Severity**: 🟡 **BREAKING CHANGE** - Requires downstream script updates
**Affected Files**: `validation_report_data.csv`, `recovery_report_data.csv`
**Affected Column**: `ProbMethod`
**Action Required**: Update your data parsing and filtering logic

---

## Summary

The probability method naming convention has been **simplified** in the new optimized pipeline. If your downstream systems filter, match, or process the `ProbMethod` column in the CSV exports, you **must update your code**.

### What Changed

The `ProbMethod` column values have changed from the `"PoW - "` prefix format to plain names:

| Old Format (Legacy) | New Format (Current) |
|---|---|
| `PoW - Weighted Average` | `Weighted Average` |
| `PoW - Bayesian Calibrated` | `Bayesian Calibrated` |
| `PoW - Original Black-Scholes` | `Original Black-Scholes` |
| `PoW - Bias Corrected` | `Bias Corrected` |
| `PoW - Historical IV` | `Historical IV` |

### Where This Appears

Both output CSV files now use the new format:
- ✅ `output/validation_report_data.csv` - Contains `ProbMethod` values
- ✅ `output/recovery_report_data.csv` - Contains `ProbMethod` values

---

## Impact Assessment

### Your Code Will Break If You:

1. **Filter by exact string match**:
   ```python
   # ❌ THIS WILL BREAK
   df = df[df['ProbMethod'] == 'PoW - Bayesian Calibrated']

   # ✅ DO THIS INSTEAD
   df = df[df['ProbMethod'] == 'Bayesian Calibrated']
   ```

2. **Use hardcoded lists of method names**:
   ```python
   # ❌ THIS WILL BREAK
   methods = ['PoW - Weighted Average', 'PoW - Bayesian Calibrated', ...]

   # ✅ DO THIS INSTEAD
   methods = ['Weighted Average', 'Bayesian Calibrated', ...]
   ```

3. **Parse or split the ProbMethod column**:
   ```python
   # ❌ THIS WILL BREAK (splits on "PoW - ")
   method_name = row['ProbMethod'].split(' - ')[1]

   # ✅ DO THIS INSTEAD (just use it as-is)
   method_name = row['ProbMethod']
   ```

4. **Use case-sensitive comparisons with the old format**:
   ```python
   # ❌ THIS WILL BREAK
   if 'PoW -' in probmethod_value:
       # process legacy format

   # ✅ DO THIS INSTEAD
   # Just use the value directly, no prefix checking needed
   ```

---

## Migration Guide

### Step 1: Identify Affected Code

Search your codebase for references to the old format:

```bash
# Search for all files containing "PoW -"
grep -r "PoW -" /your/code/directory/

# Search for all files with ProbMethod filtering
grep -r "ProbMethod" /your/code/directory/
```

### Step 2: Update String Matches

**Before**:
```python
# config/method_mapping.py
METHOD_NAMES = {
    'PoW - Weighted Average': 'WeightedAvg',
    'PoW - Bayesian Calibrated': 'BayesCalib',
    'PoW - Original Black-Scholes': 'OrigBS',
    'PoW - Bias Corrected': 'BiasCorr',
    'PoW - Historical IV': 'HistIV'
}

# your_analysis.py
df = df[df['ProbMethod'].isin(METHOD_NAMES.keys())]
```

**After**:
```python
# config/method_mapping.py
METHOD_NAMES = {
    'Weighted Average': 'WeightedAvg',
    'Bayesian Calibrated': 'BayesCalib',
    'Original Black-Scholes': 'OrigBS',
    'Bias Corrected': 'BiasCorr',
    'Historical IV': 'HistIV'
}

# your_analysis.py
df = df[df['ProbMethod'].isin(METHOD_NAMES.keys())]
```

### Step 3: Update Filtering Logic

**Before**:
```python
# Filter for Bayesian method
bayesian_data = df[df['ProbMethod'] == 'PoW - Bayesian Calibrated']

# Filter for multiple methods
methods_of_interest = df[df['ProbMethod'].isin([
    'PoW - Weighted Average',
    'PoW - Bayesian Calibrated'
])]
```

**After**:
```python
# Filter for Bayesian method
bayesian_data = df[df['ProbMethod'] == 'Bayesian Calibrated']

# Filter for multiple methods
methods_of_interest = df[df['ProbMethod'].isin([
    'Weighted Average',
    'Bayesian Calibrated'
])]
```

### Step 4: Update Any Data Transformations

**Before**:
```python
# Extract method name by removing prefix
df['method_short'] = df['ProbMethod'].str.replace('PoW - ', '')

# Check if using old format
df['is_legacy'] = df['ProbMethod'].str.startswith('PoW -')
```

**After**:
```python
# Just use the method name directly
df['method_short'] = df['ProbMethod']  # Already clean

# No need to check for legacy format anymore
# (all new files use the new format)
```

### Step 5: Update Joins and Lookups

**Before**:
```python
# Joining with a reference table
method_reference = pd.DataFrame({
    'ProbMethod': ['PoW - Weighted Average', 'PoW - Bayesian Calibrated'],
    'confidence_level': ['high', 'very_high']
})

result = df.merge(method_reference, on='ProbMethod')
```

**After**:
```python
# Joining with a reference table
method_reference = pd.DataFrame({
    'ProbMethod': ['Weighted Average', 'Bayesian Calibrated'],
    'confidence_level': ['high', 'very_high']
})

result = df.merge(method_reference, on='ProbMethod')
```

---

## Complete List of Method Labels

### All 5 Probability Methods

| Method Name | Column Name in Data | Purpose |
|---|---|---|
| **Weighted Average** | `1_2_3_ProbOfWorthless_Weighted` | Ensemble of multiple methods |
| **Bayesian Calibrated** | `ProbWorthless_Bayesian_IsoCal` | Bayesian with isotonic calibration |
| **Original Black-Scholes** | `1_ProbOfWorthless_Original` | Standard Black-Scholes model |
| **Bias Corrected** | `2_ProbOfWorthless_Calibrated` | Calibrated Black-Scholes variant |
| **Historical IV** | `3_ProbOfWorthless_Historical_IV` | Based on historical volatility |

Use the **second column** (e.g., `Weighted Average`) for all your code when processing the new CSV exports.

---

## Python Migration Examples

### Example 1: Simple Filter Update

```python
# Load CSV
df = pd.read_csv('recovery_report_data.csv', sep='|')

# OLD CODE ❌
bayesian_recovery = df[df['ProbMethod'] == 'PoW - Bayesian Calibrated']

# NEW CODE ✅
bayesian_recovery = df[df['ProbMethod'] == 'Bayesian Calibrated']
```

### Example 2: Method Comparison

```python
# OLD CODE ❌
methods_to_compare = ['PoW - Weighted Average', 'PoW - Bayesian Calibrated']
comparison_df = df[df['ProbMethod'].isin(methods_to_compare)]

# NEW CODE ✅
methods_to_compare = ['Weighted Average', 'Bayesian Calibrated']
comparison_df = df[df['ProbMethod'].isin(methods_to_compare)]
```

### Example 3: Grouping by Method

```python
# OLD CODE ❌
performance_by_method = df.groupby('ProbMethod').agg({
    'Brier_Score': 'mean'
})
# Result index would be: ['PoW - Bayesian Calibrated', 'PoW - Weighted Average', ...]

# NEW CODE ✅
performance_by_method = df.groupby('ProbMethod').agg({
    'Brier_Score': 'mean'
})
# Result index will be: ['Bayesian Calibrated', 'Weighted Average', ...]

# No code change needed, but groupby results will have different index values!
```

### Example 4: Data Validation/Testing

```python
# Test to verify you're reading the new format correctly
df = pd.read_csv('validation_report_data.csv', sep='|')

# Verify all methods are present
expected_methods = {
    'Weighted Average',
    'Bayesian Calibrated',
    'Original Black-Scholes',
    'Bias Corrected',
    'Historical IV'
}

actual_methods = set(df['ProbMethod'].unique())
assert actual_methods == expected_methods, f"Unexpected methods: {actual_methods}"

print("✅ CSV format is correct!")
```

---

## Backward Compatibility

### Handling Both Old and New Files

If you need to support **both** old (legacy) and new files, implement a compatibility layer:

```python
def normalize_probmethod(df):
    """
    Normalize ProbMethod values from old 'PoW - ' format to new format.
    Allows processing both old and new CSV files seamlessly.
    """
    # Map old format to new format
    old_to_new = {
        'PoW - Weighted Average': 'Weighted Average',
        'PoW - Bayesian Calibrated': 'Bayesian Calibrated',
        'PoW - Original Black-Scholes': 'Original Black-Scholes',
        'PoW - Bias Corrected': 'Bias Corrected',
        'PoW - Historical IV': 'Historical IV'
    }

    # Replace old format with new format
    df['ProbMethod'] = df['ProbMethod'].replace(old_to_new)
    return df

# Usage
df_old = pd.read_csv('old_recovery_report_data.csv', sep='|')
df_new = pd.read_csv('recovery_report_data.csv', sep='|')

# Normalize both to same format
df_old = normalize_probmethod(df_old)
df_new = normalize_probmethod(df_new)

# Now both have consistent labels
combined = pd.concat([df_old, df_new])
```

---

## Testing Your Updates

After updating your code, run these tests to verify the changes work:

```python
import pandas as pd

# Test 1: Load the new CSV
df = pd.read_csv('output/validation_report_data.csv', sep='|')
assert 'ProbMethod' in df.columns, "ProbMethod column missing!"
print(f"✅ Test 1 passed: CSV loaded successfully")

# Test 2: Verify new label format
expected_labels = {
    'Weighted Average',
    'Bayesian Calibrated',
    'Original Black-Scholes',
    'Bias Corrected',
    'Historical IV'
}
actual_labels = set(df['ProbMethod'].unique()) - {None}
assert actual_labels == expected_labels, f"Labels mismatch: {actual_labels}"
print(f"✅ Test 2 passed: All probability methods present with correct labels")

# Test 3: Verify no old format exists
assert not df['ProbMethod'].str.contains('PoW -', na=False).any(), \
    "Found old 'PoW -' format in data!"
print(f"✅ Test 3 passed: No legacy format found")

# Test 4: Filter by method works
bayesian = df[df['ProbMethod'] == 'Bayesian Calibrated']
assert len(bayesian) > 0, "No Bayesian Calibrated records found!"
print(f"✅ Test 4 passed: Filtering by method works ({len(bayesian)} records)")

# Test 5: Grouping by method works
grouped = df.groupby('ProbMethod').size()
assert len(grouped) == 5, f"Expected 5 methods, got {len(grouped)}"
print(f"✅ Test 5 passed: Grouping by method works")

print("\n✅ All migration tests passed! Your code is ready for the new format.")
```

---

## FAQs

### Q: Why was the naming changed?
**A:** The "PoW - " prefix (Probability of Worthless) was redundant since the context already makes it clear these are probability values. Removing it simplifies the labels and makes them more readable.

### Q: When did this change happen?
**A:** January 2026, with the release of the optimized pipeline. This is the new standard format going forward.

### Q: Can I still use the old files?
**A:** Yes, but your code needs to handle both formats. Use the backward compatibility approach shown above.

### Q: Are there other changes to these CSV files?
**A:** Yes, there was a critical bugfix related to forward-looking bias in the recovery analysis. See `INVESTIGATION_REPORT_OLD_VS_NEW_COMPARISON.md` for details.

### Q: Do I need to update my database schema?
**A:** No. The `ProbMethod` column remains the same. Only the **values** in that column have changed, not the column itself.

### Q: What if I'm using SQL/databases?
**A:** Update any `WHERE` clauses that filter on `ProbMethod`:
```sql
-- OLD ❌
SELECT * FROM recovery_data WHERE ProbMethod = 'PoW - Bayesian Calibrated'

-- NEW ✅
SELECT * FROM recovery_data WHERE ProbMethod = 'Bayesian Calibrated'
```

### Q: Will this change again?
**A:** The new format is the standard going forward. These labels will remain consistent.

---

## Checklist for Your Team

- [ ] Search codebase for all "PoW -" references
- [ ] Update hardcoded method name strings
- [ ] Update filtering logic (WHERE, isin(), ==)
- [ ] Update groupby/aggregation code that references method names
- [ ] Update any method lookup/mapping tables
- [ ] Update tests that validate ProbMethod values
- [ ] Test with new CSV files to verify changes work
- [ ] Update any downstream documentation
- [ ] Verify data pipeline outputs match new format
- [ ] Communicate changes to any other dependent teams

---

## Support & Questions

If you have questions about this change:

1. **Check this document** - most common issues are covered
2. **Review the migration examples** above
3. **Run the test suite** to verify your changes
4. **Refer to the data structure** section for the complete method list

---

## Related Documentation

- **Investigation Report**: `INVESTIGATION_REPORT_OLD_VS_NEW_COMPARISON.md` - Details on all changes between old and new outputs
- **Probability Analysis Docs**: `.claude/docs/probability_analysis.md` - Complete system documentation
- **Bugfix Notice**: `.claude/docs/PROBABILITY_ANALYSIS_BUGFIX_JAN_2026.md` - Critical bugfix that also affects recovery analysis

---

**Document Status**: ✅ Complete
**Last Updated**: January 10, 2026
**Distribution**: All downstream teams processing `validation_report_data.csv` and `recovery_report_data.csv`
