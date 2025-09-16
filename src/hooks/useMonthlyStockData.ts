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

      console.log('🔍 Attempting to load monthly stock data...');

      const urls = [
        'https://raw.githubusercontent.com/datamilo/put-options-se/main/data/Stocks_Monthly_Data.csv',
        '/data/Stocks_Monthly_Data.csv'
      ];

      let csvText = '';
      let successUrl = '';
      
      for (const url of urls) {
        try {
          console.log(`🌐 Trying to fetch from: ${url}`);
          // Add cache busting parameter
          const urlWithCacheBuster = url.includes('github') ? `${url}?${Date.now()}` : url;
          const response = await fetch(urlWithCacheBuster);
          console.log(`📨 Response status: ${response.status} for ${url}`);
          
          if (response.ok) {
            csvText = await response.text();
            successUrl = url;
            console.log(`✅ Successfully loaded from: ${url}`);
            console.log(`📄 CSV length: ${csvText.length} characters`);
            console.log(`📄 First 200 chars: ${csvText.substring(0, 200)}`);
            break;
          } else {
            console.log(`❌ Failed to load from ${url}: ${response.status} ${response.statusText}`);
          }
        } catch (urlError) {
          console.warn(`❌ Failed to fetch from ${url}:`, urlError);
        }
      }

      if (!csvText) {
        throw new Error('Could not load monthly stock data from GitHub or local source. Please check if the file exists and is accessible.');
      }

      const result = Papa.parse<MonthlyStockData>(csvText, {
        header: true,
        skipEmptyLines: true,
        delimiter: '|', // The file uses pipe separators, not commas
        transform: (value: string, field: string) => {
          if (field === 'month') {
            // Convert month names to numbers
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

      if (result.errors.length > 0) {
        console.warn('📝 CSV parsing warnings:', result.errors);
      }

      const data = result.data.filter(row => row.name && row.month && row.year);
      console.log(`📊 Parsed ${data.length} monthly records`);
      console.log(`📊 Sample records:`, data.slice(0, 3));
      setMonthlyData(data);
      
      // Calculate statistics
      const stats = calculateMonthlyStats(data);
      console.log(`📈 Calculated stats for ${stats.length} stock-month combinations`);
      setMonthlyStats(stats);
      
    } catch (err) {
      console.error('❌ Error loading monthly data:', err);
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
        top_5_accumulated_score: 0 // Not used anymore
      });
    }

    // Return stats array without score calculation
    const statsArray = Array.from(statsMap.values());

    return statsArray;
  };

  // Remove the top 5 score calculation entirely

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