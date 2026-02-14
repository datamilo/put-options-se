# Upcoming Events Display Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Display upcoming earnings reports and dividend ex-dates at the top of the Stock Metrics and History page, showing the next event for each viewed stock.

**Architecture:** Create a new hook to load the `upcoming_events.csv` file, add types for event data, build a component to display the event prominently, and integrate it into the stock details page above the metrics.

**Tech Stack:** React, TypeScript, Papa Parse (CSV), shadcn/ui Cards & Badges, Lucide icons

---

## Task 1: Add Event Type Definition

**Files:**
- Modify: `src/types/stock.ts` (add new interface at end)

**Step 1: Read the current stock types file**

Read: `src/types/stock.ts`

**Step 2: Add the UpcomingEvent interface**

Add to the end of `src/types/stock.ts`:

```typescript
export interface UpcomingEvent {
  date: string; // YYYY-MM-DD format
  stock_name: string;
  event_type: string; // "Earnings Report" or "Ex-Date"
  event_category: string; // "Earnings-FY", "Earnings-Q1", "Dividend", etc.
  days_until_event: number;
  is_earnings: boolean;
  details: string; // Description of event
}
```

**Step 3: Commit**

```bash
git add src/types/stock.ts
git commit -m "$(cat <<'EOF'
feat: add UpcomingEvent type definition

- Add UpcomingEvent interface for upcoming_events.csv data
- Fields: date, stock_name, event_type, event_category, days_until_event, is_earnings, details

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Create useUpcomingEvents Hook

**Files:**
- Create: `src/hooks/useUpcomingEvents.ts`

**Step 1: Create the new hook file**

Create `src/hooks/useUpcomingEvents.ts` with:

```typescript
import { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { UpcomingEvent } from '@/types/stock';

let cachedEvents: UpcomingEvent[] | null = null;

export const useUpcomingEvents = () => {
  const [allEvents, setAllEvents] = useState<UpcomingEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUpcomingEvents();
  }, []);

  const loadUpcomingEvents = async () => {
    try {
      // Return cached data if available
      if (cachedEvents) {
        setAllEvents(cachedEvents);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      const urls = [
        `https://raw.githubusercontent.com/datamilo/put-options-se/main/data/upcoming_events.csv?${Date.now()}`,
        `${window.location.origin}${import.meta.env.BASE_URL}data/upcoming_events.csv?${Date.now()}`
      ];

      let lastError: Error | null = null;
      let response: Response | null = null;

      for (const url of urls) {
        try {
          console.log('🔗 Trying upcoming events URL:', url);
          response = await fetch(url);
          if (response.ok) {
            console.log('✅ Successfully loaded upcoming events from:', url);
            break;
          }
        } catch (error) {
          console.warn('❌ Failed to load from:', url, error);
          lastError = error as Error;
        }
      }

      if (!response || !response.ok) {
        throw lastError || new Error('Failed to load upcoming events from any URL');
      }

      const csvText = await response.text();

      Papa.parse(csvText, {
        header: true,
        delimiter: '|',
        skipEmptyLines: true,
        complete: (results) => {
          const events = (results.data as unknown[]).map((row: unknown) => {
            const eventRow = row as Record<string, unknown>;
            return {
              date: String(eventRow.date || ''),
              stock_name: String(eventRow.stock_name || ''),
              event_type: String(eventRow.event_type || ''),
              event_category: String(eventRow.event_category || ''),
              days_until_event: parseInt(String(eventRow.days_until_event || '0'), 10),
              is_earnings: String(eventRow.is_earnings || 'False').toLowerCase() === 'true',
              details: String(eventRow.details || '')
            } as UpcomingEvent;
          });
          cachedEvents = events;
          setAllEvents(events);
        },
        error: (error) => {
          console.error('Error parsing upcoming events CSV:', error);
          setError('Failed to parse upcoming events data');
        }
      });
    } catch (err) {
      console.error('Error loading upcoming events:', err);
      setError('Failed to load upcoming events');
    } finally {
      setIsLoading(false);
    }
  };

  const getEventForStock = (stockName: string): UpcomingEvent | null => {
    // Find first event for this stock (sorted by date in CSV)
    return allEvents.find(event => event.stock_name === stockName) || null;
  };

  return {
    allEvents,
    isLoading,
    error,
    getEventForStock
  };
};
```

**Step 2: Commit**

```bash
git add src/hooks/useUpcomingEvents.ts
git commit -m "$(cat <<'EOF'
feat: create useUpcomingEvents hook

- Load upcoming_events.csv with fallback URLs
- Implement singleton caching for performance
- Provide getEventForStock() method to find next event for a stock
- Return loading state and error handling

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Create UpcomingEventCard Component

**Files:**
- Create: `src/components/stock/UpcomingEventCard.tsx`

**Step 1: Create the component file**

Create `src/components/stock/UpcomingEventCard.tsx` with:

```typescript
import { UpcomingEvent } from '@/types/stock';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, TrendingUp, Gift } from 'lucide-react';
import { formatNordicNumber } from '@/utils/numberFormatting';

interface UpcomingEventCardProps {
  event: UpcomingEvent | null;
  stockName: string;
}

export const UpcomingEventCard = ({ event, stockName }: UpcomingEventCardProps) => {
  if (!event) {
    return null; // Don't display card if no event found
  }

  const isEarnings = event.is_earnings;
  const daysUntil = event.days_until_event;

  // Determine color and icon based on event type
  const isUrgent = daysUntil <= 7;
  const eventIcon = isEarnings ? <TrendingUp className="h-5 w-5" /> : <Gift className="h-5 w-5" />;
  const badgeVariant = isUrgent ? 'destructive' : 'default';

  return (
    <Card className={isUrgent ? 'border-orange-300 bg-orange-50 dark:bg-orange-950 dark:border-orange-700' : ''}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <span>Upcoming Event</span>
          </div>
          <Badge variant={badgeVariant}>
            {daysUntil} day{daysUntil === 1 ? '' : 's'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Event Date</p>
            <p className="text-lg font-semibold">{event.date}</p>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Event Type</p>
            <div className="flex items-center gap-2">
              {eventIcon}
              <span className="font-semibold">{event.event_type}</span>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Category</p>
            <p className="font-semibold">{event.event_category}</p>
          </div>
        </div>

        <div className="pt-2 border-t">
          <p className="text-sm text-muted-foreground">Details</p>
          <p className="text-base">{event.details}</p>
        </div>
      </CardContent>
    </Card>
  );
};
```

**Step 2: Commit**

```bash
git add src/components/stock/UpcomingEventCard.tsx
git commit -m "$(cat <<'EOF'
feat: create UpcomingEventCard component

- Display upcoming event with date, type, category, and details
- Highlight urgent events (within 7 days) with orange styling
- Show days until event in badge
- Use consistent icon styling for earnings vs dividends

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Integrate UpcomingEventCard into StockDetailsPage

**Files:**
- Modify: `src/pages/StockDetailsPage.tsx` (lines 1-20 for imports, line 275 for component placement)

**Step 1: Add imports**

Update the imports section at top of `src/pages/StockDetailsPage.tsx` to include:

```typescript
import { useUpcomingEvents } from '@/hooks/useUpcomingEvents';
import { UpcomingEventCard } from '@/components/stock/UpcomingEventCard';
```

So the full imports look like:

```typescript
import { useParams, useNavigate } from "react-router-dom";
import { useStockData } from "@/hooks/useStockData";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useTimestamps } from "@/hooks/useTimestamps";
import { useUpcomingEvents } from "@/hooks/useUpcomingEvents";
import { StockDetails } from "@/components/stock/StockDetails";
import { UpcomingEventCard } from "@/components/stock/UpcomingEventCard";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { DataTimestamp } from "@/components/ui/data-timestamp";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Link } from "react-router-dom";
```

**Step 2: Add hook call in component**

Add after line 24 (after `const { timestamps } = useTimestamps();`):

```typescript
  const { getEventForStock } = useUpcomingEvents();
```

**Step 3: Get event for current stock**

Add after line 59 (after `const stockSummary = selectedStock ? getStockSummary(selectedStock) : null;`):

```typescript
  const upcomingEvent = selectedStock ? getEventForStock(selectedStock) : null;
```

**Step 4: Add UpcomingEventCard to render**

Replace line 275 with:

```typescript
      {upcomingEvent && <UpcomingEventCard event={upcomingEvent} stockName={selectedStock} />}

      <StockDetails stockData={stockData} stockSummary={stockSummary} />
```

**Step 5: Commit**

```bash
git commit -m "$(cat <<'EOF'
feat: integrate upcoming events into stock details page

- Add useUpcomingEvents hook to StockDetailsPage
- Display UpcomingEventCard above stock metrics
- Show next event for selected stock with urgency highlighting

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Build and Test

**Files:**
- No file changes - testing only

**Step 1: Build the project**

Run: `npm run build`

Expected: Successful build with no errors

**Step 2: Test upcoming events display manually**

1. Open the application in development mode: `npm run dev`
2. Navigate to "Stock Metrics and History"
3. Verify that an upcoming event card appears at the top (e.g., Sinch AB with 1 day until earnings)
4. Switch to different stocks and verify the event updates
5. Check that the card displays the correct date, type, category, and details
6. Verify urgent events (0-7 days) show orange styling

**Step 3: Test edge cases**

1. Scroll down to verify the card doesn't interfere with the stock details
2. Check mobile view to ensure responsive layout works
3. Verify that stocks without events don't show a card
4. Test that the hook caches data properly (switch stocks quickly)

**Step 4: Commit**

```bash
git commit -m "$(cat <<'EOF'
build: verify upcoming events integration works end-to-end

- Build completes successfully
- Upcoming event card displays correctly above stock metrics
- Event updates when switching stocks
- Styling matches design system
- Mobile responsive layout working

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Final Git Push

**Files:**
- No file changes - git only

**Step 1: Push all commits to GitHub**

Run: `git push origin main`

Expected: All commits pushed successfully

**Step 2: Verify push**

Run: `git status`

Expected: "Your branch is up to date with 'origin/main'"

---

## Testing Checklist

- [ ] Build completes without errors
- [ ] Upcoming event card appears at top of Stock Details page
- [ ] Event details display correctly (date, type, category, description)
- [ ] Urgent events (≤7 days) show orange styling
- [ ] Non-urgent events show default styling
- [ ] Event updates when selecting different stocks
- [ ] Card hidden for stocks with no upcoming events
- [ ] Mobile responsive layout works
- [ ] No console errors
- [ ] All commits pushed to GitHub

---

## Rollback Plan

If issues occur during implementation:

1. Identify which task caused the issue
2. Run `git reset --soft HEAD~1` to undo the last commit while keeping changes
3. Fix the code
4. Create a new commit with corrected changes
5. Push to main

---

## Success Criteria

✅ Upcoming event card displays above stock metrics
✅ Event data loads from CSV and caches properly
✅ Card shows date, type, category, and details
✅ Urgent events (≤7 days) highlighted in orange
✅ Card responsive on mobile
✅ All code committed and pushed to GitHub
