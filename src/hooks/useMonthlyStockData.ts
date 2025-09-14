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
        '/data/Stocks_Monthly_Data.csv',
        'https://raw.githubusercontent.com/datamilo/put-options-se/main/data/Stocks_Monthly_Data.csv'
      ];

      let csvText = '';
      let successUrl = '';
      
      for (const url of urls) {
        try {
          console.log(`🌐 Trying to fetch from: ${url}`);
          const response = await fetch(url);
          console.log(`📨 Response status: ${response.status} for ${url}`);
          
          if (response.ok) {
            csvText = await response.text();
            successUrl = url;
            console.log(`✅ Successfully loaded from: ${url}`);
            console.log(`📄 CSV length: ${csvText.length} characters`);
            break;
          } else {
            console.log(`❌ Failed to load from ${url}: ${response.status} ${response.statusText}`);
          }
        } catch (urlError) {
          console.warn(`❌ Failed to fetch from ${url}:`, urlError);
        }
      }

      if (!csvText) {
        console.error('❌ No CSV data loaded from any source');
        // Create sample data for development
        console.log('🔧 Creating sample monthly data for development...');
        csvText = createSampleMonthlyData();
        console.log('✅ Using sample data');
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
        console.warn('📝 CSV parsing warnings:', result.errors);
      }

      const data = result.data.filter(row => row.name && row.month && row.year);
      console.log(`📊 Parsed ${data.length} monthly records`);
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

  // Function to create sample data when real data isn't available
  const createSampleMonthlyData = (): string => {
    const header = 'name,month,year,open,high,low,close,close_previous_month,low_previous_month,pct_return_month,pct_open_to_low,pct_low_to_high,pct_low_previous_month_to_low_current_month,day_low_day_of_month,day_high_day_of_month';
    
    const sampleRows = [
      'AAK AB,1,2024,225.6,245.4,223.0,235.0,220.0,215.0,6.82,-1.15,9.76,3.72,5,19',
      'AAK AB,2,2024,235.0,243.0,228.8,228.8,235.0,223.0,-2.64,-2.55,6.20,2.60,28,7',
      'AAK AB,3,2024,228.8,251.4,226.0,257.6,228.8,228.8,12.58,-1.22,11.28,-1.23,1,27',
      'ABB Ltd,1,2024,380.0,395.0,375.0,390.0,375.0,370.0,4.00,-1.32,5.33,1.35,8,15',
      'ABB Ltd,2,2024,390.0,410.0,385.0,405.0,390.0,375.0,3.85,-1.28,6.49,2.67,12,25',
      'ABB Ltd,3,2024,405.0,425.0,400.0,420.0,405.0,385.0,3.70,-1.23,6.25,3.90,5,18',
      'ASSA ABLOY AB ser. B,1,2024,285.0,295.0,280.0,290.0,280.0,275.0,3.57,-1.75,5.36,1.82,10,20',
      'ASSA ABLOY AB ser. B,2,2024,290.0,305.0,285.0,300.0,290.0,280.0,3.45,-1.72,7.02,1.79,15,22',
      'ASSA ABLOY AB ser. B,3,2024,300.0,320.0,295.0,315.0,300.0,285.0,5.00,-1.67,8.47,3.51,8,25'
    ];
    
    return header + '\n' + sampleRows.join('\n');
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