import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VolatilityStats, VolatilityEventData } from '@/types/volatility';

interface VolatilityStatsChartProps {
  data: VolatilityStats[];
  rawData: VolatilityEventData[];
}

export const VolatilityStatsChart: React.FC<VolatilityStatsChartProps> = ({ data, rawData }) => {
  // Convert data to percentages and prepare for display
  const chartData = useMemo(() => {
    return data
      .sort((a, b) => b.mean_abs_change - a.mean_abs_change)
      .map(item => ({
        ...item,
        mean_abs_change: item.mean_abs_change * 100,
        mean_change: item.mean_change * 100,
        median_change: item.median_change * 100,
        ci95_low: item.ci95_low * 100,
        ci95_high: item.ci95_high * 100,
        p05: item.p05 * 100,
        p95: item.p95 * 100,
        min_change: item.min_change * 100,
        max_change: item.max_change * 100,
        avg_volume_pct_change: item.avg_volume_pct_change * 100,
        avg_intraday_spread_pct: Math.abs(item.avg_intraday_spread_pct) * 100
      }));
  }, [data]);

  // Take top 20 for readability
  const topStocks = chartData.slice(0, 20);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const stockData = chartData.find(item => item.name === label);
      
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index}>
              <p style={{ color: entry.color }}>
                {entry.name}: {typeof entry.value === 'number' ? `${entry.value.toFixed(2)}%` : entry.value}
              </p>
              {stockData && entry.dataKey === 'min_change' && (
                <p className="text-xs text-muted-foreground">
                  Event: {stockData.min_event_type} on {stockData.min_event_date}
                </p>
              )}
              {stockData && entry.dataKey === 'max_change' && (
                <p className="text-xs text-muted-foreground">
                  Event: {stockData.max_event_type} on {stockData.max_event_date}
                </p>
              )}
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="volatility" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="volatility">Mean Volatility</TabsTrigger>
          <TabsTrigger value="distribution">Distribution Metrics</TabsTrigger>
          <TabsTrigger value="minmax">Min/Max Changes</TabsTrigger>
        </TabsList>

      <TabsContent value="volatility">
        <Card>
          <CardHeader>
            <CardTitle>Mean Absolute Price Change During Events</CardTitle>
            <p className="text-sm text-muted-foreground">
              Average absolute percentage change in closing price during corporate events
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={topStocks} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end" 
                  height={100}
                  className="text-xs"
                />
                <YAxis className="text-xs" label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="mean_abs_change" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="distribution">
        <Card>
          <CardHeader>
            <CardTitle>Price Change Distribution Metrics</CardTitle>
            <p className="text-sm text-muted-foreground">
              Statistical distribution of price changes: 5th percentile, median, and 95th percentile
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={topStocks} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end" 
                  height={100}
                  className="text-xs"
                />
                <YAxis className="text-xs" label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="p05" fill="hsl(var(--destructive))" name="5th Percentile" />
                <Bar dataKey="median_change" fill="hsl(var(--primary))" name="Median" />
                <Bar dataKey="p95" fill="hsl(220, 70%, 40%)" name="95th Percentile" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="minmax">
        <Card>
          <CardHeader>
            <CardTitle>Min/Max Price Changes During Events</CardTitle>
            <p className="text-sm text-muted-foreground">
              Largest positive and negative percentage changes observed for each stock during events
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={topStocks} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end" 
                  height={100}
                  className="text-xs"
                />
                <YAxis className="text-xs" label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="min_change" fill="hsl(var(--destructive))" name="Min Change" />
                <Bar dataKey="max_change" fill="hsl(220, 70%, 40%)" name="Max Change" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </TabsContent>
      </Tabs>
    </div>
  );
};