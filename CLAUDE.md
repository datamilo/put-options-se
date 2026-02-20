# Put Options SE — Claude Code Index

> **This file is the index and critical-rules reference.** All detailed documentation lives in `/docs`.

---

## CRITICAL WORKFLOW RULE

**MANDATORY — NO EXCEPTIONS:**

After making changes to this project:
1. **Build (conditionally)** — see When to Build below
2. `git add -A`
3. `git commit -m "descriptive message"` — see Commit Format below
4. `git push`
5. Verify push succeeded

---

## When to Build

**SKIP BUILD for:** chart config, UI styling (CSS/Tailwind), JSX layout/reordering, docs, comments, .gitignore, Plotly/Recharts prop tweaks.

**BUILD ONLY for:** new .tsx/.ts files, business logic, hook logic changes (useEffect/useMemo/useCallback), context/state changes, TypeScript interfaces affecting compiled code, new npm packages, CSV parsing changes.

**Rule of thumb:** Changed only JSX layout, chart props, tooltip content, or visual styling? → Skip build.

---

## Git Commit Format

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

**Git Safety:** NEVER update git config, force push, hard reset, or skip hooks (--no-verify).

---

## Critical Content Rules

**Audience:** Senior professional investors. Deep knowledge assumed. No explanatory tooltips, educational disclaimers, or hand-holding language.

**Content:** Present data and facts only. No investment suggestions, recommendations, or "should" statements. No "Strategy:", "Recommendation:", "Rationale:" framing.

**Currency:** SEK/kr only. Never USD ($).

**Numbers:** Nordic formatting always — space thousands separator, comma decimal. Use `src/utils/numberFormatting.ts`. See [docs/development.md](docs/development.md).

**Explanation principle:** Explain what IS. Never explain what WAS or what COULD BE. No comparative language ("rather than", "instead of", "unlike the old").

---

## Documentation Standard

**Document the current working state only.** No historical context, fixed bugs, or abandoned approaches. See [docs/documentation-standards.md](docs/documentation-standards.md).

---

## Project Overview

Put Options SE is a financial analysis web application for put options trading on Swedish stocks. It provides tools for analyzing put options data, calculating potential returns, and visualizing market trends.

**Tech Stack:** React 18, TypeScript, Vite 5, Tailwind CSS, shadcn/ui, Recharts + Plotly, TanStack Query, Supabase, React Router 6. See [docs/architecture.md](docs/architecture.md).

---

## Pages

| Page | Route | Documentation |
|------|-------|---------------|
| Options Dashboard | `/` | [docs/index-page.md](docs/index-page.md) |
| Portfolio Generator | `/portfolio-generator` | [docs/portfolio-generator.md](docs/portfolio-generator.md) |
| Monthly Analysis | `/monthly-analysis` | [docs/monthly-analysis.md](docs/monthly-analysis.md) |
| Stock Metrics and History | `/stock-analysis`, `/stock/:stockName` | [docs/stock-analysis.md](docs/stock-analysis.md) |
| Support Level Analysis | `/consecutive-breaks` | [docs/support-level-analysis.md](docs/support-level-analysis.md) |
| Support Level Options List | `/support-level-options` | [docs/support-level-options.md](docs/support-level-options.md) |
| Probability Analysis | `/probability-analysis` | [docs/probability-analysis.md](docs/probability-analysis.md) |
| Lower Bound Analysis | `/lower-bound-analysis` | [docs/lower-bound-analysis.md](docs/lower-bound-analysis.md) |
| Financial Reporting Volatility | `/volatility-analysis` | [docs/volatility-analysis.md](docs/volatility-analysis.md) |
| Option Recommendations | `/recommendations` | [docs/recommendations.md](docs/recommendations.md) |
| Scored Options Recommendations | `/scored-options` | [docs/scored-options.md](docs/scored-options.md) |
| IV Analysis | `/iv-analysis` | [docs/iv-analysis.md](docs/iv-analysis.md) |

---

## Technical Documentation

| Topic | File | Contents |
|-------|------|----------|
| Architecture | [docs/architecture.md](docs/architecture.md) | Tech stack, build system, lazy loading, routing, auth, deployment |
| Development Patterns | [docs/development.md](docs/development.md) | Data fetching, chart patterns, Nordic formatting, settings, accessibility, tone |
| Design System | [docs/design-system.md](docs/design-system.md) | CSS tokens, typography, component hierarchy, loading states |
| Navigation | [docs/navigation.md](docs/navigation.md) | Desktop/mobile nav structure, dropdown groups, implementation |
| Data Reference | [docs/data.md](docs/data.md) | CSV files, timestamps, margin requirements, probability methods, IV data |
| Documentation Standards | [docs/documentation-standards.md](docs/documentation-standards.md) | What to document and how |
| Analytics | [docs/analytics.md](docs/analytics.md) | Usage tracking system |
| Field Guide | [docs/FIELD_GUIDE.md](docs/FIELD_GUIDE.md) | All 67 fields in data.csv for investors |
| Probability Field Names | [docs/PROBABILITY_FIELD_NAMES.md](docs/PROBABILITY_FIELD_NAMES.md) | Probability field alignment across pages |
| Portfolio Generator Script | [docs/README_Portfolio_Generator.md](docs/README_Portfolio_Generator.md) | Python script documentation |

---

## Help & Feedback

- `/help` — Get help with Claude Code
- Report issues: https://github.com/anthropics/claude-code/issues
