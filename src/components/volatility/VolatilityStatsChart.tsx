import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VolatilityStats } from '@/types/volatility';

interface VolatilityStatsChartProps {
  data: VolatilityStats[];
}

export const VolatilityStatsChart: React.FC<VolatilityStatsChartProps> = ({ data }) => {
  // Prepare data for charts (top 20 for readability)
  const topStocks = data.slice(0, 20);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(3) : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Tabs defaultValue="volatility" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="volatility">Mean Volatility</TabsTrigger>
        <TabsTrigger value="confidence">Confidence Intervals</TabsTrigger>
        <TabsTrigger value="distribution">Distribution Metrics</TabsTrigger>
        <TabsTrigger value="scatter">Risk vs Return</TabsTrigger>
      </TabsList>

      <TabsContent value="volatility">
        <Card>
          <CardHeader>
            <CardTitle>Mean Absolute Price Change During Events</CardTitle>
            <p className="text-sm text-muted-foreground">
              Average absolute percentage change in closing price during corporate events (Top 20 stocks)
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
                <YAxis className="text-xs" />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="mean_abs_change" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="confidence">
        <Card>
          <CardHeader>
            <CardTitle>95% Confidence Intervals for Mean Returns</CardTitle>
            <p className="text-sm text-muted-foreground">
              Statistical confidence intervals showing the range of expected returns during events
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
                <YAxis className="text-xs" />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="ci95_low" fill="hsl(var(--destructive))" name="CI 95% Low" />
                <Bar dataKey="mean_change" fill="hsl(var(--primary))" name="Mean Change" />
                <Bar dataKey="ci95_high" fill="hsl(var(--secondary))" name="CI 95% High" />
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
                <YAxis className="text-xs" />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="p05" fill="hsl(var(--destructive))" name="5th Percentile" />
                <Bar dataKey="median_change" fill="hsl(var(--primary))" name="Median" />
                <Bar dataKey="p95" fill="hsl(var(--secondary))" name="95th Percentile" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="scatter">
        <Card>
          <CardHeader>
            <CardTitle>Volatility vs Average Intraday Spread</CardTitle>
            <p className="text-sm text-muted-foreground">
              Relationship between price volatility and intraday trading spreads during events
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <ScatterChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="mean_abs_change" 
                  name="Mean Absolute Change"
                  className="text-xs"
                />
                <YAxis 
                  dataKey="avg_intraday_spread_pct"
                  name="Avg Intraday Spread %"
                  className="text-xs"
                />
                <Tooltip content={<CustomTooltip />} />
                <Scatter fill="hsl(var(--primary))" />
              </ScatterChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};