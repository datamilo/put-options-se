import React, { useState, useMemo } from 'react';
import Plot from 'react-plotly.js';
import { useConsecutiveBreaksAnalysis } from '@/hooks/useConsecutiveBreaksAnalysis';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export const ConsecutiveBreaksAnalysis = () => {
  const { uniqueStocks, selectedStock, setSelectedStock, analyzeStock } =
    useConsecutiveBreaksAnalysis();

  // Filter parameters
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [period, setPeriod] = useState<string>('90');
  const [maxGap, setMaxGap] = useState<string>('30');

  // Perform analysis
  const analysis = useMemo(() => {
    if (!selectedStock) return null;

    return analyzeStock(selectedStock, {
      dateFrom: dateFrom ? new Date(dateFrom) : null,
      dateTo: dateTo ? new Date(dateTo) : null,
      periodDays: parseInt(period),
      maxGapDays: parseInt(maxGap),
    });
  }, [selectedStock, dateFrom, dateTo, period, maxGap, analyzeStock]);

  // Initialize dates when stock changes
  React.useEffect(() => {
    if (analysis && !dateFrom && !dateTo) {
      if (analysis.data.length > 0) {
        const firstDate = analysis.data[0].date.split('T')[0];
        const lastDate = analysis.data[analysis.data.length - 1].date.split('T')[0];
        setDateFrom(firstDate);
        setDateTo(lastDate);
      }
    }
  }, [analysis, dateFrom, dateTo]);

  if (uniqueStocks.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">Loading stock data...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Create Plotly traces
  const plotlyTraces = analysis
    ? [
        // Candlestick trace
        {
          type: 'candlestick',
          x: analysis.data.map((d) => d.date),
          open: analysis.data.map((d) => d.open),
          high: analysis.data.map((d) => d.high),
          low: analysis.data.map((d) => d.low),
          close: analysis.data.map((d) => d.close),
          name: 'Price',
          hovertemplate: '<b>Open:</b> %{open:.2f} kr<br><b>High:</b> %{high:.2f} kr<br><b>Low:</b> %{low:.2f} kr<br><b>Close:</b> %{close:.2f} kr<extra></extra>',
          hoverinfo: 'text',
        },
        // Rolling low trace
        {
          type: 'scatter',
          mode: 'lines',
          x: analysis.data.map((d) => d.date),
          y: analysis.data.map((d) => d.rolling_low),
          name: 'Rolling Low',
          line: { color: 'blue', width: 2, dash: 'dash' },
          customdata: analysis.data.map((d) => d.last_break_date),
          hovertemplate: '<b>Rolling Low:</b> %{y:.2f} kr<br><b>Last Break:</b> %{customdata|%Y-%m-%d}<extra></extra>',
        },
        // Breaks trace
        {
          type: 'scatter',
          mode: 'markers',
          x: analysis.breaks.map((b) => b.date),
          y: analysis.breaks.map((b) => b.new_support),
          name: 'Support Broken',
          marker: { color: 'red', size: 10, symbol: 'circle' },
          text: analysis.breaks.map((b) => `Drop: ${b.drop_pct.toFixed(2)}%`),
          hovertemplate:
            '<b>%{x}</b><br>Support: %{y:.2f} kr<br>%{text}<extra></extra>',
        },
      ]
    : [];

  const plotlyLayout = {
    title: analysis ? `Support Breaks Timeline - ${selectedStock}` : 'Support Breaks Timeline',
    yaxis: {
      title: 'Price (kr)',
      autorange: true,
    },
    xaxis: {
      title: 'Date',
      type: 'date',
      rangeslider: { visible: false },
    },
    hovermode: 'x unified',
    height: 600,
    margin: { l: 50, r: 50, t: 80, b: 50 },
    dragmode: 'zoom',
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            📊 Support Level Analysis Dashboard
          </h1>
          <p className="text-muted-foreground">
            Analyze how well a stock's low is holding as support - tracking support breaks and clusters
          </p>
        </div>

        {/* Controls */}
        <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-700 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* Stock Select */}
            <div className="flex flex-col space-y-2">
              <Label htmlFor="stock-select" className="font-semibold">
                Select Stock
              </Label>
              <Select value={selectedStock} onValueChange={setSelectedStock}>
                <SelectTrigger id="stock-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {uniqueStocks.map((stock) => (
                    <SelectItem key={stock} value={stock}>
                      {stock}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date From */}
            <div className="flex flex-col space-y-2">
              <Label htmlFor="date-from" className="font-semibold">
                From Date
              </Label>
              <Input
                id="date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            {/* Date To */}
            <div className="flex flex-col space-y-2">
              <Label htmlFor="date-to" className="font-semibold">
                To Date
              </Label>
              <Input
                id="date-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>

            {/* Period */}
            <div className="flex flex-col space-y-2">
              <Label htmlFor="period-select" className="font-semibold">
                Rolling Low Period
              </Label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger id="period-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">1-Month (30 days)</SelectItem>
                  <SelectItem value="90">3-Month (90 days)</SelectItem>
                  <SelectItem value="180">6-Month (180 days)</SelectItem>
                  <SelectItem value="270">9-Month (270 days)</SelectItem>
                  <SelectItem value="365">1-Year (365 days)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Max Gap */}
            <div className="flex flex-col space-y-2">
              <Label htmlFor="max-gap" className="font-semibold">
                Max Days Between Breaks
              </Label>
              <Input
                id="max-gap"
                type="number"
                value={maxGap}
                onChange={(e) => setMaxGap(e.target.value)}
                min="1"
                max="90"
              />
            </div>
          </div>
        </div>

        {/* Chart */}
        {analysis && (
          <>
            <div className="w-full bg-white dark:bg-gray-950 p-4 rounded-lg border border-gray-200 dark:border-gray-800 mb-8 overflow-hidden">
              <Plot
                data={plotlyTraces}
                layout={plotlyLayout}
                config={{
                  responsive: true,
                  displayModeBar: true,
                  displaylogo: false,
                }}
                style={{ width: '100%', height: '600px' }}
              />
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm font-medium text-gray-600">Total Breaks</div>
                  <div className="text-2xl font-bold text-orange-700">
                    {analysis.breaks.length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm font-medium text-gray-600">Total Clusters</div>
                  <div className="text-2xl font-bold text-orange-700">
                    {analysis.clusters.length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm font-medium text-gray-600">
                    Avg Breaks per Cluster
                  </div>
                  <div className="text-2xl font-bold text-orange-700">
                    {analysis.clusters.length > 0
                      ? (analysis.breaks.length / analysis.clusters.length).toFixed(2)
                      : '0'}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm font-medium text-gray-600">
                    Multi-Break Clusters
                  </div>
                  <div className="text-2xl font-bold text-orange-700">
                    {analysis.clusters.filter((c) => c.num_breaks > 1).length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm font-medium text-gray-600">
                    Max Support Breaks
                  </div>
                  <div className="text-2xl font-bold text-orange-700">
                    {analysis.clusters.length > 0
                      ? Math.max(...analysis.clusters.map((c) => c.num_breaks))
                      : 0}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Cluster Distribution Chart */}
            {analysis.clusters.length > 0 && (
              <div className="w-full bg-white dark:bg-gray-950 p-4 rounded-lg border border-gray-200 dark:border-gray-800 mb-8 overflow-hidden">
                <Plot
                  data={[
                    {
                      x: Array.from(
                        { length: Math.max(...analysis.clusters.map((c) => c.num_breaks)) },
                        (_, i) => i + 1
                      ),
                      y: Array.from(
                        { length: Math.max(...analysis.clusters.map((c) => c.num_breaks)) },
                        (_, i) =>
                          analysis.clusters.filter((c) => c.num_breaks === i + 1).length
                      ),
                      type: 'bar',
                      marker: {
                        color: Array.from(
                          { length: Math.max(...analysis.clusters.map((c) => c.num_breaks)) },
                          (_, i) =>
                            i === 0 ? '#ffc107' : i === 1 ? '#ff9800' : i === 2 ? '#ff6f00' : '#e65100'
                        ),
                      },
                      hovertemplate: '<b>%{x} breaks</b><br>Count: %{y}<extra></extra>',
                    },
                  ]}
                  layout={{
                    title: 'Distribution of Cluster Sizes',
                    xaxis: { title: 'Number of Support Breaks in Cluster' },
                    yaxis: { title: 'Number of Clusters' },
                    height: 400,
                    margin: { l: 50, r: 50, t: 60, b: 50 },
                  }}
                  config={{ responsive: true, displayModeBar: false }}
                  style={{ width: '100%', height: '400px' }}
                />
              </div>
            )}

            {/* Cluster Details */}
            {analysis.clusters.length > 0 && (
              <div className="space-y-6 mb-8">
                <h2 className="text-2xl font-semibold">All Break Clusters</h2>
                {analysis.clusters.map((cluster) => {
                  const emoji = cluster.num_breaks > 1 ? '🔴' : '🟡';
                  const breakLabel = cluster.num_breaks === 1 ? 'break' : 'breaks';

                  return (
                    <Card key={cluster.id} className="border-l-4 border-l-orange-500">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">
                          {emoji} Cluster #{cluster.id}: {cluster.num_breaks} {breakLabel} (
                          {cluster.start_date} to {cluster.end_date})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                          <div className="bg-orange-50 p-3 rounded border border-orange-200">
                            <div className="text-xs text-gray-600 font-medium">Duration</div>
                            <div className="text-lg font-bold text-orange-700">
                              {cluster.duration_days} days
                            </div>
                          </div>
                          {cluster.avg_gap !== undefined && (
                            <div className="bg-orange-50 p-3 rounded border border-orange-200">
                              <div className="text-xs text-gray-600 font-medium">Avg Gap</div>
                              <div className="text-lg font-bold text-orange-700">
                                {cluster.avg_gap.toFixed(1)} days
                              </div>
                            </div>
                          )}
                          <div className="bg-orange-50 p-3 rounded border border-orange-200">
                            <div className="text-xs text-gray-600 font-medium">Total Drop</div>
                            <div className="text-lg font-bold text-orange-700">
                              {cluster.total_drop.toFixed(2)}%
                            </div>
                          </div>
                          <div className="bg-orange-50 p-3 rounded border border-orange-200">
                            <div className="text-xs text-gray-600 font-medium">Avg Drop per Break</div>
                            <div className="text-lg font-bold text-orange-700">
                              {cluster.avg_drop.toFixed(2)}%
                            </div>
                          </div>
                        </div>

                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-orange-50">
                                <TableHead className="text-orange-900">Date</TableHead>
                                <TableHead className="text-orange-900 text-right">
                                  Previous Support
                                </TableHead>
                                <TableHead className="text-orange-900 text-right">
                                  New Support
                                </TableHead>
                                <TableHead className="text-orange-900 text-right">Drop %</TableHead>
                                <TableHead className="text-orange-900">Days Since</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {cluster.breaks.map((brk, idx) => {
                                let daysSinceLastBreak = '-';
                                if (idx > 0) {
                                  const currentDate = new Date(brk.date);
                                  const prevDate = new Date(cluster.breaks[idx - 1].date);
                                  daysSinceLastBreak =
                                    Math.floor(
                                      (currentDate.getTime() - prevDate.getTime()) /
                                        (1000 * 60 * 60 * 24)
                                    ) + 'd';
                                }

                                return (
                                  <TableRow key={idx} className="hover:bg-orange-50">
                                    <TableCell className="font-medium">{brk.date}</TableCell>
                                    <TableCell className="text-right">
                                      {brk.prev_support.toFixed(2)} kr
                                    </TableCell>
                                    <TableCell className="text-right">
                                      {brk.new_support.toFixed(2)} kr
                                    </TableCell>
                                    <TableCell className="text-right font-semibold text-red-600">
                                      {brk.drop_pct.toFixed(2)}%
                                    </TableCell>
                                    <TableCell>{daysSinceLastBreak}</TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Statistics */}
            {analysis.stats && (
              <div className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">Support Break Statistics</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Total Breaks</h4>
                      <div className="text-2xl font-bold text-orange-700">
                        {analysis.stats.totalBreaks}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Days Since Last Break</h4>
                      <div className="text-2xl font-bold text-orange-700">
                        {analysis.stats.daysSinceLastBreak}d
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Stability</h4>
                      <div className="text-2xl font-bold text-orange-700">
                        {analysis.stats.stability.toFixed(1)}%
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Trading Days per Break</h4>
                      <div className="text-2xl font-bold text-orange-700">
                        {analysis.stats.tradingDaysPerBreak.toFixed(0)}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ConsecutiveBreaksAnalysis;
