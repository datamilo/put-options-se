# Put Options SE - Project Summary for Claude Code

> **This file (CLAUDE.md) is the main index.** For complete page documentation, implementation details, and technical specifications, see the `/docs` folder.

---

## CRITICAL WORKFLOW RULE

**MANDATORY GIT WORKFLOW - NO EXCEPTIONS:**

After making changes to this project, you MUST immediately:
1. **Build (conditionally)** - Only required for substantive changes (not docs, comments, config)
2. Run `git add -A` to stage all changes
3. Run `git commit -m "descriptive message"` with proper format (see Git Workflow section)
4. Run `git push` to sync with GitHub
5. Verify the push succeeded

**This is not optional. Every code change MUST be immediately committed and pushed to GitHub.**

---

## Project Overview

Put Options SE is a financial analysis web application for put options trading and stock market analysis. It provides tools for analyzing put options data, calculating potential returns, and visualizing market trends.

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Data Visualization**: Recharts, Plotly (for financial charts)
- **Backend & Data**: Supabase (auth/preferences), CSV data files
- **State Management**: TanStack Query, React Context

---

## Page Documentation

Detailed documentation for each page is in the `/docs` folder:

| Page | Route | Documentation | Description |
|------|-------|---------------|-------------|
| Options Dashboard | `/` | [docs/index-page.md](docs/index-page.md) | Main options analysis with filterable table |
| Portfolio Generator | `/portfolio-generator` | [docs/portfolio-generator.md](docs/portfolio-generator.md) | Portfolio optimization tools |
| Monthly Analysis | `/monthly-analysis` | [docs/monthly-analysis.md](docs/monthly-analysis.md) | Historical performance, seasonality, and day-of-month timing patterns |
| Stock Metrics and History | `/stock-analysis`, `/stock/:stockName` | [docs/stock-analysis.md](docs/stock-analysis.md) | Individual stock performance metrics |
| Support Level Analysis | `/consecutive-breaks` | [docs/support-level-analysis.md](docs/support-level-analysis.md) | Rolling low and support level breaks |
| Support Level Options List | `/support-level-options` | [docs/support-level-options.md](docs/support-level-options.md) | Filter options by support levels |
| Probability Analysis | `/probability-analysis` | [docs/probability-analysis.md](docs/probability-analysis.md) | Probability method validation and recovery |
| Lower Bound Analysis | `/lower-bound-analysis` | [docs/lower-bound-analysis.md](docs/lower-bound-analysis.md) | IV-based prediction validation |
| Financial Reporting Volatility | `/volatility-analysis` | [docs/volatility-analysis.md](docs/volatility-analysis.md) | Earnings and event volatility analysis |
| Option Recommendations | `/recommendations` | [docs/recommendations.md](docs/recommendations.md) | Automated put option recommendations with weighted scoring |
| Scored Options Recommendations | `/scored-options` | [docs/scored-options.md](docs/scored-options.md) | Dual-model analysis combining V2.1 probability and technical analysis scores |

## Analytics & User Tracking

**System Architecture**: [docs/analytics.md](docs/analytics.md)

The application includes a comprehensive usage analytics system that tracks authenticated user behavior with minimal storage impact (~1 MB/month for handful of users). Features include:

- **Automatic page view tracking** across all routes
- **Session management** with duration and activity tracking
- **Manual event tracking** for filters, exports, and settings changes
- **Row-level security** ensuring users only see their own data
- **Efficient storage** using event batching and 90-day retention policy

All analytics data is stored in Supabase with automatic cleanup and indexing for performance.

### Navigation Structure

**Desktop Horizontal Navigation:**

Pages are organized into logical groups based on their purpose and data flow:

- **Dropdown Categories**:
  - **Support Levels**: Support Level Analysis
    - Analyzes rolling low support levels and identifies break patterns
  - **Historical Performance and Volatility**: Monthly Analysis, Financial Reporting Volatility
    - Historical analysis pages examining seasonality and event-driven volatility
  - **Method Validation**: Probability Analysis, Lower Bound Analysis
    - Validation pages that test prediction method accuracy
  - **Automated Analysis**: Option Recommendations, Scored Options Recommendations, Automatic Portfolio Generator, Support Level Options List
    - Automated list generation pages that combine multiple analyses into filtered recommendations based on user preferences and settings
- **Standalone Buttons**: Stock Metrics and History
  - Deep-dive analysis of individual stocks
- **Utilities**: Calculation Settings, Theme Toggle, Sign Out

**Mobile Navigation:** Hamburger menu with identical grouping structure

**Navigation Details:**
- All pages accessible via horizontal navigation bar (desktop) or expandable hamburger menu (mobile)
- Active page highlighted with checkmark in dropdown and bold button appearance
- "Automated Analysis" group consolidates pages that automatically generate filtered lists based on user-configured weights and thresholds (Option Recommendations uses weighted scoring, Portfolio Generator uses custom rules, Support Level Options List uses support level filters)

### Additional Documentation
- [docs/analytics.md](docs/analytics.md) - Usage analytics system for tracking authenticated users
- [docs/FIELD_GUIDE.md](docs/FIELD_GUIDE.md) - Business-focused explanation of all 67 fields in data.csv for investors
- [docs/README_Portfolio_Generator.md](docs/README_Portfolio_Generator.md) - Python script documentation for portfolio generation
- [docs/PROBABILITY_FIELD_NAMES.md](docs/PROBABILITY_FIELD_NAMES.md) - Probability field name alignment and standardization across all pages

---

## Project Structure

### Key Directories
- `/src/hooks` - Custom React hooks for data fetching and calculations
- `/src/components` - Reusable UI components organized by feature
- `/src/pages` - Route components
- `/src/types` - TypeScript interfaces
- `/src/contexts` - React context providers
- `/data` - Static CSV data files (source of truth)
- `/docs` - Detailed page documentation
- `/supabase/migrations` - Database schema migrations

### Analytics System Files
- **Hook**: `/src/hooks/useAnalytics.ts` - Core analytics tracking with batching and session management
- **Provider**: `/src/components/AnalyticsProvider.tsx` - Router-level page view tracking
- **Types**: `/src/types/analytics.ts` - TypeScript interfaces for analytics events
- **Migration**: `/supabase/migrations/20260101000000_create_analytics_tables.sql` - Database schema and RLS policies
- **Documentation**: `/docs/analytics.md` - Complete analytics system reference

### Data Files

**Primary Data Files**:
- `stock_data.csv` - OHLC format stock data
- `data.csv` - Options data (67+ fields)
- `recovery_report_data.csv` - Probability recovery analysis (normalized method names as of Jan 2026)
- `validation_report_data.csv` - Probability validation (normalized method names as of Jan 2026)
- `hit_rate_trends_by_stock.csv` - Lower bound monthly trends (1,071 rows)
- `all_stocks_daily_predictions.csv` - Lower bound daily predictions (115,000+ rows, includes future expirations)
- `all_stocks_expiry_stats.csv` - Lower bound expiry statistics (2,681 rows, includes future expirations)

**CSV Format (January 2026 Onwards)**:
- `recovery_report_data.csv` and `validation_report_data.csv` use normalized method names in `ProbMethod` column
- Format: `"Weighted Average"` (without "PoW - " prefix)
- Application includes automatic normalization layer in `src/utils/probabilityMethods.ts`
- See [docs/PROBABILITY_FIELD_NAMES.md](docs/PROBABILITY_FIELD_NAMES.md) for implementation details

**Margin & Capital Analysis**:
- `margin_requirements.csv` - Estimated margin requirements with SRI methodology (13 fields)

**Additional Data Files**:
- `probability_history.csv` - Historical probability data for ProbabilityHistoryChart component
- `IV_PotentialDecline.csv` - Implied volatility-based decline predictions
- `Stock_Events_Volatility_Data.csv` - Earnings and financial event volatility data
- `Stocks_Monthly_Data.csv` - Monthly aggregated stock performance data

### Data Timestamps

**Timestamp File**: `last_updated.json` - Tracks when data and analysis were last updated

**Three Timestamp Fields**:
- `optionsData.lastUpdated` - When put options price data was downloaded
- `stockData.lastUpdated` - When stock price data was downloaded
- `analysisCompleted.lastUpdated` - When calculations and analysis were completed

**Implementation**:
- **Hook**: `useTimestamps` (src/hooks/useTimestamps.ts) - Loads timestamp data with fallback URLs and cache busting
- **Component**: `DataTimestamp` (src/components/ui/data-timestamp.tsx) - Displays formatted timestamps with clock icon
- **Format**: Timestamps stored as `YYYY-MM-DD HH:mm:ss`, displayed as `YYYY-MM-DD HH:mm`

**Pages Displaying Timestamps**:
- **Index Page** (/) - Shows all three timestamps (options data, stock data, analysis updated)
- **Stock Details Page** (/stock/:stockName) - Shows stock data and analysis updated timestamps
- **Probability Analysis Page** (/probability-analysis) - Shows options data and analysis updated timestamps

### Margin Requirements System

**Purpose**: Provides estimated margin requirements based on Synthetic Risk Interval (SRI) methodology

**Critical**: All margin fields are ESTIMATES using conservative SRI-based calculations. These are NOT exact Nasdaq Stockholm margin requirements.

**Implementation**:
- **Hook**: `useMarginRequirementsData` (src/hooks/useMarginRequirementsData.ts) - Loads margin_requirements.csv with singleton pattern
- **Data Integration**: LEFT JOIN with options data in `useEnrichedOptionsData` hook
- **Calculated Field**: `EstTotalMargin` = `Est_Margin_SEK` × `NumberOfContractsBasedOnLimit`
- **Default Display**: "Est. Total Margin" column visible by default in main and portfolio tables
- **Optional Fields**: 13 margin fields available via column manager

**The 13 Margin Fields**:
1. `EstTotalMargin` (calculated) - Total margin for full position
2. `Est_Margin_SEK` - Margin per single contract
3. `Final_SRI` - Final Safety-Risk Index
4. `Annualized_ROM_Pct` - Return on margin percentage (annualized)
5. `Net_Premium_After_Costs` - Premium minus transaction costs
6. `SRI_Base` - Base Safety-Risk Index before adjustments
7. `Event_Buffer` - Additional margin for earnings/dividend events
8. `OTM_Amount` - Out-of-the-money distance in SEK
9. `Margin_A_Broker_Proxy` - Broker-style calculation approach
10. `Margin_B_Historical_Floor` - Historical stress test approach
11. `Margin_Floor_15pct` - Swedish regulatory 15% minimum
12. `Prob_Normal_2SD_Decline_Pct` - Statistical 2SD decline probability
13. `Hist_Worst_Decline_Pct` - Historical worst decline percentage

**Number Formatting**:
- Margin amounts (SEK): Display without decimals (e.g., "12,345 SEK")
- Risk indices and percentages: Display as percentage with 2 decimals (e.g., "25.50%")
- Missing data: Display as "-"

**Field Documentation**: All margin fields documented in `fieldInfo.ts` with disclaimers that these are estimates, not exact institutional requirements

---

## Settings Architecture

### Two Independent Settings Systems
1. **Main Page Settings** - `useMainPagePreferences` hook, stored in `user_preferences` table
2. **Portfolio Generator Settings** - `usePortfolioGeneratorPreferences` hook, stored in `portfolio_preferences` table

Both use localStorage fallback for guest users.

---

## Authentication

- **Supabase Auth** for user management
- **Protected Routes** for authenticated features
- **Guest Mode** with localStorage persistence
- **Row Level Security** for user data isolation

---

## Important Development Patterns

### Data Patterns
- Use `useEnrichedOptionsData` for options table data (already includes recalculations, margin data, and IV data)
- **Margin Data**: Automatically enriched via LEFT JOIN in `useEnrichedOptionsData`; use `EstTotalMargin` for total margin requirement (calculated field)
- **OHLC Data**: Use `low` field for period lows, `high`/`low` for ranges (not close prices)
- **Stock Period Changes**: Calculate using previous period's closing price as baseline
- **Missing Margin Data**: Fields gracefully show "-" if margin data not available for an option (LEFT JOIN behavior)
- **Probability Method Names**: Use normalization utility `normalizeProbMethod()` from `src/utils/probabilityMethods.ts` when processing CSV data containing probability methods
  - Automatically converts old "PoW - Method Name" format to new "Method Name" format
  - Ensures compatibility with both old and new CSV formats
  - Use `getDisplayProbMethod()` for UI display to add "PoW - " prefix for users

### Chart Patterns
- **Plotly**: Use for financial charts (candlesticks, violins) - native support not in Recharts
- **Hover Date Format**: Always use `%{x|%Y-%m-%d}` in Plotly hovertemplates
- **Violin Plots**: Use `hovertemplate` with single entry to avoid duplicate statistical breakdowns

### Number Formatting Patterns (CRITICAL - Nordic/European Standard)

**IMPORTANT**: This is a Nordic application. ALL numbers must use Nordic/European formatting:
- **Thousand separator**: Space (not comma) - e.g., "1 234 567"
- **Decimal separator**: Comma (not dot) - e.g., "87,66"

**Never use American formatting** (commas for thousands, dots for decimals) in the UI.

**How to Format Numbers**:
- Use utilities from `src/utils/numberFormatting.ts`:
  - `formatNordicNumber(value, decimals)` - General numbers: `1 234 567,89`
  - `formatNordicDecimal(value, decimals)` - Decimals: `87,66`
  - `formatNordicPercentage(value, decimals)` - Percentages: `87,66%`
  - `formatNordicPercentagePoints(value, decimals)` - Percentage points: `+24,55 pp`
  - `formatNordicCurrency(value, decimals)` - SEK currency: `1 234 567 kr`

**Examples**:
```javascript
// ❌ WRONG - American formatting
"87.66% worthless"
"1,336,736 options"
"+24.55 pp advantage"

// ✅ CORRECT - Nordic formatting
formatNordicDecimal(87.66, 2) + "% worthless" → "87,66% worthless"
formatNordicNumber(1336736) → "1 336 736"
formatNordicPercentagePoints(24.55, 2) → "+24,55 pp"
```

**Where to Apply**:
- All numeric displays in components and pages
- KPI cards, charts, tables, lists
- Any calculated values shown to users
- Statistics, metrics, percentages, currency

**Note**: Do NOT apply Nordic formatting to:
- Data in CSV files or APIs (use standard formats there)
- Internal calculations or TypeScript numbers
- Only format when displaying to users in the UI

### Settings Patterns
- Never mix Main Page and Portfolio Generator settings
- Use `hasLoadedFromSupabase` flag to prevent continuous reloading in preference hooks

---

## Git & GitHub Workflow

### Commit Format
```bash
git commit -m "$(cat <<'EOF'
Brief summary of changes

- Detailed bullet points
- Include file paths and component names

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

### When to Build

**⚠️ CRITICAL: Only build when LOGIC or STRUCTURE changes - NOT for UI tweaks!**

**SKIP BUILD (most common) - DO NOT BUILD for:**
- **Chart configuration**: Tooltip changes, legend adjustments, color changes, axis labels
- **Component reordering**: Moving filters/dropdowns around, changing grid order
- **UI styling**: CSS/Tailwind class changes, spacing, colors, fonts
- **Documentation**: Markdown files, comments, README updates
- **Configuration**: .gitignore, package.json metadata (not dependencies)
- **Plotly/Recharts tweaks**: Hover templates, chart margins, legend positioning
- **Layout changes**: Reordering JSX elements without logic changes

**RUN BUILD ONLY for:**
- **New React components or hooks** - Creating new .tsx/.ts files
- **Business logic changes** - Calculations, data processing, filtering algorithms
- **Hook modifications** - Changes to useEffect, useMemo, useCallback logic
- **State management** - Context providers, state logic changes
- **Type changes** - TypeScript interfaces that affect compiled code
- **Dependency additions** - New npm packages installed
- **Data fetching logic** - API calls, CSV parsing changes

**When in doubt:** If you only changed JSX layout, chart props, tooltip content, filter order, or visual styling → SKIP BUILD

### Git Safety
- NEVER update git config
- NEVER run destructive commands (push --force, hard reset)
- NEVER skip hooks (--no-verify)
- Before amending: Check authorship with `git log -1 --format='%an %ae'`

---

## Documentation Standards

**Document ONLY the current, working state:**
- ✓ How the application currently works
- ✓ Current implementation details and design decisions
- ✓ Business rationale for current design
- ✓ File references with line numbers

**Do NOT document:**
- ✗ Previous versions or past implementations
- ✗ Fixed bugs or troubleshooting history
- ✗ Abandoned approaches or discarded ideas

---

## Deployment

- **Primary**: Lovable.dev hosting
- **GitHub Pages**: Alternative deployment with basename handling
- **Data Loading**: CSV files loaded from GitHub's `/data/` folder via raw.githubusercontent.com

---

## Help & Feedback

- `/help`: Get help with using Claude Code
- Report issues: https://github.com/anthropics/claude-code/issues
