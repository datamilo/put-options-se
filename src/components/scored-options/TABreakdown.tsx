import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InfoIconTooltip } from '@/components/ui/info-icon-tooltip';
import { ScoredOptionData } from '@/types/scoredOptions';
import { formatNordicDecimal, formatNordicPercentage } from '@/utils/numberFormatting';
import scoredOptionsTooltips from '@/utils/scoredOptionsTooltips';

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
        // MACD Slope: positive = rising (strengthening trend, favorable), negative = declining (weakening, unfavorable)
        if (value > 0.1) return { emoji: '🟢', label: 'Rising', assessment: 'Momentum strengthening' };
        if (value < -0.1) return { emoji: '🔴', label: 'Declining', assessment: 'Momentum weakening' };
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

      case 'ADX_14':
        // ADX (Average Directional Index): > 25 = strong trend, < 20 = weak trend
        if (value > 25) return { emoji: '🟢', label: 'Strong Trend', assessment: 'Pronounced directional momentum' };
        if (value > 20) return { emoji: '🟡', label: 'Moderate Trend', assessment: 'Established direction' };
        return { emoji: '🔴', label: 'Weak Trend', assessment: 'Weak directional signal' };

      case 'ADX_Slope':
        // ADX Slope: positive = strengthening trend, negative = weakening trend
        if (value > 0.5) return { emoji: '🟢', label: 'Strengthening', assessment: 'Trend momentum increasing' };
        if (value < -0.5) return { emoji: '🔴', label: 'Weakening', assessment: 'Trend momentum decreasing' };
        return { emoji: '🟡', label: 'Stable', assessment: 'Trend momentum steady' };

      case 'ATR_14':
        // ATR (Average True Range): higher = more volatility
        if (value > 2) return { emoji: '🟢', label: 'High', assessment: 'Elevated volatility' };
        if (value > 1) return { emoji: '🟡', label: 'Moderate', assessment: 'Normal volatility' };
        return { emoji: '🔴', label: 'Low', assessment: 'Low volatility' };

      case 'Stochastic_K':
        // Stochastic K: < 20 = oversold, 20-80 = normal, > 80 = overbought
        if (value < 20) return { emoji: '🟢', label: 'Oversold', assessment: 'Strong bullish signal' };
        if (value > 80) return { emoji: '🔴', label: 'Overbought', assessment: 'Weak bullish signal' };
        return { emoji: '🟡', label: 'Neutral', assessment: 'Normal momentum' };

      case 'Stochastic_D':
        // Stochastic D (signal line): same interpretation as K
        if (value < 20) return { emoji: '🟢', label: 'Oversold', assessment: 'Strong bullish signal' };
        if (value > 80) return { emoji: '🔴', label: 'Overbought', assessment: 'Weak bullish signal' };
        return { emoji: '🟡', label: 'Neutral', assessment: 'Normal momentum' };

      case 'Greeks_Delta':
        // Delta: -1 to 0 for puts. More negative = higher probability of ITM
        if (value < -0.5) return { emoji: '🟢', label: 'High ITM Risk', assessment: 'Option likely ITM' };
        if (value < -0.25) return { emoji: '🟡', label: 'Moderate ITM Risk', assessment: 'Moderate ITM probability' };
        return { emoji: '🔴', label: 'Low ITM Risk', assessment: 'Low ITM probability' };

      case 'Greeks_Vega':
        // Vega: sensitivity to volatility changes. Positive = option benefits from higher IV
        if (value > 0.05) return { emoji: '🟢', label: 'High IV Sensitivity', assessment: 'Benefits from volatility increase' };
        if (value > 0.01) return { emoji: '🟡', label: 'Moderate IV Sensitivity', assessment: 'Normal IV exposure' };
        return { emoji: '🔴', label: 'Low IV Sensitivity', assessment: 'Minimal IV exposure' };

      case 'Greeks_Theta':
        // Theta: time decay. Positive = option benefits from time decay (good for sellers)
        if (value > 0.01) return { emoji: '🟢', label: 'Favorable Decay', assessment: 'Time decay benefits seller' };
        if (value > -0.01) return { emoji: '🟡', label: 'Neutral Decay', assessment: 'Minimal time decay impact' };
        return { emoji: '🔴', label: 'Unfavorable Decay', assessment: 'Decay works against seller' };

      default:
        return { emoji: '⚪', label: 'Unknown', assessment: 'Unable to assess' };
    }
  };

  const getIndicatorFormat = (key: string, value: number): string => {
    // Stochastic K and D are already on 0-100 scale
    if (key === 'Stochastic_K' || key === 'Stochastic_D') {
      return formatNordicDecimal(value, 1);
    }
    // Greeks (Delta, Vega, Theta) display as small decimals
    if (key === 'Greeks_Delta' || key === 'Greeks_Vega' || key === 'Greeks_Theta') {
      return formatNordicDecimal(value, 4);
    }
    // All other indicators display as decimal
    return formatNordicDecimal(value, 2);
  };

  // Stock-level technical indicators
  const stockIndicators = [
    { key: 'RSI_14' as const, label: 'RSI (14)', value: option.RSI_14 },
    { key: 'RSI_Slope' as const, label: 'RSI Slope', value: option.RSI_Slope },
    { key: 'MACD_Hist' as const, label: 'MACD Histogram', value: option.MACD_Hist },
    { key: 'MACD_Slope' as const, label: 'MACD Slope', value: option.MACD_Slope },
    { key: 'BB_Position' as const, label: 'Bollinger Band Position', value: option.BB_Position },
    { key: 'Dist_SMA50' as const, label: 'Distance to SMA50', value: option.Dist_SMA50 },
    { key: 'Vol_Ratio' as const, label: 'Volume Ratio', value: option.Vol_Ratio },
    { key: 'ADX_14' as const, label: 'ADX (14)', value: option.ADX_14 },
    { key: 'ADX_Slope' as const, label: 'ADX Slope', value: option.ADX_Slope },
    { key: 'ATR_14' as const, label: 'ATR (14)', value: option.ATR_14 },
    { key: 'Stochastic_K' as const, label: 'Stochastic K', value: option.Stochastic_K },
    { key: 'Stochastic_D' as const, label: 'Stochastic D', value: option.Stochastic_D },
  ];

  // Contract-level indicators
  const contractIndicators = [
    { key: 'Sigma_Distance' as const, label: 'Sigma Distance', value: option.Sigma_Distance },
    { key: 'Greeks_Delta' as const, label: 'Delta (Greeks)', value: option.Greeks_Delta },
    { key: 'Greeks_Vega' as const, label: 'Vega (Greeks)', value: option.Greeks_Vega },
    { key: 'Greeks_Theta' as const, label: 'Theta (Greeks)', value: option.Greeks_Theta },
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
        {/* Stock-Level Technical Indicators */}
        <div className="space-y-3">
          <div className="text-sm font-semibold text-muted-foreground border-b pb-2">
            Stock-Level Indicators
          </div>
          {stockIndicators.map((indicator) => {
            const status = getIndicatorStatus(indicator.value, indicator.key);
            // Map indicator keys to tooltip paths
            const tooltipMap: Record<string, keyof typeof scoredOptionsTooltips.taStockIndicators> = {
              'RSI_14': 'rsi14',
              'RSI_Slope': 'rsiSlope',
              'MACD_Hist': 'macdHist',
              'MACD_Slope': 'macdSlope',
              'BB_Position': 'bbPosition',
              'Dist_SMA50': 'distSMA50',
              'Vol_Ratio': 'volRatio',
              'ADX_14': 'adx14',
              'ADX_Slope': 'adxSlope',
              'ATR_14': 'atr14',
              'Stochastic_K': 'stochasticK',
              'Stochastic_D': 'stochasticD',
            };
            const tooltipKey = tooltipMap[indicator.key];
            const tooltip = tooltipKey ? scoredOptionsTooltips.taStockIndicators[tooltipKey] : null;

            return (
              <div key={indicator.key} className="border-l-4 border-gray-200 pl-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <span className="text-lg">{status.emoji}</span>
                    <span className="flex items-center gap-1">
                      {indicator.label}
                      {tooltip && (
                        <InfoIconTooltip
                          title={tooltip.title}
                          content={tooltip.content}
                          side="top"
                        />
                      )}
                    </span>
                  </span>
                  <span className="text-sm font-semibold">
                    {indicator.value != null ? getIndicatorFormat(indicator.key, indicator.value) : '-'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {status.label} - {status.assessment}
                </p>
              </div>
            );
          })}
        </div>

        {/* Contract-Level Indicators */}
        <div className="space-y-3">
          <div className="text-sm font-semibold text-muted-foreground border-b pb-2">
            Contract-Level Indicators
          </div>
          {contractIndicators.map((indicator) => {
            const status = getIndicatorStatus(indicator.value, indicator.key);
            // Map indicator keys to tooltip paths
            const tooltipMap: Record<string, keyof typeof scoredOptionsTooltips.taContractIndicators> = {
              'Sigma_Distance': 'sigmaDistance',
              'Greeks_Delta': 'delta',
              'Greeks_Vega': 'vega',
              'Greeks_Theta': 'theta',
            };
            const tooltipKey = tooltipMap[indicator.key];
            const tooltip = tooltipKey ? scoredOptionsTooltips.taContractIndicators[tooltipKey] : null;

            return (
              <div key={indicator.key} className="border-l-4 border-gray-200 pl-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <span className="text-lg">{status.emoji}</span>
                    <span className="flex items-center gap-1">
                      {indicator.label}
                      {tooltip && (
                        <InfoIconTooltip
                          title={tooltip.title}
                          content={tooltip.content}
                          side="top"
                        />
                      )}
                    </span>
                  </span>
                  <span className="text-sm font-semibold">
                    {indicator.value != null ? getIndicatorFormat(indicator.key, indicator.value) : '-'}
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
