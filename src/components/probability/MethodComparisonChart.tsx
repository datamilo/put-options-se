import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CalibrationPoint } from '@/types/probabilityValidation';
import { ArrowUpDown } from 'lucide-react';

interface MethodComparisonChartProps {
  calibrationPoints: CalibrationPoint[];
}

interface StockMethodMetrics {
  stock: string;
  method: string;
  avgError: number;
  totalCount: number;
}

interface StockRow {
  stock: string;
  [method: string]: number | string;
}

const METHODS = ['Weighted Average', 'Bayesian Calibrated', 'Original Black-Scholes', 'Bias Corrected', 'Historical IV'];
const DTE_BINS = ['All DTE', '0-3 days', '4-7 days', '8-14 days', '15-21 days', '22-28 days', '29-35 days', '35+ days'];

const COLORS = {
  'Weighted Average': '#3b82f6',
  'Bayesian Calibrated': '#10b981',
  'Original Black-Scholes': '#f59e0b',
  'Bias Corrected': '#ef4444',
  'Historical IV': '#8b5cf6'
};

export const MethodComparisonChart: React.FC<MethodComparisonChartProps> = ({
  calibrationPoints
}) => {
  const [selectedDTE, setSelectedDTE] = useState<string>('8-14 days');
  const [sortColumn, setSortColumn] = useState<string>('stock');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Calculate weighted calibration error for each stock-method pair
  const metricsData = useMemo(() => {
    const metrics: StockMethodMetrics[] = [];

    // Ensure calibrationPoints is an array and filter for the data we need
    const allRecords = Array.isArray(calibrationPoints)
      ? calibrationPoints.filter((p: any) => p.DataType === 'calibration_by_stock_and_dte')
      : [];

    console.log('MethodComparisonChart - calibrationPoints count:', calibrationPoints?.length);
    console.log('MethodComparisonChart - filtered records count:', allRecords.length);

    if (allRecords.length === 0) {
      console.warn('No calibration_by_stock_and_dte records found');
      return [];
    }

    if (selectedDTE === 'All DTE') {
      // For All DTE, aggregate across all DTE bins
      const byStockMethod: Record<string, Record<string, { totalError: number; totalCount: number }>> = {};

      allRecords.forEach(record => {
        if (!byStockMethod[record.Stock]) {
          byStockMethod[record.Stock] = {};
        }
        if (!byStockMethod[record.Stock][record.method]) {
          byStockMethod[record.Stock][record.method] = { totalError: 0, totalCount: 0 };
        }

        const calibrationError = record.actual - record.predicted;
        byStockMethod[record.Stock][record.method].totalError += record.Count * calibrationError;
        byStockMethod[record.Stock][record.method].totalCount += record.Count;
      });

      Object.entries(byStockMethod).forEach(([stock, methodData]) => {
        Object.entries(methodData).forEach(([method, data]) => {
          const avgError = data.totalCount > 0 ? data.totalError / data.totalCount : 0;
          metrics.push({ stock, method, avgError, totalCount: data.totalCount });
        });
      });
    } else {
      // For specific DTE, filter to that DTE bin
      const dteRecords = allRecords.filter(r => r.DTE_Bin === selectedDTE);

      // Apply 25th percentile filter
      const counts = dteRecords.map(r => r.Count).sort((a, b) => a - b);
      const percentile25Index = Math.floor(counts.length * 0.25);
      const countThreshold = counts.length > 0 ? counts[percentile25Index] : 0;
      const filteredRecords = dteRecords.filter(r => r.Count >= countThreshold);

      // Group and aggregate
      const byStockMethod: Record<string, Record<string, { totalError: number; totalCount: number }>> = {};

      filteredRecords.forEach(record => {
        if (!byStockMethod[record.Stock]) {
          byStockMethod[record.Stock] = {};
        }
        if (!byStockMethod[record.Stock][record.method]) {
          byStockMethod[record.Stock][record.method] = { totalError: 0, totalCount: 0 };
        }

        const calibrationError = record.actual - record.predicted;
        byStockMethod[record.Stock][record.method].totalError += record.Count * calibrationError;
        byStockMethod[record.Stock][record.method].totalCount += record.Count;
      });

      Object.entries(byStockMethod).forEach(([stock, methodData]) => {
        Object.entries(methodData).forEach(([method, data]) => {
          const avgError = data.totalCount > 0 ? data.totalError / data.totalCount : 0;
          metrics.push({ stock, method, avgError, totalCount: data.totalCount });
        });
      });
    }

    return metrics;
  }, [calibrationPoints, selectedDTE]);

  // Build stock rows for table
  const tableData = useMemo(() => {
    const rows: Record<string, StockRow> = {};

    // Initialize each stock
    const uniqueStocks = Array.from(new Set(metricsData.map(m => m.stock))).sort();
    uniqueStocks.forEach(stock => {
      rows[stock] = { stock };
      METHODS.forEach(method => {
        rows[stock][method] = 0;
      });
    });

    // Fill in the data
    metricsData.forEach(metric => {
      if (rows[metric.stock]) {
        rows[metric.stock][metric.method] = metric.avgError;
      }
    });

    // Convert to array and calculate average error
    let stocksArray = Object.values(rows).map(row => ({
      ...row,
      avgError: METHODS.reduce((sum, m) => sum + (typeof row[m] === 'number' ? row[m] : 0), 0) / METHODS.length
    }));

    // Sort by column
    stocksArray.sort((a, b) => {
      let aVal: any = a[sortColumn];
      let bVal: any = b[sortColumn];

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = (bVal as string).toLowerCase();
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      } else {
        return sortDirection === 'asc' ? (aVal || 0) - (bVal || 0) : (bVal || 0) - (aVal || 0);
      }
    });

    return stocksArray;
  }, [metricsData, sortColumn, sortDirection]);

  // Get color for heatmap cell
  const getCellColor = (value: number) => {
    if (value < -0.20) return 'bg-red-900';
    if (value < -0.10) return 'bg-red-500';
    if (value < 0) return 'bg-red-200';
    if (value === 0) return 'bg-white';
    if (value < 0.10) return 'bg-green-200';
    if (value < 0.20) return 'bg-green-500';
    return 'bg-green-900';
  };

  const formatNumber = (value: number) => {
    return (value * 100).toFixed(1);
  };

  const toggleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sortColumn !== column) return <ArrowUpDown className="w-4 h-4 opacity-30" />;
    return (
      <ArrowUpDown className={`w-4 h-4 ${sortDirection === 'asc' ? 'rotate-0' : 'rotate-180'}`} />
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Stock Performance by Method</CardTitle>
          <div className="mt-4 space-y-4">
            <div className="max-w-xs">
              <Label>Days to Expiry</Label>
              <Select value={selectedDTE} onValueChange={setSelectedDTE}>
                <SelectTrigger>
                  <SelectValue />
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

            <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg text-sm">
              <p className="text-amber-900 dark:text-amber-200">
                <strong>Color Guide:</strong> Green = conservative (under-predicts), Red = overconfident (over-predicts), White = well-calibrated
              </p>
              <p className="text-amber-800 dark:text-amber-300 text-xs mt-2">
                Values show average calibration error (actual - predicted) weighted by sample size. Positive = conservative, Negative = overconfident.
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {metricsData.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center">No data available for this filter combination.</p>
          </CardContent>
        </Card>
      ) : (
      <Card>
        <CardContent className="space-y-6">
        {/* Heatmap */}
        <div className="overflow-x-auto">
          <div className="min-w-max border rounded-lg">
            <div className="flex">
              {/* Stock names column */}
              <div className="flex flex-col border-r bg-gray-50 dark:bg-slate-900 min-w-fit">
                <div className="h-12 flex items-center px-3 font-semibold text-sm border-b">Stock</div>
                {tableData.map(row => (
                  <div key={row.stock} className="h-10 flex items-center px-3 text-sm border-b">
                    {row.stock}
                  </div>
                ))}
              </div>

              {/* Method columns */}
              {METHODS.map(method => (
                <div key={method} className="flex flex-col border-r">
                  <div
                    className="h-12 flex items-center justify-center px-3 font-semibold text-xs border-b"
                    style={{ backgroundColor: COLORS[method as keyof typeof COLORS], color: 'white' }}
                  >
                    {method}
                  </div>
                  {tableData.map(row => {
                    const value = typeof row[method] === 'number' ? (row[method] as number) : 0;
                    return (
                      <div
                        key={`${row.stock}-${method}`}
                        className={`h-10 flex items-center justify-center px-3 text-xs font-medium border-b ${getCellColor(value)}`}
                        title={`${row.stock} - ${method}: ${formatNumber(value)}%`}
                      >
                        {formatNumber(value)}%
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="space-y-2">
          <h3 className="font-semibold text-sm">Data Table</h3>
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-slate-900 border-b">
                <tr>
                  <th className="px-4 py-2 text-left cursor-pointer" onClick={() => toggleSort('stock')}>
                    <div className="flex items-center gap-2">
                      Stock
                      <SortIcon column="stock" />
                    </div>
                  </th>
                  {METHODS.map(method => (
                    <th
                      key={method}
                      className="px-4 py-2 text-right cursor-pointer"
                      onClick={() => toggleSort(method)}
                      style={{
                        backgroundColor: COLORS[method as keyof typeof COLORS],
                        color: 'white',
                        fontSize: '0.75rem'
                      }}
                    >
                      <div className="flex items-center justify-between gap-1">
                        {method}
                        <SortIcon column={method} />
                      </div>
                    </th>
                  ))}
                  <th className="px-4 py-2 text-right cursor-pointer" onClick={() => toggleSort('avgError')}>
                    <div className="flex items-center justify-between gap-1">
                      Avg Error
                      <SortIcon column="avgError" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {tableData.map(row => (
                  <tr key={row.stock} className="border-b hover:bg-gray-50 dark:hover:bg-slate-800">
                    <td className="px-4 py-2 font-medium">{row.stock}</td>
                    {METHODS.map(method => {
                      const value = typeof row[method] === 'number' ? (row[method] as number) : 0;
                      return (
                        <td key={method} className="px-4 py-2 text-right">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getCellColor(value)}`}>
                            {formatNumber(value)}%
                          </span>
                        </td>
                      );
                    })}
                    <td className="px-4 py-2 text-right font-semibold">
                      {formatNumber(row.avgError as number)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg text-sm">
          <p className="text-blue-900 dark:text-blue-300">
            <strong>Interpretation:</strong> Positive values indicate the method is conservative (predicts lower probabilities than actual), negative values indicate overconfidence. Values are weighted by sample size to emphasize results with more data.
          </p>
        </div>
      </CardContent>
      </Card>
      )}
    </div>
  );
};
