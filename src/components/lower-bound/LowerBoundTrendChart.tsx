/**
 * Lower Bound Monthly Trend Chart Component
 * Displays hit rate evolution over time with prediction volume
 */

import React, { useMemo } from 'react';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { MonthlyTrendData } from '@/types/lowerBound';

interface LowerBoundTrendChartProps {
  data: MonthlyTrendData[];
  stock: string;
  isLoading?: boolean;
}

export const LowerBoundTrendChart: React.FC<LowerBoundTrendChartProps> = ({
  data,
  stock,
  isLoading = false,
}) => {
  // Filter data for the selected stock and sort by date
  const chartData = useMemo(() => {
    return data
      .filter((d) => d.Stock === stock)
      .sort((a, b) => a.Date.localeCompare(b.Date))
      .map((d) => ({
        date: d.Date,
        hitRate: Math.round(d.HitRate * 100) / 100,
        total: d.Total,
      }));
  }, [data, stock]);

  // Calculate y-axis ranges with padding
  const yAxisRange = useMemo(() => {
    if (chartData.length === 0) {
      return { min: 0, max: 100 };
    }

    const hitRates = chartData.map((d) => d.hitRate);
    const minRate = Math.min(...hitRates);
    const maxRate = Math.max(...hitRates);
    const padding = (maxRate - minRate) * 0.1;

    return {
      min: Math.max(0, Math.floor(minRate - padding)),
      max: Math.min(100, Math.ceil(maxRate + padding)),
    };
  }, [chartData]);

  const totalRange = useMemo(() => {
    if (chartData.length === 0) {
      return { min: 0, max: 100 };
    }

    const totals = chartData.map((d) => d.total);
    const maxTotal = Math.max(...totals);

    return {
      min: 0,
      max: Math.ceil(maxTotal * 1.2), // 20% padding above max
    };
  }, [chartData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96 bg-slate-50 rounded-lg">
        <p className="text-slate-500">Loading trend data...</p>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-slate-50 rounded-lg">
        <p className="text-slate-500">No trend data available for this stock</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height={500}>
        <ComposedChart
          data={chartData}
          margin={{ top: 20, right: 80, bottom: 60, left: 60 }}
        >
          <defs>
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.2} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

          <XAxis
            dataKey="date"
            angle={-45}
            textAnchor="end"
            height={100}
            tick={{ fontSize: 12 }}
            stroke="#6b7280"
          />

          <YAxis
            yAxisId="left"
            label={{
              value: 'Hit Rate (%)',
              angle: -90,
              position: 'insideLeft',
              offset: 10,
            }}
            domain={[yAxisRange.min, yAxisRange.max]}
            tick={{ fontSize: 12 }}
            stroke="#e74c3c"
          />

          <YAxis
            yAxisId="right"
            orientation="right"
            label={{
              value: 'Prediction Count',
              angle: 90,
              position: 'insideRight',
              offset: 10,
            }}
            domain={[totalRange.min, totalRange.max]}
            tick={{ fontSize: 12 }}
            stroke="#3b82f6"
          />

          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '12px',
            }}
            formatter={(value, name) => {
              if (name === 'hitRate') {
                return [value.toFixed(2), 'Hit Rate (%)'];
              }
              if (name === 'total') {
                return [value, 'Predictions'];
              }
              return [value, name];
            }}
            labelFormatter={(label) => `Month: ${label}`}
          />

          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            verticalAlign="bottom"
            height={36}
          />

          <Bar
            yAxisId="right"
            dataKey="total"
            name="Prediction Count"
            fill="url(#barGradient)"
            opacity={0.7}
            isAnimationActive={false}
          />

          <Line
            yAxisId="left"
            type="monotone"
            dataKey="hitRate"
            name="Hit Rate (%)"
            stroke="#e74c3c"
            strokeWidth={3}
            dot={{ fill: '#e74c3c', r: 5 }}
            activeDot={{ r: 7 }}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>

      <div className="mt-4 text-sm text-slate-600">
        <p>
          Data points: {chartData.length} | Date range: {chartData[0]?.date} to{' '}
          {chartData[chartData.length - 1]?.date}
        </p>
      </div>
    </div>
  );
};
