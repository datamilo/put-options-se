import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProbabilityRecoveryData } from '@/hooks/useProbabilityRecoveryData';
import { useProbabilityValidationData } from '@/hooks/useProbabilityValidationData';
import { RecoveryComparisonChart } from '@/components/probability/RecoveryComparisonChart';
import { CalibrationChart } from '@/components/probability/CalibrationChart';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, LineChart, TrendingUp } from 'lucide-react';

export const ProbabilityAnalysis: React.FC = () => {
  const navigate = useNavigate();
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
    <div className="flex flex-col min-h-screen">
      {/* Page Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="h-10 w-10 p-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-3">
                <LineChart className="h-6 w-6 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold">Probability Analysis</h1>
                </div>
              </div>
            </div>
            <TrendingUp className="h-6 w-6 text-muted-foreground" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 container mx-auto p-6 space-y-6">
        {/* Executive Overview - Two Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Calibration Analysis Overview */}
            <Card className="border-blue-500/20 bg-blue-500/5">
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-center gap-2">
                  <LineChart className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold">Calibration Analysis</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Validates which probability calculation methods are most accurate by comparing predictions against actual market outcomes.
                </p>
              </CardContent>
            </Card>

            {/* Recovery Analysis Overview */}
            <Card className="border-green-500/20 bg-green-500/5">
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold">Probability Recovery</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Identifies recovery opportunities where options previously had high probability levels but have since declined—these statistically expire worthless more often than expected.
                </p>
              </CardContent>
            </Card>
        </div>

        {/* Calibration Analysis Section */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center gap-3">
            <LineChart className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold">Calibration Analysis</h2>
              <p className="text-sm text-muted-foreground">Probability Method Accuracy & Validation</p>
            </div>
          </div>

          {/* How to Read the Calibration Chart */}
          <Card className="border-l-4 border-l-blue-500">
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

        {/* Probability Recovery Analysis Section */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-6 w-6 text-green-600" />
            <div>
              <h2 className="text-2xl font-bold">Probability Recovery Analysis</h2>
              <p className="text-sm text-muted-foreground">Identifying Statistical Opportunities from Historical Price Action</p>
            </div>
          </div>

          {/* How to Read the Recovery Chart */}
          <Card className="border-l-4 border-l-green-500">
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
    </div>
  );
};
