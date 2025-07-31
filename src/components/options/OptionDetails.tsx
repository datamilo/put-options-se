import { OptionData } from "@/types/options";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface OptionDetailsProps {
  option: OptionData;
}

export const OptionDetails = ({ option }: OptionDetailsProps) => {
  const formatValue = (value: any, field: string) => {
    if (value === null || value === undefined || value === 'NaN') return '-';
    
    if (typeof value === 'number') {
      if (field.includes('Pct') || field.includes('Prob') || field === 'ImpliedVolatility') {
        return `${(value * 100).toFixed(2)}%`;
      }
      if (field.includes('Loss') || field === 'Premium' || field.includes('Price')) {
        return value.toLocaleString('sv-SE');
      }
      return value.toFixed(2);
    }
    
    return String(value);
  };

  const getRiskLevel = (probOfWorthless: number) => {
    if (probOfWorthless < 0.3) return { level: "High Risk", color: "bg-destructive" };
    if (probOfWorthless < 0.6) return { level: "Medium Risk", color: "bg-accent" };
    return { level: "Low Risk", color: "bg-secondary" };
  };

  const risk = getRiskLevel(option['1_2_3_ProbOfWorthless_Weighted']);

  return (
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
        <Card>
          <CardHeader>
            <CardTitle>Risk Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Probability of Worthless</span>
              <span className="font-medium">{formatValue(option['1_2_3_ProbOfWorthless_Weighted'], '1_2_3_ProbOfWorthless_Weighted')}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Prob Above Strike</span>
              <span className="font-medium">{formatValue(option['3_ProbOfWorthless_Historical_IV'], '3_ProbOfWorthless_Historical_IV')}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Loss at Bad Decline</span>
              <span className="font-medium">{formatValue(option.LossAtBadDecline, 'LossAtBadDecline')}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Loss at Worst Decline</span>
              <span className="font-medium">{formatValue(option.LossAtWorstDecline, 'LossAtWorstDecline')}</span>
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

      <Card>
        <CardHeader>
          <CardTitle>Volatility</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Implied Volatility</span>
            <span className="font-medium">{formatValue(option.ImpliedVolatility, 'ImpliedVolatility')}</span>
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

      <Card>
        <CardHeader>
          <CardTitle>Advanced Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Median Loss %</p>
              <p className="font-medium">{formatValue(option.PoW_Stats_MedianLossPct, 'PoW_Stats_MedianLossPct')}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Worst Loss %</p>
              <p className="font-medium">{formatValue(option.PoW_Stats_WorstLossPct, 'PoW_Stats_WorstLossPct')}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Mean Accuracy</p>
              <p className="font-medium">{formatValue(option.Mean_Accuracy, 'Mean_Accuracy')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};