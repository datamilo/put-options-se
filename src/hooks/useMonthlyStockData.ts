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

export const useMonthlyStockData = () => {
  const [monthlyData, setMonthlyData] = useState<MonthlyStockData[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStockStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMonthlyData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const urls = [
        '/data/Stocks_Monthly_Data.csv',
        'https://raw.githubusercontent.com/yourusername/yourrepo/main/data/Stocks_Monthly_Data.csv'
      ];

      let csvText = '';
      for (const url of urls) {
        try {
          const response = await fetch(url);
          if (response.ok) {
            csvText = await response.text();
            break;
          }
        } catch (urlError) {
          console.warn(`Failed to fetch from ${url}:`, urlError);
        }
      }

      if (!csvText) {
        throw new Error('Could not load monthly stock data from any source');
      }

      const result = Papa.parse<MonthlyStockData>(csvText, {
        header: true,
        skipEmptyLines: true,
        transform: (value: string, field: string) => {
          if (['month', 'year', 'day_low_day_of_month', 'day_high_day_of_month'].includes(field)) {
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

      if (result.errors.length > 0) {
        console.warn('CSV parsing warnings:', result.errors);
      }

      const data = result.data.filter(row => row.name && row.month && row.year);
      setMonthlyData(data);
      
      // Calculate statistics
      const stats = calculateMonthlyStats(data);
      setMonthlyStats(stats);
      
    } catch (err) {
      console.error('Error loading monthly data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateMonthlyStats = (data: MonthlyStockData[]): MonthlyStockStats[] => {
    const statsMap = new Map<string, MonthlyStockStats>();

    // Group by stock name and month
    const grouped = data.reduce((acc, row) => {
      const key = `${row.name}-${row.month}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(row);
      return acc;
    }, {} as Record<string, MonthlyStockData[]>);

    // Calculate stats for each stock-month combination
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
        return_month_mean_pct_return_month: meanReturn,
        open_to_low_mean_pct_return_month: meanOpenToLow,
        open_to_low_min_pct_return_month: minOpenToLow,
        open_to_low_max_pct_return_month: maxOpenToLow,
        top_5_accumulated_score: 0 // Will be calculated separately
      });
    }

    // Calculate top 5 scores
    const statsArray = Array.from(statsMap.values());
    calculateTop5Scores(statsArray);

    return statsArray;
  };

  const calculateTop5Scores = (stats: MonthlyStockStats[]) => {
    // For each month, rank stocks and assign points
    for (let month = 1; month <= 12; month++) {
      const monthStats = stats.filter(s => s.month === month && s.number_of_months_available >= 3);
      
      // Rank by different metrics and assign points
      const metrics = [
        'pct_pos_return_months',
        'return_month_mean_pct_return_month',
        'open_to_low_mean_pct_return_month' // Higher is better (less negative)
      ];

      metrics.forEach(metric => {
        const sorted = [...monthStats].sort((a, b) => {
          if (metric === 'open_to_low_mean_pct_return_month') {
            return b[metric as keyof MonthlyStockStats] as number - (a[metric as keyof MonthlyStockStats] as number);
          }
          return (b[metric as keyof MonthlyStockStats] as number) - (a[metric as keyof MonthlyStockStats] as number);
        });

        sorted.slice(0, 5).forEach((stat, index) => {
          stat.top_5_accumulated_score += (5 - index); // 5 points for 1st, 4 for 2nd, etc.
        });
      });
    }
  };

  useEffect(() => {
    loadMonthlyData();
  }, []);

  return {
    monthlyData,
    monthlyStats,
    isLoading,
    error,
    loadMonthlyData
  };
};