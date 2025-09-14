import React, { useState, useMemo } from 'react';
import { MonthlyStockStats } from '@/hooks/useMonthlyStockData';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface MonthlySeasonalityHeatmapProps {
  data: MonthlyStockStats[];
}

type MetricType = 'pct_pos_return_months' | 'return_month_mean_pct_return_month';
type SortType = 'top_5_accumulated_score' | 'alphabetical' | 'avg_return';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const MonthlySeasonalityHeatmap: React.FC<MonthlySeasonalityHeatmapProps> = ({ data }) => {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('pct_pos_return_months');
  const [sortBy, setSortBy] = useState<SortType>('top_5_accumulated_score');
  const [maxStocks, setMaxStocks] = useState(20);

  // Process and sort stocks
  const processedData = useMemo(() => {
    // Get unique stocks and calculate their overall scores for sorting
    const stockMap = new Map<string, {
      name: string;
      score: number;
      avgReturn: number;
      monthlyData: Map<number, MonthlyStockStats>;
    }>();

    data.forEach(stat => {
      if (!stockMap.has(stat.name)) {
        stockMap.set(stat.name, {
          name: stat.name,
          score: 0,
          avgReturn: 0,
          monthlyData: new Map()
        });
      }
      
      const stockInfo = stockMap.get(stat.name)!;
      stockInfo.monthlyData.set(stat.month, stat);
      stockInfo.score = Math.max(stockInfo.score, stat.top_5_accumulated_score);
    });

    // Calculate average returns for sorting
    stockMap.forEach((stockInfo, name) => {
      const returns = Array.from(stockInfo.monthlyData.values()).map(s => s.return_month_mean_pct_return_month);
      stockInfo.avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    });

    // Sort stocks based on selected criteria
    const sortedStocks = Array.from(stockMap.values()).sort((a, b) => {
      switch (sortBy) {
        case 'top_5_accumulated_score':
          return b.score - a.score;
        case 'avg_return':
          return b.avgReturn - a.avgReturn;
        case 'alphabetical':
          return a.name.localeCompare(b.name);
        default:
          return b.score - a.score;
      }
    });

    return sortedStocks.slice(0, maxStocks);
  }, [data, sortBy, maxStocks]);

  const getColorClass = (value: number | null, metric: MetricType) => {
    if (value === null) return 'bg-muted';
    
    if (metric === 'pct_pos_return_months') {
      // 0-100% scale for positive return percentage
      if (value >= 80) return 'bg-green-600';
      if (value >= 70) return 'bg-green-500';
      if (value >= 60) return 'bg-green-400';
      if (value >= 50) return 'bg-yellow-400';
      if (value >= 40) return 'bg-orange-400';
      if (value >= 30) return 'bg-red-400';
      return 'bg-red-500';
    } else {
      // Return percentage scale (can be negative)
      if (value >= 5) return 'bg-green-600';
      if (value >= 2) return 'bg-green-500';
      if (value >= 0) return 'bg-green-400';
      if (value >= -2) return 'bg-yellow-400';
      if (value >= -5) return 'bg-orange-400';
      if (value >= -10) return 'bg-red-400';
      return 'bg-red-500';
    }
  };

  const getReliabilityOpacity = (monthsAvailable: number) => {
    if (monthsAvailable < 5) return 'opacity-50';
    if (monthsAvailable < 10) return 'opacity-75';
    return 'opacity-100';
  };

  const formatValue = (value: number | null, metric: MetricType) => {
    if (value === null) return '-';
    if (metric === 'pct_pos_return_months') {
      return value.toFixed(0);
    } else {
      return value > 0 ? `+${value.toFixed(1)}` : value.toFixed(1);
    }
  };

  const getTooltipContent = (stock: string, month: number, stat: MonthlyStockStats | undefined) => {
    if (!stat) return 'No data available';
    
    return `${stock} - ${MONTH_NAMES[month - 1]}
${stat.pct_pos_return_months.toFixed(1)}% positive months
Avg return: ${stat.return_month_mean_pct_return_month.toFixed(2)}%
Data points: ${stat.number_of_months_available} months`;
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Label htmlFor="metric-select">Metric:</Label>
          <Select value={selectedMetric} onValueChange={(value: MetricType) => setSelectedMetric(value)}>
            <SelectTrigger id="metric-select" className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pct_pos_return_months">% Positive Months</SelectItem>
              <SelectItem value="return_month_mean_pct_return_month">Average Return</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Label htmlFor="sort-select">Sort by:</Label>
          <Select value={sortBy} onValueChange={(value: SortType) => setSortBy(value)}>
            <SelectTrigger id="sort-select" className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="top_5_accumulated_score">Score</SelectItem>
              <SelectItem value="avg_return">Avg Return</SelectItem>
              <SelectItem value="alphabetical">Alphabetical</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Label htmlFor="stocks-select">Show:</Label>
          <Select value={maxStocks.toString()} onValueChange={(value) => setMaxStocks(parseInt(value))}>
            <SelectTrigger id="stocks-select" className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="20">Top 20</SelectItem>
              <SelectItem value="30">Top 30</SelectItem>
              <SelectItem value="50">Top 50</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Heatmap */}
      <div className="w-full overflow-x-auto">
        <div className="min-w-[900px]">
          {/* Header */}
          <div className="grid grid-cols-13 gap-1 mb-2">
            <div className="text-xs font-medium text-muted-foreground p-2 min-w-[120px]">Stock</div>
            {MONTH_NAMES.map(month => (
              <div key={month} className="text-xs font-medium text-muted-foreground text-center p-1 min-w-[60px]">
                {month}
              </div>
            ))}
          </div>

          {/* Heatmap rows */}
          <div className="space-y-1">
            {processedData.map((stockInfo) => (
              <div key={stockInfo.name} className="grid grid-cols-13 gap-1">
                <div className="text-xs font-medium p-2 truncate bg-muted rounded min-w-[120px] flex items-center justify-between">
                  <span className="truncate" title={stockInfo.name}>{stockInfo.name}</span>
                  <Badge variant="outline" className="text-xs ml-1">
                    {stockInfo.score.toFixed(0)}
                  </Badge>
                </div>
                {Array.from({ length: 12 }, (_, monthIndex) => {
                  const month = monthIndex + 1;
                  const stat = stockInfo.monthlyData.get(month);
                  const value = stat ? stat[selectedMetric] : null;
                  const monthsAvailable = stat?.number_of_months_available || 0;
                  
                  return (
                    <div
                      key={monthIndex}
                      className={`h-8 rounded flex items-center justify-center text-xs font-medium text-white cursor-help transition-all hover:scale-105 hover:z-10 relative min-w-[60px] ${getColorClass(value, selectedMetric)} ${getReliabilityOpacity(monthsAvailable)}`}
                      title={getTooltipContent(stockInfo.name, month, stat)}
                    >
                      {formatValue(value, selectedMetric)}
                      {monthsAvailable < 5 && (
                        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-gray-600 opacity-30 rounded"></div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-6 space-y-3">
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-xs font-medium text-muted-foreground">
                {selectedMetric === 'pct_pos_return_months' ? '% Positive Months:' : 'Average Return (%):'}
              </span>
              
              {selectedMetric === 'pct_pos_return_months' ? (
                <>
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 bg-red-500 rounded"></div>
                    <span className="text-xs">0-30%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 bg-orange-400 rounded"></div>
                    <span className="text-xs">30-50%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 bg-yellow-400 rounded"></div>
                    <span className="text-xs">50-60%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 bg-green-400 rounded"></div>
                    <span className="text-xs">60-70%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 bg-green-600 rounded"></div>
                    <span className="text-xs">70%+</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 bg-red-500 rounded"></div>
                    <span className="text-xs">≤-10%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 bg-orange-400 rounded"></div>
                    <span className="text-xs">-5% to -10%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 bg-yellow-400 rounded"></div>
                    <span className="text-xs">-2% to 0%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 bg-green-400 rounded"></div>
                    <span className="text-xs">0% to 2%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 bg-green-600 rounded"></div>
                    <span className="text-xs">5%+</span>
                  </div>
                </>
              )}
            </div>
            
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>Data reliability:</span>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-primary rounded opacity-50"></div>
                <span>&lt;5 months</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-primary rounded opacity-75"></div>
                <span>5-10 months</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-primary rounded"></div>
                <span>10+ months</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};