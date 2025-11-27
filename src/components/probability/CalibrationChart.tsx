import React, { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
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
    'Weighted Average': '#3b82f6',
    'Bayesian Calibrated': '#10b981',
    'Original Black-Scholes': '#f59e0b',
    'Bias Corrected': '#ef4444',
    'Historical IV': '#8b5cf6'
  };

  // Filter and group data by method
  const chartData = useMemo(() => {
    let filtered: CalibrationPoint[] = [];

    // When DTE is selected and not "All DTE", we need calibration_by_stock_and_dte data
    if (selectedDTE !== 'All DTE') {
      // Get all by_stock_and_dte records for this DTE
      const dteRecords = calibrationPoints.filter(p => {
        const point = p as any;
        return point.DataType === 'calibration_by_stock_and_dte' && point.DTE_Bin === selectedDTE;
      });

      if (selectedStock === 'All Stocks') {
        // Aggregate across all stocks for this DTE
        // Group by method and BIN (not exact predicted probability), sum counts, calculate weighted average
        const aggregated: Record<string, any> = {};

        dteRecords.forEach(point => {
          const p = point as any;
          // Create unique key combining method and BIN
          const key = `${p.method}|${p.Bin}`;

          if (!aggregated[key]) {
            aggregated[key] = {
              method: p.method,
              Bin: p.Bin,
              totalCount: 0,
              totalActualCount: 0,
              totalPredictedCount: 0
            };
          }

          // Sum counts and accumulate weighted actual rate and predicted rate
          const count = p.count || 0;
          aggregated[key].totalCount += count;
          aggregated[key].totalActualCount += count * (p.actual || 0);
          aggregated[key].totalPredictedCount += count * (p.predicted || 0);
        });

        // Convert to CalibrationPoint format with weighted average actual rate and predicted rate
        filtered = Object.values(aggregated).map((item: any) => ({
          predicted: item.totalCount > 0 ? item.totalPredictedCount / item.totalCount : 0,
          actual: item.totalCount > 0 ? item.totalActualCount / item.totalCount : 0,
          count: item.totalCount,
          method: item.method
        }));
      } else {
        // For specific stock, just filter by stock (no aggregation needed)
        filtered = dteRecords.filter(p => {
          const point = p as any;
          return point.Stock === selectedStock;
        });
      }
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

    // Calculate 25th percentile of counts to filter out low-sample outliers
    const counts = filtered.map(p => p.count).sort((a, b) => a - b);
    const percentile25Index = Math.floor(counts.length * 0.25);
    const countThreshold = counts.length > 0 ? counts[percentile25Index] : 0;

    // Filter out points with count below 25th percentile
    const filteredByCount = filtered.filter(p => p.count >= countThreshold);

    // Group by method
    const grouped: Record<string, Array<{ predicted: number; actual: number; count: number }>> = {};

    filteredByCount.forEach(point => {
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
    const methodName = payload[0].name || 'Unknown Method';
    const lineColor = payload[0].color || payload[0].stroke;

    return (
      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
        <p className="font-semibold mb-2 flex items-center gap-2">
          <span
            className="inline-block w-3 h-3 rounded-full"
            style={{ backgroundColor: lineColor }}
          />
          {methodName}
        </p>
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
        <ResponsiveContainer width="100%" height={700}>
          <LineChart margin={{ top: 20, right: 20, bottom: 150, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              type="number"
              dataKey="predicted"
              domain={[0, 1]}
              tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
              label={{ value: 'Predicted Probability', position: 'bottom', offset: 10 }}
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
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              height={80}
              wrapperStyle={{ paddingTop: '20px' }}
            />

            {/* Perfect calibration reference line */}
            <Line
              data={perfectLine}
              type="monotone"
              dataKey="actual"
              stroke="black"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
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
                <Line
                  key={method}
                  data={points}
                  type="monotone"
                  dataKey="actual"
                  stroke={COLORS[method] || '#999'}
                  strokeWidth={2}
                  dot={{ fill: COLORS[method] || '#999', r: 4 }}
                  name={method}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
        )}
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            <strong>Interpretation:</strong> Lines closer to the diagonal indicate better calibration.
            Each dot represents a probability bin showing predicted vs actual rates.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
