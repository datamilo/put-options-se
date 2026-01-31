/**
 * Type definitions for calibration metrics
 * Represents bucket-based calibration data for both Probability Optimization and TA ML Model
 */

export interface CalibrationBucket {
  /** Label for the score/prediction range (e.g., "70-80%") */
  rangeLabel: string;
  /** Minimum score for this bucket */
  minScore: number;
  /** Maximum score for this bucket */
  maxScore: number;
  /** Actual hit rate (percentage of options that expired worthless) */
  hitRate: number;
  /** Number of options/predictions in this bucket */
  sampleSize: number;
  /** Lower bound of 95% confidence interval */
  confidenceIntervalLower: number;
  /** Upper bound of 95% confidence interval */
  confidenceIntervalUpper: number;
  /** Optional note about this bucket (e.g., risk level) */
  expectedNote?: string;
  /** Whether this is the premium/optimal zone */
  isPremiumZone?: boolean;
}

export interface TemporalFoldData {
  /** Fold number (1-5 in walk-forward validation) */
  fold: number;
  /** Date range for this fold's test period */
  testPeriod: string;
  /** Actual hit rate in 70-80% bucket for this fold */
  hitRate: number;
  /** Number of predictions in this fold */
  sampleCount: number;
  /** Deviation from overall average (77%) in percentage points */
  deviation: number;
}

export interface CalibrationMetricsData {
  /** Probability Optimization Model calibration buckets */
  v21Buckets: CalibrationBucket[];
  /** TA ML Model calibration buckets */
  v3Buckets: CalibrationBucket[];
  /** TA ML Model temporal stability by fold (for 70-80% bucket) */
  v3TemporalFolds?: TemporalFoldData[];
}

export interface CalibrationMetricsState {
  /** Currently active tab ('v21' or 'v3') */
  activeTab: 'v21' | 'v3';
  /** Whether temporal stability section is expanded */
  showTemporalStability: boolean;
}
