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
}

export const useTimestamps = () => {
  const [timestamps, setTimestamps] = useState<TimestampData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTimestamps = async () => {
      console.log('[useTimestamps] Starting to load timestamps...');

      try {
        // Add cache busting to ensure fresh data
        const cacheBuster = Date.now();
        // Try multiple fallback URLs for better reliability on GitHub Pages
        const urls = [
          `https://raw.githubusercontent.com/datamilo/put-options-se/main/data/last_updated.json?cb=${cacheBuster}`,
          `${window.location.origin}${import.meta.env.BASE_URL}data/last_updated.json?cb=${cacheBuster}`
        ];

        console.log('[useTimestamps] Trying URLs:', urls);

        let lastError: Error | null = null;
        let response: Response | null = null;
        let successUrl = '';

        for (const url of urls) {
          try {
            console.log('[useTimestamps] Fetching from:', url);
            response = await fetch(url, {
              method: 'GET',
              cache: 'no-cache'
            });
            console.log('[useTimestamps] Response status:', response.status, 'OK:', response.ok);

            if (response.ok) {
              successUrl = url;
              break;
            }
          } catch (error) {
            console.warn('[useTimestamps] Fetch failed for', url, error);
            lastError = error as Error;
          }
        }

        if (!response || !response.ok) {
          throw lastError || new Error('Failed to load timestamps from any URL');
        }

        const text = await response.text();
        console.log('[useTimestamps] Response text:', text);

        const data = JSON.parse(text) as TimestampData;
        console.log('[useTimestamps] Parsed data:', data);

        setTimestamps(data);
        console.log('[useTimestamps] Successfully set timestamps');
      } catch (error) {
        console.error('[useTimestamps] Error loading timestamps:', error);
        setTimestamps(null);
      } finally {
        setIsLoading(false);
        console.log('[useTimestamps] Loading complete');
      }
    };

    loadTimestamps();
  }, []);

  return { timestamps, isLoading };
};