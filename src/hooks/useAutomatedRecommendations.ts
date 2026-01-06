import { useCallback, useMemo } from 'react';
import { useEnrichedOptionsData } from './useEnrichedOptionsData';
import { useSupportLevelMetrics } from './useSupportLevelMetrics';
import { useProbabilityHistory } from './useProbabilityHistory';
import { useProbabilityRecoveryData } from './useProbabilityRecoveryData';
import { useMonthlyStockData } from './useMonthlyStockData';
import { useStockData } from './useStockData';
import type {
  RecommendationFilters,
  ScoreWeights,
  RecommendedOption,
  ScoreBreakdown,
  ScoreComponent,
} from '@/types/recommendations';

// Helper functions for binning
const getProbabilityBin = (prob: number): string => {
  if (prob < 0.5) return '<50%';
  if (prob < 0.6) return '50-60%';
  if (prob < 0.7) return '60-70%';
  if (prob < 0.8) return '70-80%';
  if (prob < 0.9) return '80-90%';
  return '90%+';
};

const getDTEBin = (daysToExpiry: number): string => {
  if (daysToExpiry <= 7) return '0-7';
  if (daysToExpiry <= 14) return '8-14';
  if (daysToExpiry <= 21) return '15-21';
  if (daysToExpiry <= 28) return '22-28';
  if (daysToExpiry <= 35) return '29-35';
  return '36+';
};

// Map probability method field names to recovery data method names
const mapProbabilityMethodToRecoveryMethod = (fieldName: string): string => {
  const methodMap: Record<string, string> = {
    'ProbWorthless_Bayesian_IsoCal': 'PoW - Bayesian Calibrated',
    '1_2_3_ProbOfWorthless_Weighted': 'PoW - Weighted Average',
    '1_ProbOfWorthless_Original': 'PoW - Original Black-Scholes',
    '2_ProbOfWorthless_Calibrated': 'PoW - Bias Corrected',
    '3_ProbOfWorthless_Historical_IV': 'PoW - Historical IV',
  };
  return methodMap[fieldName] || fieldName;
};

// Score normalization functions (all return 0-100)
const normalizeSupportStrength = (score: number | null): number => {
  if (score === null) return 50;
  return Math.min(100, Math.max(0, score));
};

const normalizeDaysSinceBreak = (
  days: number | null,
  avgDaysBetween: number | null
): number => {
  if (days === null) return 50; // No data = neutral
  const avgGap = avgDaysBetween || 30; // default 30 if no avg
  const ratio = days / avgGap;
  return Math.min(100, Math.max(0, ratio * 50));
};

const normalizeRecoveryAdvantage = (advantagePp: number | null): number => {
  if (advantagePp === null) return 50; // No data = neutral
  // Advantage_pp typically ranges from -10 to +50
  // 0pp = 50 score, +30pp = 100 score, -10pp = 0 score
  return Math.min(100, Math.max(0, 50 + advantagePp * 1.67));
};

const normalizeHistoricalPeak = (
  currentProb: number,
  peakProb: number | null,
  threshold: number
): number => {
  if (peakProb === null) return 50;

  // Score higher if peak was >= threshold AND current is notably lower
  if (peakProb < threshold) return 30; // Not a recovery candidate

  const drop = peakProb - currentProb;
  // If drop is 10%+ from a 90%+ peak, good recovery candidate
  return Math.min(100, 50 + drop * 200);
};

const normalizeSeasonality = (
  positiveRate: number | null,
  currentDay: number,
  typicalLowDay: number | null
): number => {
  if (positiveRate === null) return 50;

  // Base score from positive rate (0-100 already in %)
  let score = positiveRate;

  // Bonus if current day is near typical low day
  if (typicalLowDay !== null) {
    const dayDiff = Math.abs(currentDay - typicalLowDay);
    if (dayDiff <= 3) score += 10; // Near typical low
  }

  return Math.min(100, score);
};

const normalizeCurrentPerformance = (
  currentMonthPct: number | null,
  avgMonthPct: number | null
): number => {
  if (currentMonthPct === null || avgMonthPct === null) return 50;

  // Score higher if underperforming (potential bounce opportunity)
  const underperformance = avgMonthPct - currentMonthPct;

  // If underperforming by 5%+, score 100; if outperforming by 5%+, score 0
  return Math.min(100, Math.max(0, 50 + underperformance * 10));
};

// Calculate typical low day (mode) from monthly stats
const getTypicalLowDay = (monthlyStats: any): number | null => {
  if (!monthlyStats || !monthlyStats.day_low_day_of_month) return null;
  // For simplicity, return the median or first available value
  // In a full implementation, you'd calculate the mode across all months
  return monthlyStats.day_low_day_of_month || null;
};

export const useAutomatedRecommendations = () => {
  // Load all data sources
  const { data: optionsData, isLoading: optionsLoading } = useEnrichedOptionsData();
  const {
    data: supportMetrics,
    isLoading: supportLoading,
    getMetricsForStock,
  } = useSupportLevelMetrics();
  const { allData: probabilityHistory, isLoading: probHistoryLoading } =
    useProbabilityHistory();
  const { chartData: recoveryData, isLoading: recoveryLoading } =
    useProbabilityRecoveryData();
  const { monthlyStats, isLoading: monthlyLoading } = useMonthlyStockData();
  const { getStockSummary, isLoading: stockLoading } = useStockData();

  // Combined loading state
  const isLoading =
    optionsLoading ||
    supportLoading ||
    probHistoryLoading ||
    recoveryLoading ||
    monthlyLoading ||
    stockLoading;

  // Pre-build lookup maps for O(1) access
  const probabilityPeaksMap = useMemo(() => {
    const map = new Map<string, number>();
    console.log('🔍 Building probabilityPeaksMap...');
    console.log('probabilityHistory type:', typeof probabilityHistory);
    console.log('probabilityHistory is array:', Array.isArray(probabilityHistory));
    console.log('probabilityHistory length:', probabilityHistory?.length);
    console.log('probabilityHistory value:', probabilityHistory);

    if (probabilityHistory && Array.isArray(probabilityHistory)) {
      probabilityHistory.forEach((p) => {
        const key = p.OptionName;
        const existing = map.get(key);
        const bayesianValue = p.ProbWorthless_Bayesian_IsoCal;
        if (!existing || bayesianValue > existing) {
          map.set(key, bayesianValue);
        }
      });
    }
    console.log(`✅ Built probabilityPeaksMap with ${map.size} entries`);
    return map;
  }, [probabilityHistory]);

  const monthlyStatsMap = useMemo(() => {
    const map = new Map<string, any>();
    const currentMonth = new Date().getMonth() + 1;
    if (monthlyStats && Array.isArray(monthlyStats)) {
      monthlyStats
        .filter((s) => s.month === currentMonth)
        .forEach((s) => map.set(s.name, s));
    }
    return map;
  }, [monthlyStats]);

  // Analysis function
  const analyzeOptions = useCallback(
    (filters: RecommendationFilters, weights: ScoreWeights): RecommendedOption[] => {
      if (!optionsData || optionsData.length === 0) return [];
      if (!supportMetrics || supportMetrics.length === 0) return [];

      const currentDay = new Date().getDate();
      const results: RecommendedOption[] = [];

      // Filter options first
      const filteredOptions = optionsData.filter((option) => {
        // Expiry date filter
        if (filters.expiryDate && option.ExpiryDate !== filters.expiryDate) return false;

        // Get support metrics
        const supportMetric = getMetricsForStock(option.StockName, filters.rollingPeriod);
        if (!supportMetric) return false;

        // Strike must be at or below rolling low
        if (
          supportMetric.rolling_low &&
          option.StrikePrice > supportMetric.rolling_low
        ) {
          return false;
        }

        // Days since break filter
        if (
          supportMetric.days_since_last_break !== null &&
          supportMetric.days_since_last_break < filters.minDaysSinceBreak
        ) {
          return false;
        }

        return true;
      });

      // Score each filtered option
      filteredOptions.forEach((option, idx) => {
        const supportMetric = getMetricsForStock(option.StockName, filters.rollingPeriod);
        if (!supportMetric) return;

        // Calculate days to expiry
        const daysToExpiry = Math.floor(
          (new Date(option.ExpiryDate).getTime() - new Date().getTime()) /
            (1000 * 60 * 60 * 24)
        );

        // Get current probability
        const currentProbability =
          option[filters.probabilityMethod as keyof typeof option] || 0;
        if (typeof currentProbability !== 'number') return;

        // Get historical peak
        const historicalPeakProbability = probabilityPeaksMap.get(option.OptionName) || null;

        // Debug: Log if we're finding probability peaks
        if (!historicalPeakProbability && idx === 0) {
          console.warn(`⚠️ Probability peaks map has ${probabilityPeaksMap.size} entries`);
          if (probabilityPeaksMap.size === 0) {
            console.warn('⚠️ probabilityPeaksMap is empty - probability history may not have loaded');
          }
        }

        // Get recovery advantage
        const probBin = getProbabilityBin(currentProbability);
        const dteBin = getDTEBin(daysToExpiry);

        let recoveryAdvantage: number | null = null;
        try {
          const thresholdKey = filters.historicalPeakThreshold.toFixed(2);
          const recoveryMethod = mapProbabilityMethodToRecoveryMethod(filters.probabilityMethod);

          // Debug: Log recovery data structure (only for first option)
          if (idx === 0) {
            console.log('🔍 Recovery data structure keys:', Object.keys(recoveryData));
            console.log('📊 Looking for threshold:', thresholdKey);
            console.log('🔑 Probability method (field):', filters.probabilityMethod);
            console.log('🔄 Mapped method (recovery):', recoveryMethod);
            if (recoveryData[thresholdKey]) {
              console.log('✅ Threshold found! Methods:', Object.keys(recoveryData[thresholdKey]));
              const methodData = recoveryData[thresholdKey]?.[recoveryMethod];
              console.log(`🔎 Method data:`, methodData ? `Found ${Object.keys(methodData).length} prob bins` : 'NOT found');
              if (methodData) {
                console.log('📊 Available prob bins:', Object.keys(methodData));
              }
            } else {
              console.warn('⚠️ Threshold NOT found:', thresholdKey);
            }
          }

          const recoveryPoint =
            recoveryData[thresholdKey]?.[recoveryMethod]?.[
              probBin
            ]?.[dteBin];

          // Log every lookup attempt for first few options
          if (idx < 3) {
            console.log(`🔍 Looking for: ${option.OptionName} - Prob: ${probBin} (current: ${(currentProbability * 100).toFixed(1)}%), DTE: ${dteBin} (days: ${daysToExpiry})`);
            if (!recoveryData[thresholdKey]?.[recoveryMethod]?.[probBin]) {
              console.warn(`⚠️ Prob bin '${probBin}' not found in recovery data`);
            } else if (!recoveryData[thresholdKey]?.[recoveryMethod]?.[probBin]?.[dteBin]) {
              console.warn(`⚠️ DTE bin '${dteBin}' not found for prob bin '${probBin}'`);
            }
          }

          if (recoveryPoint) {
            console.log(`🎯 Found recovery point for ${option.OptionName}: ${probBin} / ${dteBin}`, recoveryPoint);
            if (recoveryPoint.advantage !== undefined && recoveryPoint.advantage !== null) {
              recoveryAdvantage = recoveryPoint.advantage;
            }
          }
        } catch (e) {
          // Recovery data not available for this combination
          console.warn('Error looking up recovery data:', e);
        }

        // Get monthly stats
        const monthlyStats = monthlyStatsMap.get(option.StockName);
        const monthlyPositiveRate = monthlyStats?.pct_pos_return_months || null;
        const monthlyAvgReturn = monthlyStats?.return_month_mean_pct_return_month || null;
        const typicalLowDay = getTypicalLowDay(monthlyStats);

        // Get current stock performance
        const stockSummary = getStockSummary(option.StockName);
        const currentMonthPerformance = stockSummary?.priceChangePercentMonth || null;

        // Calculate normalized scores
        const supportStrengthNorm = normalizeSupportStrength(
          supportMetric.support_strength_score
        );
        const daysSinceBreakNorm = normalizeDaysSinceBreak(
          supportMetric.days_since_last_break,
          supportMetric.trading_days_per_break
        );
        const recoveryAdvantageNorm = normalizeRecoveryAdvantage(recoveryAdvantage);
        const historicalPeakNorm = normalizeHistoricalPeak(
          currentProbability,
          historicalPeakProbability,
          filters.historicalPeakThreshold
        );
        const seasonalityNorm = normalizeSeasonality(
          monthlyPositiveRate,
          currentDay,
          typicalLowDay
        );
        const currentPerformanceNorm = normalizeCurrentPerformance(
          currentMonthPerformance,
          monthlyAvgReturn
        );

        // Calculate weighted scores
        const scoreBreakdown: ScoreBreakdown = {
          supportStrength: {
            raw: supportMetric.support_strength_score,
            normalized: supportStrengthNorm,
            weighted: supportStrengthNorm * (weights.supportStrength / 100),
          },
          daysSinceBreak: {
            raw: supportMetric.days_since_last_break,
            normalized: daysSinceBreakNorm,
            weighted: daysSinceBreakNorm * (weights.daysSinceBreak / 100),
          },
          recoveryAdvantage: {
            raw: recoveryAdvantage,
            normalized: recoveryAdvantageNorm,
            weighted: recoveryAdvantageNorm * (weights.recoveryAdvantage / 100),
          },
          historicalPeak: {
            raw: historicalPeakProbability,
            normalized: historicalPeakNorm,
            weighted: historicalPeakNorm * (weights.historicalPeak / 100),
          },
          monthlySeasonality: {
            raw: monthlyPositiveRate,
            normalized: seasonalityNorm,
            weighted: seasonalityNorm * (weights.monthlySeasonality / 100),
          },
          currentPerformance: {
            raw: currentMonthPerformance,
            normalized: currentPerformanceNorm,
            weighted: currentPerformanceNorm * (weights.currentPerformance / 100),
          },
        };

        // Calculate composite score
        const compositeScore =
          scoreBreakdown.supportStrength.weighted +
          scoreBreakdown.daysSinceBreak.weighted +
          scoreBreakdown.recoveryAdvantage.weighted +
          scoreBreakdown.historicalPeak.weighted +
          scoreBreakdown.monthlySeasonality.weighted +
          scoreBreakdown.currentPerformance.weighted;

        // Calculate distance to support
        const distanceToSupportPct =
          supportMetric.current_price > 0 && supportMetric.rolling_low
            ? ((supportMetric.rolling_low - supportMetric.current_price) /
                supportMetric.current_price) *
              100
            : null;

        results.push({
          rank: 0, // Will be set after sorting
          optionName: option.OptionName,
          stockName: option.StockName,
          strikePrice: option.StrikePrice,
          currentPrice: supportMetric.current_price,
          expiryDate: option.ExpiryDate,
          daysToExpiry,
          premium: option.Premium || 0,
          rollingLow: supportMetric.rolling_low,
          distanceToSupportPct,
          daysSinceLastBreak: supportMetric.days_since_last_break,
          supportStrengthScore: supportMetric.support_strength_score,
          patternType: supportMetric.pattern_type,
          currentProbability,
          historicalPeakProbability,
          recoveryAdvantage,
          currentProbBin: probBin,
          dteBin,
          monthlyPositiveRate,
          monthlyAvgReturn,
          typicalLowDay,
          currentMonthPerformance,
          compositeScore,
          scoreBreakdown,
        });
      });

      // Sort by composite score descending
      results.sort((a, b) => b.compositeScore - a.compositeScore);

      // Assign ranks
      return results.map((option, index) => ({
        ...option,
        rank: index + 1,
      }));
    },
    [
      optionsData,
      supportMetrics,
      getMetricsForStock,
      probabilityPeaksMap,
      monthlyStatsMap,
      recoveryData,
      getStockSummary,
    ]
  );

  return {
    analyzeOptions,
    isLoading,
  };
};
