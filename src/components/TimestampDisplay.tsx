import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

export const TimestampDisplay = () => {
  const { t } = useTranslation('common');
  const [timestamps, setTimestamps] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTimestamps = async () => {
      try {
        const response = await fetch(
          `https://raw.githubusercontent.com/datamilo/put-options-se/main/data/last_updated.json?t=${Date.now()}`
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
    return <div className="text-sm text-muted-foreground">{t('timestampDisplay.loading')}</div>;
  }

  if (!timestamps) {
    return <div className="text-sm text-destructive">{t('timestampDisplay.error')}</div>;
  }

  return (
    <div className="bg-muted/50 border border-border rounded-lg p-3 max-w-xs">
      <h3 className="text-xs font-medium text-muted-foreground mb-2">{t('timestampDisplay.lastUpdated')}</h3>
      <div className="space-y-1 text-xs text-muted-foreground">
        <p>{t('timestampDisplay.options')}: {format(new Date(timestamps.optionsData.lastUpdated), 'yyyy-MM-dd HH:mm')}</p>
        <p>{t('timestampDisplay.stocks')}: {format(new Date(timestamps.stockData.lastUpdated), 'yyyy-MM-dd HH:mm')}</p>
      </div>
    </div>
  );
};
