import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, XCircle } from 'lucide-react';
import type { ScoreBreakdown, ScoreWeights } from '@/types/recommendations';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation('pages');

  const factors = [
    {
      key: 'recoveryAdvantage' as keyof ScoreBreakdown,
      weightKey: 'recoveryAdvantage' as keyof ScoreWeights,
    },
    {
      key: 'supportStrength' as keyof ScoreBreakdown,
      weightKey: 'supportStrength' as keyof ScoreWeights,
    },
    {
      key: 'daysSinceBreak' as keyof ScoreBreakdown,
      weightKey: 'daysSinceBreak' as keyof ScoreWeights,
    },
    {
      key: 'historicalPeak' as keyof ScoreBreakdown,
      weightKey: 'historicalPeak' as keyof ScoreWeights,
    },
    {
      key: 'monthlySeasonality' as keyof ScoreBreakdown,
      weightKey: 'monthlySeasonality' as keyof ScoreWeights,
    },
    {
      key: 'currentPerformance' as keyof ScoreBreakdown,
      weightKey: 'currentPerformance' as keyof ScoreWeights,
    },
  ];

  const formatRawValue = (raw: number | null): string => {
    if (raw === null) return t('recommendations.scoreBreakdown.notAvailable');
    if (raw >= 0 && raw <= 1) return `${(raw * 100).toFixed(1)}%`;
    if (raw >= -100 && raw <= 100) return `${raw.toFixed(1)}`;
    return raw.toFixed(0);
  };

  const factorsWithData = factors.filter((f) => breakdown[f.key].hasData).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">{t('recommendations.scoreBreakdown.title')}</CardTitle>
          {factorsWithData < 6 && (
            <div className="text-xs font-semibold text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-950 px-2 py-1 rounded">
              {t('recommendations.scoreBreakdown.basedOnFactors', { count: factorsWithData })}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg">
          <span className="font-semibold text-lg">{t('recommendations.scoreBreakdown.compositeScore')}</span>
          <span className="text-2xl font-bold text-primary">
            {compositeScore.toFixed(1)}
          </span>
        </div>

        <div className="space-y-4">
          {factors.map((factor) => {
            const component = breakdown[factor.key];
            const weight = weights[factor.weightKey];
            const rawValue = formatRawValue(component.raw);
            const normalizedScore = component.normalized;
            const weightedScore = component.weighted;
            const isDisabled = weight === 0;
            const hasData = component.hasData;
            const factorLabel = t(`recommendations.scoreBreakdown.factors.${factor.key}.label`);
            const factorExplanation = t(`recommendations.scoreBreakdown.factors.${factor.key}.explanation`);

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
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {t(`recommendations.scoreBreakdown.factorNames.${factor.key}`)}
                      </span>
                      {isDisabled && (
                        <div className="flex items-center gap-1 bg-destructive/10 text-destructive px-2 py-0.5 rounded text-xs font-semibold">
                          <AlertCircle className="h-3 w-3" />
                          {t('recommendations.scoreBreakdown.notIncluded')}
                        </div>
                      )}
                      {!isDisabled && !hasData && (
                        <div className="flex items-center gap-1 bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 px-2 py-0.5 rounded text-xs font-semibold">
                          <XCircle className="h-3 w-3" />
                          {t('recommendations.scoreBreakdown.noData')}
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

                {!isDisabled && (
                  <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                    <div className="font-semibold text-foreground mb-1">{factorLabel}:</div>
                    <div>{factorExplanation}</div>
                    <div className="mt-2 font-semibold">
                      {t('recommendations.scoreBreakdown.rawValueLabel')} {hasData ? rawValue : t('recommendations.scoreBreakdown.notAvailable')}
                    </div>
                  </div>
                )}

                {!isDisabled && !hasData && (
                  <div className="text-xs text-destructive font-semibold bg-destructive/10 p-2 rounded">
                    {t('recommendations.scoreBreakdown.noDataWarning')}
                  </div>
                )}

                <div className={`w-full bg-secondary rounded-full h-2 ${isDisabled || !hasData ? 'opacity-40' : ''}`}>
                  <div
                    className={`h-2 rounded-full transition-all ${
                      isDisabled || !hasData ? 'bg-muted-foreground' : 'bg-primary'
                    }`}
                    style={{ width: `${normalizedScore}%` }}
                  />
                </div>

                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{t('recommendations.scoreBreakdown.normalizedScore', { value: normalizedScore.toFixed(1) })}</span>
                  <span>
                    {hasData || isDisabled
                      ? t('recommendations.scoreBreakdown.contributingYes')
                      : t('recommendations.scoreBreakdown.contributingNo')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground space-y-2">
          <p>
            <strong>{t('recommendations.scoreBreakdown.howScoringTitle')}</strong>{' '}
            {t('recommendations.scoreBreakdown.howScoringDesc')}
          </p>
          <p>
            <strong>{t('recommendations.scoreBreakdown.missingDataTitle')}</strong>{' '}
            {t('recommendations.scoreBreakdown.missingDataDesc')}
          </p>
          <p>
            <strong>{t('recommendations.scoreBreakdown.noDataBadgeTitle')}</strong>{' '}
            {t('recommendations.scoreBreakdown.noDataBadgeDesc')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
