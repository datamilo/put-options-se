import { useState, useEffect } from 'react';
import { format } from 'date-fns';

export const TimestampDisplay = () => {
  const [timestamps, setTimestamps] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🚀 TimestampDisplay component mounted');
    
    const fetchTimestamps = async () => {
      console.log('📡 About to fetch timestamps...');
      
      try {
        // Try multiple fallback URLs for better reliability on GitHub Pages
        const urls = [
          `https://raw.githubusercontent.com/datamilo/put-options-se/main/data/last_updated.json?${Date.now()}`,
          `${window.location.origin}${import.meta.env.BASE_URL}data/last_updated.json?${Date.now()}`
        ];
        
        let lastError: Error | null = null;
        let response: Response | null = null;
        
        for (const url of urls) {
          try {
            console.log('🔗 Trying timestamp URL:', url);
            response = await fetch(url);
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
        console.log('📨 Got response:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Got data:', data);
          setTimestamps(data);
        } else {
          console.error('❌ Bad response:', response.status);
        }
      } catch (error) {
        console.error('❌ Fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTimestamps();
  }, []);

  console.log('🔍 Render - timestamps:', timestamps, 'loading:', loading);

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading timestamp information...</div>;
  }

  if (!timestamps) {
    return <div className="text-sm text-destructive">Failed to load timestamps</div>;
  }

  return (
    <div className="bg-muted/50 border border-border rounded-lg p-3 max-w-xs">
      <h3 className="text-xs font-medium text-muted-foreground mb-2">Last Updated</h3>
      <div className="space-y-1 text-xs text-muted-foreground">
        <p>Options: {format(new Date(timestamps.optionsData.lastUpdated), 'yyyy-MM-dd HH:mm')}</p>
        <p>Stock: {format(new Date(timestamps.stockData.lastUpdated), 'yyyy-MM-dd HH:mm')}</p>
      </div>
    </div>
  );
};