# Upstream Backtesting Package - Scoring Algorithm Code
## Complete Package for Python Implementation

**Date:** January 15, 2026
**Purpose:** Provide exact scoring algorithm code and specifications for Python backtesting replication

---

## Package Contents

This package contains:
1. **SCORING_ALGORITHM_FOR_BACKTESTING.md** - Complete mathematical specifications
2. **Original TypeScript Source Code** - All implementation files (listed below)
3. **This Summary** - Quick reference guide

---

## What You're Getting

### The 6 Scoring Factors

1. **Recovery Advantage** (25% default) - Historical recovery rate for candidates
2. **Support Strength** (20% default) - Support level robustness (0-100 pre-calculated)
3. **Days Since Break** (15% default) - Time since support last broken
4. **Historical Peak** (15% default) - Recovery candidate from probability peaks
5. **Monthly Seasonality** (15% default) - Positive month % for current month
6. **Current Performance** (10% default) - Month underperformance vs historical avg

**Output:** Composite score 0-100 for each option

---

## Original TypeScript Implementation Files

All files are located in the `/home/gustaf/put-options-se-1` directory in this repository.

### Core Scoring Logic

**`src/hooks/useAutomatedRecommendations.ts`** (559 lines)
- **Lines 17-33:** Probability bin and DTE bin functions
  ```javascript
  getProbabilityBin(prob: number): string
  getDTEBin(daysToExpiry: number): string
  ```

- **Lines 36-46:** Probability method field name to recovery method mapping
  ```javascript
  mapProbabilityMethodToRecoveryMethod(fieldName: string): string
  ```

- **Lines 77-86:** Support Strength normalization
  ```javascript
  normalizeSupportStrength(score: number | null): NormalizationResult
  ```

- **Lines 88-102:** Days Since Break normalization
  ```javascript
  normalizeDaysSinceBreak(days: number | null, avgDaysBetween: number | null): NormalizationResult
  ```

- **Lines 104-116:** Recovery Advantage normalization
  ```javascript
  normalizeRecoveryAdvantage(recoveryRate: number | null): NormalizationResult
  ```

- **Lines 118-145:** Historical Peak normalization
  ```javascript
  normalizeHistoricalPeak(currentProb: number, peakProb: number | null, threshold: number, weight: number): NormalizationResult
  ```

- **Lines 147-170:** Seasonality normalization
  ```javascript
  normalizeSeasonality(positiveRate: number | null, currentDay: number, typicalLowDay: number | null): NormalizationResult
  ```

- **Lines 201-216:** Current Performance normalization
  ```javascript
  normalizeCurrentPerformance(currentMonthPct: number | null, avgMonthPct: number | null): NormalizationResult
  ```

- **Lines 226-558:** Main `useAutomatedRecommendations()` hook
  - Lines 285-552: `analyzeOptions()` function - complete scoring pipeline
  - Lines 322-532: Per-option scoring loop
  - Lines 485-492: Composite score calculation (exact formula)
  - Lines 535-541: Sorting and ranking

### Type Definitions

**`src/types/recommendations.ts`** (94 lines)
- **Lines 1-7:** RecommendationFilters interface
- **Lines 9-16:** ScoreWeights interface
- **Lines 18-24:** ScoreComponent interface
- **Lines 26-33:** ScoreBreakdown interface
- **Lines 35-76:** RecommendedOption interface (complete output structure)
- **Lines 78-84:** DEFAULT_FILTERS constant
- **Lines 86-93:** DEFAULT_WEIGHTS constant (25%, 20%, 15%, 15%, 15%, 10%)

### Weight Normalization

**`src/pages/AutomatedRecommendations.tsx`** (Lines 65-76)
```typescript
const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
const normalizedWeights = totalWeight > 0
  ? Object.fromEntries(
      Object.entries(weights).map(([key, value]) => [
        key,
        (value / totalWeight) * 100
      ])
    ) as ScoreWeights
  : weights;
```

### Supporting Components

**`src/components/recommendations/ScoreBreakdown.tsx`** (222 lines)
- Raw value explanations and formatting
- Progress bar visualization
- Missing data handling

**`src/components/recommendations/OptionExplanation.tsx`** (226 lines)
- Narrative explanation logic (lines 18-193)
- Probability method name mapping
- Business logic for recovery candidate analysis

**`src/hooks/useProbabilityRecoveryData.ts`** (205 lines)
- Lines 26-76: `buildChartDataStructure()` - hierarchical data organization
- Recovery data CSV parsing with method name normalization

---

## How to Use These Files

### Step 1: Examine the Core Algorithm
1. Read `SCORING_ALGORITHM_FOR_BACKTESTING.md` for complete mathematical specifications
2. Review `src/types/recommendations.ts` for data structure definitions
3. Study `src/hooks/useAutomatedRecommendations.ts` for the implementation

### Step 2: Extract the Logic
The scoring consists of these operations (in order):

1. **Load Data** (from CSVs)
   - options data (data.csv)
   - support metrics (support_level_metrics.csv)
   - probability peaks (probability_history.csv)
   - recovery data (recovery_report_data.csv)
   - monthly stats (Stocks_Monthly_Data.csv)
   - stock performance (stock_data.csv)

2. **Filter Options**
   - Match expiry date
   - Get support metrics for rolling period
   - Filter: strike ≤ rolling low
   - Filter: days since break ≥ minimum

3. **For Each Option:**
   - Calculate 6 normalized scores (see normalization formulas)
   - Build score breakdown (raw, normalized, weighted)
   - Calculate composite score (sum of weighted contributions)

4. **Sort & Rank**
   - Sort by composite score descending
   - Assign ranks 1, 2, 3, ...

### Step 3: Implement in Python
Use the exact formulas from the markdown file, referencing the TypeScript code as needed.

---

## Key Implementation Details

### Normalization Formulas (From TypeScript Code)

**Support Strength** (useAutomatedRecommendations.ts:77-86)
```javascript
normalized: Math.min(100, Math.max(0, score))
```

**Days Since Break** (useAutomatedRecommendations.ts:88-102)
```javascript
const ratio = days / avgGap;
normalized: Math.min(100, Math.max(0, ratio * 50))
```

**Recovery Advantage** (useAutomatedRecommendations.ts:104-116)
```javascript
normalized: Math.min(100, Math.max(0, recoveryRate * 100))
```

**Historical Peak** (useAutomatedRecommendations.ts:118-145)
```javascript
if (peakProb < threshold) {
  normalized: 30
} else {
  const drop = peakProb - currentProb;
  normalized: Math.min(100, 50 + drop * 200)
}
```

**Monthly Seasonality** (useAutomatedRecommendations.ts:147-170)
```javascript
let score = positiveRate;
if (dayDiff <= 3) score += 10;
normalized: Math.min(100, score)
```

**Current Performance** (useAutomatedRecommendations.ts:201-216)
```javascript
const underperformance = avgMonthPct - currentMonthPct;
normalized: Math.min(100, Math.max(0, 50 + underperformance * 10))
```

### Composite Score Calculation (useAutomatedRecommendations.ts:485-492)

```javascript
const compositeScore =
  scoreBreakdown.supportStrength.weighted +
  scoreBreakdown.daysSinceBreak.weighted +
  scoreBreakdown.recoveryAdvantage.weighted +
  scoreBreakdown.historicalPeak.weighted +
  scoreBreakdown.monthlySeasonality.weighted +
  scoreBreakdown.currentPerformance.weighted;
```

Where `weighted = normalized * (weight / 100)` for each component.

---

## Recovery Data Structure

From `useProbabilityRecoveryData.ts:26-76`, recovery data is organized as:

```
recoveryData[threshold][method][probBin][dteBin] = {
  recovery_candidate_n: int,
  recovery_candidate_rate: float (0-1),
  baseline_n: int,
  baseline_rate: float | null,
  advantage: float | null
}
```

**Threshold keys:** "0.80", "0.90", "0.95"
**Method names:** "Bayesian Calibrated", "Weighted Average", "Original Black-Scholes", "Bias Corrected", "Historical IV"
**Probability bins:** "<50%", "50-60%", "60-70%", "70-80%", "80-90%", "90%+"
**DTE bins:** "0-7", "8-14", "15-21", "22-28", "29-35", "36+"

---

## Default Weights

From `src/types/recommendations.ts:86-93`:

```
supportStrength: 20
daysSinceBreak: 15
recoveryAdvantage: 25        (Highest - research finding)
historicalPeak: 15
monthlySeasonality: 15
currentPerformance: 10       (Lowest - short-term indicator)
```

These are auto-normalized to sum to 100% before use.

---

## Files You Have in This Package

1. **SCORING_ALGORITHM_FOR_BACKTESTING.md** (950 lines)
   - Complete mathematical specifications
   - All normalization formulas with examples
   - Data structures and edge cases
   - References to source code locations

2. **UPSTREAM_BACKTESTING_PACKAGE.md** (this file)
   - Quick reference and file locations
   - Key implementation details
   - Summary of what to implement

3. **Full Original TypeScript Files:**
   - src/hooks/useAutomatedRecommendations.ts
   - src/types/recommendations.ts
   - src/pages/AutomatedRecommendations.tsx
   - src/components/recommendations/ScoreBreakdown.tsx
   - src/components/recommendations/OptionExplanation.tsx
   - src/hooks/useProbabilityRecoveryData.ts
   - docs/recommendations.md (feature documentation)

---

## What Data You Need

### Input Data (CSVs)
- `data.csv` - Options with probability methods
- `support_level_metrics.csv` - Support metrics by stock and rolling period
- `probability_history.csv` - Historical probability peaks
- `recovery_report_data.csv` - Recovery candidate statistics
- `Stocks_Monthly_Data.csv` - Monthly seasonality data
- `stock_data.csv` - Current stock prices and performance

### Output
`RecommendedOption[]` - Array of scored options, sorted by composite score (highest first)

---

## Validation

To validate your Python implementation, test these scenarios:

1. **Weight Normalization**
   - Input: [20, 15, 25, 15, 15, 10] (sum=100)
   - Output: [20%, 15%, 25%, 15%, 15%, 10%] (same)

   - Input: [10, 10, 10, 10, 10, 10] (sum=60)
   - Output: [16.67%, 16.67%, 16.67%, 16.67%, 16.67%, 16.67%] (normalized to 100%)

2. **Composite Score Range**
   - All factors: 0-100 → Composite: 0-100
   - All factors: 50 → Composite: 50
   - All factors: 100 → Composite: 100

3. **Sorting**
   - Higher scores rank first (rank 1 = highest score)
   - Scores may be identical (maintain stable sort order)

---

## Contact & Questions

For questions about:
- **Algorithm specifications:** See SCORING_ALGORITHM_FOR_BACKTESTING.md
- **Exact implementation:** See original TypeScript files in src/
- **Business logic:** See docs/recommendations.md

---

## File Locations in Repository

All files are relative to `/home/gustaf/put-options-se-1/`:

```
.
├── SCORING_ALGORITHM_FOR_BACKTESTING.md          ← Detailed specs
├── UPSTREAM_BACKTESTING_PACKAGE.md               ← This file
├── src/
│   ├── hooks/
│   │   ├── useAutomatedRecommendations.ts        ← Main scoring logic
│   │   └── useProbabilityRecoveryData.ts         ← Recovery data loading
│   ├── types/
│   │   └── recommendations.ts                     ← Type definitions
│   ├── pages/
│   │   └── AutomatedRecommendations.tsx          ← Page with weight normalization
│   └── components/
│       └── recommendations/
│           ├── ScoreBreakdown.tsx                ← Display logic
│           └── OptionExplanation.tsx             ← Business logic reference
└── docs/
    └── recommendations.md                         ← Feature documentation
```

---

## Summary

You have everything needed to implement the exact same scoring algorithm in Python:

✓ Mathematical specifications with examples
✓ Normalization formulas for all 6 factors
✓ Type definitions for input/output
✓ Default weights (25%, 20%, 15%, 15%, 15%, 10%)
✓ Complete original TypeScript source code
✓ Recovery data structure and lookups
✓ Weight auto-normalization logic
✓ Binning functions (probability & DTE)

Your Python implementation should produce identical scores to the web application.
