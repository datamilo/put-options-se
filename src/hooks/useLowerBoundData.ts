/**
 * Custom hooks for loading and parsing Lower Bound validation analysis data
 */

import { useQuery } from '@tanstack/react-query';
import Papa from 'papaparse';
import {
  MonthlyTrendData,
  LowerBoundDailyPrediction,
  LowerBoundExpiryStatistic,
  AllLowerBoundData,
  LowerBoundSummaryMetrics,
} from '@/types/lowerBound';

const GITHUB_RAW_URL = import.meta.env.VITE_GITHUB_RAW_URL || 'https://raw.githubusercontent.com/datamilo/put-options-se/main';

/**
 * Hook to load monthly trend data (hit rates by month)
 */
export const useLowerBoundTrendData = () => {
  return useQuery({
    queryKey: ['lowerBound', 'trends'],
    queryFn: async (): Promise<MonthlyTrendData[]> => {
      const response = await fetch(
        `${GITHUB_RAW_URL}/data/hit_rate_trends_by_stock.csv`
      );
      if (!response.ok) throw new Error('Failed to load trend data');

      const text = await response.text();
      return new Promise((resolve, reject) => {
        Papa.parse<MonthlyTrendData>(text, {
          header: true,
          dynamicTyping: {
            HitRate: true,
            Total: true,
          },
          skipEmptyLines: true,
          error: (error) => reject(error),
          complete: (results) => {
            resolve(results.data as MonthlyTrendData[]);
          },
        });
      });
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days
  });
};

/**
 * Hook to load daily prediction data
 */
export const useLowerBoundDailyPredictions = () => {
  return useQuery({
    queryKey: ['lowerBound', 'dailyPredictions'],
    queryFn: async (): Promise<LowerBoundDailyPrediction[]> => {
      const response = await fetch(
        `${GITHUB_RAW_URL}/data/all_stocks_daily_predictions.csv`
      );
      if (!response.ok) throw new Error('Failed to load daily predictions');

      const text = await response.text();
      return new Promise((resolve, reject) => {
        Papa.parse<LowerBoundDailyPrediction>(text, {
          header: true,
          delimiter: '|',
          dynamicTyping: {
            StockPrice: true,
            LowerBound: true,
            StrikePrice: true,
          },
          skipEmptyLines: true,
          error: (error) => reject(error),
          complete: (results) => {
            resolve(results.data as LowerBoundDailyPrediction[]);
          },
        });
      });
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days
  });
};

/**
 * Hook to load expiry statistics (aggregated data by expiry)
 */
export const useLowerBoundExpiryStats = () => {
  return useQuery({
    queryKey: ['lowerBound', 'expiryStats'],
    queryFn: async (): Promise<LowerBoundExpiryStatistic[]> => {
      const response = await fetch(
        `${GITHUB_RAW_URL}/data/all_stocks_expiry_stats.csv`
      );
      if (!response.ok) throw new Error('Failed to load expiry stats');

      const text = await response.text();
      return new Promise((resolve, reject) => {
        Papa.parse<LowerBoundExpiryStatistic>(text, {
          header: true,
          delimiter: '|',
          dynamicTyping: {
            LowerBound_Min: true,
            LowerBound_Max: true,
            LowerBound_Median: true,
            LowerBound_Mean: true,
            PredictionCount: true,
            BreachCount: true,
            ExpiryClosePrice: true,
          },
          skipEmptyLines: true,
          error: (error) => reject(error),
          complete: (results) => {
            resolve(results.data as LowerBoundExpiryStatistic[]);
          },
        });
      });
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days
  });
};

/**
 * Composite hook that loads and aggregates all lower bound data
 */
export const useAllLowerBoundData = () => {
  const trendsQuery = useLowerBoundTrendData();
  const dailyQuery = useLowerBoundDailyPredictions();
  const expiryQuery = useLowerBoundExpiryStats();

  return useQuery({
    queryKey: ['lowerBound', 'all'],
    queryFn: (): AllLowerBoundData => {
      if (!trendsQuery.data || !dailyQuery.data || !expiryQuery.data) {
        throw new Error('Data not loaded');
      }

      // Extract unique stocks with sufficient data (at least 6 expiry dates)
      const expiryCountByStock = new Map<string, number>();
      expiryQuery.data.forEach((stat) => {
        const current = expiryCountByStock.get(stat.Stock) || 0;
        expiryCountByStock.set(stat.Stock, current + 1);
      });

      const stocks = Array.from(
        new Set(
          dailyQuery.data
            .map((d) => d.Stock)
            .filter((stock) => (expiryCountByStock.get(stock) || 0) >= 6)
        )
      ).sort();

      // Calculate summary metrics
      const allExpiryStats = expiryQuery.data;
      const totalBreaches = allExpiryStats.reduce(
        (sum, stat) => sum + stat.BreachCount,
        0
      );
      const totalPredictions = allExpiryStats.reduce(
        (sum, stat) => sum + stat.PredictionCount,
        0
      );
      const overallHitRate =
        totalPredictions > 0
          ? ((totalPredictions - totalBreaches) / totalPredictions) * 100
          : 0;

      // Get date range
      const dates = dailyQuery.data
        .map((d) => new Date(d.ExpiryDate))
        .sort((a, b) => a.getTime() - b.getTime());
      const dateRangeStart = dates.length > 0 ? dates[0].toISOString().split('T')[0] : '';
      const dateRangeEnd = dates.length > 0 ? dates[dates.length - 1].toISOString().split('T')[0] : '';

      const summaryMetrics: LowerBoundSummaryMetrics = {
        totalOptions: totalPredictions,
        totalStocks: stocks.length,
        overallHitRate: Math.round(overallHitRate * 100) / 100,
        dateRangeStart,
        dateRangeEnd,
        totalBreaches,
      };

      return {
        dailyPredictions: dailyQuery.data,
        expiryStats: expiryQuery.data,
        monthlyTrends: trendsQuery.data,
        stocks,
        summaryMetrics,
        lastUpdated: new Date(),
      };
    },
    enabled: trendsQuery.isSuccess && dailyQuery.isSuccess && expiryQuery.isSuccess,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days
  });
};

/**
 * Helper hook to get data for a specific stock
 */
export const useLowerBoundStockData = (stock: string) => {
  const { data: allData, ...query } = useAllLowerBoundData();

  return {
    ...query,
    data: allData
      ? {
          stock,
          dailyPredictions: allData.dailyPredictions.filter((d) => d.Stock === stock),
          expiryStats: allData.expiryStats.filter((s) => s.Stock === stock),
          monthlyTrends: allData.monthlyTrends.filter((t) => t.Stock === stock),
          totalPredictions: allData.expiryStats
            .filter((s) => s.Stock === stock)
            .reduce((sum, s) => sum + s.PredictionCount, 0),
          totalBreaches: allData.expiryStats
            .filter((s) => s.Stock === stock)
            .reduce((sum, s) => sum + s.BreachCount, 0),
          overallHitRate: (() => {
            const stats = allData.expiryStats.filter((s) => s.Stock === stock);
            const totalPred = stats.reduce((sum, s) => sum + s.PredictionCount, 0);
            const totalBreaches = stats.reduce((sum, s) => sum + s.BreachCount, 0);
            return totalPred > 0 ? ((totalPred - totalBreaches) / totalPred) * 100 : 0;
          })(),
          dateRange: allData.summaryMetrics
            ? {
                start: allData.summaryMetrics.dateRangeStart,
                end: allData.summaryMetrics.dateRangeEnd,
              }
            : { start: '', end: '' },
        }
      : undefined,
  };
};
