import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, ReferenceArea } from 'recharts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MonthlyStockData } from '@/hooks/useMonthlyStockData';

interface TimelinePerformanceChartProps {
  data: MonthlyStockData[];
  selectedStock: string;
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const MONTH_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#06B6D4',
  '#84CC16', '#F97316', '#EC4899', '#6366F1', '#14B8A6', '#F43F5E'
];

export const TimelinePerformanceChart: React.FC<TimelinePerformanceChartProps> = ({
  data,
  selectedStock
}) => {
  const [visibleMonths, setVisibleMonths] = useState<Set<number>>(new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]));

  // Process data for the timeline chart
  const chartData = useMemo(() => {
    if (!selectedStock || !data.length) return [];

    // Filter data for the selected stock
    const stockData = data.filter(d => d.name === selectedStock);

    // Group by year and calculate averages for each month
    const yearGroups = stockData.reduce((acc, record) => {
      if (!acc[record.year]) {
        acc[record.year] = {};
      }
      if (!acc[record.year][record.month]) {
        acc[record.year][record.month] = [];
      }
      acc[record.year][record.month].push(record.pct_return_month);
      return acc;
    }, {} as Record<number, Record<number, number[]>>);

    // Create timeline data points
    const timelineData = Object.keys(yearGroups)
      .map(year => parseInt(year))
      .sort((a, b) => a - b)
      .map(year => {
        const yearData: any = { year };

        // Add data for each month
        for (let month = 1; month <= 12; month++) {
          const monthReturns = yearGroups[year][month];
          if (monthReturns && monthReturns.length > 0) {
            // Calculate average return for this month in this year
            yearData[`month_${month}`] = monthReturns.reduce((sum, val) => sum + val, 0) / monthReturns.length;
          }
        }

        return yearData;
      });

    return timelineData;
  }, [data, selectedStock]);

  // Calculate Y-axis range for reference areas
  const yAxisRange = useMemo(() => {
    if (!chartData.length) return { min: -10, max: 10 };

    const allValues: number[] = [];
    chartData.forEach(yearData => {
      for (let month = 1; month <= 12; month++) {
        const value = yearData[`month_${month}`];
        if (typeof value === 'number') {
          allValues.push(value);
        }
      }
    });

    if (allValues.length === 0) return { min: -10, max: 10 };

    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const padding = Math.abs(max - min) * 0.1; // 10% padding

    return {
      min: min - padding,
      max: max + padding
    };
  }, [chartData]);

  const toggleMonth = (month: number) => {
    const newVisibleMonths = new Set(visibleMonths);
    if (newVisibleMonths.has(month)) {
      newVisibleMonths.delete(month);
    } else {
      newVisibleMonths.add(month);
    }
    setVisibleMonths(newVisibleMonths);
  };

  const showAllMonths = () => {
    setVisibleMonths(new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]));
  };

  const hideAllMonths = () => {
    setVisibleMonths(new Set());
  };

  const formatTooltip = (value: any, name: string) => {
    if (typeof value === 'number') {
      return [`${value.toFixed(2)}%`, name];
    }
    return [value, name];
  };

  const formatYAxis = (value: number) => `${value.toFixed(1)}%`;

  if (!selectedStock) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <p>Please select a stock to view the timeline performance chart</p>
      </div>
    );
  }

  if (!chartData.length) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <p>No historical data available for {selectedStock}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Month Toggle Controls */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium">Toggle Months</h4>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={showAllMonths}>
              Show All
            </Button>
            <Button variant="outline" size="sm" onClick={hideAllMonths}>
              Hide All
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {MONTH_NAMES.map((monthName, index) => {
            const monthNumber = index + 1;
            const isVisible = visibleMonths.has(monthNumber);
            return (
              <Badge
                key={monthNumber}
                variant={isVisible ? "default" : "outline"}
                className="cursor-pointer transition-colors"
                style={{
                  backgroundColor: isVisible ? MONTH_COLORS[index] : undefined,
                  borderColor: MONTH_COLORS[index],
                  color: isVisible ? 'white' : MONTH_COLORS[index]
                }}
                onClick={() => toggleMonth(monthNumber)}
              >
                {monthName}
              </Badge>
            );
          })}
        </div>
      </div>

      {/* Chart */}
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <defs>
              <linearGradient id="positiveGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity={0.2}/>
                <stop offset="100%" stopColor="#22c55e" stopOpacity={0.05}/>
              </linearGradient>
              <linearGradient id="negativeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.05}/>
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0.2}/>
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="year"
              className="fill-muted-foreground"
              tick={{ fontSize: 12 }}
            />
            <YAxis
              tickFormatter={formatYAxis}
              className="fill-muted-foreground"
              tick={{ fontSize: 12 }}
              domain={[yAxisRange.min, yAxisRange.max]}
            />
            <Tooltip
              formatter={formatTooltip}
              labelFormatter={(label) => `Year: ${label}`}
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px'
              }}
            />
            <Legend />

            {/* Background shading for positive area */}
            <ReferenceArea
              y1={0}
              y2={yAxisRange.max}
              fill="url(#positiveGradient)"
              fillOpacity={1}
            />

            {/* Background shading for negative area */}
            <ReferenceArea
              y1={yAxisRange.min}
              y2={0}
              fill="url(#negativeGradient)"
              fillOpacity={1}
            />

            {/* Zero Reference Line - makes positive/negative values visually clear */}
            <ReferenceLine
              y={0}
              stroke="hsl(var(--muted-foreground))"
              strokeWidth={2}
              strokeDasharray="5 5"
              label={{
                value: "0% (Break-even)",
                position: "insideTopRight",
                style: {
                  fontSize: '12px',
                  fill: 'hsl(var(--muted-foreground))'
                }
              }}
            />

            {/* Render a line for each visible month */}
            {MONTH_NAMES.map((monthName, index) => {
              const monthNumber = index + 1;
              const isVisible = visibleMonths.has(monthNumber);

              if (!isVisible) return null;

              return (
                <Line
                  key={monthNumber}
                  type="monotone"
                  dataKey={`month_${monthNumber}`}
                  stroke={MONTH_COLORS[index]}
                  strokeWidth={2}
                  name={monthName}
                  connectNulls={false}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Information */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p>
          • Shows monthly percentage returns for <strong>{selectedStock}</strong> over time
        </p>
        <p>
          • Each line represents a different calendar month across multiple years
        </p>
        <p>
          • <span className="text-green-600 dark:text-green-400">Green shaded area</span> = positive returns, <span className="text-red-600 dark:text-red-400">red shaded area</span> = negative returns
        </p>
        <p>
          • Dashed line at 0% shows break-even point
        </p>
        <p>
          • Click month badges above to toggle visibility • Hover over data points for detailed values
        </p>
      </div>
    </div>
  );
};