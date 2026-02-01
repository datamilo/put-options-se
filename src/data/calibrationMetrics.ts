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
      rangeLabel: '90-100%',
      minScore: 90,
      maxScore: 100,
      hitRate: 0.999,
      sampleSize: 1878,
      confidenceIntervalLower: 0.997,
      confidenceIntervalUpper: 0.9999,
      expectedNote: 'Hit Rate: 99.9%',
    },
    {
      rangeLabel: '80-90%',
      minScore: 80,
      maxScore: 90,
      hitRate: 0.981,
      sampleSize: 27082,
      confidenceIntervalLower: 0.979,
      confidenceIntervalUpper: 0.982,
      expectedNote: 'Hit Rate: 98.1%',
    },
    {
      rangeLabel: '70-80%',
      minScore: 70,
      maxScore: 80,
      hitRate: 0.838,
      sampleSize: 19830,
      confidenceIntervalLower: 0.833,
      confidenceIntervalUpper: 0.843,
      expectedNote: 'Hit Rate: 83.8%',
    },
    {
      rangeLabel: '60-70%',
      minScore: 60,
      maxScore: 70,
      hitRate: 0.514,
      sampleSize: 13506,
      confidenceIntervalLower: 0.506,
      confidenceIntervalUpper: 0.523,
      expectedNote: 'Hit Rate: 51.4%',
    },
    {
      rangeLabel: '50-60%',
      minScore: 50,
      maxScore: 60,
      hitRate: 0.322,
      sampleSize: 7389,
      confidenceIntervalLower: 0.311,
      confidenceIntervalUpper: 0.332,
      expectedNote: 'Hit Rate: 32.2%',
    },
    {
      rangeLabel: '40-50%',
      minScore: 40,
      maxScore: 50,
      hitRate: 0.123,
      sampleSize: 1963,
      confidenceIntervalLower: 0.109,
      confidenceIntervalUpper: 0.138,
      expectedNote: 'Hit Rate: 12.3%',
    },
    {
      rangeLabel: '30-40%',
      minScore: 30,
      maxScore: 40,
      hitRate: 0.064,
      sampleSize: 622,
      confidenceIntervalLower: 0.048,
      confidenceIntervalUpper: 0.086,
      expectedNote: 'Hit Rate: 6.4%',
    },
    {
      rangeLabel: '20-30%',
      minScore: 20,
      maxScore: 30,
      hitRate: 0.015,
      sampleSize: 194,
      confidenceIntervalLower: 0.005,
      confidenceIntervalUpper: 0.044,
      expectedNote: 'Hit Rate: 1.5%',
    },
    {
      rangeLabel: '10-20%',
      minScore: 10,
      maxScore: 20,
      hitRate: 0.40,
      sampleSize: 5,
      confidenceIntervalLower: 0.118,
      confidenceIntervalUpper: 0.769,
      expectedNote: 'Hit Rate: 40.0%',
    },
  ],

  v3Buckets: [
    {
      rangeLabel: '90%+',
      minScore: 90,
      maxScore: 100,
      hitRate: 0.894,
      sampleSize: 29108,
      confidenceIntervalLower: 0.890,
      confidenceIntervalUpper: 0.897,
      expectedNote: 'Hit Rate: 89.4%',
    },
    {
      rangeLabel: '80-90%',
      minScore: 80,
      maxScore: 90,
      hitRate: 0.842,
      sampleSize: 305869,
      confidenceIntervalLower: 0.841,
      confidenceIntervalUpper: 0.843,
      expectedNote: 'Hit Rate: 84.2%',
    },
    {
      rangeLabel: '70-80%',
      minScore: 70,
      maxScore: 80,
      hitRate: 0.766,
      sampleSize: 636639,
      confidenceIntervalLower: 0.765,
      confidenceIntervalUpper: 0.7671,
      expectedNote: 'Hit Rate: 76.6%',
    },
    {
      rangeLabel: '60-70%',
      minScore: 60,
      maxScore: 70,
      hitRate: 0.674,
      sampleSize: 462494,
      confidenceIntervalLower: 0.673,
      confidenceIntervalUpper: 0.675,
      expectedNote: 'Hit Rate: 67.4%',
    },
    {
      rangeLabel: '50-60%',
      minScore: 50,
      maxScore: 60,
      hitRate: 0.592,
      sampleSize: 151200,
      confidenceIntervalLower: 0.590,
      confidenceIntervalUpper: 0.594,
      expectedNote: 'Hit Rate: 59.2%',
    },
    {
      rangeLabel: '<50%',
      minScore: 0,
      maxScore: 50,
      hitRate: 0.334,
      sampleSize: 3670,
      confidenceIntervalLower: 0.319,
      confidenceIntervalUpper: 0.349,
      expectedNote: 'Hit Rate: 33.4%',
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
