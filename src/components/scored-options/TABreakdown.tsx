import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InfoIconTooltip } from '@/components/ui/info-icon-tooltip';
import { ScoredOptionData } from '@/types/scoredOptions';
import { formatNordicDecimal, formatNordicPercentage } from '@/utils/numberFormatting';
import scoredOptionsTooltips from '@/utils/scoredOptionsTooltips';
import { useTranslation } from 'react-i18next';

interface TABreakdownProps {
  option: ScoredOptionData;
}

export const TABreakdown: React.FC<TABreakdownProps> = ({ option }) => {
  const { t } = useTranslation('pages');

  const getProbabilityColor = (prob: number) => {
    if (prob >= 0.7) return 'text-green-700';
    if (prob >= 0.5) return 'text-amber-600';
    return 'text-red-600';
  };

  const getProbabilityBgColor = (prob: number) => {
    if (prob >= 0.7) return 'bg-green-50 dark:bg-green-950';
    if (prob >= 0.5) return 'bg-amber-50 dark:bg-amber-950';
    return 'bg-red-50 dark:bg-red-950';
  };

  const getIndicatorStatus = (
    value: number,
    indicator: string
  ): { emoji: string; state: string } => {
    switch (indicator) {
      case 'RSI_14':
        if (value < 30) return { emoji: '🟢', state: 'low' };
        if (value > 70) return { emoji: '🔴', state: 'high' };
        return { emoji: '🟡', state: 'neutral' };
      case 'RSI_Slope':
        if (value < -1) return { emoji: '🟢', state: 'low' };
        if (value > 1) return { emoji: '🔴', state: 'high' };
        return { emoji: '🟡', state: 'neutral' };
      case 'MACD_Hist':
        if (value < -0.5) return { emoji: '🟢', state: 'low' };
        if (value > 0.5) return { emoji: '🔴', state: 'high' };
        return { emoji: '🟡', state: 'neutral' };
      case 'MACD_Slope':
        if (value > 0.1) return { emoji: '🟢', state: 'high' };
        if (value < -0.1) return { emoji: '🔴', state: 'low' };
        return { emoji: '🟡', state: 'neutral' };
      case 'BB_Position':
        if (value < -0.5) return { emoji: '🟢', state: 'low' };
        if (value > 0.5) return { emoji: '🔴', state: 'high' };
        return { emoji: '🟡', state: 'neutral' };
      case 'Dist_SMA50':
        if (value < -2) return { emoji: '🟢', state: 'low' };
        if (value > 2) return { emoji: '🔴', state: 'high' };
        return { emoji: '🟡', state: 'neutral' };
      case 'Vol_Ratio':
        if (value > 1.2) return { emoji: '🟢', state: 'high' };
        if (value < 0.8) return { emoji: '🔴', state: 'low' };
        return { emoji: '🟡', state: 'neutral' };
      case 'ADX_14':
        if (value > 25) return { emoji: '🟢', state: 'high' };
        if (value > 20) return { emoji: '🟡', state: 'moderate' };
        return { emoji: '🔴', state: 'low' };
      case 'ADX_Slope':
        if (value > 0.5) return { emoji: '🟢', state: 'high' };
        if (value < -0.5) return { emoji: '🔴', state: 'low' };
        return { emoji: '🟡', state: 'neutral' };
      case 'ATR_14':
        if (value > 2) return { emoji: '🟢', state: 'high' };
        if (value > 1) return { emoji: '🟡', state: 'moderate' };
        return { emoji: '🔴', state: 'low' };
      case 'Stochastic_K':
        if (value < 20) return { emoji: '🟢', state: 'low' };
        if (value > 80) return { emoji: '🔴', state: 'high' };
        return { emoji: '🟡', state: 'neutral' };
      case 'Stochastic_D':
        if (value < 20) return { emoji: '🟢', state: 'low' };
        if (value > 80) return { emoji: '🔴', state: 'high' };
        return { emoji: '🟡', state: 'neutral' };
      case 'Sigma_Distance':
        if (Math.abs(value) > 2) return { emoji: '🟢', state: 'high' };
        if (Math.abs(value) > 1) return { emoji: '🟡', state: 'moderate' };
        return { emoji: '🔴', state: 'low' };
      case 'Greeks_Delta':
        if (value < -0.5) return { emoji: '🟢', state: 'high' };
        if (value < -0.25) return { emoji: '🟡', state: 'moderate' };
        return { emoji: '🔴', state: 'low' };
      case 'Greeks_Vega':
        if (value > 0.05) return { emoji: '🟢', state: 'high' };
        if (value > 0.01) return { emoji: '🟡', state: 'moderate' };
        return { emoji: '🔴', state: 'low' };
      case 'Greeks_Theta':
        if (value > 0.01) return { emoji: '🟢', state: 'high' };
        if (value > -0.01) return { emoji: '🟡', state: 'neutral' };
        return { emoji: '🔴', state: 'low' };
      default:
        return { emoji: '⚪', state: 'unknown' };
    }
  };

  const getIndicatorLabel = (key: string) =>
    t(`scoredOptions.taBreakdown.indicatorLabels.${key}`);

  const getStatusLabel = (indicatorKey: string, state: string) =>
    state === 'unknown'
      ? t('scoredOptions.taBreakdown.status.unknown.label')
      : t(`scoredOptions.taBreakdown.status.${indicatorKey}.${state}.label`);

  const getStatusAssessment = (indicatorKey: string, state: string) =>
    state === 'unknown'
      ? t('scoredOptions.taBreakdown.status.unknown.assessment')
      : t(`scoredOptions.taBreakdown.status.${indicatorKey}.${state}.assessment`);

  const getIndicatorFormat = (key: string, value: number): string => {
    if (key === 'Dist_SMA50') return formatNordicPercentage(value, 2);
    if (key === 'Stochastic_K' || key === 'Stochastic_D') return formatNordicDecimal(value, 1);
    if (key === 'Greeks_Delta' || key === 'Greeks_Vega' || key === 'Greeks_Theta') return formatNordicDecimal(value, 4);
    return formatNordicDecimal(value, 2);
  };

  const stockIndicators = [
    { key: 'RSI_14' as const, value: option.RSI_14 },
    { key: 'RSI_Slope' as const, value: option.RSI_Slope },
    { key: 'MACD_Hist' as const, value: option.MACD_Hist },
    { key: 'MACD_Slope' as const, value: option.MACD_Slope },
    { key: 'BB_Position' as const, value: option.BB_Position },
    { key: 'Dist_SMA50' as const, value: option.Dist_SMA50 },
    { key: 'Vol_Ratio' as const, value: option.Vol_Ratio },
    { key: 'ADX_14' as const, value: option.ADX_14 },
    { key: 'ADX_Slope' as const, value: option.ADX_Slope },
    { key: 'ATR_14' as const, value: option.ATR_14 },
    { key: 'Stochastic_K' as const, value: option.Stochastic_K },
    { key: 'Stochastic_D' as const, value: option.Stochastic_D },
  ];

  const contractIndicators = [
    { key: 'Sigma_Distance' as const, value: option.Sigma_Distance },
    { key: 'Greeks_Delta' as const, value: option.Greeks_Delta },
    { key: 'Greeks_Vega' as const, value: option.Greeks_Vega },
    { key: 'Greeks_Theta' as const, value: option.Greeks_Theta },
  ];

  const renderIndicator = (
    indicator: { key: string; value: number },
    tooltipFn: (key: string) => { title: string; content: string } | null
  ) => {
    const status = getIndicatorStatus(indicator.value, indicator.key);
    const tooltip = tooltipFn(indicator.key);
    return (
      <div key={indicator.key} className="border-l-4 border-gray-200 pl-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium flex items-center gap-2">
            <span className="text-lg">{status.emoji}</span>
            <span className="flex items-center gap-1">
              {getIndicatorLabel(indicator.key)}
              {tooltip && (
                <InfoIconTooltip title={tooltip.title} content={tooltip.content} side="top" />
              )}
            </span>
          </span>
          <span className="text-sm font-semibold">
            {indicator.value != null ? getIndicatorFormat(indicator.key, indicator.value) : '-'}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          {getStatusLabel(indicator.key, status.state)} - {getStatusAssessment(indicator.key, status.state)}
        </p>
      </div>
    );
  };

  const stockTooltipMap: Record<string, keyof typeof scoredOptionsTooltips.taStockIndicators> = {
    'RSI_14': 'rsi14', 'RSI_Slope': 'rsiSlope', 'MACD_Hist': 'macdHist',
    'MACD_Slope': 'macdSlope', 'BB_Position': 'bbPosition', 'Dist_SMA50': 'distSMA50',
    'Vol_Ratio': 'volRatio', 'ADX_14': 'adx14', 'ADX_Slope': 'adxSlope',
    'ATR_14': 'atr14', 'Stochastic_K': 'stochasticK', 'Stochastic_D': 'stochasticD',
  };

  const contractTooltipMap: Record<string, keyof typeof scoredOptionsTooltips.taContractIndicators> = {
    'Sigma_Distance': 'sigmaDistance', 'Greeks_Delta': 'delta',
    'Greeks_Vega': 'vega', 'Greeks_Theta': 'theta',
  };

  return (
    <Card className={`${getProbabilityBgColor(option.ta_probability)}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{t('scoredOptions.taBreakdown.title')}</CardTitle>
          <div className={`text-3xl font-bold ${getProbabilityColor(option.ta_probability)}`}>
            {formatNordicPercentage(option.ta_probability, 0)}
          </div>
        </div>
        <div className="text-sm text-muted-foreground mt-2">
          {t('scoredOptions.taBreakdown.bucket')} <span className="font-semibold">{option.ta_bucket}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="text-sm font-semibold text-muted-foreground border-b pb-2">
            {t('scoredOptions.taBreakdown.stockLevelIndicators')}
          </div>
          {stockIndicators.map((ind) =>
            renderIndicator(ind, (key) => {
              const k = stockTooltipMap[key];
              return k ? scoredOptionsTooltips.taStockIndicators[k] : null;
            })
          )}
        </div>

        <div className="space-y-3">
          <div className="text-sm font-semibold text-muted-foreground border-b pb-2">
            {t('scoredOptions.taBreakdown.contractLevelIndicators')}
          </div>
          {contractIndicators.map((ind) =>
            renderIndicator(ind, (key) => {
              const k = contractTooltipMap[key];
              return k ? scoredOptionsTooltips.taContractIndicators[k] : null;
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
};
