import { useState, useEffect } from 'react';

interface TimestampData {
  optionsData: {
    lastUpdated: string;
    description: string;
  };
  stockData: {
    lastUpdated: string;
    description: string;
  };
  analysisCompleted: {
    lastUpdated: string;
    description: string;
  };
}

export const useTimestamps = () => {
  const [timestamps, setTimestamps] = useState<TimestampData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTimestamps = async () => {
      try {
        // last_updated.json changes on every data refresh — fetch direct from GitHub
        // (raw.githubusercontent.com) to bypass jsDelivr's 12-hour CDN cache.
        // Cache-bust with timestamp so GitHub's own HTTP cache is also skipped.
        const urls = [
          `https://raw.githubusercontent.com/datamilo/put-options-se/main/data/last_updated.json?t=${Date.now()}`,
          `${window.location.origin}${import.meta.env.BASE_URL}data/last_updated.json`,
        ];

        let lastError: Error | null = null;
        let response: Response | null = null;

        for (const url of urls) {
          try {
            response = await fetch(url, {
              method: 'GET',
              cache: 'no-cache'
            });

            if (response.ok) {
              break;
            }
          } catch (error) {
            lastError = error as Error;
          }
        }

        if (!response || !response.ok) {
          throw lastError || new Error('Failed to load timestamps from any URL');
        }

        const text = await response.text();
        const data = JSON.parse(text) as TimestampData;

        setTimestamps(data);
      } catch (error) {
        console.error('Error loading timestamps:', error);
        setTimestamps(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadTimestamps();
  }, []);

  return { timestamps, isLoading };
};