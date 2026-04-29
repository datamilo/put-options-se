import { useState, useEffect } from 'react';
import Papa from 'papaparse';

export interface MonthlyStockData {
  name: string;
  month: number;
  year: number;
  open: number;
  high: number;
  low: number;
  close: number;
  close_previous_month: number;
  low_previous_month: number;
  pct_return_month: number;
  pct_open_to_low: number;
  pct_low_to_high: number;
  pct_low_previous_month_to_low_current_month: number;
  day_low_day_of_month: number;
  day_high_day_of_month: number;
}

export interface MonthlyStockStats {
  name: string;
  month: number;
  number_of_months_available: number;
  number_of_months_positive_return: number;
  pct_pos_return_months: number;
  return_month_mean_pct_return_month: number;
  open_to_low_mean_pct_return_month: number;
  open_to_low_min_pct_return_month: number;
  open_to_low_max_pct_return_month: number;
  top_5_accumulated_score: number;
}

interface MonthlyDataSingleton {
  data: MonthlyStockData[];
  stats: MonthlyStockStats[];
  loaded: boolean;
  error: string | null;
}

const monthlyDataSingleton: MonthlyDataSingleton = {
  data: [],
  stats: [],
  loaded: false,
  error: null,
};

export const useMonthlyStockData = () => {
  const [monthlyData, setMonthlyData] = useState<MonthlyStockData[]>(monthlyDataSingleton.data);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStockStats[]>(monthlyDataSingleton.stats);
  const [isLoading, setIsLoading] = useState(!monthlyDataSingleton.loaded);
  const [error, setError] = useState<string | null>(monthlyDataSingleton.error);

  const loadMonthlyData = async () => {
    if (monthlyDataSingleton.loaded) {
      setMonthlyData(monthlyDataSingleton.data);
      setMonthlyStats(monthlyDataSingleton.stats);
      setIsLoading(false);
      setError(monthlyDataSingleton.error);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const urls = [
        'https://cdn.jsdelivr.net/gh/datamilo/put-options-se@main/data/Stocks_Monthly_Data.csv',
        '/data/Stocks_Monthly_Data.csv',
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
        throw new Error('Could not load monthly stock data from any source.');
      }

      const result = Papa.parse<MonthlyStockData>(csvText, {
        header: true,
        skipEmptyLines: true,
        delimiter: '|',
        transform: (value: string, field: string) => {
          if (field === 'month') {
            const monthMap: Record<string, number> = {
              'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6,
              'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12
            };
            return monthMap[value] || parseInt(value) || 0;
          }
          if (['year', 'day_low_day_of_month', 'day_high_day_of_month'].includes(field)) {
            return parseInt(value) || 0;
          }
          if (['open', 'high', 'low', 'close', 'close_previous_month', 'low_previous_month',
               'pct_return_month', 'pct_open_to_low', 'pct_low_to_high',
               'pct_low_previous_month_to_low_current_month'].includes(field)) {
            return parseFloat(value) || 0;
          }
          return value;
        }
      });

      const data = result.data.filter(row => row.name && row.month && row.year);
      const stats = calculateMonthlyStats(data);

      monthlyDataSingleton.data = data;
      monthlyDataSingleton.stats = stats;
      monthlyDataSingleton.loaded = true;
      monthlyDataSingleton.error = null;

      setMonthlyData(data);
      setMonthlyStats(stats);

    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error occurred';
      monthlyDataSingleton.error = msg;
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateMonthlyStats = (data: MonthlyStockData[]): MonthlyStockStats[] => {
    const statsMap = new Map<string, MonthlyStockStats>();

    const grouped = data.reduce((acc, row) => {
      const key = `${row.name}-${row.month}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(row);
      return acc;
    }, {} as Record<string, MonthlyStockData[]>);

    for (const [key, monthData] of Object.entries(grouped)) {
      const [name, monthStr] = key.split('-');
      const month = parseInt(monthStr);

      const positiveReturns = monthData.filter(d => d.pct_return_month >= 0).length;
      const totalMonths = monthData.length;

      const meanReturn = monthData.reduce((sum, d) => sum + d.pct_return_month, 0) / totalMonths;
      const meanOpenToLow = monthData.reduce((sum, d) => sum + d.pct_open_to_low, 0) / totalMonths;
      const minOpenToLow = Math.min(...monthData.map(d => d.pct_open_to_low));
      const maxOpenToLow = Math.max(...monthData.map(d => d.pct_open_to_low));

      statsMap.set(key, {
        name,
        month,
        number_of_months_available: totalMonths,
        number_of_months_positive_return: positiveReturns,
        pct_pos_return_months: (positiveReturns / totalMonths) * 100,
        return_month_mean_pct_return_month: meanReturn * 100,
        open_to_low_mean_pct_return_month: meanOpenToLow,
        open_to_low_min_pct_return_month: minOpenToLow,
        open_to_low_max_pct_return_month: maxOpenToLow,
        top_5_accumulated_score: 0,
      });
    }

    return Array.from(statsMap.values());
  };

  useEffect(() => {
    loadMonthlyData();
  }, []);

  return {
    monthlyData,
    monthlyStats,
    isLoading,
    error,
    loadMonthlyData,
  };
};
