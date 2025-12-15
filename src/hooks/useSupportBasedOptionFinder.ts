import { useCallback } from 'react';
import { useEnrichedOptionsData } from './useEnrichedOptionsData';
import { useSupportLevelMetrics } from './useSupportLevelMetrics';

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
  // New metrics from pre-calculated data
  maxConsecutiveBreaks?: number;
  currentConsecutiveBreaks?: number;
  supportStrengthScore?: number;
  patternType?: string;
  breakProbability30d?: number;
  breakProbability60d?: number;
  stabilityTrend?: string;
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
  powBayesianCalibrated: number;
  powOriginal: number;
  daysToExpiry: number;
  supportStability: number;
  daysSinceLastBreak: number | null;
  numBreaks: number;
  strikeBelowLowerAtAcc: string;
  bidAskSpread: number;
  lowerBoundAtAccuracy: number | null;
  // New metrics from pre-calculated data
  maxConsecutiveBreaks?: number;
  currentConsecutiveBreaks?: number;
  supportStrengthScore?: number;
  patternType?: string;
  breakProbability30d?: number;
  breakProbability60d?: number;
  stabilityTrend?: string;
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
  // New filter criteria
  minSupportStrength?: number;
  patternTypes?: string[];
  maxBreakProbability30d?: number;
  stabilityTrends?: string[];
}

export const useSupportBasedOptionFinder = () => {
  const { data: optionsData, isLoading: optionsLoading } = useEnrichedOptionsData();
  const { data: metricsData, isLoading: metricsLoading, getMetricsForStock } = useSupportLevelMetrics();

  // Filter and rank options based on criteria
  const findOptions = useCallback((criteria: FilterCriteria): SupportBasedOption[] => {
    if (!optionsData || optionsData.length === 0) return [];
    if (!metricsData || metricsData.length === 0) return [];

    const results: SupportBasedOption[] = [];

    optionsData.forEach(option => {
      // Get pre-calculated metrics for this stock and rolling period
      const metrics = getMetricsForStock(option.StockName, criteria.rollingPeriod);
      if (!metrics) return;

      // Filter: Expiry date
      if (criteria.expiryDate && option.ExpiryDate !== criteria.expiryDate) return;

      // Filter: Days since last break
      if (metrics.days_since_last_break !== null &&
          metrics.days_since_last_break < criteria.minDaysSinceBreak) return;

      // Filter: Rolling low must exist
      if (metrics.rolling_low === null) return;

      // Filter: Strike must be at or below rolling low
      if (option.StrikePrice > metrics.rolling_low) return;

      // Filter: Probability of worthless (using Bayesian Calibrated for filtering)
      const powBayesianCalibrated = option['ProbWorthless_Bayesian_IsoCal'] ?? 0;
      const powOriginal = option['1_ProbOfWorthless_Original'] ?? 0;
      if (powBayesianCalibrated < criteria.minProbOfWorthless) return;

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

      // NEW FILTERS: Support strength
      if (criteria.minSupportStrength !== undefined &&
          metrics.support_strength_score < criteria.minSupportStrength) return;

      // NEW FILTERS: Pattern types
      if (criteria.patternTypes && criteria.patternTypes.length > 0 &&
          !criteria.patternTypes.includes(metrics.pattern_type)) return;

      // NEW FILTERS: Break probability
      if (criteria.maxBreakProbability30d !== undefined &&
          metrics.break_probability_30d > criteria.maxBreakProbability30d) return;

      // NEW FILTERS: Stability trends
      if (criteria.stabilityTrends && criteria.stabilityTrends.length > 0 &&
          !criteria.stabilityTrends.includes(metrics.stability_trend)) return;

      // Calculate distances
      // Distance to Support: negative percentage showing how much stock needs to fall to reach support
      const distanceToSupport = metrics.current_price > 0
        ? ((metrics.rolling_low - metrics.current_price) / metrics.current_price) * 100
        : null;
      const strikeVsSupport = metrics.rolling_low
        ? ((option.StrikePrice - metrics.rolling_low) / metrics.rolling_low) * 100
        : null;

      // Filter: Strike position
      if (criteria.strikePosition === 'at_support') {
        // Strike should be within 2% of support
        if (strikeVsSupport === null || Math.abs(strikeVsSupport) > 2) return;
      } else if (criteria.strikePosition === 'below_median_drop') {
        // Strike should be at support minus median drop percentage
        if (metrics.median_drop_per_break_pct === null) return;
        const targetStrike = metrics.rolling_low * (1 + metrics.median_drop_per_break_pct / 100);
        const strikeVsTarget = Math.abs(option.StrikePrice - targetStrike) / targetStrike * 100;
        if (strikeVsTarget > 5) return; // Within 5% of target
      } else if (criteria.strikePosition === 'percent_below') {
        // Strike should be X% below support
        if (!criteria.percentBelow) return;
        const targetStrike = metrics.rolling_low * (1 - criteria.percentBelow / 100);
        const strikeVsTarget = Math.abs(option.StrikePrice - targetStrike) / targetStrike * 100;
        if (strikeVsTarget > 5) return; // Within 5% of target
      }
      // 'any' - no additional filter

      results.push({
        optionName: option.OptionName,
        stockName: option.StockName,
        expiryDate: option.ExpiryDate,
        strikePrice: option.StrikePrice,
        currentPrice: metrics.current_price,
        rollingLow: metrics.rolling_low,
        distanceToSupport,
        strikeVsSupport,
        medianDropPerBreak: metrics.median_drop_per_break_pct,
        premium: option.Premium ?? 0,
        powBayesianCalibrated,
        powOriginal,
        daysToExpiry,
        supportStability: metrics.support_stability_pct,
        daysSinceLastBreak: metrics.days_since_last_break,
        numBreaks: metrics.total_breaks,
        strikeBelowLowerAtAcc: option.StrikeBelowLowerAtAcc ?? '',
        bidAskSpread,
        lowerBoundAtAccuracy: option.Lower_Bound_at_Accuracy ?? null,
        // Add new metrics
        maxConsecutiveBreaks: metrics.max_consecutive_breaks,
        currentConsecutiveBreaks: metrics.current_consecutive_breaks,
        supportStrengthScore: metrics.support_strength_score,
        patternType: metrics.pattern_type,
        breakProbability30d: metrics.break_probability_30d,
        breakProbability60d: metrics.break_probability_60d,
        stabilityTrend: metrics.stability_trend,
      });
    });

    // Sort by premium descending
    return results.sort((a, b) => b.premium - a.premium);
  }, [optionsData, metricsData, getMetricsForStock]);

  return {
    findOptions,
    isLoading: optionsLoading || metricsLoading,
  };
};
