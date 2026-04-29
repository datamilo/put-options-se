import { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { UpcomingEvent } from '@/types/stock';

const SINGLETON_TTL_MS = 30 * 60 * 1000;

let cachedEvents: UpcomingEvent[] | null = null;
let cachedAt = 0;

export const useUpcomingEvents = () => {
  const [allEvents, setAllEvents] = useState<UpcomingEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUpcomingEvents();
  }, []);

  const loadUpcomingEvents = async () => {
    try {
      if (cachedEvents && Date.now() - cachedAt < SINGLETON_TTL_MS) {
        setAllEvents(cachedEvents);
        setIsLoading(false);
        return;
      }
      cachedEvents = null;

      setIsLoading(true);
      setError(null);

      const response = await fetch(
        'https://raw.githubusercontent.com/datamilo/put-options-se/main/data/upcoming_events.csv'
      );

      if (!response.ok) {
        throw new Error('Failed to load upcoming events');
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
          cachedAt = Date.now();
          setAllEvents(events);
          setIsLoading(false);
        },
        error: () => {
          setError('Failed to parse upcoming events data');
          setIsLoading(false);
        }
      });
    } catch (err) {
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
