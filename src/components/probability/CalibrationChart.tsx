import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PlotWrapper as Plot } from '@/components/PlotWrapper';
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
  const { t, i18n } = useTranslation('pages');

  const [selectedStock, setSelectedStock] = useState<string>('All Stocks');
  const [selectedDTE, setSelectedDTE] = useState<string>('All DTE');
  const [selectedMethod, setSelectedMethod] = useState<string>('All Methods');

  const DTE_BINS = ['All DTE', '0-3 days', '4-7 days', '8-14 days', '15-21 days', '22-28 days', '29-35 days', '35+ days'];
  const dteBinKeyMap: Record<string, string> = {
    'All DTE': 'all', '0-3 days': '0to3', '4-7 days': '4to7', '8-14 days': '8to14',
    '15-21 days': '15to21', '22-28 days': '22to28', '29-35 days': '29to35', '35+ days': '35plus',
  };

  // Methods now stored in normalized format (without "PoW - " prefix) from CSV
  const METHODS_NORMALIZED = ['Weighted Average', 'Bayesian Calibrated', 'Original Black-Scholes', 'Bias Corrected', 'Historical IV'];
  const METHODS = ['All Methods', ...METHODS_NORMALIZED];

  const methodKeyMap: Record<string, string> = {
    'Weighted Average': 'weightedAverage',
    'Bayesian Calibrated': 'bayesianCalibrated',
    'Original Black-Scholes': 'originalBlackScholes',
    'Bias Corrected': 'biasCorreected',
    'Historical IV': 'historicalIV',
  };

  // Color mappings for normalized method names
  const COLORS: Record<string, string> = {
    'Weighted Average': '#3b82f6',
    'Bayesian Calibrated': '#10b981',
    'Original Black-Scholes': '#f59e0b',
    'Bias Corrected': '#ef4444',
    'Historical IV': '#8b5cf6'
  };

  const getDisplayName = (method: string): string => {
    if (method === 'All Methods') return t('probabilityAnalysis.calibrationChart.allMethods');
    const key = methodKeyMap[method];
    return key ? t(`charts:methods.${key}`) : `PoW - ${method}`;
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
        const aggregated: Record<string, any> = {};

        dteRecords.forEach(point => {
          const p = point as any;
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

          const count = p.count || 0;
          aggregated[key].totalCount += count;
          aggregated[key].totalActualCount += count * (p.actual || 0);
          aggregated[key].totalPredictedCount += count * (p.predicted || 0);
        });

        filtered = Object.values(aggregated).map((item: any) => ({
          predicted: item.totalCount > 0 ? item.totalPredictedCount / item.totalCount : 0,
          actual: item.totalCount > 0 ? item.totalActualCount / item.totalCount : 0,
          count: item.totalCount,
          method: item.method
        }));
      } else {
        filtered = dteRecords.filter(p => {
          const point = p as any;
          return point.Stock === selectedStock;
        });
      }
    } else {
      if (selectedStock !== 'All Stocks') {
        filtered = calibrationPoints.filter(p => {
          const point = p as any;
          return point.Stock === selectedStock && point.DataType === 'calibration_by_stock';
        });
      } else {
        filtered = calibrationPoints.filter(p => {
          const point = p as any;
          return point.DataType === 'calibration_aggregated';
        });
      }
    }

    const counts = filtered.map(p => p.count).sort((a, b) => a - b);
    const percentile25Index = Math.floor(counts.length * 0.25);
    const countThreshold = counts.length > 0 ? counts[percentile25Index] : 0;
    const filteredByCount = filtered.filter(p => p.count >= countThreshold);

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

    Object.keys(grouped).forEach(method => {
      grouped[method].sort((a, b) => a.predicted - b.predicted);
    });

    return grouped;
  }, [calibrationPoints, selectedStock, selectedDTE, getCalibrationPointsFn]);

  // Prepare Plotly traces
  const plotlyData = useMemo(() => {
    const traces: any[] = [];

    traces.push({
      x: [0, 1],
      y: [0, 1],
      mode: 'lines',
      name: t('probabilityAnalysis.calibrationChart.perfectCalibration'),
      line: { color: 'black', width: 2, dash: 'dash' },
      hoverinfo: 'skip',
      showlegend: true
    });

    Object.entries(chartData).forEach(([method, points]) => {
      if (!points || points.length === 0) return;
      if (selectedMethod !== 'All Methods' && method !== selectedMethod) return;

      const color = COLORS[method] || '#999';
      const displayName = getDisplayName(method);

      traces.push({
        x: points.map(p => p.predicted),
        y: points.map(p => p.actual),
        mode: 'lines+markers',
        name: displayName,
        line: { color: color, width: 2 },
        marker: { color: color, size: 8, line: { color: 'white', width: 1 } },
        hovertemplate:
          '<b>' + displayName + '</b><br>' +
          'Predicted: %{x:.1%}<br>' +
          'Actual: %{y:.1%}<br>' +
          'n=%{text}<extra></extra>',
        text: points.map(p => p.count.toLocaleString()),
        showlegend: true
      });
    });

    return traces;
  }, [chartData, selectedMethod, i18n.language]);

  const layout = useMemo(() => {
    return {
      title: {
        text: `<b>${t('probabilityAnalysis.calibrationChart.title')}</b>`,
        font: { size: 16 }
      },
      xaxis: {
        title: t('probabilityAnalysis.calibrationChart.axisPredicted'),
        tickformat: '.0%',
        range: [0, 1],
        gridcolor: '#e5e7eb'
      },
      yaxis: {
        title: t('probabilityAnalysis.calibrationChart.axisActual'),
        tickformat: '.0%',
        range: [0, 1],
        gridcolor: '#e5e7eb'
      },
      height: 700,
      template: 'plotly_white',
      hovermode: 'closest',
      showlegend: true,
      legend: { orientation: 'h', y: -0.15, x: 0.5, xanchor: 'center' }
    };
  }, [i18n.language]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('probabilityAnalysis.calibrationChart.title')}</CardTitle>
        {availableStocks.length > 0 && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl">
            <div>
              <Label>{t('probabilityAnalysis.calibrationChart.stockLabel')}</Label>
              <Select value={selectedStock} onValueChange={setSelectedStock}>
                <SelectTrigger>
                  <SelectValue placeholder={t('probabilityAnalysis.calibrationChart.selectStock')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Stocks">{t('probabilityAnalysis.calibrationChart.allStocks')}</SelectItem>
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
              <Label>{t('probabilityAnalysis.calibrationChart.dteLabel')}</Label>
              <Select value={selectedDTE} onValueChange={setSelectedDTE}>
                <SelectTrigger>
                  <SelectValue placeholder={t('probabilityAnalysis.calibrationChart.selectDTE')} />
                </SelectTrigger>
                <SelectContent>
                  {DTE_BINS.map(dte => (
                    <SelectItem key={dte} value={dte}>
                      {t(`probabilityAnalysis.recoveryCandidatesExplained.dteBins.${dteBinKeyMap[dte]}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('probabilityAnalysis.calibrationChart.methodLabel')}</Label>
              <Select value={selectedMethod} onValueChange={setSelectedMethod}>
                <SelectTrigger>
                  <SelectValue placeholder={t('probabilityAnalysis.calibrationChart.selectMethod')} />
                </SelectTrigger>
                <SelectContent>
                  {METHODS.map(method => (
                    <SelectItem key={method} value={method}>
                      {getDisplayName(method)}
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
            <p className="text-muted-foreground">{t('probabilityAnalysis.calibrationChart.noData')}</p>
          </div>
        ) : (
          <div className="w-full">
            <Plot
              data={plotlyData}
              layout={layout}
              config={{ responsive: true, displayModeBar: true, displaylogo: false }}
              style={{ width: '100%', height: '700px' }}
            />
          </div>
        )}
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            {t('probabilityAnalysis.calibrationChart.interpretation')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
