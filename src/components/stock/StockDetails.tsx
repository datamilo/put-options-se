import { StockData, StockSummary } from "@/types/stock";
import { StockChart } from "./StockChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, BarChart3, Activity, BarChart2, ArrowUpDown } from "lucide-react";
import { formatNumber } from "@/lib/utils";

interface StockDetailsProps {
  stockData: StockData[];
  stockSummary: StockSummary;
}

export const StockDetails = ({ stockData, stockSummary }: StockDetailsProps) => {
  const isPositiveChange = stockSummary.priceChange >= 0;

  return (
    <div className="space-y-6">
      {/* Stock Summary Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-6 w-6" />
              <div>
                <h2 className="text-2xl font-bold">{stockSummary.name}</h2>
                <p className="text-muted-foreground">Stock Analysis</p>
              </div>
            </div>
            <Badge variant={isPositiveChange ? "default" : "destructive"} className="text-lg px-3 py-1">
              {isPositiveChange ? (
                <TrendingUp className="h-4 w-4 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 mr-1" />
              )}
              {isPositiveChange ? '+' : ''}{stockSummary.priceChangePercent.toFixed(2)}%
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Current Price</p>
              <p className="text-2xl font-bold">{stockSummary.currentPrice.toFixed(2)}</p>
              <p className={`text-sm ${isPositiveChange ? 'text-green-600' : 'text-red-600'}`}>
                {isPositiveChange ? '+' : ''}{stockSummary.priceChange.toFixed(2)}
              </p>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <BarChart2 className="h-4 w-4" />
                Median Daily Volume
              </p>
              <p className="text-xl font-semibold">{formatNumber(stockSummary.medianVolume, 'volume')}</p>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <ArrowUpDown className="h-4 w-4" />
                1 Year Range
              </p>
              <p className="text-lg font-medium">
                {stockSummary.lowPrice52Week.toFixed(2)} - {stockSummary.highPrice52Week.toFixed(2)}
              </p>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Activity className="h-4 w-4" />
                Volatility
              </p>
              <p className="text-xl font-semibold">{stockSummary.volatility.toFixed(1)}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interactive Chart */}
      <StockChart data={stockData} stockName={stockSummary.name} />

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">1-Day Change</span>
              <span className={isPositiveChange ? 'text-green-600' : 'text-red-600'}>
                {isPositiveChange ? '+' : ''}{stockSummary.priceChangePercent.toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">1-Year High</span>
              <span className="font-medium">{stockSummary.highPrice52Week.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">1-Year Low</span>
              <span className="font-medium">{stockSummary.lowPrice52Week.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Distance from 1-Year High</span>
              <span className="font-medium">
                {(((stockSummary.currentPrice - stockSummary.highPrice52Week) / stockSummary.highPrice52Week) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Distance from 1-Year Low</span>
              <span className="font-medium">
                {(((stockSummary.currentPrice - stockSummary.lowPrice52Week) / stockSummary.lowPrice52Week) * 100).toFixed(1)}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Risk Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Annualized Volatility</span>
              <span className="font-medium">{stockSummary.volatility.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Median Volume</span>
              <span className="font-medium">{formatNumber(stockSummary.medianVolume, 'volume')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Price Range (1Y)</span>
              <span className="font-medium">
                {(stockSummary.highPrice52Week - stockSummary.lowPrice52Week).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Range Ratio</span>
              <span className="font-medium">
                {(stockSummary.highPrice52Week / stockSummary.lowPrice52Week).toFixed(2)}x
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};