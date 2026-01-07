import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Info } from 'lucide-react';
import type { RecommendedOption } from '@/types/recommendations';

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
  // Helper to get probability method display name
  const getProbabilityMethodName = (method: string): string => {
    const methodMap: Record<string, string> = {
      'ProbWorthless_Bayesian_IsoCal': 'PoW - Bayesian Calibrated',
      '1_2_3_ProbOfWorthless_Weighted': 'PoW - Weighted Average',
      '1_ProbOfWorthless_Original': 'PoW - Original Black-Scholes',
      '2_ProbOfWorthless_Calibrated': 'PoW - Bias Corrected',
      '3_ProbOfWorthless_Historical_IV': 'PoW - Historical IV',
    };
    return methodMap[method] || method;
  };

  const methodName = getProbabilityMethodName(filters.probabilityMethod);
  const rollingPeriodText = filters.rollingPeriod === 365 ? '1 year' : `${filters.rollingPeriod} days`;

  // Build narrative sections
  const sections: string[] = [];

  // 1. Introduction
  sections.push(
    `This analysis explains why ${option.optionName} (${option.stockName}) has been recommended based on multiple factors.`
  );

  // 2. Support Level Analysis
  if (option.rollingLow !== null && option.distanceToSupportPct !== null) {
    const strikeVsRollingLow = option.strikePrice <= option.rollingLow ? 'below' : 'above';
    const currentPriceVsRollingLow = option.currentPrice <= option.rollingLow ? 'below' : 'above';
    sections.push(
      `**Support Level Discovery:** The option has a strike price of ${option.strikePrice.toFixed(2)} kr, which is ` +
      `${strikeVsRollingLow} the ${rollingPeriodText} rolling low support level ` +
      `of ${option.rollingLow.toFixed(2)} kr. The current price (${option.currentPrice.toFixed(2)} kr) is ` +
      `${Math.abs(option.distanceToSupportPct).toFixed(1)}% ${currentPriceVsRollingLow} the rolling low. ` +
      `This ${rollingPeriodText} low can act as a strong support level for the stock.`
    );
  }

  // 3. Support Robustness
  if (option.daysSinceLastBreak !== null && option.supportStrengthScore !== null) {
    const strengthInterpretation = option.supportStrengthScore >= 70 ? 'strong' :
                                   option.supportStrengthScore >= 50 ? 'moderate' : 'weak';
    const strengthExplanation = option.supportStrengthScore >= 70 ?
      'historically held reliably with few breaks' :
      option.supportStrengthScore >= 50 ?
      'held reasonably well with occasional breaks' :
      'broken frequently or inconsistently';

    sections.push(
      `**Support Robustness:** The support level has not been broken for ${option.daysSinceLastBreak} days, ` +
      `which is ${option.daysSinceLastBreak >= filters.minDaysSinceBreak ? 'above' : 'below'} the minimum threshold ` +
      `of ${filters.minDaysSinceBreak} days. The support strength score is ${option.supportStrengthScore.toFixed(0)}/100, ` +
      `indicating ${strengthInterpretation} support robustness—this means the support level has ${strengthExplanation}. ` +
      `${option.daysSinceLastBreak > 20 ? 'The extended period since the last break makes this support level more reliable.' : ''}`
    );
  }

  // 4. Probability History - Recovery Candidate Identification
  if (option.historicalPeakProbability !== null && option.currentProbability) {
    const peakPct = (option.historicalPeakProbability * 100).toFixed(1);
    const currentPct = (option.currentProbability * 100).toFixed(1);
    const thresholdPct = (filters.historicalPeakThreshold * 100).toFixed(0);
    const drop = ((option.historicalPeakProbability - option.currentProbability) * 100).toFixed(1);

    if (option.historicalPeakProbability >= filters.historicalPeakThreshold &&
        option.historicalPeakProbability > option.currentProbability) {
      // Recovery candidate: peaked above threshold and has since declined
      sections.push(
        `**Probability History & Recovery Research:** This option qualifies as a "recovery candidate"—it previously reached a ${peakPct}% probability peak (above the ${thresholdPct}% threshold) but has since declined to ${currentPct}%. ` +
        `Research from the Probability Analysis page shows that options with this pattern—high historical peaks followed by probability declines—expire worthless significantly more often than their current probability suggests. ` +
        `The market appears to systematically underestimate the worthlessness probability for such recovery candidates. Visit the Probability Analysis page → "Probability Recovery Analysis" section to see detailed research on how often similar recovery candidates expire worthless.`
      );
    } else {
      // Not a recovery candidate or near peak
      sections.push(
        `**Probability History:** The ${methodName} probability has previously peaked at ${peakPct}%, ` +
        `${option.historicalPeakProbability >= filters.historicalPeakThreshold
          ? `which is above the ${thresholdPct}% threshold. The current probability is ${currentPct}%.`
          : `which is below the ${thresholdPct}% threshold, so this is not classified as a recovery candidate. The current probability is ${currentPct}%.`}`
      );
    }
  }

  // 5. Historical Worthless Rate for Recovery Candidates
  if (option.recoveryAdvantage !== null && option.currentProbBin && option.dteBin) {
    const recoveryRatePct = (option.recoveryAdvantage * 100).toFixed(1);

    sections.push(
      `**Historical Worthless Rate:** For recovery candidates like this option (${option.currentProbBin} current probability with ${option.dteBin} days to expiry ` +
      `that previously peaked above ${(filters.historicalPeakThreshold * 100).toFixed(0)}%), ` +
      `historical data shows ${recoveryRatePct}% have expired worthless. ` +
      `This is substantially higher than the current ${(option.currentProbability * 100).toFixed(1)}% probability would suggest. ` +
      `The discrepancy indicates the market undervalues the probability that this option expires worthless, potentially making it an attractive opportunity for put sellers.`
    );
  } else if (option.currentProbability >= 0.9) {
    sections.push(
      `**Historical Worthless Rate:** The current probability of ${(option.currentProbability * 100).toFixed(1)}% ` +
      `is very high (≥90%), which means historical recovery data is not available for this probability bin. ` +
      `Options with such high current probabilities have limited historical comparison data for analysis.`
    );
  }

  // 6. Monthly Seasonality
  if (option.monthlyPositiveRate !== null) {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    const currentMonthIndex = new Date().getMonth();
    const currentMonth = monthNames[currentMonthIndex];
    const monthlyPct = option.monthlyPositiveRate.toFixed(1);

    let seasonalityText = `**Monthly Seasonality:** Historical data shows that ${option.stockName} has ` +
      `had positive performance during ${monthlyPct}% of all ${currentMonth} months in the dataset ` +
      `(${option.monthsInHistoricalData || 'multiple'} months of historical data). `;

    if (option.typicalLowDay !== null) {
      const currentDay = new Date().getDate();
      const dayDiff = Math.abs(currentDay - option.typicalLowDay);
      seasonalityText += `The stock typically hits monthly lows on day ${option.typicalLowDay} ` +
        `(${dayDiff <= 3
          ? `which is very close to today (day ${currentDay}), suggesting we may be near a monthly low point`
          : `while today is day ${currentDay}`}). `;
    }

    if (option.monthlyAvgReturn !== null) {
      seasonalityText += `The average return for ${currentMonth} is ${option.monthlyAvgReturn >= 0 ? '+' : ''}${option.monthlyAvgReturn.toFixed(2)}%.`;
    }

    sections.push(seasonalityText);
  }

  // 7. Current Performance Context
  if (option.currentMonthPerformance !== null && option.monthlyAvgReturn !== null) {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    const currentMonthIndex = new Date().getMonth();
    const currentMonth = monthNames[currentMonthIndex];
    const currentPerf = option.currentMonthPerformance;
    const avgReturn = option.monthlyAvgReturn;
    const underperformance = avgReturn - currentPerf;

    let performanceText = `**Current Performance:** ${option.stockName}'s current performance for ${currentMonth} is ` +
      `${currentPerf >= 0 ? '+' : ''}${currentPerf.toFixed(2)}%, while the historical average for this month is ` +
      `${avgReturn >= 0 ? '+' : ''}${avgReturn.toFixed(2)}%. ` +
      `${underperformance > 0
        ? `The stock is currently underperforming by ${underperformance.toFixed(2)} percentage points, which could suggest potential for a bounce back.`
        : underperformance < 0
        ? `The stock is currently outperforming the historical average by ${Math.abs(underperformance).toFixed(2)} percentage points.`
        : 'The stock is performing in line with historical averages.'}`;

    // Add worst historical performance context
    if (option.worstMonthDrawdown !== null) {
      performanceText += ` Historically, the worst intra-month drawdown for ${currentMonth} has been ` +
        `${option.worstMonthDrawdown.toFixed(2)}%, providing context for potential downside risk.`;
    }

    sections.push(performanceText);
  }

  // 8. Composite Score Conclusion
  const scoreColor = option.compositeScore >= 70 ? 'strong' : option.compositeScore >= 50 ? 'moderate' : 'weak';
  sections.push(
    `**Composite Score:** Based on all these factors combined with customized weights, this option received ` +
    `a composite score of ${option.compositeScore.toFixed(1)}/100, indicating a ${scoreColor} recommendation. ` +
    `${option.compositeScore >= 70
      ? 'This high score suggests multiple favorable conditions align for this option.'
      : option.compositeScore >= 50
      ? 'This moderate score suggests some favorable conditions, but not all factors are optimal.'
      : 'This lower score suggests caution - review individual factors to understand potential concerns.'}`
  );

  // 9. Final Recommendation
  sections.push(
    `**Recommendation:** ${option.stockName} option ${option.optionName} with strike ${option.strikePrice.toFixed(2)} kr ` +
    `and expiry ${option.expiryDate} (${option.daysToExpiry} days) offers a premium of ${option.premium.toLocaleString()} kr. ` +
    `${option.compositeScore >= 70
      ? 'The combination of support level stability, probability recovery potential, and favorable seasonality makes this a compelling candidate for put option writing.'
      : option.compositeScore >= 50
      ? 'This option shows some promise based on the analysis, though individual factors should be carefully reviewed.'
      : 'Consider reviewing alternative options with higher composite scores, or adjust analysis weights to match your risk tolerance.'}`
  );

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Info className="h-4 w-4" />
          Why This Option Was Recommended
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sections.map((section, idx) => {
          // Split on ** to handle bold sections
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
