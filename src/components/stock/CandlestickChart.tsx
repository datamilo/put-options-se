import { useState } from "react";
import { StockData } from "@/types/stock";
import {
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Bar,
  Line
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity } from "lucide-react";

interface CandlestickChartProps {
  data: StockData[];
  stockName: string;
}

// Custom candlestick shape component
const Candlestick = (props: any) => {
  const { x, y, width, height, open, close, high, low, fill } = props;

  // Determine color based on open vs close
  const isPositive = close >= open;
  const color = isPositive ? "hsl(var(--chart-2))" : "hsl(var(--destructive))";

  // Calculate positions
  const bodyTop = Math.min(open, close);
  const bodyBottom = Math.max(open, close);
  const bodyHeight = Math.abs(close - open);

  // Calculate Y scale factor (assuming y represents the low value)
  const priceRange = high - low;
  const yScale = height / priceRange;

  // Calculate pixel positions
  const highY = y;
  const lowY = y + height;
  const bodyTopY = y + (high - Math.max(open, close)) * yScale;
  const bodyBottomY = y + (high - Math.min(open, close)) * yScale;
  const centerX = x + width / 2;

  return (
    <g>
      {/* High-Low line (wick) */}
      <line
        x1={centerX}
        y1={highY}
        x2={centerX}
        y2={lowY}
        stroke={color}
        strokeWidth={1}
      />
      {/* Body rectangle */}
      <rect
        x={x}
        y={bodyTopY}
        width={width}
        height={Math.max(bodyBottomY - bodyTopY, 1)}
        fill={color}
        stroke={color}
        strokeWidth={1}
      />
    </g>
  );
};

// Transform data for candlestick rendering
const transformDataForCandlestick = (data: StockData[]) => {
  return data.map(d => ({
    ...d,
    // For rendering purposes, we'll use the range
    range: [d.low, d.high],
    body: [Math.min(d.open, d.close), Math.max(d.open, d.close)]
  }));
};

export const CandlestickChart = ({ data, stockName }: CandlestickChartProps) => {
  const [timeRange, setTimeRange] = useState<'1M' | '3M' | '6M' | '1Y' | 'ALL'>('6M');

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
    if (filteredData.length === 0) return ['auto', 'auto'];

    const highs = filteredData.map(d => d.high);
    const lows = filteredData.map(d => d.low);

    const minPrice = Math.min(...lows);
    const maxPrice = Math.max(...highs);
    const padding = (maxPrice - minPrice) * 0.1; // 10% padding

    return [Math.max(0, minPrice - padding), maxPrice + padding];
  };

  // Enhanced date formatting logic
  const getXAxisTicks = () => {
    if (filteredData.length === 0) return [];

    const sortedData = [...filteredData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let tickData = [];

    if (timeRange === '1M') {
      // Show every 5 days for 1 month
      tickData = sortedData.filter((_, index) => index % 5 === 0);
    } else if (timeRange === '3M') {
      // Show every 2 weeks for 3 months
      tickData = sortedData.filter((_, index) => index % 14 === 0);
    } else if (timeRange === '6M') {
      // Show monthly
      const latestDate = new Date(sortedData[sortedData.length - 1].date);
      const dayOfMonth = latestDate.getDate();
      tickData = sortedData.filter(d => {
        const date = new Date(d.date);
        return date.getDate() === dayOfMonth || Math.abs(date.getDate() - dayOfMonth) <= 2;
      });
    } else if (timeRange === '1Y') {
      // Show monthly
      const latestDate = new Date(sortedData[sortedData.length - 1].date);
      const dayOfMonth = latestDate.getDate();
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

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isPositive = data.close >= data.open;

      return (
        <div className="bg-card border rounded-lg p-3 shadow-lg">
          <p className="font-semibold mb-2">{new Date(data.date).toLocaleDateString()}</p>
          <div className="space-y-1 text-sm">
            <p className="flex justify-between gap-4">
              <span className="text-muted-foreground">Open:</span>
              <span className="font-medium">{data.open.toFixed(2)}</span>
            </p>
            <p className="flex justify-between gap-4">
              <span className="text-muted-foreground">High:</span>
              <span className="font-medium">{data.high.toFixed(2)}</span>
            </p>
            <p className="flex justify-between gap-4">
              <span className="text-muted-foreground">Low:</span>
              <span className="font-medium">{data.low.toFixed(2)}</span>
            </p>
            <p className="flex justify-between gap-4">
              <span className="text-muted-foreground">Close:</span>
              <span className={`font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {data.close.toFixed(2)}
              </span>
            </p>
            <p className="flex justify-between gap-4">
              <span className="text-muted-foreground">Volume:</span>
              <span className="font-medium">{data.volume.toLocaleString('sv-SE')}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const formatYAxisLabel = (value: number) => {
    return value.toFixed(2);
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

  // Custom candlestick renderer using Bar component
  const renderCandlestick = (props: any) => {
    const { x, y, width, height, index } = props;
    const dataPoint = filteredData[index];

    if (!dataPoint) return null;

    const isPositive = dataPoint.close >= dataPoint.open;
    const color = isPositive ? "hsl(142, 76%, 36%)" : "hsl(0, 84%, 60%)";

    // Calculate the range for the candlestick
    const [minVal, maxVal] = getPriceDomain() as number[];
    const range = maxVal - minVal;
    const scale = height / range;

    // Calculate pixel positions
    const highPx = y + (maxVal - dataPoint.high) * scale;
    const lowPx = y + (maxVal - dataPoint.low) * scale;
    const openPx = y + (maxVal - dataPoint.open) * scale;
    const closePx = y + (maxVal - dataPoint.close) * scale;

    const bodyTop = Math.min(openPx, closePx);
    const bodyBottom = Math.max(openPx, closePx);
    const bodyHeight = Math.max(bodyBottom - bodyTop, 1);

    const centerX = x + width / 2;

    return (
      <g key={`candlestick-${index}`}>
        {/* High-Low line (wick) */}
        <line
          x1={centerX}
          y1={highPx}
          x2={centerX}
          y2={lowPx}
          stroke={color}
          strokeWidth={1}
        />
        {/* Body rectangle */}
        <rect
          x={x + width * 0.2}
          y={bodyTop}
          width={width * 0.6}
          height={bodyHeight}
          fill={color}
          stroke={color}
          strokeWidth={1}
        />
      </g>
    );
  };

  return (
    <Card>
      <CardHeader className="space-y-4">
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          {stockName} Candlestick Chart
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
        </div>
      </CardHeader>

      <CardContent>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={filteredData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="date"
                tickFormatter={formatXAxisLabel}
                className="text-muted-foreground"
                ticks={getXAxisTicks()}
              />
              <YAxis
                className="text-muted-foreground"
                domain={getPriceDomain()}
                tickFormatter={formatYAxisLabel}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="high"
                shape={renderCandlestick}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
