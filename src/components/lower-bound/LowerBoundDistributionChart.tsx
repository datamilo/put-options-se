/**
 * Lower Bound Distribution Chart Component
 * Displays prediction distribution and breach analysis with daily stock prices
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
import { LowerBoundExpiryStatistic } from '@/types/lowerBound';
import { useStockData } from '@/hooks/useStockData';

interface LowerBoundDistributionChartProps {
  data: LowerBoundExpiryStatistic[];
  stock: string;
  isLoading?: boolean;
}

export const LowerBoundDistributionChart: React.FC<
  LowerBoundDistributionChartProps
> = ({ data, stock, isLoading = false }) => {
  // Load stock price data for this stock
  const stockDataQuery = useStockData();
  const stockPriceData = useMemo(() => {
    if (!stockDataQuery.data) return [];
    return stockDataQuery.data
      .filter((d) => d.name === stock)
      .map((d) => ({
        date: d.date,
        close: d.close,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [stockDataQuery.data, stock]);
  // Create combined chart data with daily stock prices and expiry statistics
  const chartData = useMemo(() => {
    // Start with daily stock prices
    const priceData = stockPriceData.map((d) => ({
      date: d.date,
      close: d.close,
      median: null as number | null,
      mean: null as number | null,
      breachCount: 0,
      expiryClose: null as number | null,
    }));

    // Add expiry statistics to their respective dates
    const expiryMap = new Map<string, LowerBoundExpiryStatistic>();
    data.filter((d) => d.Stock === stock).forEach((d) => {
      expiryMap.set(d.ExpiryDate, d);
    });

    // Merge expiry data into the price data
    const merged = priceData.map((p) => {
      const expiry = expiryMap.get(p.date);
      if (expiry) {
        return {
          ...p,
          median: expiry.LowerBound_Median,
          mean: expiry.LowerBound_Mean,
          breachCount: expiry.BreachCount,
          expiryClose: expiry.ExpiryClosePrice,
        };
      }
      return p;
    });

    return merged.sort((a, b) => a.date.localeCompare(b.date));
  }, [data, stock, stockPriceData]);

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
            dataKey="date"
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
              if (value === null) return null;
              const num = value as number;
              if (typeof num === 'number') {
                return [num.toFixed(2), name];
              }
              return [value, name];
            }}
            labelFormatter={(label) => `Date: ${label}`}
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
          Date range: {chartData.length > 0 ? `${chartData[0].date} to ${chartData[chartData.length - 1].date}` : 'N/A'} | Total breaches: {chartData.reduce((sum, d) => sum + d.breachCount, 0)}
        </p>
        <p>
          <span className="inline-block w-3 h-3 bg-black mr-2"></span> Black line = Daily stock price (all trading days)
        </p>
        <p>
          <span className="inline-block w-3 h-3 bg-blue-500 mr-2"></span> Blue line = Median predicted bound (shown only on expiry dates)
        </p>
        <p>
          <span className="inline-block w-3 h-3 bg-purple-500 mr-2"></span> Purple dashed = Mean predicted bound (shown only on expiry dates)
        </p>
        <p>
          <span className="inline-block w-3 h-3 bg-red-500 mr-2"></span> Red bars = Breach count per expiry date (right y-axis)
        </p>
      </div>
    </div>
  );
};
