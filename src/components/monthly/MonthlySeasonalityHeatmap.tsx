import React, { useState, useMemo } from 'react';
import { MonthlyStockStats } from '@/hooks/useMonthlyStockData';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface MonthlySeasonalityHeatmapProps {
  data: MonthlyStockStats[];
  selectedMonth?: number; // 0 = all months, 1-12 = specific month
}

type MetricType = 'pct_pos_return_months' | 'return_month_mean_pct_return_month';
type SortType = 'pct_pos_return_months' | 'alphabetical' | 'avg_return';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const MonthlySeasonalityHeatmap: React.FC<MonthlySeasonalityHeatmapProps> = ({ data, selectedMonth = 0 }) => {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('pct_pos_return_months');
  const [sortBy, setSortBy] = useState<SortType>('pct_pos_return_months');
  const [maxStocks, setMaxStocks] = useState(20);

  // Process and sort stocks
  const processedData = useMemo(() => {
    const stockMap = new Map<string, {
      name: string;
      avgReturn: number;
      avgPosMonths: number;
      monthlyData: Map<number, MonthlyStockStats>;
    }>();

    data.forEach(stat => {
      if (!stockMap.has(stat.name)) {
        stockMap.set(stat.name, {
          name: stat.name,
          avgReturn: 0,
          avgPosMonths: 0,
          monthlyData: new Map()
        });
      }
      
      const stockInfo = stockMap.get(stat.name)!;
      stockInfo.monthlyData.set(stat.month, stat);
    });

    // Calculate averages for sorting
    stockMap.forEach((stockInfo) => {
      const values = Array.from(stockInfo.monthlyData.values());
      const returns = values.map(s => s.return_month_mean_pct_return_month);
      const posMonths = values.map(s => s.pct_pos_return_months);
      
      stockInfo.avgReturn = returns.length > 0 ? returns.reduce((sum, r) => sum + r, 0) / returns.length : 0;
      stockInfo.avgPosMonths = posMonths.length > 0 ? posMonths.reduce((sum, p) => sum + p, 0) / posMonths.length : 0;
    });

    // Sort stocks based on selected criteria
    const sortedStocks = Array.from(stockMap.values()).sort((a, b) => {
      switch (sortBy) {
        case 'pct_pos_return_months':
          // If a specific month is selected, sort by that month's data
          if (selectedMonth > 0) {
            const aValue = a.monthlyData.get(selectedMonth)?.pct_pos_return_months || 0;
            const bValue = b.monthlyData.get(selectedMonth)?.pct_pos_return_months || 0;
            return bValue - aValue;
          } else {
            // Otherwise sort by average across all months
            return b.avgPosMonths - a.avgPosMonths;
          }
        case 'avg_return':
          // If a specific month is selected, sort by that month's data
          if (selectedMonth > 0) {
            const aValue = a.monthlyData.get(selectedMonth)?.return_month_mean_pct_return_month || 0;
            const bValue = b.monthlyData.get(selectedMonth)?.return_month_mean_pct_return_month || 0;
            return bValue - aValue;
          } else {
            // Otherwise sort by average across all months
            return b.avgReturn - a.avgReturn;
          }
        case 'alphabetical':
          return a.name.localeCompare(b.name);
        default:
          return b.avgPosMonths - a.avgPosMonths;
      }
    });

    return sortedStocks.slice(0, maxStocks);
  }, [data, sortBy, maxStocks, selectedMonth]);

  // Calculate percentiles for color thresholds
  const colorThresholds = useMemo(() => {
    const allValues = processedData.flatMap(stockInfo => {
      if (selectedMonth === 0) {
        return Array.from({ length: 12 }, (_, monthIndex) => {
          const month = monthIndex + 1;
          const stat = stockInfo.monthlyData.get(month);
          return stat ? stat[selectedMetric] : null;
        }).filter(v => v !== null) as number[];
      } else {
        const stat = stockInfo.monthlyData.get(selectedMonth);
        return stat ? [stat[selectedMetric]] : [];
      }
    });

    if (allValues.length === 0) return null;

    const sorted = allValues.sort((a, b) => a - b);
    const getPercentile = (p: number) => {
      const index = Math.ceil(p * sorted.length / 100) - 1;
      return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
    };

    return {
      p20: getPercentile(20),
      p40: getPercentile(40),
      p60: getPercentile(60),
      p80: getPercentile(80)
    };
  }, [processedData, selectedMetric, selectedMonth]);

  const getColorClass = (value: number | null, metric: MetricType) => {
    if (value === null || !colorThresholds) return 'bg-muted/30';
    
    if (value <= colorThresholds.p20) return 'bg-red-500';
    if (value <= colorThresholds.p40) return 'bg-orange-400';
    if (value <= colorThresholds.p60) return 'bg-yellow-400';
    if (value <= colorThresholds.p80) return 'bg-green-400';
    return 'bg-green-600';
  };

  const getReliabilityOpacity = (monthsAvailable: number) => {
    if (monthsAvailable < 5) return 'opacity-40';
    if (monthsAvailable < 10) return 'opacity-70';
    return 'opacity-100';
  };

  const formatValue = (value: number | null, metric: MetricType) => {
    if (value === null) return '—';
    if (metric === 'pct_pos_return_months') {
      return Math.round(value).toString();
    } else {
      // Convert decimal to percentage and round to 2 decimal places
      const percentageValue = value * 100;
      const roundedValue = Math.round(percentageValue * 100) / 100;
      return roundedValue > 0 ? `+${roundedValue.toFixed(2)}%` : `${roundedValue.toFixed(2)}%`;
    }
  };

  const getTooltipContent = (stock: string, month: number, stat: MonthlyStockStats | undefined) => {
    if (!stat) return 'No data available';
    
    return `${stock} - ${MONTH_NAMES[month - 1]}
${stat.pct_pos_return_months.toFixed(1)}% positive months
Avg return: ${(stat.return_month_mean_pct_return_month * 100).toFixed(2)}%
Data points: ${stat.number_of_months_available} months`;
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-muted/20 rounded-lg">
        <div className="flex items-center gap-2">
          <Label htmlFor="metric-select" className="text-sm font-medium">Metric:</Label>
          <Select value={selectedMetric} onValueChange={(value: MetricType) => setSelectedMetric(value)}>
            <SelectTrigger id="metric-select" className="w-44 bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background border shadow-lg z-50">
              <SelectItem value="pct_pos_return_months">% Positive Months</SelectItem>
              <SelectItem value="return_month_mean_pct_return_month">Average Return</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Label htmlFor="sort-select" className="text-sm font-medium">Sort by:</Label>
          <Select value={sortBy} onValueChange={(value: SortType) => setSortBy(value)}>
            <SelectTrigger id="sort-select" className="w-36 bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background border shadow-lg z-50">
              <SelectItem value="pct_pos_return_months">% Positive Months</SelectItem>
              <SelectItem value="avg_return">Avg Return</SelectItem>
              <SelectItem value="alphabetical">Alphabetical</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Label htmlFor="stocks-select" className="text-sm font-medium">Show:</Label>
          <Select value={maxStocks.toString()} onValueChange={(value) => setMaxStocks(parseInt(value))}>
            <SelectTrigger id="stocks-select" className="w-28 bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background border shadow-lg z-50">
              <SelectItem value="10">Top 10</SelectItem>
              <SelectItem value="20">Top 20</SelectItem>
              <SelectItem value="30">Top 30</SelectItem>
              <SelectItem value="50">Top 50</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Heatmap */}
      <div className="w-full overflow-x-auto bg-background rounded-lg border">
        <div className="min-w-[800px] p-4">
          {/* Header Row */}
          <div className="flex mb-2">
            <div className="w-32 flex-shrink-0 text-xs font-medium text-muted-foreground p-2">
              Stock
            </div>
            {selectedMonth === 0 ? (
              MONTH_NAMES.map((month) => (
                <div key={month} className="w-12 flex-shrink-0 text-xs font-medium text-muted-foreground text-center p-2">
                  {month}
                </div>
              ))
            ) : (
              <div className="w-12 flex-shrink-0 text-xs font-medium text-muted-foreground text-center p-2">
                {MONTH_NAMES[selectedMonth - 1]}
              </div>
            )}
          </div>

          {/* Stock Rows */}
          <div className="space-y-1">
            {processedData.map((stockInfo) => (
              <div key={stockInfo.name} className="flex items-center hover:bg-muted/10 rounded">
                {/* Stock Name */}
                <div className="w-32 flex-shrink-0 text-xs font-medium p-2 truncate" title={stockInfo.name}>
                  {stockInfo.name}
                </div>
                
                {/* Month Cells */}
                {selectedMonth === 0 ? (
                  // Show all months
                  Array.from({ length: 12 }, (_, monthIndex) => {
                    const month = monthIndex + 1;
                    const stat = stockInfo.monthlyData.get(month);
                    const value = stat ? stat[selectedMetric] : null;
                    const monthsAvailable = stat?.number_of_months_available || 0;
                    
                    return (
                      <div
                        key={monthIndex}
                        className={`
                          w-12 h-8 flex-shrink-0 rounded-sm flex items-center justify-center 
                          text-xs font-medium text-white cursor-help transition-all 
                          hover:scale-110 hover:z-10 relative border border-white/10
                          ${getColorClass(value, selectedMetric)} 
                          ${getReliabilityOpacity(monthsAvailable)}
                        `}
                        title={getTooltipContent(stockInfo.name, month, stat)}
                        onTouchStart={(e) => {
                          // Show tooltip on mobile touch
                          const title = getTooltipContent(stockInfo.name, month, stat);
                          // Create a temporary tooltip element for mobile
                          const tooltip = document.createElement('div');
                          tooltip.className = 'fixed z-50 bg-black text-white text-xs p-2 rounded shadow-lg pointer-events-none';
                          tooltip.textContent = title;
                          tooltip.style.top = `${e.touches[0].clientY - 50}px`;
                          tooltip.style.left = `${e.touches[0].clientX - 75}px`;
                          document.body.appendChild(tooltip);
                          
                          setTimeout(() => {
                            document.body.removeChild(tooltip);
                          }, 2000);
                        }}
                      >
                        {formatValue(value, selectedMetric)}
                        {monthsAvailable < 5 && value !== null && (
                          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/20 rounded-sm pointer-events-none"></div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  // Show only selected month
                  (() => {
                    const stat = stockInfo.monthlyData.get(selectedMonth);
                    const value = stat ? stat[selectedMetric] : null;
                    const monthsAvailable = stat?.number_of_months_available || 0;
                    
                    return (
                      <div
                        className={`
                          w-12 h-8 flex-shrink-0 rounded-sm flex items-center justify-center 
                          text-xs font-medium text-white cursor-help transition-all 
                          hover:scale-110 hover:z-10 relative border border-white/10
                          ${getColorClass(value, selectedMetric)} 
                          ${getReliabilityOpacity(monthsAvailable)}
                        `}
                        title={getTooltipContent(stockInfo.name, selectedMonth, stat)}
                        onTouchStart={(e) => {
                          // Show tooltip on mobile touch
                          const title = getTooltipContent(stockInfo.name, selectedMonth, stat);
                          // Create a temporary tooltip element for mobile
                          const tooltip = document.createElement('div');
                          tooltip.className = 'fixed z-50 bg-black text-white text-xs p-2 rounded shadow-lg pointer-events-none';
                          tooltip.textContent = title;
                          tooltip.style.top = `${e.touches[0].clientY - 50}px`;
                          tooltip.style.left = `${e.touches[0].clientX - 75}px`;
                          document.body.appendChild(tooltip);
                          
                          setTimeout(() => {
                            document.body.removeChild(tooltip);
                          }, 2000);
                        }}
                      >
                        {formatValue(value, selectedMetric)}
                        {monthsAvailable < 5 && value !== null && (
                          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/20 rounded-sm pointer-events-none"></div>
                        )}
                      </div>
                    );
                  })()
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-3 p-4 bg-muted/10 rounded-lg">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-sm font-medium text-muted-foreground">
            {selectedMetric === 'pct_pos_return_months' ? '% Positive Months:' : 'Average Return (%):'}
          </span>
          
          {colorThresholds && (
            <>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-red-500 rounded-sm"></div>
                <span className="text-xs">Bottom 20%</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-orange-400 rounded-sm"></div>
                <span className="text-xs">20-40%</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-yellow-400 rounded-sm"></div>
                <span className="text-xs">40-60%</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-green-400 rounded-sm"></div>
                <span className="text-xs">60-80%</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-green-600 rounded-sm"></div>
                <span className="text-xs">Top 20%</span>
              </div>
            </>
          )}
        </div>
        
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>Data reliability:</span>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-primary rounded-sm opacity-40"></div>
            <span>&lt;5 months (faded)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-primary rounded-sm opacity-70"></div>
            <span>5-10 months</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-primary rounded-sm"></div>
            <span>10+ months (reliable)</span>
          </div>
        </div>
      </div>
    </div>
  );
};