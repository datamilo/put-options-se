# Scored Options KPI Cards Redesign - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace "Models Agree" and "Strong Agreement" KPI cards with dynamic performance metrics (Avg Combined Score, Sample Size, Max Historical Loss), updating all cards in a 5-card top row layout.

**Architecture:** Add a new utility function `calculateFilteredKPIs()` that computes three metrics from filtered data + calibration reference. Create three new card components that display these metrics with color coding, tooltips, and proper Nordic number formatting. Update the main ScoredOptions page to render a 5-card layout and remove the old agreement cards.

**Tech Stack:** React hooks (useMemo), calibration data from existing data file, number formatting utilities, existing UI card components.

---

## Task 1: Create KPI Calculation Utility

**Files:**
- Create: `src/utils/scoredOptionsKpiCalculations.ts`
- Modify: `src/types/calibration.ts` (if needed for type support)

**Step 1: Read calibration metrics data structure**

Run: `cat src/data/calibrationMetrics.ts | head -120`
Expected: See full v21Buckets and v3Buckets array structures with hitRate, sampleSize properties

**Step 2: Read existing number formatting utilities**

Run: `cat src/utils/numberFormatting.ts`
Expected: See formatNordicNumber, formatNordicDecimal, formatNordicPercentage functions

**Step 3: Write new utility file with three functions**

Create file `src/utils/scoredOptionsKpiCalculations.ts`:

```typescript
import { ScoredOptionData } from '@/types/scoredOptions';
import { CalibrationMetricsData } from '@/types/calibration';

export interface FilteredKPIs {
  avgCombinedScore: number | null;
  sampleSize: number | string | null;
  maxHistoricalLoss: number | null;
}

/**
 * Find the calibration bucket that matches the filtered data's score range
 * Returns the primary bucket (lower bound if spanning multiple buckets)
 */
function findCalibrationBucket(
  minScore: number,
  maxScore: number,
  calibrationBuckets: any[]
): any {
  // Find first bucket that overlaps with the score range
  return calibrationBuckets.find(
    (bucket) => minScore < bucket.maxScore && maxScore > bucket.minScore
  );
}

/**
 * Find all buckets that the score range spans
 * If spanning multiple, sum their sample sizes
 */
function getAggregatedSampleSize(
  minScore: number,
  maxScore: number,
  calibrationBuckets: any[]
): number {
  const overlappingBuckets = calibrationBuckets.filter(
    (bucket) => minScore < bucket.maxScore && maxScore > bucket.minScore
  );

  if (overlappingBuckets.length === 0) return 0;
  if (overlappingBuckets.length === 1) {
    return overlappingBuckets[0].sampleSize;
  }

  // Multiple buckets: sum their sample sizes
  return overlappingBuckets.reduce((sum, b) => sum + b.sampleSize, 0);
}

/**
 * Get max loss (1 - hitRate) from the bucket
 * Expressed as percentage (0-100)
 */
function getMaxHistoricalLoss(bucket: any): number {
  if (!bucket) return 0;
  const failureRate = 1 - bucket.hitRate; // e.g., 1 - 0.838 = 0.162
  return Math.round(failureRate * 100 * 10) / 10; // 16.2%
}

/**
 * Calculate KPI metrics for filtered options
 * Updates dynamically as filters change
 */
export function calculateFilteredKPIs(
  filteredData: ScoredOptionData[],
  calibrationMetricsData: CalibrationMetricsData
): FilteredKPIs {
  if (!filteredData || filteredData.length === 0) {
    return {
      avgCombinedScore: null,
      sampleSize: null,
      maxHistoricalLoss: null,
    };
  }

  // Calculate average combined score
  const validScores = filteredData
    .map((opt) => opt.combined_score)
    .filter((score) => score !== null && score !== undefined) as number[];

  const avgCombinedScore =
    validScores.length > 0
      ? Math.round((validScores.reduce((a, b) => a + b, 0) / validScores.length) * 10) / 10
      : null;

  // Find score range in filtered data
  const scores = validScores.sort((a, b) => a - b);
  const minScore = scores[0];
  const maxScore = scores[scores.length - 1];

  // Get calibration bucket for this range (use V21 buckets)
  const bucket = findCalibrationBucket(minScore, maxScore, calibrationMetricsData.v21Buckets);

  // Get aggregated sample size (handles multi-bucket spans)
  const sampleSize = getAggregatedSampleSize(minScore, maxScore, calibrationMetricsData.v21Buckets);

  // Format sample size as abbreviated string (e.g., "583K", "1.2M")
  let formattedSampleSize: string | null = null;
  if (sampleSize > 0) {
    if (sampleSize >= 1000000) {
      formattedSampleSize = `${(sampleSize / 1000000).toFixed(1)}M`;
    } else if (sampleSize >= 1000) {
      formattedSampleSize = `${(sampleSize / 1000).toFixed(0)}K`;
    } else {
      formattedSampleSize = sampleSize.toString();
    }
  }

  // Get max historical loss from bucket
  const maxHistoricalLoss = bucket ? getMaxHistoricalLoss(bucket) : null;

  return {
    avgCombinedScore,
    sampleSize: formattedSampleSize,
    maxHistoricalLoss,
  };
}
```

**Step 4: Run TypeScript compilation check**

Run: `npm run build 2>&1 | head -20`
Expected: Either "successfully compiled" or see any type errors from the new file

**Step 5: Commit**

```bash
cd "C:\Users\Gustaf\dev\put-options-se-1"
git add src/utils/scoredOptionsKpiCalculations.ts
git commit -m "feat: add KPI calculation utility for filtered metrics

- calculateFilteredKPIs() computes avg combined score, sample size, max loss
- Handles score range mapping to calibration buckets
- Aggregates sample sizes when spanning multiple buckets
- Returns null values when data unavailable

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 2: Create Average Combined Score KPI Card Component

**Files:**
- Create: `src/components/scored-options/KpiCard.tsx` (reusable KPI card component)
- Modify: `src/utils/scoredOptionsTooltips.ts` (add new tooltips)

**Step 1: Read existing KPI card structure**

Run: `sed -n '185,201p' src/pages/ScoredOptions.tsx`
Expected: See card HTML structure with CardContent, icon placement, layout

**Step 2: Read existing tooltips file**

Run: `head -50 src/utils/scoredOptionsTooltips.ts`
Expected: See tooltip structure and existing KPI tooltips

**Step 3: Create reusable KPI card component**

Create file `src/components/scored-options/KpiCard.tsx`:

```typescript
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { InfoIconTooltip } from '@/components/ui/info-icon-tooltip';
import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  label: string;
  value: string | number | null;
  subValue?: string; // Smaller text below main value
  icon: LucideIcon;
  iconColor: string;
  tooltipTitle: string;
  tooltipContent: string;
  colorClass?: 'text-blue-600' | 'text-green-600' | 'text-red-600' | 'text-orange-600'; // Color for icon
  valueClassName?: string; // CSS class for conditional value styling (e.g., "text-green-600")
}

export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  subValue,
  icon: Icon,
  iconColor,
  tooltipTitle,
  tooltipContent,
  colorClass = 'text-blue-600',
  valueClassName,
}) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-sm text-muted-foreground">{label}</p>
              <InfoIconTooltip title={tooltipTitle} content={tooltipContent} />
            </div>
            <p className={`text-3xl font-bold mt-2 ${valueClassName || ''}`}>
              {value !== null && value !== undefined ? value : '-'}
            </p>
            {subValue && <p className="text-xs text-muted-foreground mt-1">{subValue}</p>}
          </div>
          <Icon className={`h-8 w-8 ${colorClass}`} />
        </div>
      </CardContent>
    </Card>
  );
};
```

**Step 4: Add tooltips to scoredOptionsTooltips.ts**

Read the file first:
Run: `wc -l src/utils/scoredOptionsTooltips.ts`
Expected: Shows line count (should be 200+)

Then append tooltips at the end of the `kpi` section. Read around line 20-40 to see the existing structure:
Run: `sed -n '20,60p' src/utils/scoredOptionsTooltips.ts`

Modify `src/utils/scoredOptionsTooltips.ts` to add these tooltips in the `kpi` object:

```typescript
// Add to kpi section (replace existing modelsAgree and strongAgreement with new ones):

avgCombinedScore: {
  title: 'Average Combined Score',
  content: 'Average confidence level across your filtered options. The combined score is the average of the Probability Optimization Score and TA ML Model probability. Higher scores indicate stronger model consensus between the two independent models. Green (≥75) = strong, Amber (70-74) = good, Red (<70) = lower confidence.',
},

sampleSize: {
  title: 'Sample Size for Score Range',
  content: 'Historical validation sample size for the score range of your filtered options. Larger samples provide higher statistical confidence in the models\' predictions. Our TA Model V3 is validated on 1.59M walk-forward predictions, and the Probability Optimization Model on 934K+ historical options.',
},

maxHistoricalLoss: {
  title: 'Max Historical Loss',
  content: 'Worst-case loss percentage historically observed in this score range. This represents the downside risk of your current selection. For example, at the 70-80% score level, 23% of options historically expired in-the-money (failure rate), representing the maximum historical loss.',
},
```

**Step 5: Run TypeScript compilation check**

Run: `npm run build 2>&1 | head -20`
Expected: No errors from new component

**Step 6: Commit**

```bash
cd "C:\Users\Gustaf\dev\put-options-se-1"
git add src/components/scored-options/KpiCard.tsx src/utils/scoredOptionsTooltips.ts
git commit -m "feat: add reusable KPI card component and new tooltips

- Create KpiCard.tsx for flexible KPI rendering
- Add tooltips for Avg Combined Score, Sample Size, Max Historical Loss
- Support conditional color styling and sub-values

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 3: Update ScoredOptions Page Layout (Remove Old Cards)

**Files:**
- Modify: `src/pages/ScoredOptions.tsx` (lines 183-260)

**Step 1: Read current KPI section**

Run: `sed -n '106,115p' src/pages/ScoredOptions.tsx`
Expected: See summary calculation logic

Run: `sed -n '183,260p' src/pages/ScoredOptions.tsx`
Expected: See current 4-card grid layout with "Models Agree" and "Strong Agreement" cards

**Step 2: Update summary calculation to remove old card metrics**

Modify the `summary` useMemo hook (around line 107-114):

Replace:
```typescript
  const summary = useMemo(() => {
    return {
      totalOptions: data.length,
      bothAgreeCount: data.filter((opt) => opt.models_agree).length,
      strongAgreementCount: data.filter((opt) => opt.models_agree && opt.agreement_strength === 'Strong').length,
      currentlyShowing: filteredData.length,
    };
  }, [data, filteredData]);
```

With:
```typescript
  const summary = useMemo(() => {
    return {
      totalOptions: data.length,
      currentlyShowing: filteredData.length,
    };
  }, [data, filteredData]);
```

**Step 3: Update the KPI grid layout from 4 columns to 5 columns**

Replace line 183:
```typescript
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
```

With:
```typescript
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
```

**Step 4: Remove the "Models Agree" and "Strong Agreement" cards**

Remove lines 203-226 (entire "Models Agree Count" card)
Remove lines 228-250 (entire "Strong Agreement Count" card)

**Step 5: Keep Total Options card (unchanged)**

Lines 184-201 should remain as-is

**Step 6: Run build to check for syntax errors**

Run: `npm run build 2>&1 | grep -E "(error|Error)" | head -10`
Expected: No errors (or only warnings)

**Step 7: Commit**

```bash
cd "C:\Users\Gustaf\dev\put-options-se-1"
git add src/pages/ScoredOptions.tsx
git commit -m "refactor: update KPI grid layout from 4 to 5 columns

- Remove Models Agree and Strong Agreement cards
- Simplify summary calculation logic
- Update grid responsive breakpoints (sm:md:lg)
- Prepare for new dynamic KPI cards

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 4: Add Three New KPI Card Instances

**Files:**
- Modify: `src/pages/ScoredOptions.tsx` (add imports, add cards, add KPI calculation)

**Step 1: Add import statements at top**

Add to imports section (around line 1-15):

```typescript
import { calculateFilteredKPIs } from '@/utils/scoredOptionsKpiCalculations';
import { KpiCard } from '@/components/scored-options/KpiCard';
import { TrendingUp, Database, AlertTriangle } from 'lucide-react';
```

**Step 2: Add KPI calculation hook**

Add new useMemo hook after the summary calculation (after line 114):

```typescript
  // Calculate dynamic KPI metrics
  const kpiMetrics = useMemo(() => {
    return calculateFilteredKPIs(filteredData, calibrationMetricsData);
  }, [filteredData, calibrationMetricsData]);

  // Helper to get color class for avg score
  const avgScoreColorClass = kpiMetrics.avgCombinedScore
    ? kpiMetrics.avgCombinedScore >= 75
      ? 'text-green-600'
      : kpiMetrics.avgCombinedScore >= 70
      ? 'text-orange-500'
      : 'text-red-600'
    : '';
```

**Step 3: Import calibrationMetricsData**

Add to imports:
```typescript
import { calibrationMetricsData } from '@/data/calibrationMetrics';
```

**Step 4: Add three new cards in the grid**

In the KPI grid (after the Total Options card, before the closing div), add:

```typescript
            {/* Average Combined Score */}
            <KpiCard
              label="Avg Combined Score"
              value={kpiMetrics.avgCombinedScore !== null
                ? kpiMetrics.avgCombinedScore.toLocaleString('sv-SE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
                : null
              }
              icon={TrendingUp}
              iconColor={avgScoreColorClass || 'text-blue-600'}
              tooltipTitle={scoredOptionsTooltips.kpi.avgCombinedScore.title}
              tooltipContent={scoredOptionsTooltips.kpi.avgCombinedScore.content}
              valueClassName={avgScoreColorClass}
            />

            {/* Sample Size */}
            <KpiCard
              label="Sample Size"
              value={kpiMetrics.sampleSize ? `${kpiMetrics.sampleSize} predictions` : null}
              icon={Database}
              iconColor="text-blue-600"
              tooltipTitle={scoredOptionsTooltips.kpi.sampleSize.title}
              tooltipContent={scoredOptionsTooltips.kpi.sampleSize.content}
            />

            {/* Max Historical Loss */}
            <KpiCard
              label="Max Historical Loss"
              value={kpiMetrics.maxHistoricalLoss !== null
                ? `${kpiMetrics.maxHistoricalLoss.toLocaleString('sv-SE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`
                : null
              }
              icon={AlertTriangle}
              iconColor="text-orange-600"
              tooltipTitle={scoredOptionsTooltips.kpi.maxHistoricalLoss.title}
              tooltipContent={scoredOptionsTooltips.kpi.maxHistoricalLoss.content}
            />
```

**Step 5: Keep "Showing" card**

The "Showing" card (currently lines 251-270) should remain unchanged and stay at the end of the grid.

**Step 6: Run build to verify all imports and syntax**

Run: `npm run build 2>&1 | head -30`
Expected: Build succeeds with no errors

**Step 7: Test in browser (manual visual check)**

Run: `npm run dev`
Expected: Application starts, navigate to `/scored-options` to verify:
- 5 KPI cards display in top row
- Cards show correct values
- Color coding works for avg score
- Tooltips appear on hover
- Responsive layout works (resize browser)

**Step 8: Commit**

```bash
cd "C:\Users\Gustaf\dev\put-options-se-1"
git add src/pages/ScoredOptions.tsx
git commit -m "feat: add three dynamic KPI cards with conditional styling

- Add Average Combined Score card with color coding (green/amber/red)
- Add Sample Size card showing historical validation sample
- Add Max Historical Loss card with risk disclosure
- All cards update based on filter selections
- Integrate with calibration metrics data

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 5: Update Documentation

**Files:**
- Modify: `docs/scored-options.md` (update KPI section)

**Step 1: Read current KPI documentation**

Run: `sed -n '21,31p' docs/scored-options.md`
Expected: See KPI table with 4 cards

**Step 2: Update KPI table**

Replace lines 23-30 with:

```markdown
| KPI | Description |
|-----|-------------|
| **Total Options** | Total number of options analyzed across all expiry dates |
| **Avg Combined Score** | Average confidence level across filtered results (dynamically updates) |
| **Sample Size** | Historical validation sample size for the current score range (larger = more reliable) |
| **Max Historical Loss** | Worst-case loss percentage historically observed at this score range |
| **Showing** | Options currently displayed after applying all filters (percentage of total) |
```

**Step 3: Update Summary KPIs section description**

Find and replace the intro text (around line 22):

From:
```markdown
Four key metrics provide an at-a-glance overview:
```

To:
```markdown
Five key metrics provide an at-a-glance overview, with three updating dynamically based on current filter selections:
```

**Step 4: Add new subsection explaining dynamic behavior**

Add after the KPI table (after line 31):

```markdown
### Dynamic KPI Updates

Three KPI cards update whenever you change filters:
- **Avg Combined Score** - Recalculates mean score of filtered options; color-coded by confidence level
- **Sample Size** - Shows historical sample size for the score range of your filtered results
- **Max Historical Loss** - Shows worst-case loss from calibration data for the current score range

The other two cards remain static:
- **Total Options** - Total dataset size (unchanged)
- **Showing** - Current filter result count (updated only by filter changes, not recalculated like the three above)
```

**Step 5: Run spelling check**

Run: `grep -i "avg\|sample\|historical" docs/scored-options.md | head -10`
Expected: See updated documentation mentions

**Step 6: Commit**

```bash
cd "C:\Users\Gustaf\dev\put-options-se-1"
git add docs/scored-options.md
git commit -m "docs: update KPI documentation for new cards

- Replace Models Agree and Strong Agreement cards with new dynamic metrics
- Add explanation of dynamic KPI updates
- Update KPI table with new card descriptions

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 6: Test Dynamic Updates (All Filters)

**Files:**
- Test: Manually verify in browser (no code changes)

**Step 1: Navigate to Scored Options page**

Run: `npm run dev` (if not already running)
Navigate to: http://localhost:5173/scored-options

**Step 2: Test - Filter by score slider and verify KPI updates**

Actions:
1. Leave default filters (expiry selected)
2. Note initial Avg Combined Score, Sample Size, Max Historical Loss values
3. Move "Min Combined Score" slider to 80
4. Verify Avg Combined Score increases
5. Verify Sample Size may change based on new range
6. Verify Max Historical Loss updates to new range's worst case

Expected: All three cards update correctly

**Step 3: Test - Change stock filter and verify KPI updates**

Actions:
1. Reset filters to defaults
2. Note KPI values
3. Select a single stock from "Stocks" dropdown
4. Verify all three KPI cards recalculate

Expected: Values change based on filtered stock subset

**Step 4: Test - Change expiry date and verify KPI updates**

Actions:
1. Select different expiry date from dropdown
2. Verify all KPI metrics update

Expected: Cards show new values for selected expiry

**Step 5: Test - Empty filters (no results) show graceful degradation**

Actions:
1. Set "Min Combined Score" to 100 (likely no matches)
2. Verify KPI cards display "-" instead of crashing

Expected: All cards show "-" when no data matches

**Step 6: Test - Color coding for Avg Combined Score**

Actions:
1. Find a filter combination with avg score ≥ 75 → should show green
2. Find combination with avg score 70-74 → should show orange
3. Find combination with avg score < 70 → should show red

Expected: Color updates correctly as filters change

**Step 7: Test - Responsive layout**

Actions:
1. Desktop (1400px+): All 5 cards in single row
2. Tablet (1024px): Cards wrap appropriately (3 top, 2 bottom or similar)
3. Mobile (375px): Cards stack vertically

Expected: Grid responsive classes work correctly

**Step 8: Manual approval checklist**

- [ ] All 5 KPI cards visible on page
- [ ] Total Options card unchanged
- [ ] Avg Combined Score displays and updates
- [ ] Sample Size displays with "K" or "M" abbreviation
- [ ] Max Historical Loss displays with "%" sign
- [ ] Showing card displays at end
- [ ] Color coding works (green/amber/red for avg score)
- [ ] Tooltips appear on hover over info icons
- [ ] Cards update when filters change
- [ ] Mobile/tablet responsive layout works
- [ ] No console errors

**Step 9: Commit (manual testing done)**

```bash
cd "C:\Users\Gustaf\dev\put-options-se-1"
git commit -m "test: manual verification of KPI cards functionality

- Verified all 5 cards display and responsive layout works
- Tested dynamic updates on filter changes
- Verified color coding for avg combined score
- Tested graceful degradation with no data
- All tooltips functional

Co-Authored-By: Claude <noreply@anthropic.com>"
```

**Note:** This task requires human review and browser testing - cannot be automated.

---

## Task 7: Run Full Build and Push

**Files:**
- None (verification only)

**Step 1: Full production build**

Run: `npm run build`
Expected: Build completes successfully with no errors

If errors, review output:
Run: `npm run build 2>&1 | tail -50`

**Step 2: Type check**

Run: `npx tsc --noEmit`
Expected: No type errors

**Step 3: Git status**

Run: `git status`
Expected: All changes committed, working directory clean

**Step 4: Verify recent commits**

Run: `git log --oneline -7`
Expected: See 6 commits from this implementation plan

**Step 5: Push to GitHub**

Run: `git push`
Expected: All commits pushed successfully

**Step 6: Verify GitHub push**

Run: `git push --dry-run 2>&1 || echo "Already pushed"`
Expected: Either dry-run shows nothing to push, or succeeds

**Step 7: Final commit (if build was needed)**

If you ran a build during development, ensure final build artifacts are NOT committed (they shouldn't be in git):

Run: `git status`
Expected: Should show "nothing to commit, working tree clean"

---

## Summary

This plan implements the KPI cards redesign in 7 focused tasks:

1. **Utility Function** - `calculateFilteredKPIs()` computes metrics from filtered data
2. **Card Component** - Reusable `KpiCard` component with color coding
3. **Remove Old Cards** - Update layout from 4 to 5 columns, remove agreement cards
4. **Add New Cards** - Instantiate 3 new KPI cards with imports and hooks
5. **Update Docs** - Sync documentation with new card structure
6. **Test** - Manual verification of responsive layout and dynamic updates
7. **Build & Push** - Final build and GitHub push

**Total estimated effort:** 45-60 minutes for implementation + testing

**Key design decisions:**
- Use reusable `KpiCard` component to reduce duplication
- Color code only Avg Combined Score (green/amber/red), others neutral
- Calculate sample size as aggregated sum if spanning multiple buckets
- Use existing calibration data (no new data source needed)
- All three new cards update on every filter change (same dependencies)

