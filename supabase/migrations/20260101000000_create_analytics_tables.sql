-- =====================================================
-- Usage Analytics Tables Migration
-- =====================================================
-- Description: Creates tables for tracking user analytics
-- Author: Claude Code
-- Date: 2026-01-01
-- =====================================================

-- 1. Create analytics events table
CREATE TABLE public.user_analytics_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  event_name TEXT NOT NULL,
  page_path TEXT,
  page_title TEXT,
  event_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

  CONSTRAINT valid_event_type CHECK (event_type IN (
    'page_view', 'interaction', 'filter_change', 'table_action',
    'chart_view', 'export', 'error', 'session_start', 'session_end'
  ))
);

-- 2. Create session summary table
CREATE TABLE public.user_analytics_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  last_activity_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  pages_visited INTEGER NOT NULL DEFAULT 0,
  interactions_count INTEGER NOT NULL DEFAULT 0,
  session_duration_seconds INTEGER,
  user_agent TEXT,
  referrer TEXT,
  entry_page TEXT,
  exit_page TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Create indexes for performance
CREATE INDEX idx_user_analytics_user_id ON public.user_analytics_events(user_id);
CREATE INDEX idx_user_analytics_session_id ON public.user_analytics_events(session_id);
CREATE INDEX idx_user_analytics_event_type ON public.user_analytics_events(event_type);
CREATE INDEX idx_user_analytics_created_at ON public.user_analytics_events(created_at DESC);
CREATE INDEX idx_user_analytics_user_created ON public.user_analytics_events(user_id, created_at DESC);

CREATE INDEX idx_user_analytics_sessions_user_id ON public.user_analytics_sessions(user_id);
CREATE INDEX idx_user_analytics_sessions_started_at ON public.user_analytics_sessions(started_at DESC);
CREATE INDEX idx_user_analytics_sessions_session_id ON public.user_analytics_sessions(session_id);

-- 4. Enable Row Level Security
ALTER TABLE public.user_analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_analytics_sessions ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for events table (following user_preferences pattern)
CREATE POLICY "Users can view their own analytics events"
ON public.user_analytics_events
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own analytics events"
ON public.user_analytics_events
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Note: No UPDATE or DELETE policies - analytics events are immutable

-- 6. Create RLS policies for sessions table
CREATE POLICY "Users can view their own sessions"
ON public.user_analytics_sessions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sessions"
ON public.user_analytics_sessions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
ON public.user_analytics_sessions
FOR UPDATE
USING (auth.uid() = user_id);

-- 7. Create trigger for automatic session timestamp updates
CREATE TRIGGER update_user_analytics_sessions_updated_at
BEFORE UPDATE ON public.user_analytics_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 8. Create function to calculate session duration
CREATE OR REPLACE FUNCTION public.calculate_session_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ended_at IS NOT NULL AND NEW.started_at IS NOT NULL THEN
    NEW.session_duration_seconds = EXTRACT(EPOCH FROM (NEW.ended_at - NEW.started_at))::INTEGER;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 9. Create trigger for session duration calculation
CREATE TRIGGER calculate_session_duration_trigger
BEFORE INSERT OR UPDATE ON public.user_analytics_sessions
FOR EACH ROW
EXECUTE FUNCTION public.calculate_session_duration();

-- 10. Create function to delete old analytics events (90-day retention)
CREATE OR REPLACE FUNCTION public.delete_old_analytics_events()
RETURNS void AS $$
BEGIN
  DELETE FROM user_analytics_events
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 11. Add comments for documentation
COMMENT ON TABLE public.user_analytics_events IS 'Stores individual user analytics events for authenticated users only';
COMMENT ON TABLE public.user_analytics_sessions IS 'Stores aggregated session-level analytics metrics';
COMMENT ON COLUMN public.user_analytics_events.event_type IS 'Category of event: page_view, interaction, filter_change, table_action, chart_view, export, error, session_start, session_end';
COMMENT ON COLUMN public.user_analytics_events.event_name IS 'Specific name of the event (e.g., "filter_stocks_changed", "export_csv_clicked")';
COMMENT ON COLUMN public.user_analytics_events.event_data IS 'Flexible JSONB field for event-specific data (filters, table columns, error details, etc.)';
COMMENT ON FUNCTION public.delete_old_analytics_events() IS 'Deletes analytics events older than 90 days to manage storage on free tier. Run manually or via scheduled job.';
