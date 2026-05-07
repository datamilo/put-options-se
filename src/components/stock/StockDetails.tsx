import { StockData, StockSummary } from "@/types/stock";
import { CandlestickChart } from "./CandlestickChart";
import { useStockData } from "@/hooks/useStockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, BarChart3, Activity, BarChart2, ArrowUpDown } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface StockDetailsProps {
  stockData: StockData[];
  stockSummary: StockSummary;
}

export const StockDetails = ({ stockData, stockSummary }: StockDetailsProps) => {
  const { t } = useTranslation('pages');
  const isPositiveChange = stockSummary.priceChange >= 0;
  const { getPriceRangeForPeriod } = useStockData();

  const timePeriodOptions = [
    { labelKey: "1w", days: 7 },
    { labelKey: "1m", days: 30 },
    { labelKey: "3m", days: 90 },
    { labelKey: "6m", days: 180 },
    { labelKey: "9m", days: 270 },
    { labelKey: "1y", days: 365 },
  ];

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
                <p className="text-muted-foreground">{t('stockAnalysis.subtitle')}</p>
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
              <p className="text-sm text-muted-foreground">{t('stockAnalysis.sections.currentPrice')}</p>
              <p className="text-2xl font-bold">{stockSummary.currentPrice.toFixed(2)}</p>
              <p className={`text-sm ${isPositiveChange ? 'text-green-600' : 'text-red-600'}`}>
                {isPositiveChange ? '+' : ''}{stockSummary.priceChange.toFixed(2)}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <BarChart2 className="h-4 w-4" />
                {t('stockAnalysis.sections.medianDailyVolume')}
              </p>
              <p className="text-xl font-semibold">{formatNumber(stockSummary.medianVolume, 'volume')}</p>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <ArrowUpDown className="h-4 w-4" />
                {t('stockAnalysis.sections.oneYearRange')}
              </p>
              <p className="text-lg font-medium">
                {stockSummary.lowPrice52Week.toFixed(2)} - {stockSummary.highPrice52Week.toFixed(2)}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Activity className="h-4 w-4" />
                {t('stockAnalysis.sections.volatility')}
              </p>
              <p className="text-xl font-semibold">{stockSummary.volatility.toFixed(1)}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Price Ranges for Different Periods */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowUpDown className="h-5 w-5" />
            {t('stockAnalysis.sections.priceRanges')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {timePeriodOptions.map((period) => {
              const range = getPriceRangeForPeriod(stockSummary.name, period.days);
              return (
                <div key={period.days} className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">{t(`stockAnalysis.timePeriods.${period.labelKey}`)}</p>
                  {range ? (
                    <p className="text-sm font-semibold">
                      {range.low.toFixed(2)} - {range.high.toFixed(2)}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">{t('stockAnalysis.noData')}</p>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Interactive Candlestick Chart */}
      <CandlestickChart data={stockData} stockName={stockSummary.name} />

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {t('stockAnalysis.sections.performanceMetrics')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('stockAnalysis.sections.today')}</span>
              <span className={isPositiveChange ? 'text-green-600' : 'text-red-600'}>
                {isPositiveChange ? '+' : ''}{stockSummary.priceChangePercent.toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('stockAnalysis.sections.currentWeek')}</span>
              <span className={stockSummary.priceChangePercentWeek >= 0 ? 'text-green-600' : 'text-red-600'}>
                {stockSummary.priceChangePercentWeek >= 0 ? '+' : ''}{stockSummary.priceChangePercentWeek.toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('stockAnalysis.sections.currentMonth')}</span>
              <span className={stockSummary.priceChangePercentMonth >= 0 ? 'text-green-600' : 'text-red-600'}>
                {stockSummary.priceChangePercentMonth >= 0 ? '+' : ''}{stockSummary.priceChangePercentMonth.toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('stockAnalysis.sections.currentYear')}</span>
              <span className={stockSummary.priceChangePercentYear >= 0 ? 'text-green-600' : 'text-red-600'}>
                {stockSummary.priceChangePercentYear >= 0 ? '+' : ''}{stockSummary.priceChangePercentYear.toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('stockAnalysis.sections.yearHigh')}</span>
              <span className="font-medium">{stockSummary.highPrice52Week.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('stockAnalysis.sections.yearLow')}</span>
              <span className="font-medium">{stockSummary.lowPrice52Week.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('stockAnalysis.sections.distFromYearHigh')}</span>
              <span className="font-medium">
                {(((stockSummary.currentPrice - stockSummary.highPrice52Week) / stockSummary.highPrice52Week) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('stockAnalysis.sections.distFromYearLow')}</span>
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
              {t('stockAnalysis.sections.riskMetrics')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('stockAnalysis.sections.annualizedVolatility')}</span>
              <span className="font-medium">{stockSummary.volatility.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('stockAnalysis.sections.medianVolume')}</span>
              <span className="font-medium">{formatNumber(stockSummary.medianVolume, 'volume')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('stockAnalysis.sections.priceRange1Y')}</span>
              <span className="font-medium">
                {(stockSummary.highPrice52Week - stockSummary.lowPrice52Week).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('stockAnalysis.sections.rangeRatio')}</span>
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
