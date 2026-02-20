# Development Patterns

## Data Fetching

### Primary Options Data Hook

Use `useEnrichedOptionsData` for any component that displays options table data. This hook is the single source of truth for enriched options and performs all joins internally.

```typescript
const { data, isLoading } = useEnrichedOptionsData();
```

`useEnrichedOptionsData` automatically performs:
- Load `data.csv` via `useOptionsData`
- Load `IV_PotentialDecline.csv` for IV data
- Load `margin_requirements.csv` via `useMarginRequirementsData`
- LEFT JOIN margin data by option key
- Calculate `EstTotalMargin = Est_Margin_SEK × NumberOfContractsBasedOnLimit`
- Apply all recalculations

Do not load options data directly from `useOptionsData` in page components unless there is a specific reason to bypass enrichment.

### CSV Data Loading

All CSV files are fetched from GitHub raw content with a cache-busting timestamp, falling back to local files:

```typescript
const PRIMARY_URL = `https://raw.githubusercontent.com/datamilo/put-options-se/main/data/${file}.csv?t=${Date.now()}`;
const FALLBACK_URL = `/data/${file}.csv`;
```

Data is parsed via PapaParse. All hooks use the singleton pattern with React state — CSV files are not re-fetched on component re-renders.

### OHLC Data

- Use the `low` field for period lows, `high`/`low` for ranges — not `close` prices
- Period-over-period changes use the **previous period's closing price** as the baseline

### Margin Data

- LEFT JOIN behavior: Missing margin data shows `"-"` in the UI, never throws errors
- `EstTotalMargin` is a calculated field, not in the CSV — compute as `Est_Margin_SEK × NumberOfContractsBasedOnLimit`
- All margin figures are estimates (SRI methodology). They are not exact Nasdaq Stockholm requirements

### Probability Method Names

Always use `normalizeProbMethod()` from `src/utils/probabilityMethods.ts` when reading `ProbMethod` from CSV:

```typescript
import { normalizeProbMethod, getDisplayProbMethod } from '@/utils/probabilityMethods';

// Normalize on CSV parse (strips "PoW - " prefix if present)
const method = normalizeProbMethod(row.ProbMethod);  // → "Weighted Average"

// For UI display (adds "PoW - " prefix)
const display = getDisplayProbMethod(method);  // → "PoW - Weighted Average"
```

Both old format (`"PoW - Weighted Average"`) and new format (`"Weighted Average"`) are handled transparently.

---

## Chart Patterns

### Plotly vs Recharts

| Use case | Library |
|----------|---------|
| Candlestick charts | Plotly |
| Violin / distribution plots | Plotly |
| Complex multi-axis layouts | Plotly |
| Standard bar / line / area charts | Recharts |
| Scatter plots | Recharts |

Plotly pages: Consecutive Breaks, Probability Analysis, Lower Bound Analysis.

### Plotly Hover Date Format

Always use `%{x|%Y-%m-%d}` in Plotly `hovertemplate` strings:

```typescript
hovertemplate: '%{x|%Y-%m-%d}<br>Value: %{y}<extra></extra>'
```

### Plotly Violin Plots

Use a single `hovertemplate` entry on violin traces to prevent duplicate statistical breakdowns in the tooltip.

### Recharts

Import only the specific components needed. The `chart.tsx` wrapper in `src/components/ui/chart.tsx` re-exports Recharts primitives with the project's theme applied.

---

## Number Formatting

**This is a Nordic application. All numbers displayed in the UI must use Nordic/European formatting.**

| Separator | Standard | Nordic |
|-----------|----------|--------|
| Thousands | comma `,` | space ` ` |
| Decimals | dot `.` | comma `,` |

**Always use the utilities from `src/utils/numberFormatting.ts`:**

```typescript
formatNordicNumber(value, decimals)         // → "1 234 567"
formatNordicDecimal(value, decimals)        // → "87,66"
formatNordicPercentage(value, decimals)     // → "87,66%"
formatNordicPercentagePoints(value, dec)   // → "+24,55 pp"
formatNordicCurrency(value, decimals)       // → "1 234 567 kr"
```

Apply Nordic formatting to every numeric display in the UI: KPI cards, table cells, chart labels, statistics. Do NOT apply it to CSV data or internal calculations.

```typescript
// ❌ Wrong
`${(87.66).toFixed(2)}% worthless`          // "87.66% worthless"
`${(1336736).toLocaleString()} options`     // "1,336,736 options"

// ✅ Correct
`${formatNordicDecimal(87.66, 2)}% worthless`           // "87,66% worthless"
`${formatNordicNumber(1336736)} options`                // "1 336 736 options"
```

---

## Settings Architecture

There are two completely independent preference systems. Never mix them.

### Main Page Settings
- Hook: `useMainPagePreferences`
- Storage: `user_preferences` Supabase table + `localStorage` fallback
- Scope: Options Dashboard and related column/filter settings

### Portfolio Generator Settings
- Hook: `usePortfolioGeneratorPreferences`
- Storage: `portfolio_preferences` Supabase table + `localStorage` fallback
- Scope: Portfolio Generator page only

Both hooks use a `hasLoadedFromSupabase` flag to prevent continuous reloading when Supabase responds.

---

## Accessibility Patterns

The following accessibility attributes are applied consistently:

- `scope="col"` is the default on all `<TableHead>` components (defined in `src/components/ui/table.tsx`)
- `aria-sort` must be added to any sortable `<TableHead>` using the active sort field and direction
- `aria-label` must be added to all filter inputs (min/max/search) that lack visible labels
- `role="alert"` on error messages, `role="status"` on success messages
- Skip-to-content link at the top of `AppHeader` for keyboard navigation
- `<main id="main-content">` wraps all route content

Sort button minimum height: `h-9` (36px). Filter button minimum height: `h-9`. These are the minimum touch target sizes enforced throughout the table components.

---

## Component Conventions

- **Page components** (`src/pages/`): One file per route. Named or default export, one per file.
- **Feature components** (`src/components/<feature>/`): Grouped by the page or feature they serve.
- **UI primitives** (`src/components/ui/`): shadcn/ui components. Modify only to add project-specific props (like `numeric` on `TableHead`/`TableCell`).
- **Hooks** (`src/hooks/`): All data fetching and derived calculations. No UI logic in hooks.

---

## Audience and Tone

All UI copy is written for **senior professional investors** with deep knowledge of financial markets and options trading.

**Do not add:**
- Explanatory tooltips for standard financial concepts
- Educational warnings or disclaimers
- "Tips" or guidance text about investing strategy
- Language that assumes the investor doesn't understand the implications

**Do:**
- Present data clearly with self-explanatory labels
- Trust that investors understand context from field names and values
- Use precise financial terminology without definition

**Explanation principle**: Explain what IS, not what WAS or what COULD BE. Avoid comparative language ("rather than", "instead of", "unlike the old", "improved from"). Investors want facts, not rationale.
