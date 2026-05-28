# Development Patterns

## Data Fetching

### Primary Options Data Hook

Use `useEnrichedOptionsData` for any component that displays options table data. This hook is the single source of truth for enriched options and performs all joins internally.

```typescript
const { data, isLoading } = useEnrichedOptionsData();
```

`useEnrichedOptionsData` automatically performs:
- Load `data.csv` via `useOptionsData`
- Load `IV_PotentialDecline.csv` for IV data and join by option key
- Apply all recalculations

Do not load options data directly from `useOptionsData` in page components unless there is a specific reason to bypass enrichment.

### CSV Data Loading

All CSV files are fetched from GitHub raw content with a local fallback. Browser HTTP cache (ETags) controls freshness:

```typescript
const PRIMARY_URL = `https://raw.githubusercontent.com/datamilo/put-options-se/main/data/${file}.csv`;
const FALLBACK_URL = `/data/${file}.csv`;
```

Data is parsed via PapaParse. Two caching strategies prevent re-fetches across navigations:

- **`useOptionsData`**: TanStack Query (`staleTime: 10 min`, `gcTime: 30 min`) — data persists in the query cache across page navigations
- **All other CSV hooks**: module-level singletons — the loaded array is stored at module scope and returned immediately on subsequent mounts

### OHLC Data

- Use the `low` field for period lows, `high`/`low` for ranges — not `close` prices
- Period-over-period changes use the **previous period's closing price** as the baseline

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

## Internationalisation (i18n)

The app supports English and Swedish via **react-i18next**. Language preference persists in `localStorage` under the key `lang`.

### Namespaces

| Namespace | Contents |
|-----------|----------|
| `common`  | Nav labels, buttons, status messages, filters, auth, settings, month names |
| `pages`   | Page titles, section headings, all page-level text |
| `tables`  | Table column headers |
| `charts`  | Chart axis labels, legend entries |
| `tooltips`| Explanatory text, methodology descriptions |

Default namespace is `common`. The `pages` namespace holds the most keys.

### Usage in components

Single namespace (most common):
```tsx
const { t } = useTranslation('pages');
// key within 'pages' namespace:
t('recommendations.title')
```

Multiple namespaces:
```tsx
const { t } = useTranslation(['pages', 'common']);
// cross-namespace reference requires prefix:
t('common:monthNamesShort.5')   // "May" / "Maj"
t('pages:monthlyAnalysis.statsTable.colStock')
```

### Adding new strings

1. Add the key to `src/i18n/en/<namespace>.json` and `src/i18n/sv/<namespace>.json`
2. Use `t('key')` or `t('key', { var: value })` for interpolation
3. Month names: always use `t('common:monthNames.N')` or `t('common:monthNamesShort.N')` (1-indexed)
4. Dynamic keys via template literals: `` t(`pages:section.variant_${type}`) `` — ensure all variants exist in JSON

### Recharts labels

Recharts re-renders on language change (component re-mounts). Use `t()` directly in `name` props, axis `label` objects, and `ReferenceLine` label values — no special handling needed.

### Plotly layouts

Plotly does not re-render automatically. Wrap the layout config in `useMemo` with `i18n.language` as a dependency:
```tsx
const { t, i18n } = useTranslation('pages');
const layout = useMemo(() => ({
  xaxis: { title: t('charts.xAxisLabel') },
}), [t, i18n.language]);
```

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
