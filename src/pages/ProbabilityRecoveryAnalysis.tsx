import React from 'react';
import { useProbabilityRecoveryData } from '@/hooks/useProbabilityRecoveryData';
import { RecoveryComparisonChart } from '@/components/probability/RecoveryComparisonChart';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export const ProbabilityRecoveryAnalysis: React.FC = () => {
  const { isLoading, error, stocks, chartData, stockChartData } = useProbabilityRecoveryData();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading probability recovery data...</p>
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
      <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg p-8">
        <h1 className="text-3xl font-bold mb-2">
          Probability Recovery Analysis
        </h1>
      </div>

      {/* Explanation */}
      <Card>
        <CardContent className="pt-6">
          <p className="text-base leading-relaxed">
            Options that previously had high ITM probability but currently show lower probabilities tend to offer premium advantages. This suggests that historical peak probabilities can identify recovery opportunities where the market may be underestimating likelihood of success. Below analysis tests whether options that previously had high probability (80%+) but dropped to lower levels still expire worthless more often than their current probability suggests.
          </p>
        </CardContent>
      </Card>

      {/* Recovery Advantage Analysis */}
      <div>
        <RecoveryComparisonChart stocks={stocks} chartData={chartData} stockChartData={stockChartData} />
      </div>
    </div>
  );
};
