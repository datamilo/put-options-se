import React, { useMemo } from 'react';
import { useProbabilityRecoveryData } from '@/hooks/useProbabilityRecoveryData';
import { useProbabilityValidationData } from '@/hooks/useProbabilityValidationData';
import { RecoveryComparisonChart } from '@/components/probability/RecoveryComparisonChart';
import { CalibrationChart } from '@/components/probability/CalibrationChart';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export const ProbabilityAnalysis: React.FC = () => {
  const { isLoading: recoveryLoading, error: recoveryError, stocks, chartData, stockChartData } = useProbabilityRecoveryData();
  const { calibrationData, isLoading: validationLoading, error: validationError, getCalibrationPoints } = useProbabilityValidationData();
  const isLoading = recoveryLoading || validationLoading;
  const error = recoveryError || validationError;

  const calibrationPoints = useMemo(() => getCalibrationPoints('aggregated'), [getCalibrationPoints]);

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
          <p>Loading probability analysis data...</p>
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
      {/* Executive Overview */}
      <Card className="border-blue-500/20 bg-blue-500/5">
        <CardContent className="pt-6">
          <p className="text-sm leading-relaxed mb-3">
            This page provides two complementary analyses to improve your put option writing decisions: (1) <strong>Calibration Analysis</strong> validates which probability calculation methods are most accurate by comparing predictions against actual market outcomes, and (2) <strong>Probability Recovery Analysis</strong> identifies recovery opportunities where options previously had high probability levels but have since declined—these statistically expire worthless more often than their current probability suggests.
          </p>
        </CardContent>
      </Card>

      {/* Calibration Analysis Section */}
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-lg p-6">
          <h2 className="text-2xl font-bold">Calibration Analysis</h2>
          <p className="text-sm text-muted-foreground mt-1">Probability Method Accuracy & Validation</p>
        </div>

        {/* How to Read the Calibration Chart */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-3">How to Read the Chart</h3>
              <p className="text-sm text-muted-foreground mb-4">
                The chart compares predicted probabilities (horizontal axis) against actual outcomes (vertical axis). The diagonal line represents perfect calibration. Methods above the line are conservative (safer than predicted); methods below are overconfident (riskier than predicted). Colored lines with dots represent different probability calculation methods—larger dots indicate more data points.
              </p>
              <p className="text-sm text-muted-foreground">
                Use the dropdown menu to filter by individual stocks and see which probability methods are most reliable for your trading.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Calibration Chart */}
        <Card>
          <CardContent className="pt-6">
            <CalibrationChart
              calibrationPoints={calibrationPoints}
              availableStocks={availableStocks}
              getCalibrationPoints={getCalibrationPoints}
            />
          </CardContent>
        </Card>
      </div>

      {/* Section Separator */}
      <div className="border-t-2 border-border my-8" />

      {/* Probability Recovery Analysis */}
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg p-6">
          <h2 className="text-2xl font-bold">Probability Recovery Analysis</h2>
          <p className="text-sm text-muted-foreground mt-1">Identifying Statistical Opportunities from Historical Price Action</p>
        </div>

        {/* How to Read the Recovery Chart */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-3">How to Read the Chart</h3>
              <p className="text-sm text-muted-foreground mb-4">
                The chart shows the worthless rate (percentage of options that expired worthless) for recovery candidates (green bars) versus baseline options (red bars) across different days-to-expiry buckets. Recovery candidates are options that previously reached your selected probability threshold (80%, 90%, 95%) but have since declined. If green bars are significantly higher than red bars, recovery candidates are statistically safer.
              </p>
              <p className="text-sm text-muted-foreground">
                Use the filters to explore different probability thresholds, methods, and current probability ranges. Stock filtering lets you identify which stocks show the strongest recovery advantage.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Recovery Advantage Analysis Chart */}
        <Card>
          <CardContent className="pt-6">
            <RecoveryComparisonChart stocks={stocks} chartData={chartData} stockChartData={stockChartData} />
          </CardContent>
        </Card>
      </div>

    </div>
  );
};
