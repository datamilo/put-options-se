import { useState, useEffect } from 'react';
import Papa from 'papaparse';

export interface SupportLevelMetric {
  stock_name: string;
  rolling_period: number;
  current_price: number;
  rolling_low: number | null;
  distance_to_support_pct: number | null;
  total_breaks: number;
  days_since_last_break: number | null;
  last_break_date: string | null;
  support_stability_pct: number;
  stability_trend: 'improving' | 'stable' | 'weakening';
  median_drop_per_break_pct: number | null;
  avg_drop_per_break_pct: number | null;
  max_drop_pct: number | null;
  drop_std_dev_pct: number;
  avg_days_between_breaks: number | null;
  median_days_between_breaks: number | null;
  trading_days_per_break: number;
  num_clusters: number;
  max_consecutive_breaks: number;
  current_consecutive_breaks: number;
  support_strength_score: number;
  pattern_type: 'never_breaks' | 'exhausted_cascade' | 'shallow_breaker' | 'volatile' | 'stable' | 'predictable_cycles';
  break_probability_30d: number;
  break_probability_60d: number;
  last_calculated: string;
  data_through_date: string;
}

export const useSupportLevelMetrics = () => {
  const [data, setData] = useState<SupportLevelMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Load from GitHub raw URL (same pattern as other data files)
        const response = await fetch(
          'https://raw.githubusercontent.com/datamilo/put-options-se/main/data/support_level_metrics.csv'
        );

        if (!response.ok) {
          throw new Error(`Failed to load support metrics: ${response.statusText}`);
        }

        const csvText = await response.text();

        // Parse CSV
        Papa.parse<SupportLevelMetric>(csvText, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          transformHeader: (header) => header.trim(),
          transform: (value, field) => {
            // Handle null values
            if (value === '' || value === 'None' || value === null) {
              return null;
            }
            return value;
          },
          complete: (results) => {
            if (results.errors.length > 0) {
              console.error('CSV parsing errors:', results.errors);
            }
            setData(results.data);
            setIsLoading(false);
          },
          error: (error: Error) => {
            console.error('CSV parsing error:', error);
            setError(error.message);
            setIsLoading(false);
          },
        });
      } catch (err) {
        console.error('Error loading support metrics:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setIsLoading(false);
      }
    };

    loadMetrics();
  }, []);

  // Helper function to get metrics for a specific stock and period
  const getMetricsForStock = (stockName: string, rollingPeriod: number): SupportLevelMetric | undefined => {
    return data.find(
      (metric) => metric.stock_name === stockName && metric.rolling_period === rollingPeriod
    );
  };

  // Helper function to get all metrics for a stock (all periods)
  const getAllMetricsForStock = (stockName: string): SupportLevelMetric[] => {
    return data.filter((metric) => metric.stock_name === stockName);
  };

  // Helper function to get all stocks for a specific period
  const getMetricsForPeriod = (rollingPeriod: number): SupportLevelMetric[] => {
    return data.filter((metric) => metric.rolling_period === rollingPeriod);
  };

  // Helper function to get stocks by pattern type
  const getStocksByPattern = (patternType: SupportLevelMetric['pattern_type'], rollingPeriod?: number): SupportLevelMetric[] => {
    let filtered = data.filter((metric) => metric.pattern_type === patternType);
    if (rollingPeriod !== undefined) {
      filtered = filtered.filter((metric) => metric.rolling_period === rollingPeriod);
    }
    return filtered;
  };

  return {
    data,
    isLoading,
    error,
    getMetricsForStock,
    getAllMetricsForStock,
    getMetricsForPeriod,
    getStocksByPattern,
  };
};
