import React, { useMemo, useState } from 'react';
import Plot from 'react-plotly.js';
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
  const [selectedMethod, setSelectedMethod] = useState<string>('All Methods');


  const DTE_BINS = ['All DTE', '0-3 days', '4-7 days', '8-14 days', '15-21 days', '22-28 days', '29-35 days', '35+ days'];
  const METHODS = ['All Methods', 'Weighted Average', 'Bayesian Calibrated', 'Original Black-Scholes', 'Bias Corrected', 'Historical IV'];

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

  // Prepare Plotly traces
  const plotlyData = useMemo(() => {
    const traces: any[] = [];

    // Perfect calibration reference line (diagonal)
    traces.push({
      x: [0, 1],
      y: [0, 1],
      mode: 'lines',
      name: 'Perfect Calibration',
      line: {
        color: 'black',
        width: 2,
        dash: 'dash'
      },
      hoverinfo: 'skip',
      showlegend: true
    });

    // Add traces for each method
    Object.entries(chartData).forEach(([method, points]) => {
      if (!points || points.length === 0) return;

      // Skip this method if a specific method is selected and it doesn't match
      if (selectedMethod !== 'All Methods' && method !== selectedMethod) {
        return;
      }

      const color = COLORS[method] || '#999';

      traces.push({
        x: points.map(p => p.predicted),
        y: points.map(p => p.actual),
        mode: 'lines+markers',
        name: method,
        line: {
          color: color,
          width: 2
        },
        marker: {
          color: color,
          size: 8,
          line: {
            color: 'white',
            width: 1
          }
        },
        hovertemplate:
          '<b>' + method + '</b><br>' +
          'Predicted: %{x:.1%}<br>' +
          'Actual: %{y:.1%}<br>' +
          'n=%{text}<extra></extra>',
        text: points.map(p => p.count.toLocaleString()),
        showlegend: true
      });
    });

    return traces;
  }, [chartData, selectedMethod]);

  const layout = useMemo(() => {
    return {
      title: {
        text: '<b>Calibration Analysis</b>',
        font: { size: 16 }
      },
      xaxis: {
        title: 'Predicted Probability',
        tickformat: '.0%',
        range: [0, 1],
        gridcolor: '#e5e7eb'
      },
      yaxis: {
        title: 'Actual Rate',
        tickformat: '.0%',
        range: [0, 1],
        gridcolor: '#e5e7eb'
      },
      height: 700,
      template: 'plotly_white',
      hovermode: 'closest',
      showlegend: true,
      legend: {
        orientation: 'h',
        y: -0.15,
        x: 0.5,
        xanchor: 'center'
      }
    };
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calibration Analysis</CardTitle>
        {availableStocks.length > 0 && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl">
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
            <div>
              <Label>Probability Method</Label>
              <Select value={selectedMethod} onValueChange={setSelectedMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  {METHODS.map(method => (
                    <SelectItem key={method} value={method}>
                      {method}
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
          <div className="w-full">
            <Plot
              data={plotlyData}
              layout={layout}
              config={{
                responsive: true,
                displayModeBar: true,
                displaylogo: false,
              }}
              style={{ width: '100%', height: '700px' }}
            />
          </div>
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
