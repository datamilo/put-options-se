import { ScoredOptionData } from '@/types/scoredOptions';
import { CalibrationMetricsData } from '@/types/calibration';

export interface FilteredKPIs {
  avgCombinedScore: number | null;
  sampleSize: number | string | null;
  maxHistoricalLoss: number | null;
}

/**
 * Find the calibration bucket that matches the filtered data's score range
 * For max loss calculation, finds the bucket containing the minimum score (most conservative)
 * For sample size, this is used to determine the relevant score range bucket
 */
function findCalibrationBucket(
  minScore: number,
  maxScore: number,
  calibrationBuckets: any[]
): any {
  // Find bucket that contains the minScore (worst-case/lowest score)
  // This is more meaningful than first overlap, especially when spanning buckets
  return calibrationBuckets.find(
    (bucket) => minScore >= bucket.minScore && minScore < bucket.maxScore
  );
}

/**
 * Find all buckets that the score range spans
 * If spanning multiple, sum their sample sizes
 */
function getAggregatedSampleSize(
  minScore: number,
  maxScore: number,
  calibrationBuckets: any[]
): number {
  const overlappingBuckets = calibrationBuckets.filter(
    (bucket) => minScore < bucket.maxScore && maxScore > bucket.minScore
  );

  if (overlappingBuckets.length === 0) return 0;
  if (overlappingBuckets.length === 1) {
    return overlappingBuckets[0].sampleSize;
  }

  // Multiple buckets: sum their sample sizes
  return overlappingBuckets.reduce((sum, b) => sum + b.sampleSize, 0);
}

/**
 * Get max loss (1 - hitRate) from the bucket
 * Expressed as percentage (0-100)
 */
function getMaxHistoricalLoss(bucket: any): number {
  if (!bucket) return 0;
  const failureRate = 1 - bucket.hitRate; // e.g., 1 - 0.838 = 0.162
  return Math.round(failureRate * 100 * 10) / 10; // 16.2%
}

/**
 * Calculate KPI metrics for filtered options
 * Updates dynamically as filters change
 */
export function calculateFilteredKPIs(
  filteredData: ScoredOptionData[],
  calibrationMetricsData: CalibrationMetricsData
): FilteredKPIs {
  if (!filteredData || filteredData.length === 0) {
    return {
      avgCombinedScore: null,
      sampleSize: null,
      maxHistoricalLoss: null,
    };
  }

  // Calculate average combined score
  const validScores = filteredData
    .map((opt) => opt.combined_score)
    .filter((score) => score !== null && score !== undefined) as number[];

  const avgCombinedScore =
    validScores.length > 0
      ? Math.round((validScores.reduce((a, b) => a + b, 0) / validScores.length) * 10) / 10
      : null;

  // Find score range in filtered data
  const scores = validScores.sort((a, b) => a - b);
  const minScore = scores[0];
  const maxScore = scores[scores.length - 1];

  // Get calibration bucket for this range (use V21 buckets)
  const bucket = findCalibrationBucket(minScore, maxScore, calibrationMetricsData.v21Buckets);

  // Get aggregated sample size (handles multi-bucket spans)
  const sampleSize = getAggregatedSampleSize(minScore, maxScore, calibrationMetricsData.v21Buckets);

  // Format sample size as abbreviated string (e.g., "583K", "1.2M")
  let formattedSampleSize: string | null = null;
  if (sampleSize > 0) {
    if (sampleSize >= 1000000) {
      formattedSampleSize = `${(sampleSize / 1000000).toFixed(1)}M`;
    } else if (sampleSize >= 1000) {
      formattedSampleSize = `${(sampleSize / 1000).toFixed(0)}K`;
    } else {
      formattedSampleSize = sampleSize.toString();
    }
  }

  // Get max historical loss from bucket
  const maxHistoricalLoss = bucket ? getMaxHistoricalLoss(bucket) : null;

  return {
    avgCombinedScore,
    sampleSize: formattedSampleSize,
    maxHistoricalLoss,
  };
}
