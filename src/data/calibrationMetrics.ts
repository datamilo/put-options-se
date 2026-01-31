/**
 * Calibration metrics data for Probability Optimization Model and TA ML Model
 * Source: INVESTOR_GUIDE_SCORING_ENGINE_PERFORMANCE.md (January 31, 2026)
 *
 * This data shows actual hit rates (percentage of options that expired worthless)
 * achieved at different predicted probability levels.
 *
 * CRITICAL: Only includes verified data from source document.
 * NO premium multiplier claims, NO "optimal" designations, NO recommendations.
 * Users can filter and sort themselves to reach their own conclusions.
 */

import { CalibrationMetricsData } from '@/types/calibration';

export const calibrationMetricsData: CalibrationMetricsData = {
  v21Buckets: [
    {
      rangeLabel: '<50%',
      minScore: 0,
      maxScore: 50,
      hitRate: 0.23,
      sampleSize: 382000,
      confidenceIntervalLower: 0.22,
      confidenceIntervalUpper: 0.24,
      expectedNote: 'Hit Rate: 23%',
    },
    {
      rangeLabel: '50-60%',
      minScore: 50,
      maxScore: 60,
      hitRate: 0.51,
      sampleSize: 400000,
      confidenceIntervalLower: 0.50,
      confidenceIntervalUpper: 0.52,
      expectedNote: 'Hit Rate: 51%',
    },
    {
      rangeLabel: '60-70%',
      minScore: 60,
      maxScore: 70,
      hitRate: 0.59,
      sampleSize: 450000,
      confidenceIntervalLower: 0.58,
      confidenceIntervalUpper: 0.60,
      expectedNote: 'Hit Rate: 59%',
    },
    {
      rangeLabel: '70-80%',
      minScore: 70,
      maxScore: 80,
      hitRate: 0.67,
      sampleSize: 99107,
      confidenceIntervalLower: 0.66,
      confidenceIntervalUpper: 0.68,
      expectedNote: 'Hit Rate: 67% | Avg Premium: $2,459',
    },
    {
      rangeLabel: '80-100%',
      minScore: 80,
      maxScore: 100,
      hitRate: 0.80,
      sampleSize: 200000,
      confidenceIntervalLower: 0.79,
      confidenceIntervalUpper: 0.81,
      expectedNote: 'Hit Rate: 80%+ | Avg Premium: $2,477',
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
      expectedNote: 'Hit Rate: 44.6%',
    },
    {
      rangeLabel: '50-60%',
      minScore: 50,
      maxScore: 60,
      hitRate: 0.571,
      sampleSize: 95560,
      confidenceIntervalLower: 0.568,
      confidenceIntervalUpper: 0.574,
      expectedNote: 'Hit Rate: 57.1%',
    },
    {
      rangeLabel: '60-70%',
      minScore: 60,
      maxScore: 70,
      hitRate: 0.653,
      sampleSize: 547402,
      confidenceIntervalLower: 0.652,
      confidenceIntervalUpper: 0.654,
      expectedNote: 'Hit Rate: 65.3%',
    },
    {
      rangeLabel: '70-80%',
      minScore: 70,
      maxScore: 80,
      hitRate: 0.771,
      sampleSize: 583229,
      confidenceIntervalLower: 0.770,
      confidenceIntervalUpper: 0.772,
      expectedNote: 'Hit Rate: 77.1%',
    },
    {
      rangeLabel: '80-90%',
      minScore: 80,
      maxScore: 90,
      hitRate: 0.823,
      sampleSize: 300158,
      confidenceIntervalLower: 0.822,
      confidenceIntervalUpper: 0.825,
      expectedNote: 'Hit Rate: 82.3%',
    },
    {
      rangeLabel: '90%+',
      minScore: 90,
      maxScore: 100,
      hitRate: 0.876,
      sampleSize: 46902,
      confidenceIntervalLower: 0.873,
      confidenceIntervalUpper: 0.879,
      expectedNote: 'Hit Rate: 87.6%',
    },
  ],

  v3TemporalFolds: [
    {
      fold: 1,
      testPeriod: 'Aug 29 - Dec 2, 2024',
      hitRate: 0.738,
      sampleCount: 54021,
      deviation: -3.3,
    },
    {
      fold: 2,
      testPeriod: 'Dec 3, 2024 - Mar 14, 2025',
      hitRate: 0.647,
      sampleCount: 103117,
      deviation: -12.4,
    },
    {
      fold: 3,
      testPeriod: 'Mar 17 - Jun 26, 2025',
      hitRate: 0.820,
      sampleCount: 116641,
      deviation: 4.9,
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
