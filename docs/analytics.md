# Usage Analytics System

**Last Updated**: January 1, 2026
**Status**: Active
**Scope**: Authenticated users only

---

## Overview

The Usage Analytics System tracks authenticated user behavior and interactions with minimal storage impact on your Supabase free tier account. The system automatically collects page visits, filter changes, exports, and settings modifications for analysis and insights.

---

## Features

### Automatic Tracking

**Page Views**
- Automatically tracked on all route changes
- Captures page path, title, referrer, and search parameters
- No configuration needed - happens transparently

**Session Management**
- Session creation on user login
- Session end tracking on logout or page close
- Session duration calculation
- Activity timeout tracking (30 minutes of inactivity)

### Manual Tracking (High-Value Events)

**Filter Changes** (Index/Options Dashboard)
- Stock filter modifications
- Expiry date filter changes
- Risk level filter changes
- Strike below period filter changes

**Export Actions**
- CSV export tracking with row count
- Includes data source information

**Settings Changes**
- Settings modal open events
- Settings save events with new values

---

## Database Schema

### user_analytics_events Table

Stores individual user events with flexible JSONB payload.

**Columns**:
- `id` (UUID) - Unique event identifier
- `user_id` (UUID) - Reference to authenticated user
- `session_id` (UUID) - Current session identifier
- `event_type` (TEXT) - Event category (page_view, interaction, filter_change, table_action, chart_view, export, error, session_start, session_end)
- `event_name` (TEXT) - Specific event name (e.g., 'filter_stocks_changed')
- `page_path` (TEXT) - Current page path
- `page_title` (TEXT) - Current page title
- `event_data` (JSONB) - Event-specific data
- `created_at` (TIMESTAMP) - Event timestamp (UTC)

**Row Level Security**: Users can only view their own events

### user_analytics_sessions Table

Stores aggregated session-level metrics for efficient querying.

**Columns**:
- `id` (UUID) - Unique session identifier
- `session_id` (UUID) - Session identifier (matches events)
- `user_id` (UUID) - Reference to authenticated user
- `started_at` (TIMESTAMP) - Session start time
- `ended_at` (TIMESTAMP) - Session end time (NULL if ongoing)
- `last_activity_at` (TIMESTAMP) - Last recorded activity
- `pages_visited` (INTEGER) - Count of unique pages visited
- `interactions_count` (INTEGER) - Count of tracked interactions
- `session_duration_seconds` (INTEGER) - Calculated session length
- `user_agent` (TEXT) - Browser/device information
- `referrer` (TEXT) - Page referrer
- `entry_page` (TEXT) - First page visited
- `exit_page` (TEXT) - Last page visited
- `created_at` (TIMESTAMP) - Record creation time
- `updated_at` (TIMESTAMP) - Last update time (auto-updated)

**Row Level Security**: Users can only view their own sessions

---

## Implementation Details

### Core Hook: useAnalytics

**Location**: `src/hooks/useAnalytics.ts`

**Key Features**:

1. **Event Batching**
   - Queues events in memory
   - Auto-flushes when 10 events accumulated or 5 seconds elapsed
   - Reduces database calls by 90%

2. **Session Management**
   - Generates unique session ID on hook initialization
   - Creates session record in database
   - Tracks activity with auto-update
   - Cleans up on page unload

3. **Performance Optimization**
   - All tracking methods are async/non-blocking
   - Uses `useCallback` to prevent unnecessary re-renders
   - Immediate flush for critical events (errors, session end)
   - `sendBeacon` API for reliable page unload tracking

4. **Public Methods**:

```typescript
// Page view tracking (auto via AnalyticsProvider)
trackPageView(path?: string, title?: string, data?: object)

// Filter and interaction tracking
trackFilterChange(name: string, data: object)
trackInteraction(name: string, data?: object)

// Export and chart tracking
trackExport(name: string, data: object)
trackChartView(name: string, data?: object)

// Error tracking (immediate, not batched)
trackError(name: string, data: object)

// Session info
sessionId: string
```

### AnalyticsProvider Component

**Location**: `src/components/AnalyticsProvider.tsx`

Automatically tracks page views when routes change. Integrates at the router level in `App.tsx`, wrapping all protected routes.

**Behavior**:
- Listens to route changes via `useLocation()`
- Extracts search parameters from URL
- Only tracks for authenticated users
- No configuration required

### Integration Points

#### Index.tsx (Options Dashboard)

**Filter Tracking**:
- Stock selections: `filter_stocks_changed`
- Expiry dates: `filter_expiry_changed`
- Risk levels: `filter_risk_levels_changed`
- Strike period: `filter_strike_below_period_changed`

**Export Tracking**:
- CSV export: `export_csv_clicked`
- Includes row count of exported data

#### SettingsModal.tsx

**Settings Tracking**:
- Settings open: `settings_opened`
- Settings save: `settings_saved`
- Includes underlying value and transaction cost

---

## Storage Impact

### Estimated Usage

For a handful of users (5 active users):
- ~30-50 events per user session
- Each event: ~500 bytes
- Per session: ~15-25 KB
- Monthly usage: ~1 MB
- Annual usage: ~12 MB

**Free Tier Allocation**: 500 MB total storage
**Usage Percentage**: <3% after 1 year

### Data Retention

**Auto-delete policy**: Events older than 90 days

Run manual cleanup:
```sql
SELECT delete_old_analytics_events();
```

Or run monthly via scheduled job in Supabase functions.

---

## Querying Analytics Data

### Most Visited Pages

```sql
SELECT page_path, COUNT(*) as views
FROM user_analytics_events
WHERE event_type = 'page_view'
GROUP BY page_path
ORDER BY views DESC;
```

### User Activity Summary

```sql
SELECT
  user_id,
  COUNT(DISTINCT session_id) as session_count,
  COUNT(*) as total_events,
  MIN(created_at AT TIME ZONE 'Europe/Stockholm') as first_visit,
  MAX(created_at AT TIME ZONE 'Europe/Stockholm') as last_visit
FROM user_analytics_events
GROUP BY user_id;
```

### Session Metrics

```sql
SELECT
  user_id,
  COUNT(*) as total_sessions,
  AVG(pages_visited) as avg_pages_per_session,
  AVG(interactions_count) as avg_interactions_per_session,
  AVG(session_duration_seconds) / 60.0 as avg_duration_minutes
FROM user_analytics_sessions
GROUP BY user_id;
```

### Filter Usage

```sql
SELECT event_name, COUNT(*) as usage_count
FROM user_analytics_events
WHERE event_type = 'filter_change'
GROUP BY event_name
ORDER BY usage_count DESC;
```

### Export Statistics

```sql
SELECT
  event_name,
  COUNT(*) as export_count,
  AVG((event_data->>'row_count')::INTEGER) as avg_rows_exported
FROM user_analytics_events
WHERE event_type = 'export'
GROUP BY event_name;
```

### Storage Usage Check

```sql
SELECT
  pg_size_pretty(pg_total_relation_size('user_analytics_events')) as events_size,
  pg_size_pretty(pg_total_relation_size('user_analytics_sessions')) as sessions_size,
  (SELECT COUNT(*) FROM user_analytics_events) as event_count,
  (SELECT COUNT(*) FROM user_analytics_sessions) as session_count;
```

---

## Timezone Considerations

All timestamps are stored in **UTC** (Coordinated Universal Time) in the database. When viewing data, convert to your local timezone:

```sql
-- View in Swedish time (CET/CEST)
SELECT
  event_name,
  created_at AT TIME ZONE 'Europe/Stockholm' as local_time
FROM user_analytics_events
ORDER BY created_at DESC;
```

---

## Event Types Reference

| Event Type | Event Name | Triggered By | Data Includes |
|---|---|---|---|
| `page_view` | `page_viewed` | Route change | referrer, search_params |
| `filter_change` | `filter_*_changed` | Filter modification | old_value, new_value, filter_type |
| `interaction` | `settings_opened` / `settings_saved` | Settings actions | element_type, values |
| `export` | `export_csv_clicked` | CSV export | export_type, data_source, row_count |
| `session_start` | `session_started` | User login | device info, screen resolution |
| `session_end` | `session_ended` | User logout/close | duration_seconds |

---

## Guest Users

**Guest mode users are NOT tracked**. Analytics are only collected for authenticated users via Row Level Security policies. This ensures privacy and keeps data minimal.

---

## Performance Impact

- **No UI blocking**: All tracking is async
- **Batched inserts**: 10 events per database call
- **Debounced flushing**: 5-second intervals prevent rapid inserts
- **Indexed queries**: Fast lookups on user_id, created_at, event_type
- **Session reuse**: One session per page load, not per event

**Result**: Negligible performance impact on user experience

---

## Future Enhancements

Possible additions (not in current implementation):

1. **Analytics Dashboard** - Visualize usage patterns
2. **User Flow Analysis** - Trace common navigation paths
3. **A/B Testing Framework** - Track experiment variants
4. **Performance Metrics** - Page load times, component renders
5. **Heatmap Data** - Click/scroll position tracking
6. **Anomaly Alerts** - Notify on unusual patterns or errors
7. **Export/Reporting** - Generate usage reports

---

## Setup & Deployment

### Initial Setup

1. Create migration in Supabase:
   - SQL Editor → Paste `supabase/migrations/20260101000000_create_analytics_tables.sql`
   - Execute to create tables and RLS policies

2. Verify tables created:
   - Table Editor should show `user_analytics_events` and `user_analytics_sessions`

3. Start tracking:
   - Log in and navigate the application
   - Data automatically captured in Supabase

### Monthly Maintenance

Run data retention cleanup:
```sql
SELECT delete_old_analytics_events();
```

### Monitoring

Check storage growth weekly:
```sql
SELECT COUNT(*) as events FROM user_analytics_events;
```

If approaching storage limits, reduce retention period or archive old data.

---

## Troubleshooting

**Q: Why don't I see analytics data immediately?**
A: Events are batched (10 events or 5 seconds). Wait 5+ seconds for first batch flush.

**Q: Timestamps are off by 1 hour?**
A: Database stores UTC. Use `AT TIME ZONE 'Europe/Stockholm'` in queries to see local time.

**Q: Can guest users be tracked?**
A: No, RLS policies prevent guest tracking. Only authenticated users generate analytics.

**Q: How long until data is deleted?**
A: 90 days by default. Run `delete_old_analytics_events()` manually to clean up sooner.

**Q: Storage usage seems high?**
A: Check with `pg_total_relation_size()` query. If over budget, reduce tracking scope or retention period.
