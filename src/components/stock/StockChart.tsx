import { useState } from "react";
import { StockData } from "@/types/stock";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ComposedChart,
  Bar
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, BarChart3, Activity } from "lucide-react";

interface StockChartProps {
  data: StockData[];
  stockName: string;
}

export const StockChart = ({ data, stockName }: StockChartProps) => {
  const [timeRange, setTimeRange] = useState<'1M' | '3M' | '6M' | '1Y' | 'ALL'>('6M');
  const [chartType, setChartType] = useState<'price' | 'volume' | 'both'>('price');

  const getFilteredData = () => {
    if (timeRange === 'ALL') return data;
    
    const now = new Date();
    const monthsBack = timeRange === '1M' ? 1 : timeRange === '3M' ? 3 : timeRange === '6M' ? 6 : 12;
    const cutoffDate = new Date(now.getFullYear(), now.getMonth() - monthsBack, now.getDate());
    
    return data.filter(d => new Date(d.date) >= cutoffDate);
  };

  const filteredData = getFilteredData();
  
  // Calculate dynamic Y-axis domain for better price visualization
  const getPriceDomain = () => {
    if (chartType === 'volume') return ['auto', 'auto'];
    
    const prices = filteredData.map(d => d.close);
    if (prices.length === 0) return ['auto', 'auto'];
    
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const padding = (maxPrice - minPrice) * 0.1; // 10% padding
    
    return [Math.max(0, minPrice - padding), maxPrice + padding];
  };

  // Enhanced date formatting logic
  const getXAxisTicks = () => {
    if (filteredData.length === 0) return [];
    
    const sortedData = [...filteredData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const latestDate = new Date(sortedData[sortedData.length - 1].date);
    const dayOfMonth = latestDate.getDate();
    
    let tickData = [];
    
    if (timeRange === '1M') {
      // Show every 5 days for 1 month
      tickData = sortedData.filter((_, index) => index % 5 === 0);
    } else if (timeRange === '3M') {
      // Show every 2 weeks for 3 months
      tickData = sortedData.filter((_, index) => index % 14 === 0);
    } else if (timeRange === '6M') {
      // Show monthly, same day as latest
      tickData = sortedData.filter(d => {
        const date = new Date(d.date);
        return date.getDate() === dayOfMonth || Math.abs(date.getDate() - dayOfMonth) <= 2;
      });
    } else if (timeRange === '1Y') {
      // Show monthly, same day as latest
      tickData = sortedData.filter(d => {
        const date = new Date(d.date);
        return date.getDate() === dayOfMonth || Math.abs(date.getDate() - dayOfMonth) <= 2;
      });
    } else {
      // ALL - show every 6 months approximately
      const totalPoints = sortedData.length;
      const interval = Math.max(1, Math.floor(totalPoints / 8));
      tickData = sortedData.filter((_, index) => index % interval === 0);
    }
    
    return tickData.map(d => d.date);
  };
  
  const formatTooltipValue = (value: number, name: string) => {
    if (name === 'close') {
      return [`${value.toFixed(2)}`, 'Price'];
    }
    if (name === 'volume') {
      return [value.toLocaleString('sv-SE'), 'Volume'];
    }
    return [value, name];
  };

  const formatYAxisLabel = (value: number) => {
    return value.toFixed(2);
  };

  const formatVolumeYAxisLabel = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }
    return value.toString();
  };

  const formatXAxisLabel = (tickItem: string) => {
    const date = new Date(tickItem);
    if (timeRange === '1Y' || timeRange === 'ALL') {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        year: '2-digit'
      });
    }
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <Card>
      <CardHeader className="space-y-4">
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          {stockName} Stock Price Chart
        </CardTitle>
        
        <div className="flex flex-wrap gap-2">
          <div className="flex gap-1">
            {(['1M', '3M', '6M', '1Y', 'ALL'] as const).map(range => (
              <Button
                key={range}
                variant={timeRange === range ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeRange(range)}
              >
                {range}
              </Button>
            ))}
          </div>
          
          <div className="flex gap-1">
            <Button
              variant={chartType === 'price' ? "default" : "outline"}
              size="sm"
              onClick={() => setChartType('price')}
            >
              <TrendingUp className="h-4 w-4 mr-1" />
              Price
            </Button>
            <Button
              variant={chartType === 'volume' ? "default" : "outline"}
              size="sm"
              onClick={() => setChartType('volume')}
            >
              <BarChart3 className="h-4 w-4 mr-1" />
              Volume
            </Button>
            <Button
              variant={chartType === 'both' ? "default" : "outline"}
              size="sm"
              onClick={() => setChartType('both')}
            >
              Both
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'both' ? (
              <ComposedChart data={filteredData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatXAxisLabel}
                  className="text-muted-foreground"
                  ticks={getXAxisTicks()}
                />
                <YAxis 
                  yAxisId="price"
                  orientation="left"
                  className="text-muted-foreground"
                  domain={getPriceDomain()}
                  tickFormatter={formatYAxisLabel}
                />
                <YAxis 
                  yAxisId="volume"
                  orientation="right"
                  className="text-muted-foreground"
                  tickFormatter={formatVolumeYAxisLabel}
                />
                <Tooltip 
                  formatter={formatTooltipValue}
                  labelFormatter={(label) => new Date(label).toISOString().split('T')[0]}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius)'
                  }}
                />
                <Legend />
                <Line
                  yAxisId="price"
                  dataKey="close"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                  name="Price"
                />
                <Bar
                  yAxisId="volume"
                  dataKey="volume"
                  fill="hsl(var(--muted-foreground))"
                  fillOpacity={0.3}
                  name="Volume"
                />
              </ComposedChart>
            ) : (
              <LineChart data={filteredData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatXAxisLabel}
                  className="text-muted-foreground"
                  ticks={getXAxisTicks()}
                />
                <YAxis 
                  className="text-muted-foreground" 
                  domain={chartType === 'price' ? getPriceDomain() : ['auto', 'auto']}
                  tickFormatter={chartType === 'price' ? formatYAxisLabel : formatVolumeYAxisLabel}
                />
                <Tooltip 
                  formatter={formatTooltipValue}
                  labelFormatter={(label) => new Date(label).toISOString().split('T')[0]}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius)'
                  }}
                />
                <Legend />
                <Line
                  dataKey={chartType === 'price' ? 'close' : 'volume'}
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                  name={chartType === 'price' ? 'Price' : 'Volume'}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};