import { useMemo, useCallback } from 'react';
import { useEnrichedOptionsData } from './useEnrichedOptionsData';
import { useConsecutiveBreaksAnalysis } from './useConsecutiveBreaksAnalysis';
import { useStockData } from './useStockData';

export interface SupportMetrics {
  stockName: string;
  currentPrice: number;
  rollingLow: number | null;
  daysSinceLastBreak: number | null;
  supportStability: number;
  numBreaks: number;
  medianDropPerBreak: number | null;
  avgDropPerBreak: number | null;
  lastBreakDate: string | null;
}

export interface SupportBasedOption {
  optionName: string;
  stockName: string;
  expiryDate: string;
  strikePrice: number;
  currentPrice: number;
  rollingLow: number | null;
  distanceToSupport: number | null;
  strikeVsSupport: number | null;
  medianDropPerBreak: number | null;
  premium: number;
  probOfWorthless: number;
  daysToExpiry: number;
  supportStability: number;
  daysSinceLastBreak: number | null;
  numBreaks: number;
  strikeBelowLowerAtAcc: string;
  bidAskSpread: number;
  lowerBoundAtAccuracy: number | null;
}

export interface FilterCriteria {
  rollingPeriod: number;
  minDaysSinceBreak: number;
  strikePosition: 'at_support' | 'below_median_drop' | 'percent_below' | 'any';
  percentBelow?: number;
  minProbOfWorthless: number;
  maxDaysToExpiry: number;
  minPremium: number;
  requireStrikeBelowLowerAtAcc: boolean;
  maxBidAskSpread: number;
  expiryDate?: string;
}

export const useSupportBasedOptionFinder = () => {
  const { data: optionsData, isLoading: optionsLoading } = useEnrichedOptionsData();
  const { uniqueStocks, analyzeStock } = useConsecutiveBreaksAnalysis();
  const { allStockData, getLowPriceForPeriod } = useStockData();

  // Memoize support metrics by rolling period to avoid recalculation on every filter change
  const supportMetricsCache = useMemo(() => {
    const cache: Map<number, Map<string, SupportMetrics>> = new Map();

    const calculateForPeriod = (rollingPeriod: number): Map<string, SupportMetrics> => {
      if (cache.has(rollingPeriod)) {
        return cache.get(rollingPeriod)!;
      }

      const metrics = new Map<string, SupportMetrics>();

      if (!uniqueStocks || uniqueStocks.length === 0) return metrics;

      uniqueStocks.forEach(stockName => {
        // Get latest stock price
        const stockDataForStock = allStockData
          .filter(d => d.name === stockName)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        if (stockDataForStock.length === 0) return;

        const currentPrice = stockDataForStock[0].close;

        // Get rolling low using the same method as Strike Price Below filter
        const rollingLow = getLowPriceForPeriod(stockName, rollingPeriod);

        // Analyze with specified rolling period for break statistics
        const analysis = analyzeStock(stockName, {
          dateFrom: null,
          dateTo: null,
          periodDays: rollingPeriod,
          maxGapDays: 30,
        });

        if (!analysis) return;

        // Calculate median drop per break from clusters
        let medianDropPerBreak = null;
        let avgDropPerBreak = null;
        if (analysis.clusters.length > 0) {
          const allMedianDrops = analysis.clusters.map(c => c.median_drop);
          allMedianDrops.sort((a, b) => a - b);
          medianDropPerBreak = allMedianDrops.length % 2 === 0
            ? (allMedianDrops[allMedianDrops.length / 2 - 1] + allMedianDrops[allMedianDrops.length / 2]) / 2
            : allMedianDrops[Math.floor(allMedianDrops.length / 2)];

          const allAvgDrops = analysis.clusters.map(c => c.avg_drop);
          avgDropPerBreak = allAvgDrops.reduce((a, b) => a + b, 0) / allAvgDrops.length;
        }

        metrics.set(stockName, {
          stockName,
          currentPrice,
          rollingLow,
          daysSinceLastBreak: analysis.stats?.daysSinceLastBreak ?? null,
          supportStability: analysis.stats?.stability ?? 0,
          numBreaks: analysis.breaks.length,
          medianDropPerBreak,
          avgDropPerBreak,
          lastBreakDate: analysis.breaks.length > 0 ? analysis.breaks[analysis.breaks.length - 1].date : null,
        });
      });

      cache.set(rollingPeriod, metrics);
      return metrics;
    };

    return { cache, calculateForPeriod };
  }, [uniqueStocks, analyzeStock, allStockData, getLowPriceForPeriod]);

  // Filter and rank options based on criteria
  const findOptions = useCallback((criteria: FilterCriteria): SupportBasedOption[] => {
    if (!optionsData || optionsData.length === 0) return [];

    // Get support metrics for the specified rolling period (cached if already computed)
    const supportMetrics = supportMetricsCache.calculateForPeriod(criteria.rollingPeriod);

    const results: SupportBasedOption[] = [];

    optionsData.forEach(option => {
      const metrics = supportMetrics.get(option.StockName);
      if (!metrics) return;

      // Filter: Expiry date
      if (criteria.expiryDate && option.ExpiryDate !== criteria.expiryDate) return;

      // Filter: Days since last break
      if (metrics.daysSinceLastBreak !== null &&
          metrics.daysSinceLastBreak < criteria.minDaysSinceBreak) return;

      // Filter: Rolling low must exist
      if (metrics.rollingLow === null) return;

      // Filter: Strike must be at or below rolling low
      if (option.StrikePrice > metrics.rollingLow) return;

      // Filter: Probability of worthless
      const pow = option['1_2_3_ProbOfWorthless_Weighted'] ?? 0;
      if (pow < criteria.minProbOfWorthless) return;

      // Filter: Days to expiry
      const daysToExpiry = Math.floor(
        (new Date(option.ExpiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysToExpiry > criteria.maxDaysToExpiry || daysToExpiry < 0) return;

      // Filter: Minimum premium
      if ((option.Premium ?? 0) < criteria.minPremium) return;

      // Filter: StrikeBelowLowerAtAcc
      if (criteria.requireStrikeBelowLowerAtAcc && option.StrikeBelowLowerAtAcc !== 'Y') return;

      // Filter: Bid-ask spread
      const bidAskSpread = (option.Ask ?? 0) - (option.Bid ?? 0);
      if (bidAskSpread > criteria.maxBidAskSpread) return;

      // Calculate distances
      const distanceToSupport = ((metrics.currentPrice - metrics.rollingLow) / metrics.currentPrice) * 100;
      const strikeVsSupport = metrics.rollingLow
        ? ((option.StrikePrice - metrics.rollingLow) / metrics.rollingLow) * 100
        : null;

      // Filter: Strike position
      if (criteria.strikePosition === 'at_support') {
        // Strike should be within 2% of support
        if (strikeVsSupport === null || Math.abs(strikeVsSupport) > 2) return;
      } else if (criteria.strikePosition === 'below_median_drop') {
        // Strike should be at support minus median drop percentage
        if (metrics.medianDropPerBreak === null) return;
        const targetStrike = metrics.rollingLow * (1 + metrics.medianDropPerBreak / 100);
        const strikeVsTarget = Math.abs(option.StrikePrice - targetStrike) / targetStrike * 100;
        if (strikeVsTarget > 5) return; // Within 5% of target
      } else if (criteria.strikePosition === 'percent_below') {
        // Strike should be X% below support
        if (!criteria.percentBelow) return;
        const targetStrike = metrics.rollingLow * (1 - criteria.percentBelow / 100);
        const strikeVsTarget = Math.abs(option.StrikePrice - targetStrike) / targetStrike * 100;
        if (strikeVsTarget > 5) return; // Within 5% of target
      }
      // 'any' - no additional filter

      results.push({
        optionName: option.OptionName,
        stockName: option.StockName,
        expiryDate: option.ExpiryDate,
        strikePrice: option.StrikePrice,
        currentPrice: metrics.currentPrice,
        rollingLow: metrics.rollingLow,
        distanceToSupport,
        strikeVsSupport,
        medianDropPerBreak: metrics.medianDropPerBreak,
        premium: option.Premium ?? 0,
        probOfWorthless: pow,
        daysToExpiry,
        supportStability: metrics.supportStability,
        daysSinceLastBreak: metrics.daysSinceLastBreak,
        numBreaks: metrics.numBreaks,
        strikeBelowLowerAtAcc: option.StrikeBelowLowerAtAcc ?? '',
        bidAskSpread,
        lowerBoundAtAccuracy: option.Lower_Bound_at_Accuracy ?? null,
      });
    });

    // Sort by premium descending
    return results.sort((a, b) => b.premium - a.premium);
  }, [optionsData, supportMetricsCache]);

  return {
    findOptions,
    isLoading: optionsLoading,
  };
};
