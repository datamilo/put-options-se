import React, { useState, useMemo } from 'react';
import { MonthlyStockStats } from '@/hooks/useMonthlyStockData';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface MonthlySeasonalityHeatmapProps {
  data: MonthlyStockStats[];
  selectedMonths?: number[]; // empty array = all months, [1,2,3] = specific months
}

type MetricType = 'pct_pos_return_months' | 'return_month_mean_pct_return_month';
type SortType = 'pct_pos_return_months' | 'alphabetical' | 'avg_return';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const MonthlySeasonalityHeatmap: React.FC<MonthlySeasonalityHeatmapProps> = ({ data, selectedMonths = [] }) => {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('pct_pos_return_months');
  const [sortBy, setSortBy] = useState<SortType>('pct_pos_return_months');
  const [maxStocks, setMaxStocks] = useState(20);
  const [sortByMonth, setSortByMonth] = useState<number | null>(null); // null = use general sorting, number = sort by specific month

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
      // If sorting by specific month, prioritize that
      if (sortByMonth !== null) {
        const aValue = a.monthlyData.get(sortByMonth)?.[selectedMetric] || 0;
        const bValue = b.monthlyData.get(sortByMonth)?.[selectedMetric] || 0;
        return bValue - aValue; // Always descending for month-specific sorting
      }

      // Otherwise use general sorting logic
      switch (sortBy) {
        case 'pct_pos_return_months':
          // If specific months are selected, sort by average of those months
          if (selectedMonths.length > 0) {
            const aValues = selectedMonths.map(m => a.monthlyData.get(m)?.pct_pos_return_months || 0);
            const bValues = selectedMonths.map(m => b.monthlyData.get(m)?.pct_pos_return_months || 0);
            const aAvg = aValues.reduce((sum, v) => sum + v, 0) / aValues.length;
            const bAvg = bValues.reduce((sum, v) => sum + v, 0) / bValues.length;
            return bAvg - aAvg;
          } else {
            // Otherwise sort by average across all months
            return b.avgPosMonths - a.avgPosMonths;
          }
        case 'avg_return':
          // If specific months are selected, sort by average of those months
          if (selectedMonths.length > 0) {
            const aValues = selectedMonths.map(m => a.monthlyData.get(m)?.return_month_mean_pct_return_month || 0);
            const bValues = selectedMonths.map(m => b.monthlyData.get(m)?.return_month_mean_pct_return_month || 0);
            const aAvg = aValues.reduce((sum, v) => sum + v, 0) / aValues.length;
            const bAvg = bValues.reduce((sum, v) => sum + v, 0) / bValues.length;
            return bAvg - aAvg;
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
  }, [data, sortBy, maxStocks, selectedMonths, sortByMonth, selectedMetric]);

  // Calculate percentiles for color thresholds
  const colorThresholds = useMemo(() => {
    const allValues = processedData.flatMap(stockInfo => {
      if (selectedMonths.length === 0) {
        return Array.from({ length: 12 }, (_, monthIndex) => {
          const month = monthIndex + 1;
          const stat = stockInfo.monthlyData.get(month);
          return stat ? stat[selectedMetric] : null;
        }).filter(v => v !== null) as number[];
      } else {
        return selectedMonths.map(month => {
          const stat = stockInfo.monthlyData.get(month);
          return stat ? stat[selectedMetric] : null;
        }).filter(v => v !== null) as number[];
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
  }, [processedData, selectedMetric, selectedMonths]);

  const getColorClass = (value: number | null, metric: MetricType) => {
    if (value === null || !colorThresholds) return 'bg-slate-100 dark:bg-slate-800';

    if (value <= colorThresholds.p20) return 'bg-gradient-to-br from-red-500 to-red-600';
    if (value <= colorThresholds.p40) return 'bg-gradient-to-br from-orange-400 to-orange-500';
    if (value <= colorThresholds.p60) return 'bg-gradient-to-br from-amber-400 to-amber-500';
    if (value <= colorThresholds.p80) return 'bg-gradient-to-br from-emerald-400 to-emerald-500';
    return 'bg-gradient-to-br from-emerald-500 to-emerald-600';
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
      <div className="space-y-4">
        {sortByMonth !== null && (
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                  Sorted by {MONTH_NAMES[sortByMonth - 1]}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Click any month header to change sorting or click again to clear
                </span>
              </div>
              <button
                onClick={() => setSortByMonth(null)}
                className="text-sm text-muted-foreground hover:text-foreground underline"
              >
                Clear month sorting
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-6 p-6 bg-gradient-to-r from-muted/10 to-muted/20 rounded-xl border border-border/50 shadow-sm">
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
      </div>

      {/* Heatmap */}
      <div className="w-full overflow-x-auto bg-background rounded-lg border shadow-sm">
        <div className="min-w-[1200px] p-6">
          {/* Header Row */}
          <div className="flex mb-3 pb-2 border-b border-border/50">
            <div className="w-40 flex-shrink-0 text-sm font-semibold text-foreground px-3 py-2">
              Stock Symbol
            </div>
            {selectedMonths.length === 0 ? (
              MONTH_NAMES.map((month, index) => {
                const monthNumber = index + 1;
                const isActiveSortColumn = sortByMonth === monthNumber;
                return (
                  <button
                    key={month}
                    onClick={() => {
                      if (sortByMonth === monthNumber) {
                        setSortByMonth(null); // Clear month-specific sorting
                      } else {
                        setSortByMonth(monthNumber);
                      }
                    }}
                    className={`
                      w-16 flex-shrink-0 text-sm font-semibold text-center px-2 py-2 rounded-md
                      transition-all duration-200 cursor-pointer hover:bg-muted/20
                      flex items-center justify-center gap-1
                      ${isActiveSortColumn
                        ? 'bg-primary/10 text-primary border-2 border-primary/20'
                        : 'text-foreground hover:text-primary'
                      }
                    `}
                    title={`Click to sort by ${month} values`}
                  >
                    {month}
                    {isActiveSortColumn && (
                      <ChevronDown className="h-3 w-3" />
                    )}
                  </button>
                );
              })
            ) : (
              selectedMonths.map((monthNumber) => {
                const isActiveSortColumn = sortByMonth === monthNumber;
                return (
                  <button
                    key={monthNumber}
                    onClick={() => {
                      if (sortByMonth === monthNumber) {
                        setSortByMonth(null); // Clear month-specific sorting
                      } else {
                        setSortByMonth(monthNumber);
                      }
                    }}
                    className={`
                      w-16 flex-shrink-0 text-sm font-semibold text-center px-2 py-2 rounded-md
                      transition-all duration-200 cursor-pointer hover:bg-muted/20
                      flex items-center justify-center gap-1
                      ${isActiveSortColumn
                        ? 'bg-primary/10 text-primary border-2 border-primary/20'
                        : 'text-foreground hover:text-primary'
                      }
                    `}
                    title={`Click to sort by ${MONTH_NAMES[monthNumber - 1]} values`}
                  >
                    {MONTH_NAMES[monthNumber - 1]}
                    {isActiveSortColumn && (
                      <ChevronDown className="h-3 w-3" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Stock Rows */}
          <div className="space-y-2">
            {processedData.map((stockInfo) => (
              <div key={stockInfo.name} className="flex items-center hover:bg-muted/5 rounded-lg transition-colors duration-200">
                {/* Stock Name */}
                <div className="w-40 flex-shrink-0 text-sm font-medium px-3 py-2 truncate text-foreground" title={stockInfo.name}>
                  {stockInfo.name}
                </div>
                
                {/* Month Cells */}
                {selectedMonths.length === 0 ? (
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
                          w-16 h-10 flex-shrink-0 rounded-md flex items-center justify-center
                          text-xs font-semibold text-white cursor-help transition-all duration-200
                          hover:scale-105 hover:shadow-lg hover:z-10 relative border border-white/20 mx-0.5
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
                  // Show only selected months
                  selectedMonths.map((monthNumber) => {
                    const stat = stockInfo.monthlyData.get(monthNumber);
                    const value = stat ? stat[selectedMetric] : null;
                    const monthsAvailable = stat?.number_of_months_available || 0;

                    return (
                      <div
                        key={monthNumber}
                        className={`
                          w-16 h-10 flex-shrink-0 rounded-md flex items-center justify-center
                          text-xs font-semibold text-white cursor-help transition-all duration-200
                          hover:scale-105 hover:shadow-lg hover:z-10 relative border border-white/20 mx-0.5
                          ${getColorClass(value, selectedMetric)}
                          ${getReliabilityOpacity(monthsAvailable)}
                        `}
                        title={getTooltipContent(stockInfo.name, monthNumber, stat)}
                        onTouchStart={(e) => {
                          // Show tooltip on mobile touch
                          const title = getTooltipContent(stockInfo.name, monthNumber, stat);
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
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-4 p-6 bg-gradient-to-r from-muted/5 to-muted/10 rounded-xl border border-border/50">
        <div className="flex flex-wrap items-center gap-6">
          <span className="text-base font-semibold text-foreground">
            {selectedMetric === 'pct_pos_return_months' ? 'Performance Scale - % Positive Months' : 'Performance Scale - Average Return (%)'}
          </span>

          {colorThresholds && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-gradient-to-br from-red-500 to-red-600 rounded-md shadow-sm"></div>
                <span className="text-sm font-medium">Lowest 20%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-gradient-to-br from-orange-400 to-orange-500 rounded-md shadow-sm"></div>
                <span className="text-sm font-medium">20-40%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-gradient-to-br from-amber-400 to-amber-500 rounded-md shadow-sm"></div>
                <span className="text-sm font-medium">40-60%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-md shadow-sm"></div>
                <span className="text-sm font-medium">60-80%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-md shadow-sm"></div>
                <span className="text-sm font-medium">Top 20%</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-6 text-sm text-muted-foreground pt-2 border-t border-border/30">
          <span className="font-medium">Data Reliability:</span>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-primary rounded-md opacity-40 shadow-sm"></div>
            <span>&lt;5 months (limited data)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-primary rounded-md opacity-70 shadow-sm"></div>
            <span>5-10 months (moderate)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-primary rounded-md shadow-sm"></div>
            <span>10+ months (reliable)</span>
          </div>
        </div>
      </div>
    </div>
  );
};