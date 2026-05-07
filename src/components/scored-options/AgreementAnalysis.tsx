import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScoredOptionData } from '@/types/scoredOptions';
import { formatNordicDecimal } from '@/utils/numberFormatting';
import { CheckCircle, XCircle } from 'lucide-react';
import { InfoIconTooltip } from '@/components/ui/info-icon-tooltip';
import scoredOptionsTooltips from '@/utils/scoredOptionsTooltips';
import { useTranslation } from 'react-i18next';

interface AgreementAnalysisProps {
  option: ScoredOptionData;
}

export const AgreementAnalysis: React.FC<AgreementAnalysisProps> = ({ option }) => {
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

  const getAgreementColor = (strength: string) => {
    if (strength === 'Strong') return 'text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800';
    if (strength === 'Moderate') return 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800';
    return 'text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800';
  };

  const getAgreementExplanation = () => {
    const v21Score = formatNordicDecimal(option.v21_score, 1);
    const taScore = formatNordicDecimal(option.ta_probability * 100, 1);
    const diff = formatNordicDecimal(Math.abs(option.v21_score - option.ta_probability * 100), 1);

    if (!option.models_agree) {
      const v21Higher = option.v21_score > option.ta_probability * 100;
      return {
        title: t('scoredOptions.agreementAnalysis.modelsDisagreeTitle'),
        icon: <XCircle className="w-5 h-5" />,
        description: v21Higher
          ? t('scoredOptions.agreementAnalysis.disagreeDescV21Higher', { v21Score, taScore, diff })
          : t('scoredOptions.agreementAnalysis.disagreeDescTAHigher', { v21Score, taScore, diff }),
        recommendation: t('scoredOptions.agreementAnalysis.disagreeRecommendation'),
      };
    }

    return {
      title: t('scoredOptions.agreementAnalysis.modelsAgreeTitle'),
      icon: <CheckCircle className="w-5 h-5" />,
      description: option.agreement_strength === 'Strong'
        ? t('scoredOptions.agreementAnalysis.agreeDescStrong', { v21Score, taScore, diff })
        : t('scoredOptions.agreementAnalysis.agreeDescModerate', { v21Score, taScore, diff }),
      recommendation: option.agreement_strength === 'Strong'
        ? t('scoredOptions.agreementAnalysis.agreeRecommendationStrong')
        : t('scoredOptions.agreementAnalysis.agreeRecommendationModerate'),
    };
  };

  const agreement = getAgreementExplanation();

  return (
    <Card className={`${getScoreBgColor(option.combined_score)}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{t('scoredOptions.agreementAnalysis.title')}</CardTitle>
          <div className={`text-4xl font-bold ${getScoreColor(option.combined_score)}`}>
            {formatNordicDecimal(option.combined_score, 1)}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className={`flex items-center gap-3 p-3 rounded-lg border ${getAgreementColor(option.agreement_strength)}`}>
          {agreement.icon}
          <div className="flex-1">
            <div className="font-semibold text-sm">{agreement.title}</div>
            <div className="text-xs mt-0.5 opacity-90">
              {t('scoredOptions.agreementAnalysis.strengthAgreement', { strength: option.agreement_strength })}
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium">{t('scoredOptions.agreementAnalysis.modelsAgreeField')}</span>
            <InfoIconTooltip
              title={scoredOptionsTooltips.agreement.modelsAgreeField.title}
              content={scoredOptionsTooltips.agreement.modelsAgreeField.content}
              side="top"
            />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold">
              {option.models_agree
                ? t('scoredOptions.agreementAnalysis.yes')
                : t('scoredOptions.agreementAnalysis.no')}
            </span>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium">{t('scoredOptions.agreementAnalysis.agreementStrengthField')}</span>
            <InfoIconTooltip
              title={scoredOptionsTooltips.agreement.agreementStrengthField.title}
              content={scoredOptionsTooltips.agreement.agreementStrengthField.content}
              side="top"
            />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold">
              {option.agreement_strength}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">{t('scoredOptions.agreementAnalysis.modelScores')}</div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">{t('scoredOptions.agreementAnalysis.probOptimizationModel')}</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500"
                    style={{ width: `${Math.min(option.v21_score, 100)}%` }}
                  />
                </div>
                <span className="text-sm font-semibold w-12 text-right">
                  {formatNordicDecimal(option.v21_score, 0)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">{t('scoredOptions.agreementAnalysis.taModel')}</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500"
                    style={{ width: `${Math.min(option.ta_probability * 100, 100)}%` }}
                  />
                </div>
                <span className="text-sm font-semibold w-12 text-right">
                  {formatNordicDecimal(option.ta_probability * 100, 0)}
                </span>
              </div>
            </div>
          </div>

          <div className="text-xs text-muted-foreground mt-2">
            {t('scoredOptions.agreementAnalysis.difference')}{' '}
            <span className="font-semibold">
              {t('scoredOptions.agreementAnalysis.diffPoints', {
                value: formatNordicDecimal(Math.abs(option.v21_score - option.ta_probability * 100), 1),
              })}
            </span>
          </div>
        </div>

        <div className="border-t pt-3">
          <p className="text-sm text-gray-700 mb-2">{agreement.description}</p>
          <div className="bg-muted/50 p-2 rounded text-xs italic text-muted-foreground">
            💡 {agreement.recommendation}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
