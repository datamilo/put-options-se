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
        const url = `https://raw.githubusercontent.com/datamilo/put-options-se/main/data/last_updated.json?cb=${cacheBuster}`;
        
        console.log('📡 Fetching from:', url);
        
        const response = await fetch(url, {
          method: 'GET',
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });

        console.log('📨 Response status:', response.status);

        if (response.ok) {
          const text = await response.text();
          console.log('📄 Raw response:', text);
          
          const data = JSON.parse(text);
          console.log('✅ Parsed timestamps:', data);
          
          setTimestamps(data);
        } else {
          console.error('❌ Failed to fetch timestamps:', response.status, response.statusText);
          setTimestamps(null);
        }
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