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

  const risk = getRiskLevel(option.ProbOfWorthless);

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
              <span className="font-medium">{formatValue(option.ProbOfWorthless, 'ProbOfWorthless')}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Prob Above Strike</span>
              <span className="font-medium">{formatValue(option.EstimatedProbAboveStrike, 'EstimatedProbAboveStrike')}</span>
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
            <CardTitle>Pricing & Volatility</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Implied Volatility</span>
              <span className="font-medium">{formatValue(option.ImpliedVolatility, 'ImpliedVolatility')}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Bid-Ask Spread</span>
              <span className="font-medium">{formatValue(option.AskBidSpread, 'AskBidSpread')}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Bid Price</span>
              <span className="font-medium">{formatValue(option.Bid, 'Bid')}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Mid Price</span>
              <span className="font-medium">{formatValue(option.Bid_Ask_Mid_Price, 'Bid_Ask_Mid_Price')}</span>
            </div>
          </CardContent>
        </Card>
      </div>

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