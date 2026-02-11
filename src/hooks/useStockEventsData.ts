import { useState, useEffect } from 'react';

export interface StockEvent {
  date: string;
  stockName: string;
  eventType: string;
  eventValue: string;
}

const cache = new Map<string, { data: StockEvent[]; timestamp: number }>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export const useStockEventsData = () => {
  const [data, setData] = useState<StockEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const now = Date.now();
        const cached = cache.get('stock-events');

        // Use cache if available and fresh
        if (cached && now - cached.timestamp < CACHE_DURATION) {
          setData(cached.data);
          setIsLoading(false);
          return;
        }

        setIsLoading(true);
        const isGitHubPages = window.location.hostname === 'datamilo.github.io';
        const baseUrl = isGitHubPages
          ? 'https://raw.githubusercontent.com/DataMilo/put-options-se/main'
          : 'https://raw.githubusercontent.com/DataMilo/put-options-se/main';

        const response = await fetch(
          `${baseUrl}/data/Stock_Events_Volatility_Data.csv?t=${Date.now()}`
        );

        if (!response.ok) {
          throw new Error(`Failed to load events data: ${response.statusText}`);
        }

        const csv = await response.text();
        const lines = csv.trim().split('\n');

        if (lines.length < 2) {
          throw new Error('Events data is empty');
        }

        // Parse header (pipe-delimited)
        const headers = lines[0].split('|');
        const dateIndex = headers.indexOf('date');
        const nameIndex = headers.indexOf('name');
        const typeIndex = headers.indexOf('type_of_event');
        const valueIndex = headers.indexOf('event_value');

        if (dateIndex === -1 || nameIndex === -1 || typeIndex === -1) {
          throw new Error('Required columns not found in events data');
        }

        const parsedData: StockEvent[] = lines
          .slice(1)
          .map((line) => {
            const values = line.split('|');
            return {
              date: values[dateIndex],
              stockName: values[nameIndex],
              eventType: values[typeIndex],
              eventValue: values[valueIndex] || '',
            };
          })
          .filter((event) => event.date && event.stockName);

        setData(parsedData);
        cache.set('stock-events', { data: parsedData, timestamp: now });
        setError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error loading events data';
        console.error('Error loading stock events:', message);
        setError(message);
        setData([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const getNextFinancialReportDate = (stockName: string): string | null => {
    const today = new Date();
    const financialReports = data.filter(
      (event) =>
        event.stockName === stockName &&
        (event.eventType.toLowerCase().includes('rapport') ||
         event.eventType.toLowerCase().includes('kommuniké') ||
         event.eventType.toLowerCase().includes('kvartalsrapport') ||
         event.eventType.toLowerCase().includes('boksluts'))
    );

    const nextReport = financialReports
      .map((event) => new Date(event.date))
      .filter((date) => date > today)
      .sort((a, b) => a.getTime() - b.getTime())[0];

    return nextReport ? nextReport.toISOString().split('T')[0] : null;
  };

  const getNextDividendDate = (stockName: string): string | null => {
    const today = new Date();
    const dividends = data.filter(
      (event) =>
        event.stockName === stockName &&
        event.eventType.toLowerCase().includes('dividend')
    );

    const nextDividend = dividends
      .map((event) => new Date(event.date))
      .filter((date) => date > today)
      .sort((a, b) => a.getTime() - b.getTime())[0];

    return nextDividend ? nextDividend.toISOString().split('T')[0] : null;
  };

  return {
    data,
    isLoading,
    error,
    getNextFinancialReportDate,
    getNextDividendDate,
  };
};
