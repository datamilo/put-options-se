import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import type { AnalyticsEvent } from '@/types/analytics';

const BATCH_SIZE = 10;
const BATCH_INTERVAL_MS = 5000; // 5 seconds

export const useAnalytics = () => {
  const { user } = useAuth();
  const [sessionId] = useState(() => crypto.randomUUID());
  const eventQueue = useRef<AnalyticsEvent[]>([]);
  const batchTimer = useRef<NodeJS.Timeout | null>(null);
  const sessionStartTime = useRef<Date>(new Date());
  const lastActivityTime = useRef<Date>(new Date());
  const sessionInitialized = useRef(false);
  const isFlushingRef = useRef(false);

  // Initialize session when user is authenticated
  useEffect(() => {
    if (user && !sessionInitialized.current) {
      initializeSession();
      sessionInitialized.current = true;
    }
  }, [user]);

  // Flush events on unmount or before page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (user) {
        flushEventsSync();
        endSessionSync();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (user && eventQueue.current.length > 0) {
        flushEventsSync();
      }
    };
  }, [user]);

  // Initialize session in database
  const initializeSession = async () => {
    if (!user) return;

    try {
      await supabase.from('user_analytics_sessions').insert({
        session_id: sessionId,
        user_id: user.id,
        started_at: sessionStartTime.current.toISOString(),
        last_activity_at: new Date().toISOString(),
        user_agent: navigator.userAgent,
        referrer: document.referrer || null,
        entry_page: window.location.pathname,
      });

      // Track session start event
      trackEvent({
        event_type: 'session_start',
        event_name: 'session_started',
        event_data: {
          user_agent: navigator.userAgent,
          screen_resolution: `${window.screen.width}x${window.screen.height}`,
          viewport_size: `${window.innerWidth}x${window.innerHeight}`,
        },
      });
    } catch (error) {
      console.error('Failed to initialize analytics session:', error);
    }
  };

  // End session in database (async version)
  const endSession = async () => {
    if (!user) return;

    try {
      const endTime = new Date();
      await supabase
        .from('user_analytics_sessions')
        .update({
          ended_at: endTime.toISOString(),
          exit_page: window.location.pathname,
        })
        .eq('session_id', sessionId);

      // Track session end event
      trackEventImmediate({
        event_type: 'session_end',
        event_name: 'session_ended',
        event_data: {
          duration_seconds: Math.floor((endTime.getTime() - sessionStartTime.current.getTime()) / 1000),
        },
      });
    } catch (error) {
      console.error('Failed to end analytics session:', error);
    }
  };

  // End session synchronously for page unload
  const endSessionSync = () => {
    if (!user) return;

    const endTime = new Date();
    const sessionData = {
      ended_at: endTime.toISOString(),
      exit_page: window.location.pathname,
    };

    // Best effort using sendBeacon
    const blob = new Blob([JSON.stringify({ session_id: sessionId, ...sessionData })], { type: 'application/json' });
    navigator.sendBeacon('/api/analytics/session-end', blob);
  };

  // Update session activity
  const updateSessionActivity = useCallback(async () => {
    if (!user) return;

    const now = new Date();
    lastActivityTime.current = now;

    try {
      await supabase
        .from('user_analytics_sessions')
        .update({
          last_activity_at: now.toISOString(),
        })
        .eq('session_id', sessionId);
    } catch (error) {
      console.error('Failed to update session activity:', error);
    }
  }, [user, sessionId]);

  // Increment session counters
  const incrementSessionCounter = useCallback(async (counter: 'pages_visited' | 'interactions_count') => {
    if (!user) return;

    try {
      const { data: session } = await supabase
        .from('user_analytics_sessions')
        .select(counter)
        .eq('session_id', sessionId)
        .single();

      if (session) {
        await supabase
          .from('user_analytics_sessions')
          .update({
            [counter]: (session[counter] || 0) + 1,
          })
          .eq('session_id', sessionId);
      }
    } catch (error) {
      console.error(`Failed to increment ${counter}:`, error);
    }
  }, [user, sessionId]);

  // Flush event queue to database
  const flushEvents = useCallback(async () => {
    if (!user || eventQueue.current.length === 0 || isFlushingRef.current) return;

    isFlushingRef.current = true;
    const eventsToFlush = [...eventQueue.current];
    eventQueue.current = [];

    try {
      const eventRecords = eventsToFlush.map(event => ({
        user_id: user.id,
        session_id: sessionId,
        ...event,
      }));

      const { error } = await supabase
        .from('user_analytics_events')
        .insert(eventRecords);

      if (error) {
        console.error('Failed to flush analytics events:', error);
        // Re-add events to queue on failure
        eventQueue.current = [...eventsToFlush, ...eventQueue.current];
      }
    } catch (error) {
      console.error('Failed to flush analytics events:', error);
      eventQueue.current = [...eventsToFlush, ...eventQueue.current];
    } finally {
      isFlushingRef.current = false;
    }
  }, [user, sessionId]);

  // Synchronous flush for page unload
  const flushEventsSync = () => {
    if (!user || eventQueue.current.length === 0) return;

    const eventsToFlush = [...eventQueue.current];
    eventQueue.current = [];

    const eventRecords = eventsToFlush.map(event => ({
      user_id: user.id,
      session_id: sessionId,
      ...event,
    }));

    // Use sendBeacon for reliable delivery during page unload
    const blob = new Blob([JSON.stringify(eventRecords)], { type: 'application/json' });
    navigator.sendBeacon('/api/analytics/events', blob);
  };

  // Schedule batch flush
  const scheduleBatchFlush = useCallback(() => {
    if (batchTimer.current) {
      clearTimeout(batchTimer.current);
    }

    batchTimer.current = setTimeout(() => {
      flushEvents();
    }, BATCH_INTERVAL_MS);
  }, [flushEvents]);

  // Track event (batched)
  const trackEvent = useCallback((event: AnalyticsEvent) => {
    if (!user) return; // Only track for authenticated users

    eventQueue.current.push({
      ...event,
      page_path: event.page_path || window.location.pathname,
      page_title: event.page_title || document.title,
    });

    updateSessionActivity();

    // Flush immediately if batch size reached
    if (eventQueue.current.length >= BATCH_SIZE) {
      flushEvents();
    } else {
      scheduleBatchFlush();
    }
  }, [user, flushEvents, scheduleBatchFlush, updateSessionActivity]);

  // Track event immediately (no batching)
  const trackEventImmediate = useCallback(async (event: AnalyticsEvent) => {
    if (!user) return;

    try {
      await supabase.from('user_analytics_events').insert({
        user_id: user.id,
        session_id: sessionId,
        ...event,
        page_path: event.page_path || window.location.pathname,
        page_title: event.page_title || document.title,
      });
    } catch (error) {
      console.error('Failed to track event immediately:', error);
    }
  }, [user, sessionId]);

  // Convenience methods for common events
  const trackPageView = useCallback((path?: string, title?: string, data?: Record<string, any>) => {
    trackEvent({
      event_type: 'page_view',
      event_name: 'page_viewed',
      page_path: path,
      page_title: title,
      event_data: data,
    });
    incrementSessionCounter('pages_visited');
  }, [trackEvent, incrementSessionCounter]);

  const trackInteraction = useCallback((name: string, data?: Record<string, any>) => {
    trackEvent({
      event_type: 'interaction',
      event_name: name,
      event_data: data,
    });
    incrementSessionCounter('interactions_count');
  }, [trackEvent, incrementSessionCounter]);

  const trackFilterChange = useCallback((name: string, data: Record<string, any>) => {
    trackEvent({
      event_type: 'filter_change',
      event_name: name,
      event_data: data,
    });
  }, [trackEvent]);

  const trackTableAction = useCallback((name: string, data: Record<string, any>) => {
    trackEvent({
      event_type: 'table_action',
      event_name: name,
      event_data: data,
    });
  }, [trackEvent]);

  const trackChartView = useCallback((name: string, data?: Record<string, any>) => {
    trackEvent({
      event_type: 'chart_view',
      event_name: name,
      event_data: data,
    });
  }, [trackEvent]);

  const trackExport = useCallback((name: string, data: Record<string, any>) => {
    trackEvent({
      event_type: 'export',
      event_name: name,
      event_data: data,
    });
  }, [trackEvent]);

  const trackError = useCallback((name: string, data: Record<string, any>) => {
    trackEventImmediate({
      event_type: 'error',
      event_name: name,
      event_data: data,
    });
  }, [trackEventImmediate]);

  return {
    trackEvent,
    trackEventImmediate,
    trackPageView,
    trackInteraction,
    trackFilterChange,
    trackTableAction,
    trackChartView,
    trackExport,
    trackError,
    sessionId,
  };
};
