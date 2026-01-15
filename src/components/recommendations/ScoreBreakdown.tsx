import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, XCircle } from 'lucide-react';
import type { ScoreBreakdown, ScoreWeights } from '@/types/recommendations';

interface ScoreBreakdownProps {
  breakdown: ScoreBreakdown;
  compositeScore: number;
  weights: ScoreWeights;
}

const rawValueExplanations: Record<string, { label: string; explanation: string }> = {
  supportStrength: {
    label: 'Support reliability score',
    explanation: 'Composite metric (0-100) measuring how consistently support level has held based on stability, break frequency, and drop consistency',
  },
  daysSinceBreak: {
    label: 'Days since support break',
    explanation: 'Number of trading days since support level was last tested/broken; higher is better',
  },
  recoveryAdvantage: {
    label: 'Recovery candidate rate',
    explanation: 'Percentage of similar options (by probability/DTE) that recovered from similar levels in historical data',
  },
  historicalPeak: {
    label: 'Historical peak probability',
    explanation: 'Highest probability of worthlessness ever seen for this option; indicates recovery potential if peaked above current threshold',
  },
  monthlySeasonality: {
    label: 'Monthly positive rate',
    explanation: 'Percentage of historical months with positive returns for this stock in the current calendar month',
  },
  currentPerformance: {
    label: 'Month-to-date underperformance',
    explanation: 'How much the stock is underperforming (negative = better for puts) compared to its historical average for this calendar month',
  },
};

export const ScoreBreakdownComponent: React.FC<ScoreBreakdownProps> = ({
  breakdown,
  compositeScore,
  weights,
}) => {
  const factors = [
    {
      name: 'Recovery Advantage',
      key: 'recoveryAdvantage' as keyof ScoreBreakdown,
      weightKey: 'recoveryAdvantage' as keyof ScoreWeights,
      description: 'Historical worthless rate for similar recovery candidates',
    },
    {
      name: 'Support Strength',
      key: 'supportStrength' as keyof ScoreBreakdown,
      weightKey: 'supportStrength' as keyof ScoreWeights,
      description: 'Pre-calculated composite support level robustness',
    },
    {
      name: 'Days Since Break',
      key: 'daysSinceBreak' as keyof ScoreBreakdown,
      weightKey: 'daysSinceBreak' as keyof ScoreWeights,
      description: 'Time since support level was last broken',
    },
    {
      name: 'Historical Peak',
      key: 'historicalPeak' as keyof ScoreBreakdown,
      weightKey: 'historicalPeak' as keyof ScoreWeights,
      description: 'Recovery candidate based on historical probability peaks',
    },
    {
      name: 'Monthly Seasonality',
      key: 'monthlySeasonality' as keyof ScoreBreakdown,
      weightKey: 'monthlySeasonality' as keyof ScoreWeights,
      description: 'Historical positive return rate for current month',
    },
    {
      name: 'Current Performance',
      key: 'currentPerformance' as keyof ScoreBreakdown,
      weightKey: 'currentPerformance' as keyof ScoreWeights,
      description: 'Current month underperformance vs historical average',
    },
  ];

  const formatRawValue = (raw: number | null): string => {
    if (raw === null) return 'N/A';
    if (raw >= 0 && raw <= 1) return `${(raw * 100).toFixed(1)}%`;
    if (raw >= -100 && raw <= 100) return `${raw.toFixed(1)}`;
    return raw.toFixed(0);
  };

  // Count factors with actual data
  const factorsWithData = factors.filter((f) => breakdown[f.key].hasData).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Score Breakdown</CardTitle>
          {factorsWithData < 6 && (
            <div className="text-xs font-semibold text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-950 px-2 py-1 rounded">
              Based on {factorsWithData}/6 factors with data
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Composite Score */}
        <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg">
          <span className="font-semibold text-lg">Composite Score</span>
          <span className="text-2xl font-bold text-primary">
            {compositeScore.toFixed(1)}
          </span>
        </div>

        {/* Factor Breakdown */}
        <div className="space-y-4">
          {factors.map((factor) => {
            const component = breakdown[factor.key];
            const weight = weights[factor.weightKey];
            const rawValue = formatRawValue(component.raw);
            const normalizedScore = component.normalized;
            const weightedScore = component.weighted;
            const isDisabled = weight === 0;
            const hasData = component.hasData;
            const dataStatus = component.dataStatus;
            const explanation = rawValueExplanations[factor.key];

            return (
              <div
                key={factor.key}
                className={`space-y-2 p-3 rounded-lg transition-colors ${
                  isDisabled
                    ? 'bg-muted/40 border border-dashed border-muted-foreground/30'
                    : !hasData
                      ? 'bg-destructive/5 border border-destructive/20'
                      : 'bg-transparent'
                }`}
              >
                {/* Header with name and status */}
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{factor.name}</span>
                      {isDisabled && (
                        <div className="flex items-center gap-1 bg-destructive/10 text-destructive px-2 py-0.5 rounded text-xs font-semibold">
                          <AlertCircle className="h-3 w-3" />
                          Not Included
                        </div>
                      )}
                      {!isDisabled && !hasData && (
                        <div className="flex items-center gap-1 bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 px-2 py-0.5 rounded text-xs font-semibold">
                          <XCircle className="h-3 w-3" />
                          No Data
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">
                      {weightedScore.toFixed(1)} pts
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {weight.toFixed(0)}% weight
                    </div>
                  </div>
                </div>

                {/* Raw value explanation */}
                {!isDisabled && (
                  <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                    <div className="font-semibold text-foreground mb-1">{explanation?.label}:</div>
                    <div>{explanation?.explanation}</div>
                    <div className="mt-2 font-semibold">Raw value: {hasData ? rawValue : 'Not Available'}</div>
                  </div>
                )}

                {/* Message for missing data */}
                {!isDisabled && !hasData && (
                  <div className="text-xs text-destructive font-semibold bg-destructive/10 p-2 rounded">
                    ⚠️ No data available for this stock. Score contribution: <strong>0 points</strong> (not included)
                  </div>
                )}

                {/* Progress bar */}
                <div className={`w-full bg-secondary rounded-full h-2 ${isDisabled || !hasData ? 'opacity-40' : ''}`}>
                  <div
                    className={`h-2 rounded-full transition-all ${
                      isDisabled || !hasData ? 'bg-muted-foreground' : 'bg-primary'
                    }`}
                    style={{ width: `${normalizedScore}%` }}
                  />
                </div>

                {/* Normalized score display */}
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Normalized: {normalizedScore.toFixed(1)}/100</span>
                  <span>Contributing: {hasData || isDisabled ? 'Yes' : 'No (missing data)'}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Explanation */}
        <div className="mt-4 p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground space-y-2">
          <p>
            <strong>How Scoring Works:</strong> Each factor is normalized to a 0-100 scale, then weighted according to its
            importance. Only factors with available data contribute to the final score.
          </p>
          <p>
            <strong>Missing Data:</strong> If a factor has no historical data for this stock, it contributes 0 points
            to the composite score, regardless of its weight setting.
          </p>
          <p>
            <strong>Red "No Data" badge:</strong> This stock lacks the historical data needed for this factor, so it
            contributes 0 points.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
