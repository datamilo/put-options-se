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

// Score normalization functions (all return object with normalized score and hasData flag)

interface NormalizationResult {
  normalized: number;
  hasData: boolean;
  dataStatus: 'available' | 'insufficient' | 'unavailable';
}

/**
 * Support Strength Score (0-100 scale)
 *
 * Pre-calculated composite metric from support_level_metrics.csv measuring
 * how reliably the support level has held historically.
 *
 * COMPONENTS (weighted average):
 * - Support Stability (30%): % of days support held
 * - Days Since Last Break (25%): Recency of breaks
 * - Break Frequency (25%): Predictability of breaks
 * - Drop Consistency (20%): Consistency of drop sizes
 *
 * INTERPRETATION:
 * - 80-100: Exceptional (very reliable, few breaks)
 * - 70-79: Strong (reliable, occasional breaks)
 * - 50-69: Moderate (reasonably reliable, some breaks)
 * - 40-49: Weak (frequent breaks)
 * - <40: Very Weak (unreliable)
 *
 * NO TRANSFORMATION NEEDED: Already 0-100 scale from CSV
 */
const normalizeSupportStrength = (score: number | null): NormalizationResult => {
  if (score === null) {
    return { normalized: 0, hasData: false, dataStatus: 'unavailable' };
  }
  return {
    normalized: Math.min(100, Math.max(0, score)),
    hasData: true,
    dataStatus: 'available',
  };
};

const normalizeDaysSinceBreak = (
  days: number | null,
  avgDaysBetween: number | null
): NormalizationResult => {
  if (days === null) {
    return { normalized: 0, hasData: false, dataStatus: 'unavailable' };
  }
  const avgGap = avgDaysBetween || 30; // default 30 if no avg
  const ratio = days / avgGap;
  return {
    normalized: Math.min(100, Math.max(0, ratio * 50)),
    hasData: true,
    dataStatus: 'available',
  };
};

const normalizeRecoveryAdvantage = (recoveryRate: number | null): NormalizationResult => {
  if (recoveryRate === null) {
    return { normalized: 0, hasData: false, dataStatus: 'unavailable' };
  }
  // Recovery rate is 0-1 (e.g., 0.785 = 78.5% worthless rate)
  // Higher worthless rate = better recovery candidate = higher score
  // 0.5 (50%) = 50 score, 0.8+ (80%+) = 100 score
  return {
    normalized: Math.min(100, Math.max(0, recoveryRate * 100)),
    hasData: true,
    dataStatus: 'available',
  };
};

const normalizeHistoricalPeak = (
  currentProb: number,
  peakProb: number | null,
  threshold: number,
  weight: number
): NormalizationResult => {
  // If weight is 0%, the factor is disabled
  if (weight === 0) {
    return { normalized: 0, hasData: false, dataStatus: 'unavailable' };
  }

  if (peakProb === null) {
    return { normalized: 0, hasData: false, dataStatus: 'unavailable' };
  }

  // Score higher if peak was >= threshold AND current is notably lower
  if (peakProb < threshold) {
    return { normalized: 30, hasData: true, dataStatus: 'available' };
  }

  const drop = peakProb - currentProb;
  // If drop is 10%+ from a 90%+ peak, good recovery candidate
  return {
    normalized: Math.min(100, 50 + drop * 200),
    hasData: true,
    dataStatus: 'available',
  };
};

const normalizeSeasonality = (
  positiveRate: number | null,
  currentDay: number,
  typicalLowDay: number | null
): NormalizationResult => {
  if (positiveRate === null) {
    return { normalized: 0, hasData: false, dataStatus: 'unavailable' };
  }

  // Base score from positive rate (0-100 already in %)
  let score = positiveRate;

  // Bonus if current day is near typical low day
  if (typicalLowDay !== null) {
    const dayDiff = Math.abs(currentDay - typicalLowDay);
    if (dayDiff <= 3) score += 10; // Near typical low
  }

  return {
    normalized: Math.min(100, score),
    hasData: true,
    dataStatus: 'available',
  };
};

/**
 * Normalizes current month performance relative to historical averages.
 *
 * RATIONALE: Stocks underperforming their seasonal/historical average may offer
 * better put writing opportunities because:
 * 1. Mean reversion - Markets tend to correct extreme underperformance
 * 2. Valuation opportunity - Underperforming stocks may be oversold
 * 3. Lower support risk - Further downside may be limited after significant decline
 *
 * CALCULATION:
 * - Current Month Performance: Price change from last trading day of previous month
 *   to today (includes most of current month)
 * - Historical Average: Average return for this calendar month across all historical data
 * - Underperformance: Historical Avg - Current Performance
 * - Normalized Score: 50 + (Underperformance × 10), capped at 0-100
 *
 * EXAMPLES:
 * - If historical average for January is +2.5% and current Jan perf is -2.5%:
 *   Underperformance = 2.5 - (-2.5) = 5%
 *   Score = 50 + (5 × 10) = 100 (best case - strong underperformance)
 *
 * - If current perf matches historical average (+2.5%):
 *   Underperformance = 0%
 *   Score = 50 (neutral - performing as expected)
 *
 * - If current perf exceeds historical average by 5% or more:
 *   Underperformance = -5% or worse
 *   Score = 0 (worst case - outperforming/overvalued)
 */
const normalizeCurrentPerformance = (
  currentMonthPct: number | null,
  avgMonthPct: number | null
): NormalizationResult => {
  if (currentMonthPct === null || avgMonthPct === null) {
    return { normalized: 0, hasData: false, dataStatus: 'unavailable' };
  }

  const underperformance = avgMonthPct - currentMonthPct;

  return {
    normalized: Math.min(100, Math.max(0, 50 + underperformance * 10)),
    hasData: true,
    dataStatus: 'available',
  };
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
            // Use recovery_candidate_rate (historical worthless rate for recovery candidates)
            if (recoveryPoint.recovery_candidate_rate !== undefined && recoveryPoint.recovery_candidate_rate !== null) {
              recoveryAdvantage = recoveryPoint.recovery_candidate_rate;
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
        const monthsInHistoricalData = monthlyStats?.number_of_months_available || null;
        const worstMonthDrawdown = monthlyStats?.open_to_low_max_pct_return_month || null;

        // Get current stock performance
        const stockSummary = getStockSummary(option.StockName);
        const currentMonthPerformance = stockSummary?.priceChangePercentMonth || null;

        // Calculate normalized scores
        const supportStrengthResult = normalizeSupportStrength(
          supportMetric.support_strength_score
        );
        const daysSinceBreakResult = normalizeDaysSinceBreak(
          supportMetric.days_since_last_break,
          supportMetric.trading_days_per_break
        );
        const recoveryAdvantageResult = normalizeRecoveryAdvantage(recoveryAdvantage);
        const historicalPeakResult = normalizeHistoricalPeak(
          currentProbability,
          historicalPeakProbability,
          filters.historicalPeakThreshold,
          weights.historicalPeak
        );
        const seasonalityResult = normalizeSeasonality(
          monthlyPositiveRate,
          currentDay,
          typicalLowDay
        );
        const currentPerformanceResult = normalizeCurrentPerformance(
          currentMonthPerformance,
          monthlyAvgReturn
        );

        // Calculate weighted scores
        const scoreBreakdown: ScoreBreakdown = {
          supportStrength: {
            raw: supportMetric.support_strength_score,
            normalized: supportStrengthResult.normalized,
            weighted: supportStrengthResult.normalized * (weights.supportStrength / 100),
            hasData: supportStrengthResult.hasData,
            dataStatus: supportStrengthResult.dataStatus,
          },
          daysSinceBreak: {
            raw: supportMetric.days_since_last_break,
            normalized: daysSinceBreakResult.normalized,
            weighted: daysSinceBreakResult.normalized * (weights.daysSinceBreak / 100),
            hasData: daysSinceBreakResult.hasData,
            dataStatus: daysSinceBreakResult.dataStatus,
          },
          recoveryAdvantage: {
            raw: recoveryAdvantage,
            normalized: recoveryAdvantageResult.normalized,
            weighted: recoveryAdvantageResult.normalized * (weights.recoveryAdvantage / 100),
            hasData: recoveryAdvantageResult.hasData,
            dataStatus: recoveryAdvantageResult.dataStatus,
          },
          historicalPeak: {
            raw: historicalPeakProbability,
            normalized: historicalPeakResult.normalized,
            weighted: historicalPeakResult.normalized * (weights.historicalPeak / 100),
            hasData: historicalPeakResult.hasData,
            dataStatus: historicalPeakResult.dataStatus,
          },
          monthlySeasonality: {
            raw: monthlyPositiveRate,
            normalized: seasonalityResult.normalized,
            weighted: seasonalityResult.normalized * (weights.monthlySeasonality / 100),
            hasData: seasonalityResult.hasData,
            dataStatus: seasonalityResult.dataStatus,
          },
          currentPerformance: {
            raw: currentMonthPerformance,
            normalized: currentPerformanceResult.normalized,
            weighted: currentPerformanceResult.normalized * (weights.currentPerformance / 100),
            hasData: currentPerformanceResult.hasData,
            dataStatus: currentPerformanceResult.dataStatus,
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
          monthsInHistoricalData,
          worstMonthDrawdown,
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
