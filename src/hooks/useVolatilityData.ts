import { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { VolatilityEventData, VolatilityStats } from '@/types/volatility';

const SINGLETON_TTL_MS = 30 * 60 * 1000;

interface VolatilitySingleton {
  data: VolatilityEventData[];
  stats: VolatilityStats[];
  loaded: boolean;
  loadedAt: number;
  error: string | null;
}

const volatilitySingleton: VolatilitySingleton = {
  data: [],
  stats: [],
  loaded: false,
  loadedAt: 0,
  error: null,
};

export const useVolatilityData = () => {
  const [volatilityData, setVolatilityData] = useState<VolatilityEventData[]>(volatilitySingleton.data);
  const [volatilityStats, setVolatilityStats] = useState<VolatilityStats[]>(volatilitySingleton.stats);
  const [isLoading, setIsLoading] = useState(!volatilitySingleton.loaded);
  const [error, setError] = useState<string | null>(volatilitySingleton.error);

  const loadVolatilityData = async () => {
    if (volatilitySingleton.loaded && Date.now() - volatilitySingleton.loadedAt < SINGLETON_TTL_MS) {
      setVolatilityData(volatilitySingleton.data);
      setVolatilityStats(volatilitySingleton.stats);
      setIsLoading(false);
      setError(volatilitySingleton.error);
      return;
    }
    volatilitySingleton.loaded = false;

    try {
      setIsLoading(true);
      setError(null);

      const urls = [
        'https://raw.githubusercontent.com/datamilo/put-options-se/main/data/Stock_Events_Volatility_Data.csv',
        '/data/Stock_Events_Volatility_Data.csv',
      ];

      let csvText = '';

      for (const url of urls) {
        try {
          const response = await fetch(url);
          if (response.ok) {
            csvText = await response.text();
            break;
          }
        } catch {
          // try next URL
        }
      }

      if (!csvText) {
        throw new Error('Could not load volatility event data from any source.');
      }

      const result = Papa.parse<VolatilityEventData>(csvText, {
        header: true,
        skipEmptyLines: true,
        delimiter: '|',
        transform: (value: string, field: string) => {
          if (['year', 'month'].includes(field)) {
            return parseInt(value) || 0;
          }
          if (['event_value', 'open', 'high', 'low', 'close', 'volume',
               'volume_pct_change_from_previous_day', 'close_price_pct_change_from_previous_day',
               'intraday_high_low_price_diff', 'pct_intraday_high_low_movement',
               'pct_intraday_open_close_movement'].includes(field)) {
            return parseFloat(value) || 0;
          }
          return value;
        }
      });

      const data = result.data.filter(row => row.name && row.date);
      const stats = calculateVolatilityStats(data);

      volatilitySingleton.data = data;
      volatilitySingleton.stats = stats;
      volatilitySingleton.loaded = true;
      volatilitySingleton.loadedAt = Date.now();
      volatilitySingleton.error = null;

      setVolatilityData(data);
      setVolatilityStats(stats);

    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error occurred';
      volatilitySingleton.error = msg;
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateVolatilityStats = (data: VolatilityEventData[]): VolatilityStats[] => {
    const grouped = data.reduce((acc, row) => {
      const key = row.name;
      if (!acc[key]) acc[key] = [];
      acc[key].push(row);
      return acc;
    }, {} as Record<string, VolatilityEventData[]>);

    const statsArray: VolatilityStats[] = [];

    for (const [name, stockData] of Object.entries(grouped)) {
      const validChanges = stockData
        .map(d => d.close_price_pct_change_from_previous_day)
        .filter(change => !isNaN(change));

      if (validChanges.length === 0) continue;

      const count = validChanges.length;
      const mean_change = validChanges.reduce((sum, val) => sum + val, 0) / count;

      const sortedChanges = [...validChanges].sort((a, b) => a - b);
      const median_change = count % 2 === 0
        ? (sortedChanges[count / 2 - 1] + sortedChanges[count / 2]) / 2
        : sortedChanges[Math.floor(count / 2)];

      const variance = validChanges.reduce((sum, val) => sum + Math.pow(val - mean_change, 2), 0) / count;
      const std_dev = Math.sqrt(variance);

      const min_change = Math.min(...validChanges);
      const max_change = Math.max(...validChanges);

      const minEvent = stockData.find(d => d.close_price_pct_change_from_previous_day === min_change);
      const maxEvent = stockData.find(d => d.close_price_pct_change_from_previous_day === max_change);

      const p05 = count > 0 ? sortedChanges[Math.floor(count * 0.05)] : NaN;
      const p95 = count > 0 ? sortedChanges[Math.floor(count * 0.95)] : NaN;

      const mean_abs_change = validChanges.reduce((sum, val) => sum + Math.abs(val), 0) / count;
      const negative_count = validChanges.filter(val => val < 0).length;
      const negative_rate = negative_count / count;

      const se_mean = std_dev / Math.sqrt(count);
      const ci95_low = mean_change - 1.96 * se_mean;
      const ci95_high = mean_change + 1.96 * se_mean;

      const validVolumeChanges = stockData
        .map(d => d.volume_pct_change_from_previous_day)
        .filter(change => !isNaN(change));
      const avg_volume_pct_change = validVolumeChanges.length > 0
        ? validVolumeChanges.reduce((sum, val) => sum + val, 0) / validVolumeChanges.length
        : 0;

      const validSpreadChanges = stockData
        .map(d => Math.abs(d.pct_intraday_high_low_movement))
        .filter(change => !isNaN(change));
      const avg_intraday_spread_pct = validSpreadChanges.length > 0
        ? validSpreadChanges.reduce((sum, val) => sum + val, 0) / validSpreadChanges.length
        : 0;

      statsArray.push({
        name,
        count,
        mean_change,
        median_change,
        std_dev,
        min_change,
        max_change,
        p05,
        p95,
        mean_abs_change,
        negative_count,
        negative_rate,
        se_mean,
        ci95_low,
        ci95_high,
        avg_volume_pct_change,
        avg_intraday_spread_pct,
        min_event_type: minEvent?.type_of_event || '',
        min_event_date: minEvent?.date || '',
        max_event_type: maxEvent?.type_of_event || '',
        max_event_date: maxEvent?.date || '',
      });
    }

    return statsArray.sort((a, b) => b.mean_abs_change - a.mean_abs_change);
  };

  useEffect(() => {
    loadVolatilityData();
  }, []);

  return {
    volatilityData,
    volatilityStats,
    isLoading,
    error,
    loadVolatilityData,
  };
};
