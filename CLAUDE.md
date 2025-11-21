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
| Monthly Analysis | `/monthly-analysis` | [docs/monthly-analysis.md](docs/monthly-analysis.md) | Historical performance and seasonality |
| Stock Analysis | `/stock-analysis`, `/stock/:stockName` | [docs/stock-analysis.md](docs/stock-analysis.md) | Individual stock performance metrics |
| Support Level Analysis | `/consecutive-breaks` | [docs/support-level-analysis.md](docs/support-level-analysis.md) | Rolling low and support break detection |
| Probability Analysis | `/probability-analysis` | [docs/probability-analysis.md](docs/probability-analysis.md) | Probability method validation and recovery |
| Lower Bound Analysis | `/lower-bound-analysis` | [docs/lower-bound-analysis.md](docs/lower-bound-analysis.md) | IV-based prediction validation |
| Volatility Analysis | `/volatility-analysis` | [docs/volatility-analysis.md](docs/volatility-analysis.md) | Financial reporting volatility |

### Additional Documentation
- [docs/FIELD_GUIDE.md](docs/FIELD_GUIDE.md) - Business-focused explanation of all 67 fields in data.csv for investors
- [docs/README_Portfolio_Generator.md](docs/README_Portfolio_Generator.md) - Python script documentation for portfolio generation

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

### Data Files
- `stock_data.csv` - OHLC format stock data
- `data.csv` - Options data
- `recovery_report_data.csv` - Probability recovery analysis
- `validation_report_data.csv` - Probability validation
- `hit_rate_trends_by_stock.csv` - Lower bound monthly trends (1,071 rows)
- `all_stocks_daily_predictions.csv` - Lower bound daily predictions (115,000+ rows, includes future expirations)
- `all_stocks_expiry_stats.csv` - Lower bound expiry statistics (2,681 rows, includes future expirations)

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
- Use `useEnrichedOptionsData` for options table data (already includes recalculations)
- **OHLC Data**: Use `low` field for period lows, `high`/`low` for ranges (not close prices)
- **Stock Period Changes**: Calculate using previous period's closing price as baseline

### Chart Patterns
- **Plotly**: Use for financial charts (candlesticks, violins) - native support not in Recharts
- **Hover Date Format**: Always use `%{x|%Y-%m-%d}` in Plotly hovertemplates
- **Violin Plots**: Use `hovertemplate` with single entry to avoid duplicate statistical breakdowns

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
**Run `npm run build`:**
- React components, hooks, or logic changes
- TypeScript/JavaScript modifications
- Styling changes (CSS/Tailwind)
- Data processing or calculation changes

**Skip build for:**
- Documentation or markdown files
- Comments-only edits
- Small Plotly/chart configuration tweaks
- Configuration files like .gitignore

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
