import React from 'react';
import { MonthlyStockStats } from '@/hooks/useMonthlyStockData';

interface MonthlySeasonalityHeatmapProps {
  data: MonthlyStockStats[];
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const MonthlySeasonalityHeatmap: React.FC<MonthlySeasonalityHeatmapProps> = ({ data }) => {
  // Create a matrix of stocks vs months
  const stocks = Array.from(new Set(data.map(d => d.name))).slice(0, 20); // Limit to top 20 for readability
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const getHeatmapData = () => {
    return stocks.map(stock => {
      const stockData = months.map(month => {
        const stat = data.find(d => d.name === stock && d.month === month);
        return stat ? stat.pct_pos_return_months : null;
      });
      return { stock, data: stockData };
    });
  };

  const heatmapData = getHeatmapData();

  const getColorClass = (value: number | null) => {
    if (value === null) return 'bg-muted';
    if (value >= 80) return 'bg-green-600';
    if (value >= 70) return 'bg-green-500';
    if (value >= 60) return 'bg-green-400';
    if (value >= 50) return 'bg-yellow-400';
    if (value >= 40) return 'bg-orange-400';
    if (value >= 30) return 'bg-red-400';
    return 'bg-red-500';
  };

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[800px]">
        {/* Header */}
        <div className="grid grid-cols-13 gap-1 mb-2">
          <div className="text-xs font-medium text-muted-foreground p-2">Stock</div>
          {MONTH_NAMES.map(month => (
            <div key={month} className="text-xs font-medium text-muted-foreground text-center p-1">
              {month}
            </div>
          ))}
        </div>

        {/* Heatmap rows */}
        <div className="space-y-1">
          {heatmapData.map(({ stock, data: stockData }) => (
            <div key={stock} className="grid grid-cols-13 gap-1">
              <div className="text-xs font-medium p-2 truncate bg-muted rounded">
                {stock}
              </div>
              {stockData.map((value, monthIndex) => (
                <div
                  key={monthIndex}
                  className={`h-8 rounded flex items-center justify-center text-xs font-medium text-white ${getColorClass(value)}`}
                  title={value !== null ? `${stock} - ${MONTH_NAMES[monthIndex]}: ${value.toFixed(1)}%` : 'No data'}
                >
                  {value !== null ? value.toFixed(0) : '-'}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center gap-4">
          <span className="text-xs font-medium text-muted-foreground">% Positive Months:</span>
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
        </div>
      </div>
    </div>
  );
};