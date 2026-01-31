import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScoredOptionData } from '@/types/scoredOptions';
import { formatNordicDecimal } from '@/utils/numberFormatting';
import { CheckCircle, XCircle } from 'lucide-react';
import { InfoIconTooltip } from '@/components/ui/info-icon-tooltip';
import scoredOptionsTooltips from '@/utils/scoredOptionsTooltips';

interface AgreementAnalysisProps {
  option: ScoredOptionData;
}

export const AgreementAnalysis: React.FC<AgreementAnalysisProps> = ({ option }) => {
  // Determine combined score color
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-700';
    if (score >= 70) return 'text-amber-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-50';
    if (score >= 70) return 'bg-amber-50';
    return 'bg-red-50';
  };

  // Get agreement strength color
  const getAgreementColor = (strength: string) => {
    if (strength === 'Strong') return 'text-green-700 bg-green-50 border-green-200';
    if (strength === 'Moderate') return 'text-amber-700 bg-amber-50 border-amber-200';
    return 'text-red-700 bg-red-50 border-red-200';
  };

  // Get agreement explanation
  const getAgreementExplanation = () => {
    if (!option.models_agree) {
      const v21Higher = option.v21_score > option.ta_probability * 100;
      const diff = Math.abs(option.v21_score - option.ta_probability * 100);

      return {
        title: 'Models Disagree',
        icon: <XCircle className="w-5 h-5" />,
        description: v21Higher
          ? `Probability Optimization Model (${formatNordicDecimal(option.v21_score, 1)}) is bullish, but TA ML Model (${formatNordicDecimal(option.ta_probability * 100, 1)}) is bearish. Difference: ${formatNordicDecimal(diff, 1)} points.`
          : `TA ML Model (${formatNordicDecimal(option.ta_probability * 100, 1)}) is bullish, but Probability Optimization Model (${formatNordicDecimal(option.v21_score, 1)}) is bearish. Difference: ${formatNordicDecimal(diff, 1)} points.`,
        recommendation: 'Use with caution. Mixed signals suggest elevated uncertainty. Consider additional confirmation.',
      };
    }

    const v21Higher = option.v21_score > option.ta_probability * 100;
    const diff = Math.abs(option.v21_score - option.ta_probability * 100);

    return {
      title: 'Models Agree',
      icon: <CheckCircle className="w-5 h-5" />,
      description:
        option.agreement_strength === 'Strong'
          ? `Both models strongly bullish. Probability Optimization: ${formatNordicDecimal(option.v21_score, 1)}, TA ML: ${formatNordicDecimal(option.ta_probability * 100, 1)}. Difference: ${formatNordicDecimal(diff, 1)} points.`
          : `Both models aligned with moderate conviction. Probability Optimization: ${formatNordicDecimal(option.v21_score, 1)}, TA ML: ${formatNordicDecimal(option.ta_probability * 100, 1)}. Difference: ${formatNordicDecimal(diff, 1)} points.`,
      recommendation:
        option.agreement_strength === 'Strong'
          ? 'High confidence signal. Both models strongly support this position.'
          : 'Moderate confidence signal. Both models support, but with some variance.',
    };
  };

  const agreement = getAgreementExplanation();

  return (
    <Card className={`${getScoreBgColor(option.combined_score)}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Combined Analysis</CardTitle>
          <div className={`text-4xl font-bold ${getScoreColor(option.combined_score)}`}>
            {formatNordicDecimal(option.combined_score, 1)}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Agreement Status */}
        <div className={`flex items-center gap-3 p-3 rounded-lg border ${getAgreementColor(option.agreement_strength)}`}>
          {agreement.icon}
          <div className="flex-1">
            <div className="font-semibold text-sm">{agreement.title}</div>
            <div className="text-xs mt-0.5 opacity-90">{option.agreement_strength} Agreement</div>
          </div>
        </div>

        {/* Models Agree Field */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium">Models Agree</span>
            <InfoIconTooltip
              title={scoredOptionsTooltips.agreement.modelsAgreeField.title}
              content={scoredOptionsTooltips.agreement.modelsAgreeField.content}
              side="top"
            />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold">
              {option.models_agree ? 'Yes' : 'No'}
            </span>
          </div>
        </div>

        {/* Agreement Strength Field */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium">Agreement Strength</span>
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

        {/* Model Scores Comparison */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Model Scores</div>
          <div className="space-y-2">
            {/* Probability Optimization Score */}
            <div className="flex items-center justify-between">
              <span className="text-sm">Probability Optimization Model</span>
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

            {/* TA Score */}
            <div className="flex items-center justify-between">
              <span className="text-sm">TA Model</span>
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

          {/* Score Difference */}
          <div className="text-xs text-muted-foreground mt-2">
            Difference:{' '}
            <span className="font-semibold">
              {formatNordicDecimal(Math.abs(option.v21_score - option.ta_probability * 100), 1)} points
            </span>
          </div>
        </div>

        {/* Agreement Explanation */}
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
