import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MethodPerformance } from '@/types/probabilityValidation';

interface ValidationMetricsChartProps {
  performance: MethodPerformance[];
}

export const ValidationMetricsChart: React.FC<ValidationMetricsChartProps> = ({ performance }) => {
  const COLORS = ['#1f77b4', '#2ca02c', '#ff7f0e', '#d62728', '#9467bd'];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const value = payload[0].value;
    return (
      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
        <p className="font-semibold mb-1">{label}</p>
        <p className="text-sm">{payload[0].name}: {value.toFixed(4)}</p>
      </div>
    );
  };

  const renderMetricChart = (
    title: string,
    dataKey: keyof MethodPerformance,
    lowerIsBetter: boolean = true
  ) => {
    const data = performance.map(p => ({
      method: p.method,
      value: p[dataKey]
    }));

    return (
      <div className="bg-card rounded-lg p-4 border">
        <h3 className="text-base font-semibold mb-4 text-center">
          {title}
          <span className="text-xs font-normal opacity-70 ml-2">
            ({lowerIsBetter ? 'lower is better' : 'higher is better'})
          </span>
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis type="category" dataKey="method" angle={-45} textAnchor="end" height={100} className="text-xs" />
            <YAxis type="number" className="text-sm" />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" name={title} radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Metrics Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {renderMetricChart('Brier Score', 'brierScore', true)}
          {renderMetricChart('AUC-ROC', 'aucRoc', false)}
          {renderMetricChart('Log Loss', 'logLoss', true)}
          {renderMetricChart('Expected Calibration Error', 'calibrationError', true)}
        </div>
      </CardContent>
    </Card>
  );
};
