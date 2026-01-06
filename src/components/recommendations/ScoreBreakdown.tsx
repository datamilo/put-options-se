import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import type { ScoreBreakdown, ScoreWeights } from '@/types/recommendations';

interface ScoreBreakdownProps {
  breakdown: ScoreBreakdown;
  compositeScore: number;
  weights: ScoreWeights;
}

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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Score Breakdown</CardTitle>
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
        <div className="space-y-3">
          {factors.map((factor) => {
            const component = breakdown[factor.key];
            const weight = weights[factor.weightKey];
            const rawValue = formatRawValue(component.raw);
            const normalizedScore = component.normalized;
            const weightedScore = component.weighted;
            const isDisabled = weight === 0;

            return (
              <div
                key={factor.key}
                className={`space-y-1 p-3 rounded-lg transition-colors ${
                  isDisabled
                    ? 'bg-muted/40 border border-dashed border-muted-foreground/30'
                    : 'bg-transparent'
                }`}
              >
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
                <div className="text-xs text-muted-foreground mb-1">
                  {factor.description}
                </div>
                <div className={`w-full bg-secondary rounded-full h-2 ${isDisabled ? 'opacity-40' : ''}`}>
                  <div
                    className={`h-2 rounded-full transition-all ${
                      isDisabled ? 'bg-muted-foreground' : 'bg-primary'
                    }`}
                    style={{ width: `${normalizedScore}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Raw: {rawValue}</span>
                  <span>Normalized: {normalizedScore.toFixed(1)}/100</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Explanation */}
        <div className="mt-4 p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
          <p>
            Each factor is normalized to a 0-100 scale, then weighted according to its
            importance. The composite score is the sum of all weighted factors.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
