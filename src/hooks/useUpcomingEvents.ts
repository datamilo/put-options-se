import { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { UpcomingEvent } from '@/types/stock';

// Singleton cache - persists across component mounts to prevent reloading
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
          setIsLoading(false);
        },
        error: (error) => {
          console.error('Error parsing upcoming events CSV:', error);
          setError('Failed to parse upcoming events data');
          setIsLoading(false);
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
