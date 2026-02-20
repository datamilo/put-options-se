# Navigation

## Desktop Navigation (≥768px)

A horizontal navigation bar rendered by `HorizontalNavigation` (`src/components/HorizontalNavigation.tsx`) sits inside `AppHeader` in `App.tsx`. It is hidden below the `md` breakpoint.

The bar contains:
- A home button (house icon, links to `/`)
- Dropdown menu groups for categorised pages
- Standalone page buttons
- Utility controls (Settings, Theme toggle, Sign Out)

### Dropdown Groups

| Group label | Pages |
|-------------|-------|
| **Support Levels** | Support Level Analysis (`/consecutive-breaks`) |
| **Historical Performance and Volatility** | Monthly Analysis (`/monthly-analysis`), Financial Reporting Volatility (`/volatility-analysis`) |
| **Method Validation** | Probability Analysis (`/probability-analysis`), Lower Bound Analysis (`/lower-bound-analysis`) |
| **Automated Analysis** | Option Recommendations (`/recommendations`), Scored Options Recommendations (`/scored-options`), Automatic Portfolio Generator (`/portfolio-generator`), Support Level Options List (`/support-level-options`) |

### Standalone Buttons

| Button | Route |
|--------|-------|
| Stock Metrics and History | `/stock-analysis` |
| IV Analysis | `/iv-analysis` |

### Active State

- Active dropdown group: the trigger button renders with `variant="default"` (filled)
- Active standalone page button: renders with `variant="default"` (filled, bold)
- Active item inside a dropdown: shows a checkmark before the label

### Utility Controls

| Control | Behaviour |
|---------|-----------|
| Calculation Settings | Opens `SettingsModal` (main page preferences) |
| Theme Toggle | Cycles between light and dark mode via next-themes |
| Sign Out | Calls `signOut()` from `AuthProvider` |

Label visibility on desktop:
- "Calculation Settings" text: visible on `lg` and above, icon-only on `md`–`lg`
- Navigation group labels: visible on `sm` and above

---

## Mobile Navigation (<768px)

The horizontal bar is hidden on mobile. A hamburger menu button (`size="icon"`, `h-9 w-9`) appears in the header. Tapping it opens a `DropdownMenu` that mirrors the desktop structure with identical groupings.

The mobile hamburger menu contains all the same groups and pages as the desktop bar, plus the utility controls (Settings, Theme, Sign Out), all within a single vertical dropdown.

---

## Navigation Implementation Details

- Navigation uses React Router `<Link>` components inside `Button asChild` for routing without page reloads
- `isActive(path)` compares `location.pathname` for standalone buttons
- `isGroupActive(paths[])` checks if any page in a group is the current route, to highlight the dropdown trigger
- The `NavDropdown` and `NavButton` components are defined as inner functions inside `HorizontalNavigation` and close over `location` and `isActive`/`isGroupActive`

---

## Page Title

Every page calls `usePageTitle(title)` (`src/hooks/usePageTitle.ts`) on mount, which sets `document.title` to `"${title} | Put Options SE"`.

---

## 404 Handling

Unmatched routes render `NotFound.tsx`, which provides links back to `/` and `/auth`. The GitHub Pages SPA redirect script in `index.html` handles direct navigation to deep links by rewriting the URL before React Router mounts.
