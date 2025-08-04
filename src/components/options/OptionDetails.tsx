import { OptionData } from "@/types/options";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Info } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { useState } from "react";

interface OptionDetailsProps {
  option: OptionData;
}

export const OptionDetails = ({ option }: OptionDetailsProps) => {
  const formatValue = (value: any, field: string) => {
    return formatNumber(value, field);
  };

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
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="text-xs">{content}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );

  const getRiskLevel = (probOfWorthless: number) => {
    if (probOfWorthless < 0.3) return { level: "High Risk", color: "bg-destructive" };
    if (probOfWorthless < 0.6) return { level: "Medium Risk", color: "bg-accent" };
    return { level: "Low Risk", color: "bg-secondary" };
  };

  const risk = getRiskLevel(option['1_2_3_ProbOfWorthless_Weighted']);

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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Premium</p>
              <p className="text-lg font-semibold">{formatValue(option.Premium, 'Premium')}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Strike Price</p>
              <p className="text-lg font-semibold">{formatValue(option.StrikePrice, 'StrikePrice')}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Days to Expiry</p>
              <p className="text-lg font-semibold">{option.DaysToExpiry}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Stock Price</p>
              <p className="text-lg font-semibold">{formatValue(option.StockPrice, 'StockPrice')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Risk Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Historical 100Days Worst Decline</span>
              <span className="font-medium">{formatValue(option.Historical100DaysWorstDecline, 'Historical100DaysWorstDecline')}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Historical 50Days Worst Decline</span>
              <span className="font-medium">{formatValue(option.Historical50DaysWorstDecline, 'Historical50DaysWorstDecline')}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">2008 100Days Worst Decline</span>
              <span className="font-medium">{formatValue(option['2008_100DaysWorstDecline'], '2008_100DaysWorstDecline')}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">2008 50Days Worst Decline</span>
              <span className="font-medium">{formatValue(option['2008_50DaysWorstDecline'], '2008_50DaysWorstDecline')}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Worst Historical Decline</span>
              <span className="font-medium">{formatValue(option.WorstHistoricalDecline, 'WorstHistoricalDecline')}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Bad Historical Decline</span>
              <span className="font-medium">{formatValue(option.BadHistoricalDecline, 'BadHistoricalDecline')}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Stock Price After 100Day Worst Decline</span>
              <span className="font-medium">{formatValue(option.StockPrice_After_100DayWorstDecline, 'StockPrice_After_100DayWorstDecline')}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Stock Price After 50Day Worst Decline</span>
              <span className="font-medium">{formatValue(option.StockPrice_After_50DayWorstDecline, 'StockPrice_After_50DayWorstDecline')}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Stock Price After 2008 50Day Worst Decline</span>
              <span className="font-medium">{formatValue(option.StockPrice_After_2008_50DayWorstDecline, 'StockPrice_After_2008_50DayWorstDecline')}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Stock Price After 2008 100Day Worst Decline</span>
              <span className="font-medium">{formatValue(option.StockPrice_After_2008_100DayWorstDecline, 'StockPrice_After_2008_100DayWorstDecline')}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">100Day Max Price</span>
              <span className="font-medium">{formatValue(option['100DayMaxPrice'], '100DayMaxPrice')}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">100Day Max Price Date</span>
              <span className="font-medium">{formatValue(option['100DayMaxPriceDate'], '100DayMaxPriceDate')}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">50Day Max Price</span>
              <span className="font-medium">{formatValue(option['50DayMaxPrice'], '50DayMaxPrice')}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">50Day Max Price Date</span>
              <span className="font-medium">{formatValue(option['50DayMaxPriceDate'], '50DayMaxPriceDate')}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Risk Metrics (Absolute Values)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Figures Assume Underlying Value</span>
              <span className="font-medium">{formatValue(option.Underlying_Value, 'Underlying_Value')}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">100k Invested Loss Mean</span>
              <span className="font-medium">{formatValue(option['100k_Invested_Loss_Mean'], '100k_Invested_Loss_Mean')}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Loss Least Bad</span>
              <span className="font-medium">{formatValue(option.Loss_Least_Bad, 'Loss_Least_Bad')}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Loss At 2008 100Day Worst Decline</span>
              <span className="font-medium">{formatValue(option.LossAt_2008_100DayWorstDecline, 'LossAt_2008_100DayWorstDecline')}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Loss At 2008 50Day Worst Decline</span>
              <span className="font-medium">{formatValue(option.LossAt_2008_50DayWorstDecline, 'LossAt_2008_50DayWorstDecline')}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Loss At 100Day Worst Decline</span>
              <span className="font-medium">{formatValue(option.LossAt100DayWorstDecline, 'LossAt100DayWorstDecline')}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Loss At 50Day Worst Decline</span>
              <span className="font-medium">{formatValue(option.LossAt50DayWorstDecline, 'LossAt50DayWorstDecline')}</span>
            </div>
          </CardContent>
        </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pricing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Stock Price</span>
            <span className="font-medium">{formatValue(option.StockPrice, 'StockPrice')}</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Number of Contracts Based on Limit</span>
            <span className="font-medium">{formatValue(option.NumberOfContractsBasedOnLimit, 'NumberOfContractsBasedOnLimit')}</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Bid Price</span>
            <span className="font-medium">{formatValue(option.Bid, 'Bid')}</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Ask Price</span>
            <span className="font-medium">{formatValue(option.Ask, 'Ask')}</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Bid-Ask Mid Price</span>
            <span className="font-medium">{formatValue(option.Bid_Ask_Mid_Price, 'Bid_Ask_Mid_Price')}</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Option Price Min</span>
            <span className="font-medium">{formatValue(option.Option_Price_Min, 'Option_Price_Min')}</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Underlying Value</span>
            <span className="font-medium">{formatValue(option.Underlying_Value, 'Underlying_Value')}</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Ask-Bid Spread</span>
            <span className="font-medium">{formatValue(option.AskBidSpread, 'AskBidSpread')}</span>
          </div>
        </CardContent>
        </Card>
        </div>

      <Card>
        <CardHeader>
          <CardTitle>Volatility</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <div className="flex items-center gap-1">
              <span className="text-sm text-muted-foreground">Implied Volatility (Current)</span>
              <DesktopTooltip content="Current Option">
                <Info className="h-3 w-3 text-muted-foreground cursor-help" />
              </DesktopTooltip>
              <InfoTooltip content="Current Option" />
            </div>
            <span className="font-medium">{formatValue(option.ImpliedVolatility, 'ImpliedVolatility')}</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <div className="flex items-center gap-1">
              <span className="text-sm text-muted-foreground">Implied Volatility (Market Median)</span>
              <DesktopTooltip content="Median All Stock Options Nearest Strike, ≤ 100 Days to Expiry">
                <Info className="h-3 w-3 text-muted-foreground cursor-help" />
              </DesktopTooltip>
              <InfoTooltip content="Median All Stock Options Nearest Strike, ≤ 100 Days to Expiry" />
            </div>
            <span className="font-medium">{formatValue(option.AllMedianIV_Maximum100DaysToExp, 'AllMedianIV_Maximum100DaysToExp')}</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <div className="flex items-center gap-1">
              <span className="text-sm text-muted-foreground">Implied Volatility (Stock Median)</span>
              <DesktopTooltip content="Median All Stock Options, ≤ 100 Days to Expiry">
                <Info className="h-3 w-3 text-muted-foreground cursor-help" />
              </DesktopTooltip>
              <InfoTooltip content="Median All Stock Options, ≤ 100 Days to Expiry" />
            </div>
            <span className="font-medium">{formatValue(option.TodayStockMedianIV_Maximum100DaysToExp, 'TodayStockMedianIV_Maximum100DaysToExp')}</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Lower Bound</span>
            <span className="font-medium">{formatValue(option.Lower_Bound, 'Lower_Bound')}</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Lower Bound at Accuracy</span>
            <span className="font-medium">{formatValue(option.Lower_Bound_at_Accuracy, 'Lower_Bound_at_Accuracy')}</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Lower Bound Hist Median IV</span>
            <span className="font-medium">{formatValue(option.Lower_Bound_HistMedianIV, 'Lower_Bound_HistMedianIV')}</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Lower Bound Hist Median IV at Accuracy</span>
            <span className="font-medium">{formatValue(option.Lower_Bound_HistMedianIV_at_Accuracy, 'Lower_Bound_HistMedianIV_at_Accuracy')}</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Implied Volatility Until Expiry</span>
            <span className="font-medium">{formatValue(option.ImpliedVolatilityUntilExpiry, 'ImpliedVolatilityUntilExpiry')}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Probability of Worthless Bayesian IsoCal Monte Carlo Simulation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Mean Earnings</span>
            <span className="font-medium">{formatValue(option.PoW_Simulation_Mean_Earnings, 'PoW_Simulation_Mean_Earnings')}</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Stats Median Loss</span>
            <span className="font-medium">{formatValue(option.PoW_Stats_MedianLoss, 'PoW_Stats_MedianLoss')}</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Stats Median Loss Pct</span>
            <span className="font-medium">{formatValue(option.PoW_Stats_MedianLossPct, 'PoW_Stats_MedianLossPct')}</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Stats Worst Loss</span>
            <span className="font-medium">{formatValue(option.PoW_Stats_WorstLoss, 'PoW_Stats_WorstLoss')}</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Stats Worst Loss Pct</span>
            <span className="font-medium">{formatValue(option.PoW_Stats_WorstLossPct, 'PoW_Stats_WorstLossPct')}</span>
          </div>
        </CardContent>
      </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Events Before Expiry Day</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Financial Report</p>
              <p className="font-medium">{formatValue(option.FinancialReport, 'FinancialReport')}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">X-Day</p>
              <p className="font-medium">{formatValue(option['X-Day'], 'X-Day')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
    </TooltipProvider>
  );
};