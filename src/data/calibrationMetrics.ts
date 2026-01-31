/**
 * Calibration metrics data for Probability Optimization Model and TA ML Model
 * Source: INVESTOR_GUIDE_SCORING_ENGINE_PERFORMANCE.md (January 31, 2026)
 *
 * This data shows actual hit rates (percentage of options that expired worthless)
 * achieved at different predicted probability levels.
 */

import { CalibrationMetricsData } from '@/types/calibration';

export const calibrationMetricsData: CalibrationMetricsData = {
  v21Buckets: [
    {
      rangeLabel: '<50%',
      minScore: 0,
      maxScore: 50,
      hitRate: 0.42,
      sampleSize: 1820,
      confidenceIntervalLower: 0.40,
      confidenceIntervalUpper: 0.44,
      expectedNote: 'Not recommended for premium collection',
    },
    {
      rangeLabel: '50-60%',
      minScore: 50,
      maxScore: 60,
      hitRate: 0.58,
      sampleSize: 1540,
      confidenceIntervalLower: 0.56,
      confidenceIntervalUpper: 0.60,
      expectedNote: 'Elevated risk',
    },
    {
      rangeLabel: '60-70%',
      minScore: 60,
      maxScore: 70,
      hitRate: 0.68,
      sampleSize: 2890,
      confidenceIntervalLower: 0.66,
      confidenceIntervalUpper: 0.70,
      expectedNote: 'Acceptable risk',
    },
    {
      rangeLabel: '70-80%',
      minScore: 70,
      maxScore: 80,
      hitRate: 0.77,
      sampleSize: 3240,
      confidenceIntervalLower: 0.76,
      confidenceIntervalUpper: 0.78,
      expectedNote: 'OPTIMAL: Premium zone with 5-10x premium multiplier',
      isPremiumZone: true,
    },
    {
      rangeLabel: '80-90%',
      minScore: 80,
      maxScore: 90,
      hitRate: 0.88,
      sampleSize: 1250,
      confidenceIntervalLower: 0.86,
      confidenceIntervalUpper: 0.90,
      expectedNote: 'Conservative: Lower premiums (2x)',
    },
    {
      rangeLabel: '90-100%',
      minScore: 90,
      maxScore: 100,
      hitRate: 0.92,
      sampleSize: 890,
      confidenceIntervalLower: 0.90,
      confidenceIntervalUpper: 0.94,
      expectedNote: 'Very conservative: Minimal premiums (1x)',
    },
  ],

  v3Buckets: [
    {
      rangeLabel: '<50%',
      minScore: 0,
      maxScore: 50,
      hitRate: 0.446,
      sampleSize: 15729,
      confidenceIntervalLower: 0.438,
      confidenceIntervalUpper: 0.453,
      expectedNote: 'Poor prediction - avoid',
    },
    {
      rangeLabel: '50-60%',
      minScore: 50,
      maxScore: 60,
      hitRate: 0.571,
      sampleSize: 95560,
      confidenceIntervalLower: 0.568,
      confidenceIntervalUpper: 0.574,
      expectedNote: 'Elevated risk',
    },
    {
      rangeLabel: '60-70%',
      minScore: 60,
      maxScore: 70,
      hitRate: 0.653,
      sampleSize: 547402,
      confidenceIntervalLower: 0.652,
      confidenceIntervalUpper: 0.654,
      expectedNote: 'Acceptable risk',
    },
    {
      rangeLabel: '70-80%',
      minScore: 70,
      maxScore: 80,
      hitRate: 0.771,
      sampleSize: 583229,
      confidenceIntervalLower: 0.770,
      confidenceIntervalUpper: 0.772,
      expectedNote: 'OPTIMAL: Converges with Probability Optimization Model at 77% hit rate',
      isPremiumZone: true,
    },
    {
      rangeLabel: '80-90%',
      minScore: 80,
      maxScore: 90,
      hitRate: 0.823,
      sampleSize: 300158,
      confidenceIntervalLower: 0.822,
      confidenceIntervalUpper: 0.825,
      expectedNote: 'Conservative: Lower premiums',
    },
    {
      rangeLabel: '90%+',
      minScore: 90,
      maxScore: 100,
      hitRate: 0.876,
      sampleSize: 46902,
      confidenceIntervalLower: 0.873,
      confidenceIntervalUpper: 0.879,
      expectedNote: 'Very conservative: Overestimates by 7.4pp',
    },
  ],

  v3TemporalFolds: [
    {
      fold: 1,
      testPeriod: 'Aug 29 - Dec 2, 2024',
      hitRate: 0.738,
      sampleCount: 54021,
      deviation: -3.2,
    },
    {
      fold: 2,
      testPeriod: 'Dec 3, 2024 - Mar 14, 2025',
      hitRate: 0.647,
      sampleCount: 103117,
      deviation: -12.3,
    },
    {
      fold: 3,
      testPeriod: 'Mar 17 - Jun 26, 2025',
      hitRate: 0.820,
      sampleCount: 116641,
      deviation: 7.0,
    },
    {
      fold: 4,
      testPeriod: 'Jun 27 - Sep 30, 2025',
      hitRate: 0.790,
      sampleCount: 140181,
      deviation: 1.9,
    },
    {
      fold: 5,
      testPeriod: 'Oct 1, 2025 - Jan 12, 2026',
      hitRate: 0.808,
      sampleCount: 169269,
      deviation: 3.7,
    },
  ],
};

/**
 * Get hit rate for a specific score range in Probability Optimization Model
 */
export const getV21HitRate = (score: number): number | null => {
  const bucket = calibrationMetricsData.v21Buckets.find(
    (b) => score >= b.minScore && score < b.maxScore
  );
  return bucket ? bucket.hitRate : null;
};

/**
 * Get hit rate for a specific score range in TA ML Model
 */
export const getV3HitRate = (score: number): number | null => {
  const bucket = calibrationMetricsData.v3Buckets.find(
    (b) => score >= b.minScore && score < b.maxScore
  );
  return bucket ? bucket.hitRate : null;
};
