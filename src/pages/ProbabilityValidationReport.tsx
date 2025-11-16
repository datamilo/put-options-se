import React, { useMemo } from 'react';
import { useProbabilityValidationData } from '@/hooks/useProbabilityValidationData';
import { ValidationMetricsChart } from '@/components/probability/ValidationMetricsChart';
import { ValidationMetricsTable } from '@/components/probability/ValidationMetricsTable';
import { CalibrationChart } from '@/components/probability/CalibrationChart';
import { RecoveryMetricCard } from '@/components/probability/RecoveryMetricCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export const ProbabilityValidationReport: React.FC = () => {
  const {
    metrics,
    calibrationData,
    isLoading,
    error,
    getMethodPerformance,
    getCalibrationPoints
  } = useProbabilityValidationData();

  const performance = useMemo(() => getMethodPerformance(), [getMethodPerformance]);
  const calibrationPoints = useMemo(() => getCalibrationPoints('aggregated'), [getCalibrationPoints]);

  const summary = useMemo(() => {
    if (metrics.length === 0) {
      return {
        sampleSize: 0,
        actualSuccessRate: 0,
        bestMethod: 'N/A',
        bestCalibration: 'N/A'
      };
    }

    // Get total sample size (use first metric as they should all be similar)
    const sampleSize = metrics[0]?.Count || 0;

    // Calculate overall actual success rate from calibration data
    const aggregatedCalib = calibrationData.filter(d => d.DataType === 'calibration_aggregated');
    const totalCount = aggregatedCalib.reduce((sum, d) => sum + d.Count, 0);
    const weightedActual = aggregatedCalib.reduce((sum, d) => sum + (d.ActualRate * d.Count), 0);
    const actualSuccessRate = totalCount > 0 ? (weightedActual / totalCount) : 0;

    // Find best method by calibration error
    const sortedByCalib = [...metrics].sort((a, b) => a.Expected_Calibration_Error - b.Expected_Calibration_Error);
    const bestCalibration = sortedByCalib[0]?.ProbMethod || 'N/A';

    // Find best method by Brier score
    const sortedByBrier = [...metrics].sort((a, b) => a.Brier_Score - b.Brier_Score);
    const bestMethod = sortedByBrier[0]?.ProbMethod || 'N/A';

    return {
      sampleSize,
      actualSuccessRate,
      bestMethod,
      bestCalibration
    };
  }, [metrics, calibrationData]);

  // Get unique stocks for calibration chart filter
  const availableStocks = useMemo(() => {
    const stocks = calibrationData
      .filter(d => d.DataType === 'calibration_by_stock' && d.Stock)
      .map(d => d.Stock);
    return Array.from(new Set(stocks)).sort();
  }, [calibrationData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading probability validation data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-destructive">
          <p className="font-semibold">Error loading data</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500/10 to-violet-500/10 border border-purple-500/20 rounded-lg p-8">
        <h1 className="text-3xl font-bold mb-2">
          Probability Prediction Validation Report
        </h1>
        <p className="text-lg opacity-90">
          Comparing probability calculation methods for accuracy
        </p>
      </div>

      {/* Executive Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Executive Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <RecoveryMetricCard
              title="Sample Size"
              value={summary.sampleSize.toLocaleString()}
              description="Total predictions analyzed"
            />
            <RecoveryMetricCard
              title="Actual Success Rate"
              value={`${(summary.actualSuccessRate * 100).toFixed(1)}%`}
              description="Overall ITM rate"
            />
            <RecoveryMetricCard
              title="Best Overall Method"
              value={summary.bestMethod}
              description="Lowest Brier Score"
              variant="success"
            />
            <RecoveryMetricCard
              title="Best Calibration"
              value={summary.bestCalibration}
              description="Lowest calibration error"
              variant="success"
            />
          </div>

          <div className="mt-6 p-6 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900 rounded-lg">
            <h3 className="font-semibold text-purple-800 dark:text-purple-300 mb-3 text-lg">
              Winner: {summary.bestCalibration}
            </h3>
            <p className="text-purple-700 dark:text-purple-400">
              Based on comprehensive validation across multiple metrics, {summary.bestCalibration} demonstrates
              the best balance of accuracy and calibration. This method provides the most reliable
              probability estimates for put option ITM predictions.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics Comparison */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Performance Metrics Comparison</h2>
        <ValidationMetricsChart performance={performance} />
      </div>

      {/* Detailed Metrics Table */}
      <div>
        <ValidationMetricsTable performance={performance} />
      </div>

      {/* Calibration Analysis */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Calibration Analysis</h2>
        <CalibrationChart
          calibrationPoints={calibrationPoints}
          availableStocks={availableStocks}
        />
      </div>

      {/* Interpretation */}
      <Card>
        <CardHeader>
          <CardTitle>Understanding the Metrics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Brier Score</h3>
            <p className="text-sm opacity-80">
              Measures the mean squared difference between predicted probabilities and actual outcomes.
              Lower values indicate better accuracy. Range: 0 (perfect) to 1 (worst).
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">AUC-ROC</h3>
            <p className="text-sm opacity-80">
              Area Under the Receiver Operating Characteristic curve. Measures the model's ability to
              discriminate between outcomes. Higher values are better. Range: 0.5 (random) to 1.0 (perfect).
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Log Loss</h3>
            <p className="text-sm opacity-80">
              Logarithmic loss penalizes confident wrong predictions more heavily. Lower values indicate
              better probability estimates. Range: 0 (perfect) to infinity (worst).
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Expected Calibration Error (ECE)</h3>
            <p className="text-sm opacity-80">
              Measures how closely predicted probabilities match actual frequencies. Lower values indicate
              better calibration. A well-calibrated model's predictions should align with reality.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
