import React from 'react';
import { MonthlyStockStats } from '@/hooks/useMonthlyStockData';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from 'recharts';

interface TopRankingChartProps {
  data: MonthlyStockStats[];
  metric: 'pct_pos_return_months' | 'return_month_mean_pct_return_month' | 'top_5_accumulated_score';
  month: number;
}

export const TopRankingChart: React.FC<TopRankingChartProps> = ({ data, metric, month }) => {
  const metricLabels = {
    pct_pos_return_months: 'Positive Months %',
    return_month_mean_pct_return_month: 'Avg Return %',
    top_5_accumulated_score: 'Score'
  };

  const getTopPerformers = () => {
    let filteredData = data;
    
    if (month > 0) {
      filteredData = data.filter(d => d.month === month);
    }

    return filteredData
      .filter(d => d.number_of_months_available >= 3)
      .sort((a, b) => (b[metric] as number) - (a[metric] as number))
      .slice(0, 10)
      .map(d => ({
        name: d.name,
        value: d[metric] as number,
        months: d.number_of_months_available
      }));
  };

  const chartData = getTopPerformers();

  const getBarColor = (value: number, index: number) => {
    const colors = [
      '#10b981', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6',
      '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#ef4444'
    ];
    return colors[index % colors.length];
  };

  const formatValue = (value: number) => {
    if (metric === 'top_5_accumulated_score') {
      return value.toFixed(0);
    }
    return value.toFixed(1) + '%';
  };

  if (chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        No data available for the selected filters
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="horizontal"
          margin={{ top: 5, right: 30, left: 50, bottom: 5 }}
        >
          <XAxis type="number" />
          <YAxis 
            type="category" 
            dataKey="name" 
            width={40}
            tick={{ fontSize: 10 }}
            tickFormatter={(value) => value.length > 8 ? value.substring(0, 8) + '...' : value}
          />
          <Tooltip 
            formatter={(value: number, name) => [formatValue(value), metricLabels[metric]]}
            labelFormatter={(label) => `Stock: ${label}`}
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-background border rounded-lg p-3 shadow-lg">
                    <p className="font-medium">{label}</p>
                    <p className="text-primary">
                      {metricLabels[metric]}: {formatValue(payload[0].value as number)}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      History: {data.months} months
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="value" radius={[0, 2, 2, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.value, index)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};