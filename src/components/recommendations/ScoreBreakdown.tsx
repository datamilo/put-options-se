import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ScoreBreakdown } from '@/types/recommendations';

interface ScoreBreakdownProps {
  breakdown: ScoreBreakdown;
  compositeScore: number;
}

export const ScoreBreakdownComponent: React.FC<ScoreBreakdownProps> = ({
  breakdown,
  compositeScore,
}) => {
  const factors = [
    {
      name: 'Recovery Advantage',
      key: 'recoveryAdvantage' as keyof ScoreBreakdown,
      description: 'Historical worthless rate for similar recovery candidates',
    },
    {
      name: 'Support Strength',
      key: 'supportStrength' as keyof ScoreBreakdown,
      description: 'Pre-calculated composite support level robustness',
    },
    {
      name: 'Days Since Break',
      key: 'daysSinceBreak' as keyof ScoreBreakdown,
      description: 'Time since support level was last broken',
    },
    {
      name: 'Historical Peak',
      key: 'historicalPeak' as keyof ScoreBreakdown,
      description: 'Recovery candidate based on historical probability peaks',
    },
    {
      name: 'Monthly Seasonality',
      key: 'monthlySeasonality' as keyof ScoreBreakdown,
      description: 'Historical positive return rate for current month',
    },
    {
      name: 'Current Performance',
      key: 'currentPerformance' as keyof ScoreBreakdown,
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
            const rawValue = formatRawValue(component.raw);
            const normalizedScore = component.normalized;
            const weightedScore = component.weighted;

            return (
              <div key={factor.key} className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-sm">{factor.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {weightedScore.toFixed(1)} pts
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mb-1">
                  {factor.description}
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
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
