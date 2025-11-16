import React, { useMemo } from 'react';
import { useProbabilityRecoveryData } from '@/hooks/useProbabilityRecoveryData';
import { RecoveryMetricCard } from '@/components/probability/RecoveryMetricCard';
import { RecoveryComparisonChart } from '@/components/probability/RecoveryComparisonChart';
import { RecoveryScenarioTable } from '@/components/probability/RecoveryScenarioTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export const ProbabilityRecoveryAnalysis: React.FC = () => {
  const { scenarios, isLoading, error } = useProbabilityRecoveryData();

  React.useEffect(() => {
    console.log('🔍 Recovery Analysis - Data Status:', {
      scenariosLength: scenarios.length,
      isLoading,
      error,
      hasSampleScenario: scenarios.length > 0 ? scenarios[0] : 'no data'
    });
  }, [scenarios, isLoading, error]);

  const metrics = useMemo(() => {
    if (scenarios.length === 0) {
      return {
        bestAdvantage: 0,
        recoveryCandidates: 0,
        baselineN: 0,
        averagePremiumAdvantage: 0
      };
    }

    // Find best advantage
    const bestScenario = [...scenarios].sort((a, b) => b.Advantage_pp - a.Advantage_pp)[0];
    const bestAdvantage = bestScenario?.Advantage_pp || 0;

    // Count total recovery candidates
    const recoveryCandidates = scenarios.reduce((sum, s) => sum + s.RecoveryCandidate_N, 0);

    // Sum baseline
    const baselineN = scenarios.reduce((sum, s) => sum + s.Baseline_N, 0);

    // Calculate average premium advantage
    const avgPremium = scenarios.reduce((sum, s) => sum + s.RecoveryCandidate_Premium_pp, 0) / scenarios.length;

    return {
      bestAdvantage,
      recoveryCandidates,
      baselineN,
      averagePremiumAdvantage: avgPremium
    };
  }, [scenarios]);

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
        <p className="text-lg opacity-90">
          Options with Historical High Probability
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
              title="Best Advantage"
              value={`${metrics.bestAdvantage.toFixed(2)} pp`}
              description="Maximum premium advantage"
              variant="success"
            />
            <RecoveryMetricCard
              title="Recovery Candidates"
              value={metrics.recoveryCandidates.toLocaleString()}
              description="Total options analyzed"
            />
            <RecoveryMetricCard
              title="Baseline"
              value={metrics.baselineN.toLocaleString()}
              description="Comparison baseline"
            />
            <RecoveryMetricCard
              title="Avg Premium Advantage"
              value={`${metrics.averagePremiumAdvantage.toFixed(2)} pp`}
              description="Mean premium increase"
              variant="success"
            />
          </div>

          <div className="mt-6 p-6 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg">
            <h3 className="font-semibold text-green-800 dark:text-green-300 mb-3 text-lg">
              Key Finding: Historical High Probability is a Strong Signal!
            </h3>
            <p className="text-green-700 dark:text-green-400">
              Options that previously had high ITM probability but currently show lower probabilities
              tend to offer premium advantages. This suggests that historical peak probabilities can
              identify recovery opportunities where the market may be underestimating likelihood of success.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Interactive Analysis */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Interactive Analysis</h2>
        <RecoveryComparisonChart scenarios={scenarios} />
      </div>

      {/* Top Scenarios */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Top 5 Scenarios (Overall Best)</h2>
        <RecoveryScenarioTable scenarios={scenarios} topN={5} />
      </div>

      {/* Interpretation & Strategy */}
      <Card>
        <CardHeader>
          <CardTitle>Interpretation & Strategy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg mb-2">What This Means for Put Writing</h3>
            <p className="text-sm opacity-80">
              The recovery analysis identifies put options where historical probability data suggests
              the current market pricing may not fully account for recovery potential. Options with
              historically high ITM probabilities that have temporarily declined may represent
              opportunities where premium collection can be optimized.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">Practical Application</h3>
            <ul className="list-disc list-inside space-y-2 text-sm opacity-80">
              <li>
                Focus on options in the highest advantage scenarios (top rows in the table above)
              </li>
              <li>
                Consider the worthless rate when assessing risk - higher rates indicate more reliable historical patterns
              </li>
              <li>
                Balance between premium advantage and sample size (candidates) for statistical reliability
              </li>
              <li>
                Use the interactive chart to explore different probability methods and time-to-expiry ranges
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
