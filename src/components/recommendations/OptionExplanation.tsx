import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Info } from 'lucide-react';
import type { RecommendedOption } from '@/types/recommendations';
import { useTranslation } from 'react-i18next';

interface OptionExplanationProps {
  option: RecommendedOption;
  filters: {
    rollingPeriod: number;
    minDaysSinceBreak: number;
    probabilityMethod: string;
    historicalPeakThreshold: number;
  };
}

export const OptionExplanation: React.FC<OptionExplanationProps> = ({ option, filters }) => {
  const { t } = useTranslation(['pages', 'common']);

  const getProbabilityMethodName = (method: string): string => {
    const methodMap: Record<string, string> = {
      'ProbWorthless_Bayesian_IsoCal': t('pages:recommendations.explanation.methodBayesian'),
      '1_2_3_ProbOfWorthless_Weighted': t('pages:recommendations.explanation.methodWeighted'),
      '1_ProbOfWorthless_Original': t('pages:recommendations.explanation.methodOriginal'),
      '2_ProbOfWorthless_Calibrated': t('pages:recommendations.explanation.methodCalibrated'),
      '3_ProbOfWorthless_Historical_IV': t('pages:recommendations.explanation.methodHistoricalIV'),
    };
    return methodMap[method] || method;
  };

  const methodName = getProbabilityMethodName(filters.probabilityMethod);
  const rollingPeriodText = filters.rollingPeriod === 365
    ? t('pages:recommendations.explanation.rollingPeriodYear')
    : t('pages:recommendations.explanation.rollingPeriodDays', { count: filters.rollingPeriod });

  const sections: string[] = [];

  sections.push(t('pages:recommendations.explanation.intro', {
    optionName: option.optionName,
    stockName: option.stockName,
  }));

  if (option.rollingLow !== null && option.distanceToSupportPct !== null) {
    const strikeDir = option.strikePrice <= option.rollingLow
      ? t('pages:recommendations.explanation.dirBelow')
      : t('pages:recommendations.explanation.dirAbove');
    const priceDir = option.currentPrice <= option.rollingLow
      ? t('pages:recommendations.explanation.dirBelow')
      : t('pages:recommendations.explanation.dirAbove');
    sections.push(
      `**${t('pages:recommendations.explanation.supportHeader')}** ` +
      t('pages:recommendations.explanation.supportText', {
        strikePrice: option.strikePrice.toFixed(2),
        strikeDir,
        period: rollingPeriodText,
        rollingLow: option.rollingLow.toFixed(2),
        currentPrice: option.currentPrice.toFixed(2),
        distancePct: Math.abs(option.distanceToSupportPct).toFixed(1),
        priceDir,
      })
    );
  }

  if (option.daysSinceLastBreak !== null && option.supportStrengthScore !== null) {
    const strengthKey = option.supportStrengthScore >= 70 ? 'strengthStrong'
      : option.supportStrengthScore >= 50 ? 'strengthModerate' : 'strengthWeak';
    const strengthExplKey = option.supportStrengthScore >= 70 ? 'strengthExplStrong'
      : option.supportStrengthScore >= 50 ? 'strengthExplModerate' : 'strengthExplWeak';
    const aboveBelow = option.daysSinceLastBreak >= filters.minDaysSinceBreak
      ? t('pages:recommendations.explanation.dirAbove')
      : t('pages:recommendations.explanation.dirBelow');

    sections.push(
      `**${t('pages:recommendations.explanation.robustnessHeader')}** ` +
      t('pages:recommendations.explanation.robustnessText', {
        days: option.daysSinceLastBreak,
        aboveBelow,
        threshold: filters.minDaysSinceBreak,
        score: option.supportStrengthScore.toFixed(0),
        strength: t(`pages:recommendations.explanation.${strengthKey}`),
        strengthExpl: t(`pages:recommendations.explanation.${strengthExplKey}`),
      }) +
      (option.daysSinceLastBreak > 20 ? ` ${t('pages:recommendations.explanation.robustnessExtended')}` : '')
    );
  }

  if (option.historicalPeakProbability !== null && option.currentProbability) {
    const peakPct = (option.historicalPeakProbability * 100).toFixed(1);
    const currentPct = (option.currentProbability * 100).toFixed(1);
    const thresholdPct = (filters.historicalPeakThreshold * 100).toFixed(0);
    const drop = ((option.historicalPeakProbability - option.currentProbability) * 100).toFixed(1);

    if (option.historicalPeakProbability >= filters.historicalPeakThreshold &&
        option.historicalPeakProbability > option.currentProbability &&
        option.recoveryAdvantage !== null && option.currentProbBin && option.dteBin) {
      const recoveryRatePct = (option.recoveryAdvantage * 100).toFixed(1);
      sections.push(
        `**${t('pages:recommendations.explanation.recoveryHeader')}** ` +
        t('pages:recommendations.explanation.recoveryText', {
          peakPct,
          currentPct,
          currentProbBin: option.currentProbBin,
          dteBin: option.dteBin,
          thresholdPct,
          recoveryRatePct,
          advantage: (parseFloat(recoveryRatePct) - parseFloat(currentPct)).toFixed(1),
        })
      );
    } else if (option.historicalPeakProbability >= filters.historicalPeakThreshold &&
               option.historicalPeakProbability > option.currentProbability) {
      sections.push(
        `**${t('pages:recommendations.explanation.recoverySimpleHeader')}** ` +
        t('pages:recommendations.explanation.recoverySimpleText', { peakPct, currentPct })
      );
    } else {
      const histAbove = option.historicalPeakProbability >= filters.historicalPeakThreshold;
      sections.push(
        `**${t('pages:recommendations.explanation.probHistoryHeader')}** ` +
        t(histAbove
          ? 'pages:recommendations.explanation.probHistoryAbove'
          : 'pages:recommendations.explanation.probHistoryBelow',
          { methodName, peakPct, thresholdPct, currentPct }
        )
      );
    }
  } else if (option.currentProbability >= 0.9 && option.recoveryAdvantage === null) {
    sections.push(
      `**${t('pages:recommendations.explanation.probAnalysisHeader')}** ` +
      t('pages:recommendations.explanation.probAnalysisText', {
        currentPct: (option.currentProbability * 100).toFixed(1),
      })
    );
  }

  if (option.monthlyPositiveRate !== null) {
    const currentMonthIndex = new Date().getMonth();
    const currentMonth = t(`common:monthNames.${currentMonthIndex + 1}`);
    const monthlyPct = option.monthlyPositiveRate.toFixed(1);

    let seasonalityText = `**${t('pages:recommendations.explanation.seasonalityHeader')}** `;
    if (option.monthsInHistoricalData) {
      seasonalityText += t('pages:recommendations.explanation.seasonalityBase', {
        stockName: option.stockName,
        monthlyPct,
        month: currentMonth,
        monthsCount: option.monthsInHistoricalData,
      });
    } else {
      seasonalityText += t('pages:recommendations.explanation.seasonalityBaseMultiple', {
        stockName: option.stockName,
        monthlyPct,
        month: currentMonth,
      });
    }

    if (option.typicalLowDay !== null) {
      const currentDay = new Date().getDate();
      const dayDiff = Math.abs(currentDay - option.typicalLowDay);
      seasonalityText += dayDiff <= 3
        ? t('pages:recommendations.explanation.seasonalityLowDayClose', {
            lowDay: option.typicalLowDay,
            today: currentDay,
          })
        : t('pages:recommendations.explanation.seasonalityLowDayFar', {
            lowDay: option.typicalLowDay,
            today: currentDay,
          });
    }

    if (option.monthlyAvgReturn !== null) {
      const returnWithSign = `${option.monthlyAvgReturn >= 0 ? '+' : ''}${option.monthlyAvgReturn.toFixed(2)}%`;
      seasonalityText += t('pages:recommendations.explanation.seasonalityAvgReturn', {
        month: currentMonth,
        return: returnWithSign,
      });
    }

    sections.push(seasonalityText);
  }

  if (option.currentMonthPerformance !== null && option.monthlyAvgReturn !== null) {
    const currentMonthIndex = new Date().getMonth();
    const currentMonth = t(`common:monthNames.${currentMonthIndex + 1}`);
    const currentPerf = option.currentMonthPerformance;
    const avgReturn = option.monthlyAvgReturn;
    const underperformance = avgReturn - currentPerf;
    const currentPerfStr = `${currentPerf >= 0 ? '+' : ''}${currentPerf.toFixed(2)}%`;
    const avgReturnStr = `${avgReturn >= 0 ? '+' : ''}${avgReturn.toFixed(2)}%`;

    let performanceText = `**${t('pages:recommendations.explanation.perfHeader')}** ` +
      t('pages:recommendations.explanation.perfBase', {
        stockName: option.stockName,
        month: currentMonth,
        currentPerf: currentPerfStr,
        avgReturn: avgReturnStr,
      });

    if (underperformance > 0) {
      performanceText += t('pages:recommendations.explanation.perfUnder', {
        underperf: underperformance.toFixed(2),
      });
    } else if (underperformance < 0) {
      performanceText += t('pages:recommendations.explanation.perfOver', {
        overperf: Math.abs(underperformance).toFixed(2),
      });
    } else {
      performanceText += t('pages:recommendations.explanation.perfInLine');
    }

    if (option.worstMonthDrawdown !== null) {
      performanceText += t('pages:recommendations.explanation.perfWorstDrawdown', {
        month: currentMonth,
        drawdown: option.worstMonthDrawdown.toFixed(2),
      });
    }

    sections.push(performanceText);
  }

  const scoreStrengthKey = option.compositeScore >= 70 ? 'strengthStrong'
    : option.compositeScore >= 50 ? 'strengthModerate' : 'strengthWeak';
  const compositeQualKey = option.compositeScore >= 70 ? 'compositeHigh'
    : option.compositeScore >= 50 ? 'compositeModerate' : 'compositeLow';
  sections.push(
    `**${t('pages:recommendations.explanation.compositeHeader')}** ` +
    t('pages:recommendations.explanation.compositeBase', {
      score: option.compositeScore.toFixed(1),
      strength: t(`pages:recommendations.explanation.${scoreStrengthKey}`),
    }) +
    t(`pages:recommendations.explanation.${compositeQualKey}`)
  );

  const finalQualKey = option.compositeScore >= 70 ? 'finalHigh'
    : option.compositeScore >= 50 ? 'finalModerate' : 'finalLow';
  sections.push(
    `**${t('pages:recommendations.explanation.finalHeader')}** ` +
    t('pages:recommendations.explanation.finalBase', {
      stockName: option.stockName,
      optionName: option.optionName,
      strikePrice: option.strikePrice.toFixed(2),
      expiryDate: option.expiryDate,
      daysToExpiry: option.daysToExpiry,
      premium: option.premium.toLocaleString(),
    }) +
    t(`pages:recommendations.explanation.${finalQualKey}`)
  );

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Info className="h-4 w-4" />
          {t('pages:recommendations.explanation.cardTitle')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sections.map((section, idx) => {
          const parts = section.split(/(\*\*.*?\*\*)/g);
          return (
            <p key={idx} className="text-sm leading-relaxed">
              {parts.map((part, partIdx) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                  return (
                    <span key={partIdx} className="font-semibold">
                      {part.slice(2, -2)}
                    </span>
                  );
                }
                return part;
              })}
            </p>
          );
        })}
      </CardContent>
    </Card>
  );
};
