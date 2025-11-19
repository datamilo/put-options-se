/**
 * Lower Bound Distribution Chart Component
 * Displays prediction distribution and breach analysis
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
  Cell,
} from 'recharts';
import { LowerBoundExpiryStatistic } from '@/types/lowerBound';

interface LowerBoundDistributionChartProps {
  data: LowerBoundExpiryStatistic[];
  stock: string;
  stockPriceData?: Array<{ date: string; close: number }>;
  isLoading?: boolean;
}

export const LowerBoundDistributionChart: React.FC<
  LowerBoundDistributionChartProps
> = ({ data, stock, stockPriceData, isLoading = false }) => {
  // Filter and prepare chart data
  const chartData = useMemo(() => {
    const stockData = data
      .filter((d) => d.Stock === stock)
      .sort((a, b) => a.ExpiryDate.localeCompare(b.ExpiryDate))
      .map((d) => {
        // Calculate if this expiry had breaches
        const breachRate =
          d.PredictionCount > 0
            ? (d.BreachCount / d.PredictionCount) * 100
            : 0;

        return {
          expiryDate: d.ExpiryDate,
          rangeMin: d.LowerBound_Min,
          rangeMax: d.LowerBound_Max,
          median: d.LowerBound_Median,
          mean: d.LowerBound_Mean,
          predictionCount: d.PredictionCount,
          breachCount: d.BreachCount,
          breachRate: Math.round(breachRate * 100) / 100,
          expiryClose: d.ExpiryClosePrice || 0,
          hit: (d.BreachCount === 0) ? true : false,
        };
      });

    return stockData;
  }, [data, stock]);

  // Calculate price range for y-axis
  const priceRange = useMemo(() => {
    if (chartData.length === 0) {
      return { min: 0, max: 100 };
    }

    const allPrices = [
      ...chartData.map((d) => d.rangeMin),
      ...chartData.map((d) => d.rangeMax),
      ...chartData.map((d) => d.expiryClose),
    ].filter((p) => p > 0);

    if (allPrices.length === 0) {
      return { min: 0, max: 100 };
    }

    const minPrice = Math.min(...allPrices);
    const maxPrice = Math.max(...allPrices);
    const padding = (maxPrice - minPrice) * 0.1;

    return {
      min: Math.max(0, minPrice - padding),
      max: maxPrice + padding,
    };
  }, [chartData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96 bg-slate-50 rounded-lg">
        <p className="text-slate-500">Loading distribution data...</p>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-slate-50 rounded-lg">
        <p className="text-slate-500">
          No distribution data available for this stock
        </p>
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
            <linearGradient id="rangeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

          <XAxis
            dataKey="expiryDate"
            angle={-45}
            textAnchor="end"
            height={100}
            tick={{ fontSize: 12 }}
            stroke="#6b7280"
          />

          <YAxis
            label={{
              value: 'Price',
              angle: -90,
              position: 'insideLeft',
              offset: 10,
            }}
            domain={[priceRange.min, priceRange.max]}
            tick={{ fontSize: 12 }}
            stroke="#6b7280"
          />

          <YAxis
            yAxisId="right"
            orientation="right"
            label={{
              value: 'Breach Count',
              angle: 90,
              position: 'insideRight',
              offset: 10,
            }}
            tick={{ fontSize: 12 }}
            stroke="#ef4444"
          />

          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '12px',
            }}
            formatter={(value, name) => {
              const num = value as number;
              if (typeof num === 'number') {
                return [num.toFixed(2), name];
              }
              return [value, name];
            }}
            labelFormatter={(label) => `Expiry: ${label}`}
          />

          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            verticalAlign="bottom"
            height={36}
          />

          {/* Breach count bars (secondary y-axis) */}
          <Bar
            yAxisId="right"
            dataKey="breachCount"
            name="Breach Count"
            fill="#ef4444"
            opacity={0.6}
            isAnimationActive={false}
          />

          {/* Median line */}
          <Line
            type="monotone"
            dataKey="median"
            name="Median Prediction"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ fill: '#3b82f6', r: 4 }}
            isAnimationActive={false}
          />

          {/* Mean line */}
          <Line
            type="monotone"
            dataKey="mean"
            name="Mean Prediction"
            stroke="#8b5cf6"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ fill: '#8b5cf6', r: 4 }}
            isAnimationActive={false}
          />

          {/* Expiry close price */}
          <Line
            type="monotone"
            dataKey="expiryClose"
            name="Expiry Close Price"
            stroke="#000000"
            strokeWidth={3}
            dot={{ fill: '#000000', r: 5 }}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>

      <div className="mt-4 space-y-2 text-sm text-slate-600">
        <p>
          Total expirations: {chartData.length} | Total breaches: {chartData.reduce((sum, d) => sum + d.breachCount, 0)}
        </p>
        <p>
          <span className="inline-block w-3 h-3 bg-red-500 mr-2"></span> Red bars = Breach count per expiry date (right y-axis)
        </p>
        <p>
          <span className="inline-block w-3 h-3 bg-black mr-2"></span> Black line = Actual expiry close price
        </p>
        <p>
          <span className="inline-block w-3 h-3 bg-blue-500 mr-2"></span> Blue line = Median prediction
        </p>
        <p>
          <span className="inline-block w-3 h-3 bg-purple-500 mr-2"></span> Purple dashed = Mean prediction
        </p>
      </div>
    </div>
  );
};
