import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { WeeklyDistribution } from './DayOfMonthAnalysis';

interface PeriodComparisonChartProps {
  data: WeeklyDistribution[];
  analysisType: 'lows' | 'highs';
  selectedMonths: number[];
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const PeriodComparisonChart: React.FC<PeriodComparisonChartProps> = ({
  data,
  analysisType,
  selectedMonths
}) => {
  // Transform data for stacked bar chart
  const chartData = useMemo(() => {
    // Filter by selected months if any
    const filteredData = selectedMonths.length > 0
      ? data.filter(d => selectedMonths.includes(d.month))
      : data;

    return filteredData.map(d => ({
      month: MONTH_NAMES[d.month - 1],
      monthNumber: d.month,
      'Days 1-7': Number(d.week1Pct.toFixed(1)),
      'Days 8-14': Number(d.week2Pct.toFixed(1)),
      'Days 15-21': Number(d.week3Pct.toFixed(1)),
      'Days 22-31': Number(d.week4Pct.toFixed(1)),
      week1Count: d.week1Count,
      week2Count: d.week2Count,
      week3Count: d.week3Count,
      week4Count: d.week4Count
    }));
  }, [data, selectedMonths]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const total = payload.reduce((sum: number, entry: any) => sum + entry.value, 0);

      return (
        <div
          style={{
            backgroundColor: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '6px',
            padding: '12px'
          }}
        >
          <p className="font-semibold mb-2">{label}</p>
          {payload.reverse().map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {entry.value.toFixed(1)}%
              {entry.payload[`week${4 - index}Count`] !== undefined && (
                <span className="text-muted-foreground text-xs ml-2">
                  ({entry.payload[`week${4 - index}Count`]} occurrences)
                </span>
              )}
            </p>
          ))}
          <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border/30">
            Total: {total.toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  const formatYAxis = (value: number) => `${value}%`;

  return (
    <div className="space-y-4">
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="month"
              className="fill-muted-foreground"
              tick={{ fontSize: 11 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis
              tickFormatter={formatYAxis}
              className="fill-muted-foreground"
              tick={{ fontSize: 11 }}
              label={{
                value: 'Percentage of Occurrences',
                angle: -90,
                position: 'insideLeft',
                style: { fontSize: '12px', fill: 'hsl(var(--muted-foreground))' }
              }}
              domain={[0, 100]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="square"
            />

            {/* Stacked bars for each week period */}
            <Bar dataKey="Days 1-7" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
            <Bar dataKey="Days 8-14" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
            <Bar dataKey="Days 15-21" stackId="a" fill="#8b5cf6" radius={[0, 0, 0, 0]} />
            <Bar dataKey="Days 22-31" stackId="a" fill="#ec4899" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Information */}
      <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t border-border/30">
        <p>
          • Bars are stacked to show the distribution of {analysisType === 'lows' ? 'lows' : 'highs'} across weeks within each calendar month
        </p>
        <p>
          • Each segment represents a week: <span className="font-semibold text-[#3b82f6]">Days 1-7</span>, <span className="font-semibold text-[#f59e0b]">Days 8-14</span>, <span className="font-semibold text-[#8b5cf6]">Days 15-21</span>, <span className="font-semibold text-[#ec4899]">Days 22-31</span>
        </p>
        <p>
          • Percentages sum to 100% for each month
        </p>
        <p>
          • Hover over segments to see exact percentages and occurrence counts
        </p>
        <p className="pt-1 font-medium">
          Example insights: Large <span className="text-[#ec4899]">pink</span> segments = late-month {analysisType}, large <span className="text-[#3b82f6]">blue</span> segments = early-month {analysisType}
        </p>
      </div>
    </div>
  );
};
