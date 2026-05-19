/**
 * Calibration metrics data for Probability Optimization Model and TA ML Model
 * Source: ta_ml_model_all_options_analysis.md (May 16, 2026)
 *
 * This data shows actual hit rates (percentage of options that expired worthless)
 * achieved at different predicted probability levels.
 *
 * TA ML Model: May 2026 retrain on 8,757,990 option-day records (April 2024 - January 2026).
 * One record per option contract per trading day — same contract can appear multiple times.
 * Calibration backtest on 7,375,016 out-of-sample records across 5 temporal folds.
 * Bug fixes applied: 100K sampling cap removed, DTE now calculated in business days.
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
      expectedNote: 'Actual Worthless %: 99.9%',
    },
    {
      rangeLabel: '80-90%',
      minScore: 80,
      maxScore: 90,
      hitRate: 0.981,
      sampleSize: 27082,
      confidenceIntervalLower: 0.979,
      confidenceIntervalUpper: 0.982,
      expectedNote: 'Actual Worthless %: 98.1%',
    },
    {
      rangeLabel: '70-80%',
      minScore: 70,
      maxScore: 80,
      hitRate: 0.838,
      sampleSize: 19830,
      confidenceIntervalLower: 0.833,
      confidenceIntervalUpper: 0.843,
      expectedNote: 'Actual Worthless %: 83.8%',
    },
    {
      rangeLabel: '60-70%',
      minScore: 60,
      maxScore: 70,
      hitRate: 0.514,
      sampleSize: 13506,
      confidenceIntervalLower: 0.506,
      confidenceIntervalUpper: 0.523,
      expectedNote: 'Actual Worthless %: 51.4%',
    },
    {
      rangeLabel: '50-60%',
      minScore: 50,
      maxScore: 60,
      hitRate: 0.322,
      sampleSize: 7389,
      confidenceIntervalLower: 0.311,
      confidenceIntervalUpper: 0.332,
      expectedNote: 'Actual Worthless %: 32.2%',
    },
    {
      rangeLabel: '40-50%',
      minScore: 40,
      maxScore: 50,
      hitRate: 0.123,
      sampleSize: 1963,
      confidenceIntervalLower: 0.109,
      confidenceIntervalUpper: 0.138,
      expectedNote: 'Actual Worthless %: 12.3%',
    },
    {
      rangeLabel: '30-40%',
      minScore: 30,
      maxScore: 40,
      hitRate: 0.064,
      sampleSize: 622,
      confidenceIntervalLower: 0.048,
      confidenceIntervalUpper: 0.086,
      expectedNote: 'Actual Worthless %: 6.4%',
    },
    {
      rangeLabel: '20-30%',
      minScore: 20,
      maxScore: 30,
      hitRate: 0.015,
      sampleSize: 194,
      confidenceIntervalLower: 0.005,
      confidenceIntervalUpper: 0.044,
      expectedNote: 'Actual Worthless %: 1.5%',
    },
    {
      rangeLabel: '10-20%',
      minScore: 10,
      maxScore: 20,
      hitRate: 0.40,
      sampleSize: 5,
      confidenceIntervalLower: 0.118,
      confidenceIntervalUpper: 0.769,
      expectedNote: 'Actual Worthless %: 40.0%',
    },
  ],

  v3Buckets: [
    {
      rangeLabel: '90%+',
      minScore: 90,
      maxScore: 100,
      hitRate: 0.8622,
      sampleSize: 479492,
      confidenceIntervalLower: 0.8612,
      confidenceIntervalUpper: 0.8631,
      expectedNote: 'Actual Worthless %: 86.22%',
    },
    {
      rangeLabel: '80-90%',
      minScore: 80,
      maxScore: 90,
      hitRate: 0.7654,
      sampleSize: 1153766,
      confidenceIntervalLower: 0.7646,
      confidenceIntervalUpper: 0.7661,
      expectedNote: 'Actual Worthless %: 76.54%',
    },
    {
      rangeLabel: '70-80%',
      minScore: 70,
      maxScore: 80,
      hitRate: 0.7006,
      sampleSize: 1617173,
      confidenceIntervalLower: 0.6999,
      confidenceIntervalUpper: 0.7013,
      expectedNote: 'Actual Worthless %: 70.06%',
    },
    {
      rangeLabel: '60-70%',
      minScore: 60,
      maxScore: 70,
      hitRate: 0.5791,
      sampleSize: 2109577,
      confidenceIntervalLower: 0.5784,
      confidenceIntervalUpper: 0.5798,
      expectedNote: 'Actual Worthless %: 57.91%',
    },
    {
      rangeLabel: '50-60%',
      minScore: 50,
      maxScore: 60,
      hitRate: 0.3878,
      sampleSize: 1400572,
      confidenceIntervalLower: 0.3870,
      confidenceIntervalUpper: 0.3886,
      expectedNote: 'Actual Worthless %: 38.78%',
    },
    {
      rangeLabel: '<50%',
      minScore: 0,
      maxScore: 50,
      hitRate: 0.1575,
      sampleSize: 614436,
      confidenceIntervalLower: 0.1566,
      confidenceIntervalUpper: 0.1584,
      expectedNote: 'Actual Worthless %: 15.75%',
    },
  ],

  v3TemporalFolds: [
    {
      fold: 1,
      testPeriod: 'Aug 29 - Dec 2, 2024',
      hitRate: 0.750,
      sampleCount: 72253,
      deviation: 4.9,
    },
    {
      fold: 2,
      testPeriod: 'Dec 3, 2024 - Mar 14, 2025',
      hitRate: 0.694,
      sampleCount: 110180,
      deviation: -0.7,
    },
    {
      fold: 3,
      testPeriod: 'Mar 17 - Jun 26, 2025',
      hitRate: 0.748,
      sampleCount: 108676,
      deviation: 4.7,
    },
    {
      fold: 4,
      testPeriod: 'Jun 27 - Sep 30, 2025',
      hitRate: 0.852,
      sampleCount: 130333,
      deviation: 15.1,
    },
    {
      fold: 5,
      testPeriod: 'Oct 1, 2025 - Jan 12, 2026',
      hitRate: 0.765,
      sampleCount: 215197,
      deviation: 6.4,
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
