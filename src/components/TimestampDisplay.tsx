import { useState, useEffect } from 'react';

export const TimestampDisplay = () => {
  const [timestamps, setTimestamps] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🚀 TimestampDisplay component mounted');
    
    const fetchTimestamps = async () => {
      console.log('📡 About to fetch timestamps...');
      
      try {
        const url = `https://raw.githubusercontent.com/datamilo/put-options-se/main/data/last_updated.json?${Date.now()}`;
        console.log('🌐 Fetching from URL:', url);
        
        const response = await fetch(url);
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
    <div className="text-sm text-muted-foreground space-y-1">
      <p>Options data last updated: {new Date(timestamps.optionsData.lastUpdated).toLocaleString()}</p>
      <p>Stock data last updated: {new Date(timestamps.stockData.lastUpdated).toLocaleString()}</p>
    </div>
  );
};