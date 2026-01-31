import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScoredOptionData } from '@/types/scoredOptions';
import { formatNordicDecimal, formatNordicPercentage } from '@/utils/numberFormatting';
import { InfoIconTooltip } from '@/components/ui/info-icon-tooltip';
import scoredOptionsTooltips from '@/utils/scoredOptionsTooltips';

interface V21BreakdownProps {
  option: ScoredOptionData;
}

export const V21Breakdown: React.FC<V21BreakdownProps> = ({ option }) => {
  // Determine score color
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

  // Get interpretation text based on bucket
  const getInterpretation = () => {
    const score = option.v21_score;

    if (score >= 90) {
      return 'Very strong put option. High probability of expiration worthless. Excellent entry point.';
    } else if (score >= 80) {
      return 'Strong put option. Good probability of expiration worthless. Solid opportunity.';
    } else if (score >= 70) {
      return 'Moderate put option. Reasonable probability of expiration worthless. Acceptable risk/reward.';
    } else if (score >= 60) {
      return 'Weak put option. Lower probability of expiration worthless. Marginal opportunity.';
    } else {
      return 'Very weak put option. Low probability of expiration worthless. Avoid.';
    }
  };

  return (
    <Card className={`${getScoreBgColor(option.v21_score)}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Probability Optimization Model</CardTitle>
          <div className={`text-3xl font-bold ${getScoreColor(option.v21_score)}`}>
            {option.v21_score != null ? `${formatNordicDecimal(option.v21_score, 1)}%` : '-'}
          </div>
        </div>
        <div className="text-sm text-muted-foreground mt-2">
          Bucket: <span className="font-semibold">{option.v21_bucket}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Probability */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium">Current Probability</span>
            <InfoIconTooltip
              title={scoredOptionsTooltips.v21Details.currentProbability.title}
              content={scoredOptionsTooltips.v21Details.currentProbability.content}
              side="top"
            />
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold">{option.current_probability != null ? formatNordicPercentage(option.current_probability, 2) : '-'}</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500"
              style={{ width: `${Math.min((option.current_probability || 0) * 100, 100)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Probability of expiration worthless
          </p>
        </div>

        {/* Historical Peak */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium">Historical Peak</span>
            <InfoIconTooltip
              title={scoredOptionsTooltips.v21Details.historicalPeak.title}
              content={scoredOptionsTooltips.v21Details.historicalPeak.content}
              side="top"
            />
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold">{option.v21_historical_peak != null ? formatNordicPercentage(option.v21_historical_peak, 2) : '-'}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Highest probability this stock has shown historically
          </p>
        </div>

        {/* Support Strength */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium">Support Strength</span>
            <InfoIconTooltip
              title={scoredOptionsTooltips.v21Details.supportStrength.title}
              content={scoredOptionsTooltips.v21Details.supportStrength.content}
              side="top"
            />
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold">{option.v21_support_strength != null ? `${formatNordicDecimal(option.v21_support_strength, 2)}%` : '-'}</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-500"
              style={{ width: `${Math.min(option.v21_support_strength || 0, 100)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Strength of support level around strike price
          </p>
        </div>

        {/* Interpretation */}
        <div className="mt-4 pt-3 border-t">
          <p className="text-sm italic text-gray-700">
            {getInterpretation()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
