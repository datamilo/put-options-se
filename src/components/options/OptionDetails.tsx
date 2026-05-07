import { OptionData } from "@/types/options";
import { RecalculatedOptionData } from "@/hooks/useRecalculatedOptions";
import { useSettings } from "@/contexts/SettingsContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Info } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { useState } from "react";
import { ProbabilityHistoryChart } from "./ProbabilityHistoryChart";
import { useTranslation } from "react-i18next";

interface OptionDetailsProps {
  option: OptionData | RecalculatedOptionData;
}

export const OptionDetails = ({ option }: OptionDetailsProps) => {
  const { underlyingValue } = useSettings();
  const { t } = useTranslation('pages');

  // Calculate the actual underlying value based on contracts and strike price
  const calculatedUnderlyingValue = option.NumberOfContractsBasedOnLimit * option.StrikePrice * 100;

  const formatValue = (value: any, field: string) => {
    return formatNumber(value, field);
  };

  const isRecalculated = 'originalPremium' in option;

  const InfoTooltip = ({ content }: { content: string }) => (
    <div className="md:hidden">
      <Dialog>
        <DialogTrigger asChild>
          <Info className="h-3 w-3 text-muted-foreground cursor-pointer" />
        </DialogTrigger>
        <DialogContent className="max-w-sm">
          <p className="text-sm">{content}</p>
        </DialogContent>
      </Dialog>
    </div>
  );

  const DesktopTooltip = ({ content, children }: { content: string; children: React.ReactNode }) => (
    <div className="hidden md:block">
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent>
          <p>{content}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );

  const getRiskLevel = (probOfWorthless: number) => {
    if (probOfWorthless <= 0.6) return { level: t('optionDetails.riskLevel.high'), color: "bg-destructive" };
    if (probOfWorthless < 0.8) return { level: t('optionDetails.riskLevel.medium'), color: "bg-accent" };
    return { level: t('optionDetails.riskLevel.low'), color: "bg-secondary" };
  };

  const probValue = option.ProbWorthless_Bayesian_IsoCal ?? option['1_2_3_ProbOfWorthless_Weighted'];
  const risk = getRiskLevel(probValue);

  return (
    <TooltipProvider>
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{option.StockName} - {option.OptionName}</span>
            <Badge className={risk.color}>{risk.level}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">{t('optionDetails.kpi.premium')}</p>
              <p className="text-lg font-semibold">{formatValue(option.Premium, 'Premium')}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('optionDetails.kpi.strikePrice')}</p>
              <p className="text-lg font-semibold">{formatValue(option.StrikePrice, 'StrikePrice')}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('optionDetails.kpi.daysToExpiry')}</p>
              <p className="text-lg font-semibold">{option.DaysToExpiry}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('optionDetails.kpi.stockPrice')}</p>
              <p className="text-lg font-semibold">{formatValue(option.StockPrice, 'StockPrice')}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('optionDetails.kpi.strikeVsStock')}</p>
              <p className="text-lg font-semibold">{formatValue(((option.StrikePrice - option.StockPrice) / option.StockPrice), 'Pct')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {t('optionDetails.pricing.title')}
            {isRecalculated && (
               <Badge variant="secondary" className="text-xs">
                 {t('optionDetails.pricing.recalculatedFor', { value: underlyingValue.toLocaleString('sv-SE') })}
               </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
             <span className="text-sm text-muted-foreground">{t('optionDetails.pricing.underlyingValue')}</span>
             <span className="font-medium">{calculatedUnderlyingValue.toLocaleString('sv-SE')}</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">{t('optionDetails.kpi.strikePrice')}</span>
            <span className="font-medium">{formatValue(option.StrikePrice, 'StrikePrice')}</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">{t('optionDetails.pricing.contracts')}</span>
            <span className="font-medium">{formatValue(option.NumberOfContractsBasedOnLimit, 'NumberOfContractsBasedOnLimit')}</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">{t('optionDetails.pricing.bid')}</span>
            <span className="font-medium">{formatValue(option.Bid, 'Bid')}</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">{t('optionDetails.pricing.ask')}</span>
            <span className="font-medium">{formatValue(option.Ask, 'Ask')}</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">{t('optionDetails.pricing.midPrice')}</span>
            <span className="font-medium">{formatValue(option.Bid_Ask_Mid_Price, 'Bid_Ask_Mid_Price')}</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">{t('optionDetails.pricing.optionPriceMin')}</span>
            <span className="font-medium">{formatValue(option.Option_Price_Min, 'Option_Price_Min')}</span>
          </div>
          {isRecalculated && (
            <>
              <Separator />
              <div className="bg-muted/50 p-3 rounded-lg space-y-2">
                <p className="text-xs text-muted-foreground font-medium">{t('optionDetails.pricing.originalVsRecalc')}</p>
                <div className="flex justify-between text-sm">
                  <span>{t('optionDetails.pricing.originalPremium')}</span>
                  <span>{formatValue((option as RecalculatedOptionData).originalPremium, 'Premium')}</span>
                </div>
                <div className="flex justify-between text-sm font-medium">
                  <span>{t('optionDetails.pricing.currentPremium')}</span>
                  <span>{formatValue(option.Premium, 'Premium')}</span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <ProbabilityHistoryChart optionName={option.OptionName} />


      <Card>
        <CardHeader>
          <CardTitle>{t('optionDetails.events.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">{t('optionDetails.events.financialReport')}</p>
              <p className="font-medium">{formatValue(option.FinancialReport, 'FinancialReport')}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('optionDetails.events.xDay')}</p>
              <p className="font-medium">{formatValue(option['X-Day'], 'X-Day')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('optionDetails.riskMetrics.title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">{t('optionDetails.riskMetrics.hist100Decline')}</span>
              <span className="font-medium">{formatValue(option.Historical100DaysWorstDecline, 'Historical100DaysWorstDecline')}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">{t('optionDetails.riskMetrics.hist50Decline')}</span>
              <span className="font-medium">{formatValue(option.Historical50DaysWorstDecline, 'Historical50DaysWorstDecline')}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">{t('optionDetails.riskMetrics.year2008_100Decline')}</span>
              <span className="font-medium">{formatValue(option['2008_100DaysWorstDecline'], '2008_100DaysWorstDecline')}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">{t('optionDetails.riskMetrics.year2008_50Decline')}</span>
              <span className="font-medium">{formatValue(option['2008_50DaysWorstDecline'], '2008_50DaysWorstDecline')}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">{t('optionDetails.riskMetrics.worstHistDecline')}</span>
              <span className="font-medium">{formatValue(option.WorstHistoricalDecline, 'WorstHistoricalDecline')}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">{t('optionDetails.riskMetrics.badHistDecline')}</span>
              <span className="font-medium">{formatValue(option.BadHistoricalDecline, 'BadHistoricalDecline')}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">{t('optionDetails.riskMetrics.priceAfter100Day')}</span>
              <span className="font-medium">{formatValue(option.StockPrice_After_100DayWorstDecline, 'StockPrice_After_100DayWorstDecline')}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">{t('optionDetails.riskMetrics.priceAfter50Day')}</span>
              <span className="font-medium">{formatValue(option.StockPrice_After_50DayWorstDecline, 'StockPrice_After_50DayWorstDecline')}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">{t('optionDetails.riskMetrics.priceAfter2008_50Day')}</span>
              <span className="font-medium">{formatValue(option.StockPrice_After_2008_50DayWorstDecline, 'StockPrice_After_2008_50DayWorstDecline')}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">{t('optionDetails.riskMetrics.priceAfter2008_100Day')}</span>
              <span className="font-medium">{formatValue(option.StockPrice_After_2008_100DayWorstDecline, 'StockPrice_After_2008_100DayWorstDecline')}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">{t('optionDetails.riskMetrics.maxPrice100Day')}</span>
              <span className="font-medium">{formatValue(option['100DayMaxPrice'], '100DayMaxPrice')}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">{t('optionDetails.riskMetrics.maxPriceDate100Day')}</span>
              <span className="font-medium">{formatValue(option['100DayMaxPriceDate'], '100DayMaxPriceDate')}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">{t('optionDetails.riskMetrics.maxPrice50Day')}</span>
              <span className="font-medium">{formatValue(option['50DayMaxPrice'], '50DayMaxPrice')}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">{t('optionDetails.riskMetrics.maxPriceDate50Day')}</span>
              <span className="font-medium">{formatValue(option['50DayMaxPriceDate'], '50DayMaxPriceDate')}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('optionDetails.riskMetricsAbs.title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">{t('optionDetails.riskMetricsAbs.figuresAssume')}</span>
              <span className="font-medium">{formatValue(option.Underlying_Value, 'Underlying_Value')}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">{t('optionDetails.riskMetricsAbs.loss100kMean')}</span>
              <span className="font-medium">{formatValue(option['100k_Invested_Loss_Mean'], '100k_Invested_Loss_Mean')}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">{t('optionDetails.riskMetricsAbs.lossLeastBad')}</span>
              <span className="font-medium">{formatValue(option.Loss_Least_Bad, 'Loss_Least_Bad')}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">{t('optionDetails.riskMetricsAbs.lossAt2008_100Day')}</span>
              <span className="font-medium">{formatValue(option.LossAt_2008_100DayWorstDecline, 'LossAt_2008_100DayWorstDecline')}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">{t('optionDetails.riskMetricsAbs.lossAt2008_50Day')}</span>
              <span className="font-medium">{formatValue(option.LossAt_2008_50DayWorstDecline, 'LossAt_2008_50DayWorstDecline')}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">{t('optionDetails.riskMetricsAbs.lossAt100Day')}</span>
              <span className="font-medium">{formatValue(option.LossAt100DayWorstDecline, 'LossAt100DayWorstDecline')}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">{t('optionDetails.riskMetricsAbs.lossAt50Day')}</span>
              <span className="font-medium">{formatValue(option.LossAt50DayWorstDecline, 'LossAt50DayWorstDecline')}</span>
            </div>
          </CardContent>
        </Card>
        </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('optionDetails.volatilityCard.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <div className="flex items-center gap-1">
              <span className="text-sm text-muted-foreground">{t('optionDetails.volatilityCard.ivCurrent')}</span>
              <DesktopTooltip content={t('optionDetails.volatilityCard.ivCurrentTooltip')}>
                <Info className="h-3 w-3 text-muted-foreground cursor-help" />
              </DesktopTooltip>
              <InfoTooltip content={t('optionDetails.volatilityCard.ivCurrentTooltip')} />
            </div>
            <span className="font-medium">{formatValue(option.ImpliedVolatility, 'ImpliedVolatility')}</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <div className="flex items-center gap-1">
              <span className="text-sm text-muted-foreground">{t('optionDetails.volatilityCard.ivMarketMedian')}</span>
              <DesktopTooltip content={t('optionDetails.volatilityCard.ivMarketMedianTooltip')}>
                <Info className="h-3 w-3 text-muted-foreground cursor-help" />
              </DesktopTooltip>
              <InfoTooltip content={t('optionDetails.volatilityCard.ivMarketMedianTooltip')} />
            </div>
            <span className="font-medium">{formatValue(option.AllMedianIV_Maximum100DaysToExp, 'AllMedianIV_Maximum100DaysToExp')}</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <div className="flex items-center gap-1">
              <span className="text-sm text-muted-foreground">{t('optionDetails.volatilityCard.ivStockMedian')}</span>
              <DesktopTooltip content={t('optionDetails.volatilityCard.ivStockMedianTooltip')}>
                <Info className="h-3 w-3 text-muted-foreground cursor-help" />
              </DesktopTooltip>
              <InfoTooltip content={t('optionDetails.volatilityCard.ivStockMedianTooltip')} />
            </div>
            <span className="font-medium">{formatValue(option.TodayStockMedianIV_Maximum100DaysToExp, 'TodayStockMedianIV_Maximum100DaysToExp')}</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">{t('optionDetails.volatilityCard.lowerBound')}</span>
            <span className="font-medium">{formatValue(option.Lower_Bound, 'Lower_Bound')}</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">{t('optionDetails.volatilityCard.lowerBoundAtAccuracy')}</span>
            <span className="font-medium">{formatValue(option.Lower_Bound_at_Accuracy, 'Lower_Bound_at_Accuracy')}</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">{t('optionDetails.volatilityCard.lowerBoundHistMedian')}</span>
            <span className="font-medium">{formatValue(option.Lower_Bound_HistMedianIV, 'Lower_Bound_HistMedianIV')}</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">{t('optionDetails.volatilityCard.lowerBoundHistMedianAtAccuracy')}</span>
            <span className="font-medium">{formatValue(option.Lower_Bound_HistMedianIV_at_Accuracy, 'Lower_Bound_HistMedianIV_at_Accuracy')}</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">{t('optionDetails.volatilityCard.ivUntilExpiry')}</span>
            <span className="font-medium">{formatValue(option.ImpliedVolatilityUntilExpiry, 'ImpliedVolatilityUntilExpiry')}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('optionDetails.powSimulation.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">{t('optionDetails.powSimulation.meanEarnings')}</span>
            <span className="font-medium">{formatValue(option.PoW_Simulation_Mean_Earnings, 'PoW_Simulation_Mean_Earnings')}</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">{t('optionDetails.powSimulation.statsMedianLoss')}</span>
            <span className="font-medium">{formatValue(option.PoW_Stats_MedianLoss, 'PoW_Stats_MedianLoss')}</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">{t('optionDetails.powSimulation.statsMedianLossPct')}</span>
            <span className="font-medium">{formatValue(option.PoW_Stats_MedianLossPct, 'PoW_Stats_MedianLossPct')}</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">{t('optionDetails.powSimulation.statsWorstLoss')}</span>
            <span className="font-medium">{formatValue(option.PoW_Stats_WorstLoss, 'PoW_Stats_WorstLoss')}</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">{t('optionDetails.powSimulation.statsWorstLossPct')}</span>
            <span className="font-medium">{formatValue(option.PoW_Stats_WorstLossPct, 'PoW_Stats_WorstLossPct')}</span>
          </div>
        </CardContent>
      </Card>
      </div>


    </div>
    </TooltipProvider>
  );
};