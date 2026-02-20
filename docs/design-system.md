# Design System

## Design Tokens

All colors are defined as HSL CSS custom properties in `src/index.css`. Use tokens, never hard-coded hex or RGB values in components.

### Light Theme

```css
--background: 0 0% 99%;
--foreground: 215 25% 15%;

--card: 0 0% 100%;
--card-foreground: 215 25% 15%;

--primary: 210 45% 25%;          /* Deep blue-gray */
--primary-foreground: 210 40% 98%;

--secondary: 25 45% 45%;          /* Copper/bronze */
--secondary-foreground: 215 25% 15%;

--muted: 210 40% 96.1%;
--muted-foreground: 215 16% 35%;

--accent: 25 45% 45%;             /* Copper/bronze */
--accent-foreground: 0 0% 100%;

--destructive: 355 75% 45%;       /* Deep red */
--destructive-foreground: 210 40% 98%;

--border: 210 40% 85%;
--input: 210 40% 85%;
--ring: 210 45% 25%;

--radius: 0.5rem;
```

### Dark Theme

```css
--background: 215 28% 8%;
--foreground: 210 40% 98%;

--primary: 210 40% 98%;
--primary-foreground: 210 45% 25%;

--muted: 217.2 32.6% 17.5%;
--muted-foreground: 215 20% 65%;  /* Lightness ≥65% required for WCAG AA */

--border: 215 25% 25%;
--ring: 210 40% 60%;
```

### Financial Semantic Colors

```css
/* Market direction */
--bull: 145 60% 40%;              /* Green — gains */
--bear: 355 75% 45%;              /* Red — losses */
--neutral: 215 15% 55%;           /* Gray — neutral */

/* Risk levels */
--high-risk: 20 90% 48%;          /* Orange-red */
--low-risk: 188 85% 40%;          /* Teal */

/* Status */
--success: 145 60% 40%;
--warning: 35 90% 50%;
--info: 200 95% 45%;
```

### Chart Colors

```css
--chart-1: 200 95% 45%;           /* Blue */
--chart-2: 145 60% 40%;           /* Green */
--chart-3: 262 80% 60%;           /* Purple */
--chart-4: 330 80% 55%;           /* Pink */
--chart-5: 35 90% 50%;            /* Amber */
--chart-6: 250 75% 60%;           /* Indigo */
```

---

## Probability Method Colors

These colors are used consistently across all probability charts:

| Method | Color |
|--------|-------|
| PoW - Weighted Average | `#3b82f6` (blue) |
| PoW - Bayesian Calibrated | `#10b981` (green) |
| PoW - Original Black-Scholes | `#f59e0b` (amber) |
| PoW - Bias Corrected | `#ef4444` (red) |
| PoW - Historical IV | `#8b5cf6` (purple) |

PoW = Probability of Worthless. The prefix is displayed in the UI but stripped internally (see `src/utils/probabilityMethods.ts`).

---

## Typography

```css
body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.font-mono, [data-numeric="true"] {
  font-family: 'IBM Plex Mono', 'Courier New', monospace;
}

.font-sans-alt {
  font-family: 'IBM Plex Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
```

Numeric data in table cells uses monospace font. The `numeric` prop on `TableHead` and `TableCell` applies `font-mono` and `tabular-nums` automatically.

---

## Tailwind Configuration

Custom container max-width is set at the `2xl` breakpoint (1400px). Standard Tailwind breakpoints are used otherwise: `sm` (640px), `md` (768px), `lg` (1024px), `xl` (1280px).

---

## Component Hierarchy

### Button Variants

| Variant | Use case |
|---------|---------|
| `default` | Primary action, active state |
| `ghost` | Navigation buttons, sort buttons |
| `outline` | Secondary filter actions |
| `destructive` | Delete / remove actions |

Minimum interactive height: `h-9` (36px) for touch targets. Icon-only buttons use `size="icon"` which renders at `h-10 w-10`.

### Table Cell Alignment

- Text / identifier columns: left-aligned
- Numeric columns: right-aligned, monospace, `tabular-nums`
- Use the `numeric` prop on `TableHead` and `TableCell` to apply both alignment and font simultaneously

### Dark Mode

Dark mode is toggled via the `ThemeProvider` (next-themes) with `attribute="class"`. The `.dark` class on the `<html>` element activates the dark theme CSS variables. The default theme is `"light"`.

---

## Loading States

The standard loading indicator used across the application:

```tsx
<div className="flex items-center justify-center min-h-[60vh]">
  <div className="flex flex-col items-center gap-3">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    <p className="text-sm text-muted-foreground">Loading...</p>
  </div>
</div>
```

Used in: `ProtectedRoute` (auth check), `PageLoader` Suspense fallback (lazy page load).

---

## Accessibility Standards

Target: WCAG 2.1 AA.

- Focus styles: `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` on all interactive elements (provided by shadcn/ui components)
- Skip-to-content link: visible on keyboard focus, links to `#main-content`
- Screen-reader-only text: use `sr-only` class for button labels and separators
- Color contrast: `--muted-foreground` in dark mode is set to ≥65% lightness to maintain contrast ratios above 4.5:1 against the dark background
- Do not use opacity modifiers (`opacity-50`, `opacity-70`) on text elements — this reduces contrast below threshold
