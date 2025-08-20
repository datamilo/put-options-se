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
  
  const formatTooltipValue = (value: number, name: string) => {
    if (name === 'close') {
      return [`$${value.toFixed(2)}`, 'Price'];
    }
    if (name === 'volume') {
      return [value.toLocaleString(), 'Volume'];
    }
    return [value, name];
  };

  const formatXAxisLabel = (tickItem: string) => {
    const date = new Date(tickItem);
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
                />
                <YAxis 
                  yAxisId="price"
                  orientation="left"
                  className="text-muted-foreground"
                />
                <YAxis 
                  yAxisId="volume"
                  orientation="right"
                  className="text-muted-foreground"
                />
                <Tooltip 
                  formatter={formatTooltipValue}
                  labelFormatter={(label) => new Date(label).toLocaleDateString()}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius)'
                  }}
                />
                <Legend />
                <Line
                  yAxisId="price"
                  type="monotone"
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
                />
                <YAxis className="text-muted-foreground" />
                <Tooltip 
                  formatter={formatTooltipValue}
                  labelFormatter={(label) => new Date(label).toLocaleDateString()}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius)'
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
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