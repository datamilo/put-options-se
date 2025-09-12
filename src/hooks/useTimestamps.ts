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
  console.log('📁 useTimestamps hook called');
  const [timestamps, setTimestamps] = useState<TimestampData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTimestamps = async () => {
      console.log('🕒 Loading timestamps from GitHub...');
      
      try {
        // Add cache busting to ensure fresh data
        const cacheBuster = Date.now();
        // Try multiple fallback URLs for better reliability on GitHub Pages
        const urls = [
          `https://raw.githubusercontent.com/datamilo/put-options-se/main/data/last_updated.json?cb=${cacheBuster}`,
          `${window.location.origin}${import.meta.env.BASE_URL}data/last_updated.json?cb=${cacheBuster}`
        ];
        
        let lastError: Error | null = null;
        let response: Response | null = null;
        
        for (const url of urls) {
          try {
            console.log('🔗 Trying timestamp URL:', url);
            response = await fetch(url, {
              method: 'GET',
              cache: 'no-cache',
              headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
              }
            });
            if (response.ok) {
              console.log('✅ Successfully loaded timestamps from:', url);
              break;
            }
          } catch (error) {
            console.warn('❌ Failed to load from:', url, error);
            lastError = error as Error;
          }
        }
        
        if (!response || !response.ok) {
          throw lastError || new Error('Failed to load timestamps from any URL');
        }

        console.log('📨 Response status:', response.status);

        const text = await response.text();
        console.log('📄 Raw response:', text);
        
        const data = JSON.parse(text);
        console.log('✅ Parsed timestamps:', data);
        
        setTimestamps(data);
      } catch (error) {
        console.error('❌ Error loading timestamps:', error);
        setTimestamps(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadTimestamps();
  }, []);

  return { timestamps, isLoading };
};