# Portfolio Generator: Scored Models Strategy

**Status**: Implemented (Feb 13, 2026)

## Overview

A fourth optimization strategy ("Scored Models") added to the Automatic Portfolio Generator that ranks options using the dual-model ML scores from the Scored Options system (V2.1 probability optimization + TA V3 technical analysis).

## Design Decisions

- **Side-by-side mode**: New strategy added alongside existing returns/capital/balanced — no changes to existing strategies
- **Exclude unscored options**: Only options present in `current_options_scored.csv` are eligible when this strategy is active
- **User-configurable weights**: Slider to blend V2.1 and TA scores (default 50/50)
- **Key columns + expandable detail**: Three score columns plus selected PoW field in table, expandable row detail reusing existing V2.1 and TA breakdown components
- **Max probability filter**: Added to all strategies to enable targeting a probability range (not just a minimum floor)

## Scoring Formula

```
finalScore = (v21Weight / 100) * v21_score + ((100 - v21Weight) / 100) * (ta_probability * 100)
```

- `v21Weight`: User-configurable, 0–100, default 50, steps of 5
- `ta_probability` is 0–1 in the CSV, scaled to 0–100 for comparable range with `v21_score`

## Data Integration

- Reuse `useScoredOptionsData` hook (loads `current_options_scored.csv`)
- Join onto enriched options data by `OptionName` (`option_name` in scored CSV)
- Joined fields: `v21_score`, `v21_bucket`, `v21_historical_peak`, `v21_support_strength`, `ta_probability`, `ta_bucket`, `combined_score`, `models_agree`, `agreement_strength`, all 17 TA indicators

## Settings Persistence

New fields in `usePortfolioGeneratorPreferences`:
- `v21Weight: number` (default 50, range 0–100)
- `maxProbabilityWorthless: number | null` (default null)
- `optimizationStrategy` gains fourth value: `'scored'`

`taWeight` is derived as `100 - v21Weight` (not stored separately).

## Table Columns

**Default columns when "Scored Models" active:**

| Column | Header | Format |
|--------|--------|--------|
| `StockName` | Stock | Text |
| `OptionName` | Option | Text |
| `ExpiryDate` | Expiry | Date |
| `DaysToExpiry` | DTE | Integer |
| `StrikePrice` | Strike | Nordic decimal |
| `Premium` | Premium | Nordic decimal |
| `NumberOfContractsBasedOnLimit` | Contracts | Integer |
| [selected PoW field] | [selected PoW label] | Percentage (×100) |
| `combined_score` | Combined Score | Nordic decimal, 1 decimal |
| `v21_score` | V2.1 Score | Nordic decimal, 1 decimal |
| `ta_probability` | TA Probability | Nordic decimal, 1 decimal |

When switching to other strategies, table reverts to existing default columns.

**Expandable row detail:**
- Chevron toggle on each row
- V2.1 Breakdown: reuses `V21Breakdown.tsx`
- TA Breakdown: reuses `TABreakdown.tsx` (17 indicators with colored status)

## UI Controls

**Strategy selector** — fourth option added:
- Returns | Capital Efficiency | Balanced | **Scored Models**

**Weight slider** (visible only when "Scored Models" selected):
- Slider with "V2.1" and "TA" labels at endpoints
- Displays current split: "V2.1: 50% / TA: 50%"
- Steps of 5, range 0–100
- Default: 50

**Max probability filter** (all strategies):
- New input field alongside existing min probability
- Enables constraining probability range (e.g., 75%–85%)
- Prevents scored strategy from always selecting highest-probability options

## Files Modified

1. **`src/hooks/usePortfolioGeneratorPreferences.ts`** — added `v21Weight`, `maxProbabilityWorthless` fields, added `'scored'` to strategy type
2. **`src/pages/PortfolioGenerator.tsx`** — calls `useScoredOptionsData`, join logic, blended score, weight slider UI, max probability filter, strategy-specific column defaults
3. **`src/components/options/PortfolioOptionsTable.tsx`** — score columns, expandable row toggle and detail rendering (reuses V21Breakdown + TABreakdown), `isScoredStrategy` and `selectedProbabilityField` props

## Files Reused (No Changes)

- `src/hooks/useScoredOptionsData.ts` — loads scored CSV
- `src/components/scored-options/V21Breakdown.tsx` — V2.1 detail panel
- `src/components/scored-options/TABreakdown.tsx` — TA indicator detail panel
