import { useState, useCallback, useMemo } from 'react';
import { useStockData } from './useStockData';
import {
  RollingLowData,
  SupportBreak,
  BreakCluster,
  BreakStatistics,
  ConsecutiveBreaksAnalysis,
} from '@/types/consecutiveBreaks';

interface FilterParams {
  dateFrom: Date | null;
  dateTo: Date | null;
  periodDays: number;
  maxGapDays: number;
}

export const useConsecutiveBreaksAnalysis = () => {
  const { allStockData } = useStockData();
  const [selectedStock, setSelectedStock] = useState<string>('');

  // Get unique stock names
  const uniqueStocks = useMemo(() => {
    if (!allStockData || allStockData.length === 0) return [];
    return Array.from(new Set(allStockData.map((d) => d.name)))
      .filter((name) => name && name.trim() !== '')
      .sort();
  }, [allStockData]);

  // Initialize default stock on first load
  useMemo(() => {
    if (selectedStock === '' && uniqueStocks.length > 0) {
      setSelectedStock(uniqueStocks[0]);
    }
  }, [uniqueStocks, selectedStock]);

  const filterDataByDate = useCallback(
    (data: typeof allStockData, fromDate: Date, toDate: Date) => {
      return data.filter((d) => {
        const date = new Date(d.date);
        return date >= fromDate && date <= toDate;
      });
    },
    []
  );

  const calculateRollingLow = useCallback((data: typeof allStockData, periodDays: number): RollingLowData[] => {
    const result: RollingLowData[] = [];

    for (let i = 0; i < data.length; i++) {
      const currentDate = new Date(data[i].date);
      const lookbackDate = new Date(currentDate);
      lookbackDate.setDate(lookbackDate.getDate() - periodDays);

      // More efficient: find the start index of the lookback window
      let startIdx = 0;
      for (let j = i; j >= 0; j--) {
        const checkDate = new Date(data[j].date);
        if (checkDate < lookbackDate) {
          startIdx = j + 1;
          break;
        }
        if (j === 0) {
          startIdx = 0;
        }
      }

      // Find minimum low only within the lookback window
      let minLow = Infinity;
      for (let j = startIdx; j <= i; j++) {
        minLow = Math.min(minLow, data[j].low);
      }

      result.push({
        date: data[i].date,
        open: data[i].open,
        high: data[i].high,
        low: data[i].low,
        close: data[i].close,
        volume: data[i].volume,
        rolling_low: minLow === Infinity ? null : minLow,
      });
    }

    return result;
  }, []);

  const analyzeSupportBreaks = useCallback((data: RollingLowData[]): SupportBreak[] => {
    const breaks: SupportBreak[] = [];

    for (let i = 1; i < data.length; i++) {
      if (data[i].rolling_low && data[i - 1].rolling_low) {
        if (data[i].rolling_low < data[i - 1].rolling_low) {
          const daysSince =
            breaks.length > 0
              ? Math.floor(
                  (new Date(data[i].date).getTime() - new Date(breaks[breaks.length - 1].date).getTime()) /
                    (1000 * 60 * 60 * 24)
                )
              : null;

          breaks.push({
            date: data[i].date,
            prev_support: data[i - 1].rolling_low,
            new_support: data[i].rolling_low,
            drop_pct: ((data[i].rolling_low - data[i - 1].rolling_low) / data[i - 1].rolling_low) * 100,
            days_since: daysSince,
          });
        }
      }
    }

    return breaks;
  }, []);

  const analyzeConsecutiveBreaks = useCallback((breaks: SupportBreak[], maxGap: number): BreakCluster[] => {
    if (breaks.length === 0) return [];

    const clusters: BreakCluster[] = [];
    let currentCluster = [breaks[0]];
    let clusterId = 0;

    for (let i = 1; i < breaks.length; i++) {
      const currentDate = new Date(breaks[i].date);
      const prevDate = new Date(breaks[i - 1].date);
      const daysDiff = (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);

      if (daysDiff <= maxGap) {
        currentCluster.push(breaks[i]);
      } else {
        if (currentCluster.length > 0) {
          const clusterData = createClusterData(clusterId, currentCluster);
          clusters.push(clusterData);
          clusterId++;
        }
        currentCluster = [breaks[i]];
      }
    }

    if (currentCluster.length > 0) {
      const clusterData = createClusterData(clusterId, currentCluster);
      clusters.push(clusterData);
    }

    return clusters;
  }, []);

  const createClusterData = (clusterId: number, clusterBreaks: SupportBreak[]): BreakCluster => {
    const gaps: number[] = [];
    for (let j = 1; j < clusterBreaks.length; j++) {
      const d =
        (new Date(clusterBreaks[j].date).getTime() - new Date(clusterBreaks[j - 1].date).getTime()) /
        (1000 * 60 * 60 * 24);
      gaps.push(d);
    }

    const totalDrop = clusterBreaks.reduce((sum, b) => sum + b.drop_pct, 0);

    return {
      id: clusterId,
      breaks: clusterBreaks,
      num_breaks: clusterBreaks.length,
      start_date: clusterBreaks[0].date,
      end_date: clusterBreaks[clusterBreaks.length - 1].date,
      duration_days: Math.floor(
        (new Date(clusterBreaks[clusterBreaks.length - 1].date).getTime() -
          new Date(clusterBreaks[0].date).getTime()) /
          (1000 * 60 * 60 * 24)
      ),
      avg_gap: gaps.length > 0 ? gaps.reduce((a, b) => a + b) / gaps.length : undefined,
      min_gap: gaps.length > 0 ? Math.min(...gaps) : undefined,
      max_gap: gaps.length > 0 ? Math.max(...gaps) : undefined,
      total_drop: totalDrop,
      avg_drop: totalDrop / clusterBreaks.length,
    };
  };

  const calculateBreakStats = useCallback(
    (data: RollingLowData[], breaks: SupportBreak[]): BreakStatistics | null => {
      if (breaks.length === 0) return null;

      const totalDays = data.length;
      const stability = ((totalDays - breaks.length) / totalDays) * 100;

      const dropPcts = breaks.map((b) => b.drop_pct);
      const avgDrop = dropPcts.reduce((a, b) => a + b, 0) / dropPcts.length;
      const maxDrop = Math.min(...dropPcts);

      const daysBetween = breaks.filter((b) => b.days_since !== null).map((b) => b.days_since as number);
      const avgDaysBetween =
        daysBetween.length > 0 ? daysBetween.reduce((a, b) => a + b, 0) / daysBetween.length : null;

      const medianDaysBetween =
        daysBetween.length > 0
          ? daysBetween.sort((a, b) => a - b)[Math.floor(daysBetween.length / 2)]
          : null;

      const minDaysBetween = daysBetween.length > 0 ? Math.min(...daysBetween) : null;
      const maxDaysBetween = daysBetween.length > 0 ? Math.max(...daysBetween) : null;

      const lastBreak = new Date(breaks[breaks.length - 1].date);
      const lastDate = new Date(data[data.length - 1].date);
      const daysSinceLastBreak = Math.floor((lastDate.getTime() - lastBreak.getTime()) / (1000 * 60 * 60 * 24));

      const firstBreak = new Date(breaks[0].date);
      const firstDate = new Date(data[0].date);
      const daysBeforeFirstBreak = Math.floor((firstBreak.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));

      return {
        totalBreaks: breaks.length,
        stability,
        avgDrop,
        maxDrop,
        avgDaysBetween,
        medianDaysBetween,
        minDaysBetween,
        maxDaysBetween,
        daysSinceLastBreak,
        daysBeforeFirstBreak,
        tradingDaysPerBreak: totalDays / breaks.length,
        firstBreakDate: breaks[0].date,
        lastBreakDate: breaks[breaks.length - 1].date,
      };
    },
    []
  );

  const analyzeStock = useCallback(
    (stockName: string, params: FilterParams): ConsecutiveBreaksAnalysis | null => {
      // Get stock data
      const stockData = allStockData.filter((d) => d.name === stockName).sort((a, b) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      if (stockData.length === 0) return null;

      // Determine date range
      let fromDate = params.dateFrom;
      let toDate = params.dateTo;

      if (!fromDate) {
        fromDate = new Date(stockData[0].date);
      }
      if (!toDate) {
        toDate = new Date(stockData[stockData.length - 1].date);
      }

      // Filter by date
      const filteredData = filterDataByDate(stockData, fromDate, toDate);

      // Calculate rolling low
      const dataWithRollingLow = calculateRollingLow(filteredData, params.periodDays);

      // Analyze breaks
      const breaks = analyzeSupportBreaks(dataWithRollingLow);

      // Analyze clusters
      const clusters = analyzeConsecutiveBreaks(breaks, params.maxGapDays);

      // Calculate stats
      const stats = calculateBreakStats(dataWithRollingLow, breaks);

      return {
        stockName,
        data: dataWithRollingLow,
        breaks,
        clusters,
        stats,
      };
    },
    [allStockData, filterDataByDate, calculateRollingLow, analyzeSupportBreaks, analyzeConsecutiveBreaks, calculateBreakStats]
  );

  return {
    uniqueStocks,
    selectedStock,
    setSelectedStock,
    analyzeStock,
  };
};
