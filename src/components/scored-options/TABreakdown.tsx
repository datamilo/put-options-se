import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScoredOptionData } from '@/types/scoredOptions';
import { formatNordicDecimal, formatNordicPercentage } from '@/utils/numberFormatting';

interface TABreakdownProps {
  option: ScoredOptionData;
}

export const TABreakdown: React.FC<TABreakdownProps> = ({ option }) => {
  // Determine probability color
  const getProbabilityColor = (prob: number) => {
    if (prob >= 0.7) return 'text-green-700';
    if (prob >= 0.5) return 'text-amber-600';
    return 'text-red-600';
  };

  const getProbabilityBgColor = (prob: number) => {
    if (prob >= 0.7) return 'bg-green-50';
    if (prob >= 0.5) return 'bg-amber-50';
    return 'bg-red-50';
  };

  /**
   * Get indicator status based on technical indicator values
   * Returns emoji and assessment
   */
  const getIndicatorStatus = (
    value: number,
    indicator: string
  ): { emoji: string; label: string; assessment: string } => {
    switch (indicator) {
      case 'RSI_14':
        // RSI: < 30 = oversold (bullish for puts), 30-70 = neutral, > 70 = overbought (bearish for puts)
        if (value < 30) return { emoji: '🟢', label: 'Oversold', assessment: 'Strong bullish signal' };
        if (value > 70) return { emoji: '🔴', label: 'Overbought', assessment: 'Weak bullish signal' };
        return { emoji: '🟡', label: 'Neutral', assessment: 'Moderate signal' };

      case 'RSI_Slope':
        // Slope: negative = declining RSI (improving for puts), positive = rising RSI (worsening)
        if (value < -1) return { emoji: '🟢', label: 'Declining', assessment: 'RSI improving for puts' };
        if (value > 1) return { emoji: '🔴', label: 'Rising', assessment: 'RSI worsening for puts' };
        return { emoji: '🟡', label: 'Stable', assessment: 'RSI changing slowly' };

      case 'MACD_Hist':
        // MACD Histogram: negative = bearish, positive = bullish (but for puts, bearish is good)
        if (value < -0.5) return { emoji: '🟢', label: 'Bearish', assessment: 'Strong bearish momentum' };
        if (value > 0.5) return { emoji: '🔴', label: 'Bullish', assessment: 'Bullish momentum' };
        return { emoji: '🟡', label: 'Neutral', assessment: 'Momentum at crossover' };

      case 'MACD_Slope':
        // MACD Slope: negative = declining, positive = rising
        if (value < -0.1) return { emoji: '🟢', label: 'Declining', assessment: 'Momentum weakening' };
        if (value > 0.1) return { emoji: '🔴', label: 'Rising', assessment: 'Momentum strengthening' };
        return { emoji: '🟡', label: 'Flat', assessment: 'Momentum stable' };

      case 'BB_Position':
        // Bollinger Band Position: -1 = at lower band, 0 = middle, 1 = at upper band
        // For puts, closer to lower band is better (more volatility, higher probability of drop)
        if (value < -0.5) return { emoji: '🟢', label: 'Lower Band', assessment: 'Price near support' };
        if (value > 0.5) return { emoji: '🔴', label: 'Upper Band', assessment: 'Price near resistance' };
        return { emoji: '🟡', label: 'Middle', assessment: 'Price mid-range' };

      case 'Dist_SMA50':
        // Distance to 50-day MA: negative = below (bearish), positive = above (bullish)
        if (value < -2) return { emoji: '🟢', label: 'Well Below', assessment: 'Far below moving average' };
        if (value > 2) return { emoji: '🔴', label: 'Well Above', assessment: 'Far above moving average' };
        return { emoji: '🟡', label: 'Near', assessment: 'Close to moving average' };

      case 'Vol_Ratio':
        // Volume Ratio: > 1 = above average volume, < 1 = below average
        if (value > 1.2) return { emoji: '🟢', label: 'High Volume', assessment: 'Strong trading activity' };
        if (value < 0.8) return { emoji: '🔴', label: 'Low Volume', assessment: 'Weak trading activity' };
        return { emoji: '🟡', label: 'Normal', assessment: 'Average volume' };

      case 'Sigma_Distance':
        // Standard deviations from mean: > 2 = extreme, 1-2 = significant, < 1 = normal
        if (Math.abs(value) > 2) return { emoji: '🟢', label: 'Extreme', assessment: 'Price at extremes' };
        if (Math.abs(value) > 1) return { emoji: '🟡', label: 'Significant', assessment: 'Notable move' };
        return { emoji: '🔴', label: 'Normal', assessment: 'Within normal range' };

      case 'HV_annual':
        // Historical Volatility (annual): higher is better for options
        if (value > 40) return { emoji: '🟢', label: 'High', assessment: 'Elevated volatility' };
        if (value > 25) return { emoji: '🟡', label: 'Moderate', assessment: 'Normal volatility' };
        return { emoji: '🔴', label: 'Low', assessment: 'Low volatility' };

      default:
        return { emoji: '⚪', label: 'Unknown', assessment: 'Unable to assess' };
    }
  };

  const getIndicatorFormat = (key: string, value: number): string => {
    // HV_annual should be displayed as percentage
    if (key === 'HV_annual') {
      return formatNordicPercentage(value, 2);
    }
    // All other indicators display as decimal
    return formatNordicDecimal(value, 2);
  };

  const indicators = [
    { key: 'RSI_14' as const, label: 'RSI (14)', value: option.RSI_14 },
    { key: 'RSI_Slope' as const, label: 'RSI Slope', value: option.RSI_Slope },
    { key: 'MACD_Hist' as const, label: 'MACD Histogram', value: option.MACD_Hist },
    { key: 'MACD_Slope' as const, label: 'MACD Slope', value: option.MACD_Slope },
    { key: 'BB_Position' as const, label: 'Bollinger Band Position', value: option.BB_Position },
    { key: 'Dist_SMA50' as const, label: 'Distance to SMA50', value: option.Dist_SMA50 },
    { key: 'Vol_Ratio' as const, label: 'Volume Ratio', value: option.Vol_Ratio },
    { key: 'Sigma_Distance' as const, label: 'Sigma Distance', value: option.Sigma_Distance },
    { key: 'HV_annual' as const, label: 'Historical Volatility (Annual)', value: option.HV_annual },
  ];

  return (
    <Card className={`${getProbabilityBgColor(option.ta_probability)}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">TA Model</CardTitle>
          <div className={`text-3xl font-bold ${getProbabilityColor(option.ta_probability)}`}>
            {formatNordicPercentage(option.ta_probability, 0)}
          </div>
        </div>
        <div className="text-sm text-muted-foreground mt-2">
          Bucket: <span className="font-semibold">{option.ta_bucket}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Indicators */}
        <div className="space-y-3">
          {indicators.map((indicator) => {
            const status = getIndicatorStatus(indicator.value, indicator.key);
            return (
              <div key={indicator.key} className="border-l-4 border-gray-200 pl-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <span className="text-lg">{status.emoji}</span>
                    {indicator.label}
                  </span>
                  <span className="text-sm font-semibold">
                    {getIndicatorFormat(indicator.key, indicator.value)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {status.label} - {status.assessment}
                </p>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 pt-3 border-t">
          <div className="text-xs font-medium text-muted-foreground mb-2">Legend:</div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="flex items-center gap-1">
              <span>🟢</span>
              <span>Favorable</span>
            </div>
            <div className="flex items-center gap-1">
              <span>🟡</span>
              <span>Neutral</span>
            </div>
            <div className="flex items-center gap-1">
              <span>🔴</span>
              <span>Unfavorable</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
