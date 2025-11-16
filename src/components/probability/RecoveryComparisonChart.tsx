import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface ChartDataPoint {
  recovery_candidate_n: number;
  recovery_candidate_rate: number;
  baseline_n: number;
  baseline_rate: number | null;
  advantage: number | null;
}

type ChartDataStructure = Record<string, Record<string, Record<string, Record<string, Record<string, ChartDataPoint>>>>>;

interface RecoveryComparisonChartProps {
  stocks: string[];
  chartData: ChartDataStructure;
  stockChartData: ChartDataStructure;
}

export const RecoveryComparisonChart: React.FC<RecoveryComparisonChartProps> = ({
  stocks,
  chartData,
  stockChartData
}) => {
  // Get available thresholds and methods from chart data
  const availableOptions = useMemo(() => {
    const thresholds = new Set<string>();
    const methods = new Set<string>();
    const probBins = new Set<string>();

    // Extract from aggregated data
    Object.keys(chartData).forEach(threshold => {
      thresholds.add(threshold);
      Object.keys(chartData[threshold]).forEach(method => {
        methods.add(method);
        Object.keys(chartData[threshold][method]).forEach(probBin => {
          probBins.add(probBin);
        });
      });
    });

    // Extract from stock data
    Object.keys(stockChartData).forEach(threshold => {
      thresholds.add(threshold);
      Object.keys(stockChartData[threshold]).forEach(stock => {
        Object.keys(stockChartData[threshold][stock]).forEach(method => {
          methods.add(method);
          Object.keys(stockChartData[threshold][stock][method]).forEach(probBin => {
            probBins.add(probBin);
          });
        });
      });
    });

    return {
      thresholds: Array.from(thresholds).sort(),
      methods: Array.from(methods).sort(),
      probBins: Array.from(probBins).sort()
    };
  }, [chartData, stockChartData]);

  // Initialize with first available values
  const [threshold, setThreshold] = React.useState(availableOptions.thresholds[0] || '0.8');
  const [method, setMethod] = React.useState(availableOptions.methods[0] || 'Weighted Average');
  const [probBin, setProbBin] = React.useState(availableOptions.probBins[0] || '50-60%');
  const [stock, setStock] = React.useState('All Stocks');

  // Prepare chart data with both bars
  const barChartData = useMemo(() => {
    let dteBins = ['0-7', '8-14', '15-21', '22-28', '29-35', '36+'];
    // Reverse the order to show highest DTE first (matching HTML behavior)
    dteBins = dteBins.slice().reverse();
    const dataMap: any[] = [];

    // Get the appropriate data source
    const selectedData = stock === 'All Stocks'
      ? chartData[threshold]?.[method]?.[probBin]
      : stockChartData[threshold]?.[stock]?.[method]?.[probBin];

    if (!selectedData) {
      return [];
    }

    for (const dte of dteBins) {
      const point = selectedData[dte];
      if (point) {
        dataMap.push({
          name: dte,
          'Recovery Candidates': point.recovery_candidate_rate * 100,
          'Baseline': point.baseline_rate !== null ? point.baseline_rate * 100 : null,
          recovery_candidate_n: point.recovery_candidate_n,
          baseline_n: point.baseline_n
        });
      }
    }

    return dataMap;
  }, [chartData, stockChartData, threshold, method, probBin, stock]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;

    return (
      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
        <p className="font-semibold mb-2">{data.name} days</p>

        {payload.map((entry: any, index: number) => (
          <div key={index}>
            <p className="text-sm mb-1">
              <span style={{ color: entry.color }} className="font-medium">{entry.name}:</span>
            </p>
            {entry.value !== null ? (
              <>
                <p className="text-sm opacity-90 ml-2">
                  Worthless Rate: {entry.value.toFixed(1)}%
                </p>
                <p className="text-sm opacity-70 ml-2">
                  {entry.name === 'Recovery Candidates'
                    ? `${entry.value.toFixed(1)}% (${data.recovery_candidate_n.toLocaleString()})`
                    : `${entry.value.toFixed(1)}% (${data.baseline_n.toLocaleString()})`}
                </p>
              </>
            ) : (
              <p className="text-sm opacity-70 ml-2">No data</p>
            )}
          </div>
        ))}
      </div>
    );
  };

  const thresholdPct = Math.round(parseFloat(threshold) * 100);
  const title = stock === 'All Stocks'
    ? `Recovery Candidates (${thresholdPct}%+ peak) vs Baseline - ${method} (${probBin})`
    : `${stock} - ${method} (${probBin}) - Peak Threshold: ${thresholdPct}%+`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recovery Advantage Analysis</CardTitle>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          <div>
            <Label>Historical Peak Threshold</Label>
            <Select value={threshold} onValueChange={setThreshold}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableOptions.thresholds.map(t => (
                  <SelectItem key={t} value={t}>
                    {(parseFloat(t) * 100).toFixed(0)}%
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Probability Method</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableOptions.methods.map(m => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Current Probability Bin</Label>
            <Select value={probBin} onValueChange={setProbBin}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableOptions.probBins.map(pb => (
                  <SelectItem key={pb} value={pb}>
                    {pb}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Stock (optional)</Label>
            <Select value={stock} onValueChange={setStock}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {stocks.map(s => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {barChartData.length === 0 ? (
          <div className="flex items-center justify-center h-96">
            <p className="text-center text-destructive">No data available for this combination</p>
          </div>
        ) : (
          <div>
            <p className="text-sm font-semibold mb-4">{title}</p>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={barChartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="name"
                  label={{ value: 'Days to Expiry (Calendar Days)', position: 'insideBottom', offset: -5 }}
                  className="text-sm"
                />
                <YAxis
                  label={{ value: 'Worthless Rate (%)', angle: -90, position: 'insideLeft' }}
                  domain={[0, 100]}
                  className="text-sm"
                />
                <Tooltip content={({ active, payload }) => <CustomTooltip active={active} payload={payload} />} />
                <Legend
                  wrapperStyle={{ paddingTop: '20px' }}
                  layout="horizontal"
                  align="center"
                  verticalAlign="bottom"
                />
                <Bar dataKey="Recovery Candidates" fill="#16a34a" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Baseline" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
