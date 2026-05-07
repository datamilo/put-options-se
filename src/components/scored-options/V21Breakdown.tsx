import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScoredOptionData } from '@/types/scoredOptions';
import { formatNordicDecimal, formatNordicPercentage } from '@/utils/numberFormatting';
import { InfoIconTooltip } from '@/components/ui/info-icon-tooltip';
import scoredOptionsTooltips from '@/utils/scoredOptionsTooltips';
import { useTranslation } from 'react-i18next';

interface V21BreakdownProps {
  option: ScoredOptionData;
}

export const V21Breakdown: React.FC<V21BreakdownProps> = ({ option }) => {
  const { t } = useTranslation('pages');

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-700';
    if (score >= 70) return 'text-amber-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-50 dark:bg-green-950';
    if (score >= 70) return 'bg-amber-50 dark:bg-amber-950';
    return 'bg-red-50 dark:bg-red-950';
  };

  const getInterpretation = () => {
    const score = option.v21_score;
    if (score >= 90) return t('scoredOptions.v21Breakdown.interp90');
    if (score >= 80) return t('scoredOptions.v21Breakdown.interp80');
    if (score >= 70) return t('scoredOptions.v21Breakdown.interp70');
    if (score >= 60) return t('scoredOptions.v21Breakdown.interp60');
    return t('scoredOptions.v21Breakdown.interp0');
  };

  return (
    <Card className={`${getScoreBgColor(option.v21_score)}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{t('scoredOptions.v21Breakdown.title')}</CardTitle>
          <div className={`text-3xl font-bold ${getScoreColor(option.v21_score)}`}>
            {option.v21_score != null ? `${formatNordicDecimal(option.v21_score, 1)}%` : '-'}
          </div>
        </div>
        <div className="text-sm text-muted-foreground mt-2">
          {t('scoredOptions.v21Breakdown.bucket')} <span className="font-semibold">{option.v21_bucket}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium">{t('scoredOptions.v21Breakdown.currentProbability')}</span>
            <InfoIconTooltip
              title={scoredOptionsTooltips.v21Details.currentProbability.title}
              content={scoredOptionsTooltips.v21Details.currentProbability.content}
              side="top"
            />
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold">
              {option.current_probability != null ? formatNordicPercentage(option.current_probability, 2) : '-'}
            </span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500"
              style={{ width: `${Math.min((option.current_probability || 0) * 100, 100)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {t('scoredOptions.v21Breakdown.probWorthlessNote')}
          </p>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium">{t('scoredOptions.v21Breakdown.historicalPeak')}</span>
            <InfoIconTooltip
              title={scoredOptionsTooltips.v21Details.historicalPeak.title}
              content={scoredOptionsTooltips.v21Details.historicalPeak.content}
              side="top"
            />
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold">
              {option.v21_historical_peak != null ? formatNordicPercentage(option.v21_historical_peak, 2) : '-'}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {t('scoredOptions.v21Breakdown.historicalPeakNote')}
          </p>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium">{t('scoredOptions.v21Breakdown.supportStrength')}</span>
            <InfoIconTooltip
              title={scoredOptionsTooltips.v21Details.supportStrength.title}
              content={scoredOptionsTooltips.v21Details.supportStrength.content}
              side="top"
            />
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold">
              {option.v21_support_strength != null ? `${formatNordicDecimal(option.v21_support_strength, 2)}%` : '-'}
            </span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-500"
              style={{ width: `${Math.min(option.v21_support_strength || 0, 100)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {t('scoredOptions.v21Breakdown.supportStrengthNote')}
          </p>
        </div>

        <div className="mt-4 pt-3 border-t">
          <p className="text-sm italic text-gray-700">
            {getInterpretation()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
