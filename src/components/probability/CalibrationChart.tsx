import React, { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  ZAxis
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { CalibrationPoint } from '@/types/probabilityValidation';

interface CalibrationChartProps {
  calibrationPoints: CalibrationPoint[];
  availableStocks?: string[];
  getCalibrationPoints?: (filterType: 'aggregated' | 'by_stock', filterValue?: string) => CalibrationPoint[];
}

export const CalibrationChart: React.FC<CalibrationChartProps> = ({
  calibrationPoints,
  availableStocks = [],
  getCalibrationPoints: getCalibrationPointsFn
}) => {
  const [selectedStock, setSelectedStock] = useState<string>('All Stocks');
  const [selectedDTE, setSelectedDTE] = useState<string>('All DTE');

  const DTE_BINS = ['All DTE', '0-3 days', '4-7 days', '8-14 days', '15-21 days', '22-28 days', '29-35 days', '35+ days'];

  const COLORS: Record<string, string> = {
    'Weighted Average': '#1f77b4',
    'Bayesian Calibrated': '#2ca02c',
    'Original Black-Scholes': '#ff7f0e',
    'Bias Corrected': '#d62728',
    'Historical IV': '#9467bd'
  };

  // Filter and group data by method
  const chartData = useMemo(() => {
    let filtered: CalibrationPoint[] = [];

    // When DTE is selected and not "All DTE", we need calibration_by_stock_and_dte data
    if (selectedDTE !== 'All DTE') {
      // Filter for DTE-specific data (only calibration_by_stock_and_dte has DTE_Bin values)
      filtered = calibrationPoints.filter(point => {
        const p = point as any;
        // Check if this record has a DTE_Bin (only by_stock_and_dte records do)
        if (p.DTE_Bin === selectedDTE && p.DataType === 'calibration_by_stock_and_dte') {
          // Check stock filter
          if (selectedStock === 'All Stocks') {
            // For All Stocks with specific DTE, show all stocks in that DTE bin
            return true;
          } else {
            // For specific stock, check both stock and DTE
            return p.Stock === selectedStock;
          }
        }
        return false;
      });
    } else {
      // When DTE is "All DTE", show aggregated or by-stock data
      if (selectedStock !== 'All Stocks') {
        // For specific stock, use by_stock data (no DTE filtering)
        filtered = calibrationPoints.filter(p => {
          const point = p as any;
          return point.Stock === selectedStock && point.DataType === 'calibration_by_stock';
        });
      } else {
        // For All Stocks, use aggregated data (no stock or DTE filtering)
        filtered = calibrationPoints.filter(p => {
          const point = p as any;
          return point.DataType === 'calibration_aggregated';
        });
      }
    }

    // Group by method
    const grouped: Record<string, Array<{ predicted: number; actual: number; count: number }>> = {};

    filtered.forEach(point => {
      if (!grouped[point.method]) {
        grouped[point.method] = [];
      }
      grouped[point.method].push({
        predicted: point.predicted,
        actual: point.actual,
        count: point.count
      });
    });

    // Sort each method's points by predicted value
    Object.keys(grouped).forEach(method => {
      grouped[method].sort((a, b) => a.predicted - b.predicted);
    });

    return grouped;
  }, [calibrationPoints, selectedStock, selectedDTE, getCalibrationPointsFn]);

  // Prepare perfect calibration line
  const perfectLine = [
    { predicted: 0, actual: 0 },
    { predicted: 1, actual: 1 }
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;
    return (
      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
        <p className="font-semibold mb-2">{payload[0].name || payload[0].dataKey}</p>
        <p className="text-sm">Predicted: {(data.predicted * 100).toFixed(1)}%</p>
        <p className="text-sm">Actual: {(data.actual * 100).toFixed(1)}%</p>
        {data.count && <p className="text-sm opacity-70">Count: {data.count.toLocaleString()}</p>}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calibration Analysis</CardTitle>
        {availableStocks.length > 0 && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
            <div>
              <Label>Stock</Label>
              <Select value={selectedStock} onValueChange={setSelectedStock}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a stock" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Stocks">All Stocks</SelectItem>
                  {availableStocks
                    .filter(stock => stock !== 'All Stocks')
                    .map(stock => (
                      <SelectItem key={stock} value={stock}>
                        {stock}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Days to Expiry</Label>
              <Select value={selectedDTE} onValueChange={setSelectedDTE}>
                <SelectTrigger>
                  <SelectValue placeholder="Select DTE" />
                </SelectTrigger>
                <SelectContent>
                  {DTE_BINS.map(dte => (
                    <SelectItem key={dte} value={dte}>
                      {dte}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {Object.keys(chartData).length === 0 || Object.values(chartData).every((points: any) => !points || points.length === 0) ? (
          <div className="flex items-center justify-center h-96 bg-muted/30 rounded-lg">
            <p className="text-muted-foreground">No calibration data available for this filter combination.</p>
          </div>
        ) : (
        <ResponsiveContainer width="100%" height={500}>
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              type="number"
              dataKey="predicted"
              domain={[0, 1]}
              tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
              label={{ value: 'Predicted Probability', position: 'insideBottom', offset: -10 }}
              className="text-sm"
            />
            <YAxis
              type="number"
              dataKey="actual"
              domain={[0, 1]}
              tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
              label={{ value: 'Actual Rate', angle: -90, position: 'insideLeft' }}
              className="text-sm"
            />
            <ZAxis type="number" dataKey="count" range={[50, 400]} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />

            {/* Perfect calibration reference line */}
            <Scatter
              data={perfectLine}
              fill="black"
              line={{ stroke: 'black', strokeWidth: 2, strokeDasharray: '5 5' }}
              shape="circle"
              isAnimationActive={false}
              name="Perfect Calibration"
            />

            {/* Method calibration curves */}
            {Object.entries(chartData).map(([method, points]) => {
              // Only render if method has data points
              if (!points || points.length === 0) {
                return null;
              }
              return (
                <Scatter
                  key={method}
                  data={points}
                  fill={COLORS[method] || '#999'}
                  line={{ stroke: COLORS[method] || '#999', strokeWidth: 2 }}
                  shape="circle"
                  name={method}
                />
              );
            })}
          </ScatterChart>
        </ResponsiveContainer>
        )}
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            <strong>Interpretation:</strong> Points closer to the diagonal line indicate better calibration.
            Larger circles represent more data points at that probability level.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
