import { useState, useEffect } from 'react';
import { format } from 'date-fns';

export const TimestampDisplay = () => {
  const [timestamps, setTimestamps] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTimestamps = async () => {
      try {
        const response = await fetch(
          'https://cdn.jsdelivr.net/gh/datamilo/put-options-se@main/data/last_updated.json'
        );
        if (response.ok) {
          setTimestamps(await response.json());
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTimestamps();
  }, []);

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
        <p>Stocks: {format(new Date(timestamps.stockData.lastUpdated), 'yyyy-MM-dd HH:mm')}</p>
      </div>
    </div>
  );
};
