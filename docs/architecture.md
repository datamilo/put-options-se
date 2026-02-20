# Architecture

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI framework | React 18 + TypeScript |
| Build tool | Vite 5 (with `@vitejs/plugin-react-swc`) |
| Styling | Tailwind CSS 3 + shadcn/ui (Radix primitives) |
| Charts | Recharts 2 (standard charts) + Plotly 3 (financial charts) |
| Data fetching | TanStack Query v5 |
| State / preferences | React Context + Supabase (authenticated) + localStorage (guest) |
| Auth | Supabase Auth |
| Routing | React Router 6 |
| Node.js polyfills | vite-plugin-node-polyfills (required for Plotly's `buffer` dependency) |

---

## Project Directory Structure

```
put-options-se-1/
├── src/
│   ├── App.tsx                   # Root component, routing, lazy-loaded pages
│   ├── main.tsx                  # Entry point
│   ├── index.css                 # Design tokens (CSS custom properties)
│   ├── auth/                     # AuthProvider, ProtectedRoute
│   ├── components/
│   │   ├── ui/                   # shadcn/ui components + custom primitives
│   │   ├── options/              # OptionsTable, PortfolioOptionsTable, ColumnManager
│   │   ├── monthly/              # Monthly analysis charts and tables
│   │   ├── probability/          # Calibration and recovery charts
│   │   ├── lower-bound/          # Lower bound charts and tables
│   │   ├── scored-options/       # Scored options table, filters, metrics
│   │   ├── recommendations/      # Recommendations table and filters
│   │   ├── iv-analysis/          # IV screening table and charts
│   │   ├── stock/                # Candlestick and line charts
│   │   ├── volatility/           # Volatility stats chart
│   │   └── HorizontalNavigation.tsx
│   ├── contexts/                 # SettingsContext
│   ├── hooks/                    # All data-fetching and calculation hooks
│   ├── pages/                    # One file per route
│   ├── types/                    # TypeScript interfaces
│   └── utils/                    # numberFormatting, probabilityMethods, etc.
├── data/                         # Static CSV data files (served at runtime)
├── docs/                         # All project documentation
├── public/                       # Static assets
├── supabase/migrations/          # Database schema
└── vite.config.ts
```

---

## Build System

### Vite Configuration (`vite.config.ts`)

```typescript
plugins: [
  react(),
  nodePolyfills({ include: ['buffer'] }),  // Required for Plotly
],
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        vendor: ['react', 'react-dom'],
        router: ['react-router-dom'],
        charts: ['recharts'],
        csv: ['papaparse'],
      }
    }
  }
}
```

The `vite-plugin-node-polyfills` plugin is required because Plotly's dependency `typedarray-pool` imports the Node.js `buffer` built-in. Without the polyfill, this import fails as an unresolvable module specifier in the browser.

### Code Splitting and Lazy Loading

All 16 page components are lazy-loaded via `React.lazy()` with a single `<Suspense>` boundary wrapping the `<Routes>`:

```typescript
const Index = React.lazy(() => import("./pages/Index"));
const ConsecutiveBreaksAnalysis = React.lazy(() => import("./pages/ConsecutiveBreaksAnalysis"));
// ... all pages
```

**Why this matters**: Initial JS payload is ~430 kB gzipped (down from ~1.9 MB). Pages are loaded on demand. Plotly (used by 3 pages) is bundled by Rollup into a shared lazy chunk and never loaded on initial visit.

Pages that export named exports (not default) require the `.then()` pattern:
```typescript
const MonthlyAnalysis = React.lazy(() =>
  import("./pages/MonthlyAnalysis").then(m => ({ default: m.MonthlyAnalysis }))
);
```

Pages using this pattern: `MonthlyAnalysis`, `VolatilityAnalysis`, `ProbabilityAnalysis`, `LowerBoundAnalysis`, `ScoredOptions`, `IVAnalysis`.

### Base Path

The app detects GitHub Pages at runtime and sets the base path accordingly:

```typescript
const isGitHubPages = window.location.hostname === 'datamilo.github.io';
const basename = isGitHubPages ? '/put-options-se' : '';
```

The Vite build always uses `/put-options-se` as the base in production mode. GitHub Pages SPA routing is handled via the `index.html` redirect script and React Router's `basename` prop.

---

## Routing

All routes except `/auth` and `/auth/callback` are wrapped in `<ProtectedRoute>`, which redirects unauthenticated users to `/auth`.

```
/                         → Index (Options Dashboard)
/portfolio-generator      → PortfolioGenerator
/monthly-analysis         → MonthlyAnalysis
/volatility-analysis      → VolatilityAnalysis
/iv-analysis              → IVAnalysis
/consecutive-breaks       → ConsecutiveBreaksAnalysis
/support-level-options    → SupportBasedOptionFinder
/option/:optionId         → OptionDetailsPage
/stock/:stockName         → StockDetailsPage
/stock-analysis           → StockDetailsPage (no param)
/probability-analysis     → ProbabilityAnalysis
/lower-bound-analysis     → LowerBoundAnalysis
/recommendations          → AutomatedRecommendations
/scored-options           → ScoredOptions
/auth                     → Auth (public)
/auth/callback            → AuthCallback (public)
```

---

## Authentication

Supabase Auth manages user sessions. The `AuthProvider` context (`src/auth/AuthProvider.tsx`) wraps the entire app and exposes `session`, `loading`, `signIn`, `signUp`, and `signOut`.

`ProtectedRoute` renders a spinner during the `loading` state and redirects to `/auth` when `session` is null, preserving the attempted path in `location.state.from` for post-login redirect.

Guest mode: Preference hooks fall back to `localStorage` when no Supabase session is active.

---

## Deployment

- **Primary hosting**: [Lovable.dev](https://lovable.dev)
- **Public site**: GitHub Pages at `https://datamilo.github.io/put-options-se/`
- **CI/CD**: GitHub Actions automatically builds and deploys to the `gh-pages` branch on every push to `main`
- **Data files**: CSV files are loaded at runtime from `https://raw.githubusercontent.com/datamilo/put-options-se/main/data/` with cache-busting query strings and a local fallback

### Build Command

```bash
npm run build         # vite build --mode production
npm run deploy        # gh-pages -d dist (manual deploy)
```

Sourcemaps are disabled in production mode. The `dist/` folder is what gets published to the `gh-pages` branch.
