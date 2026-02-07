# Scored Options Recommendations - KPI Cards Redesign

**Date:** February 7, 2026
**Page:** `/scored-options` (Scored Options Recommendations)
**Objective:** Replace less actionable "Models Agree" and "Strong Agreement" cards with dynamic performance and risk metrics

---

## Overview

Replace the two status-oriented KPI cards with three dynamic cards that provide model performance insight and risk context. Cards update based on user's current filter selections.

---

## Current State

**5 KPI Cards:**
1. Total Options - Total number of options in dataset
2. Models Agree - Count where both models recommend
3. Strong Agreement - Options with "Strong" agreement strength
4. Showing - Currently displayed after filters
5. (Removed - was a 4-card layout)

**Problem:** "Models Agree" and "Strong Agreement" cards show filter status rather than actionable insights.

---

## Proposed Design

### Layout

**Top Row (5 Cards):**
1. Total Options (existing)
2. Avg Combined Score (NEW)
3. Sample Size (NEW)
4. Max Historical Loss (NEW)
5. Showing (existing, moved to top row)

**Responsive Behavior:**
- Desktop: All 5 cards in single row
- Tablet/Mobile: Stacks naturally to 2 rows

---

## Card Specifications

### Card 2: Average Combined Score

**Purpose:** Show average model confidence level across filtered results

**Display Value:**
- Format: Single decimal (Nordic: `74,3`)
- Example: `74,3`

**Calculation:**
- Mean of "Combined" column for all rows matching current filters
- Combined score = average of Probability Optimization Score and TA Probability
- Includes all visible rows after filtering

**Updates When:**
- Expiry date changes
- Stocks filter changes
- Model Agreement filter changes
- Min Combined Score slider changes
- Min Probability Optimization Score slider changes
- Min TA Prob slider changes

**Color Coding:**
- 🟢 Green: Score ≥ 75 (strong model consensus)
- 🟡 Amber: Score 70-74 (good)
- 🔴 Red: Score < 70 (lower confidence)

**Tooltip:**
> "Average confidence level across your filtered options. Higher scores indicate stronger model consensus between Probability Optimization and TA ML models."

**Edge Cases:**
- If no filtered results: Display "-"
- If all combined scores are null: Display "-"
- If partial nulls: Calculate mean from non-null values only

---

### Card 3: Sample Size for Score Range

**Purpose:** Show statistical power behind the filtered data's score range

**Display Value:**
- Format: Abbreviated (e.g., `583K`, `1,2M`)
- Example: `583K predictions`

**Calculation:**
- Determine min/max combined scores in current filtered results
- Map to calibration bucket (e.g., 70-80%, 80-90%, etc.)
- Return sample size from corresponding bucket in calibration data
- If scores span multiple buckets, sum the sample sizes

**Updates When:**
- Any filter that changes which scores are visible (same as Card 2)

**Color Coding:** Neutral/informational (no red/green)

**Tooltip:**
> "Historical validation sample size for this score range. Larger samples provide higher statistical confidence in the model's predictions. Our TA Model V3 is validated on 1.59M walk-forward predictions."

**Calibration Buckets Reference:**
- <50%: Sample size from calibration data
- 50-60%: Sample size from calibration data
- 60-70%: Sample size from calibration data
- 70-80%: 583K (from TA Model V3 calibration)
- 80-90%: Sample size from calibration data
- 90-100%: Sample size from calibration data

**Edge Cases:**
- If score range unmapped or unclear: Display "N/A"
- If multiple buckets: Show primary bucket or combined total with note

---

### Card 4: Max Historical Loss

**Purpose:** Disclose worst-case scenario risk for the current score range

**Display Value:**
- Format: Percentage (Nordic: `45,0%`)
- Example: `45,0% max loss`

**Calculation:**
- Determine score range of filtered results (same as Card 3)
- Return maximum historical loss from that calibration bucket
- Based on: (1 - hit rate) × 100
- Example: 70-80% range has 77% hit rate → 23% failure rate → max historical loss shown as percentage point or loss amount

**Updates When:**
- Same triggers as Cards 2 & 3

**Color Coding:** Neutral/informational disclosure (no red/green alert)

**Tooltip:**
> "Worst historical loss in this score range. At the 70-80% score level, 23% of options historically expired in-the-money. This represents the downside risk of the current selection."

**Edge Cases:**
- If score range unmapped: Display "-"
- If no loss data available: Display "-"

---

## Data Integration

**Data Source:** Calibration metrics already displayed in page's "Model Calibration & Accuracy" section

**Calculations Location:** New utility function or component:
- `calculateFilteredKPIs()` - Computes all three values from filtered data + calibration reference
- Input: filtered options array, calibration metrics data
- Output: { avgScore, sampleSize, maxLoss }

**Dependencies:**
- `useEnrichedOptionsData` hook (provides filtered options)
- Calibration tables data (already in component)
- Existing column definitions (Combined, Probability Optimization Score, TA Probability)

---

## Visual Design

**Card Styling:**
- Maintain existing KPI card design/spacing
- Same color coding as other metric cards
- Icons: Optional (scorecard icon for avg score, graph/database icon for sample size, warning icon for max loss)

**Typography:**
- Large metric value (existing size)
- Small label below (existing pattern)
- Tooltip on hover

**Responsive Adjustments:**
- Cards scale proportionally on smaller screens
- Text truncation: None (values should fit)
- Mobile: Stack to 2 rows naturally

---

## Implementation Checklist

- [ ] Update KPI card grid layout (remove 4-card constraint, allow 5)
- [ ] Create `calculateFilteredKPIs()` utility function
- [ ] Add Card 2 (Avg Combined Score) component
- [ ] Add Card 3 (Sample Size) component
- [ ] Add Card 4 (Max Historical Loss) component
- [ ] Wire up filter dependencies (recalculate on every filter change)
- [ ] Update tooltips in `scoredOptionsTooltips.ts`
- [ ] Test responsive layout (desktop, tablet, mobile)
- [ ] Test edge cases (empty filters, null values, unmapped ranges)
- [ ] Update `docs/scored-options.md` to reflect new KPI structure
- [ ] Test with live data - verify cards update correctly as filters change

---

## Testing Scenarios

1. **Initial Load:** All 5 cards display with baseline data
2. **Filter by Expiry:** Cards update to reflect new expiry selection
3. **Filter by Score:** Avg score, sample size, and max loss update correctly
4. **Multiple Filters:** All filters combined produce correct aggregated metrics
5. **Empty Results:** Cards gracefully show "-" when no data matches
6. **Null Scores:** Calculation excludes null values appropriately
7. **Responsive:** All 5 cards fit on desktop, stack cleanly on mobile

---

## Related Documentation

- `/docs/scored-options.md` - Main page documentation (needs update to reflect new KPI structure)
- `/docs/analytics.md` - If analytics tracking needed for new cards
- Calibration metrics in page component

