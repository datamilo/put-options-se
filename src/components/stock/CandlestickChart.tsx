import { useState, useMemo, useEffect } from "react";
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
  Line,
  Scatter
} from "recharts";
import { useVolatilityData } from "@/hooks/useVolatilityData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Activity, BarChart3 } from "lucide-react";

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
  const [showVolume, setShowVolume] = useState<boolean>(false);
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const { volatilityData } = useVolatilityData();

  // Initialize default date values on component mount
  useEffect(() => {
    if (!dateFrom && !dateTo) {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      // Calculate 6 months back
      const sixMonthsBack = new Date(today.getFullYear(), today.getMonth() - 6, today.getDate());
      const sixMonthsBackStr = sixMonthsBack.toISOString().split('T')[0];

      setDateFrom(sixMonthsBackStr);
      setDateTo(todayStr);
    }
  }, []);

  // Filter data by both time range and custom date range
  const filteredData = useMemo(() => {
    let filtered = data;

    // Apply custom date filters if provided
    if (dateFrom || dateTo) {
      filtered = filtered.filter(d => {
        const recordDate = new Date(d.date);

        if (dateFrom && dateTo) {
          return recordDate >= new Date(dateFrom) && recordDate <= new Date(dateTo);
        } else if (dateFrom) {
          return recordDate >= new Date(dateFrom);
        } else if (dateTo) {
          return recordDate <= new Date(dateTo);
        }
        return true;
      });
    } else if (timeRange !== 'ALL') {
      // Apply preset time range only if no custom dates are set
      const now = new Date();
      const monthsBack = timeRange === '1M' ? 1 : timeRange === '3M' ? 3 : timeRange === '6M' ? 6 : 12;
      const cutoffDate = new Date(now.getFullYear(), now.getMonth() - monthsBack, now.getDate());
      filtered = filtered.filter(d => new Date(d.date) >= cutoffDate);
    }

    return filtered;
  }, [data, timeRange, dateFrom, dateTo]);

  // Filter earnings events for the selected stock and date range
  const earningsEvents = useMemo(() => {
    if (!stockName || !volatilityData.length) return [];

    // Filter volatility data for the selected stock
    const stockEvents = volatilityData.filter(
      (event) => event.name === stockName
    );

    // Match earnings dates with filtered price data
    return stockEvents
      .map((event) => {
        // Find the corresponding price data for this date
        const priceData = filteredData.find((d) => d.date === event.date);
        if (!priceData) return null;

        return {
          date: event.date,
          earningsMarker: priceData.high * 1.02, // Position marker 2% above the high
          type: event.type_of_event,
        };
      })
      .filter(Boolean);
  }, [stockName, volatilityData, filteredData]);

  // Merge earnings events into chart data
  const chartData = useMemo(() => {
    return filteredData.map((d) => {
      const earningsEvent = earningsEvents.find((e) => e.date === d.date);
      return {
        ...d,
        earningsMarker: earningsEvent ? earningsEvent.earningsMarker : null,
        earningsType: earningsEvent ? earningsEvent.type : null,
      };
    });
  }, [filteredData, earningsEvents]);

  // Handle preset button clicks - set dates instead of just timeRange
  const handlePresetRange = (range: '1M' | '3M' | '6M' | '1Y' | 'ALL') => {
    setTimeRange(range);

    if (range === 'ALL') {
      setDateFrom('');
      setDateTo('');
    } else {
      const now = new Date();
      const monthsBack = range === '1M' ? 1 : range === '3M' ? 3 : range === '6M' ? 6 : 12;
      const cutoffDate = new Date(now.getFullYear(), now.getMonth() - monthsBack, now.getDate());

      setDateFrom(cutoffDate.toISOString().split('T')[0]);
      setDateTo(now.toISOString().split('T')[0]);
    }
  };

  // Calculate dynamic Y-axis domain for better price visualization
  const getPriceDomain = () => {
    if (chartData.length === 0) return ['auto', 'auto'];

    const highs = chartData.map(d => d.high);
    const lows = chartData.map(d => d.low);

    // Include earnings markers in the domain calculation
    const earningsMarkers = chartData
      .map(d => d.earningsMarker)
      .filter(Boolean) as number[];

    const minPrice = Math.min(...lows);
    const maxPrice = Math.max(...highs, ...earningsMarkers);
    const padding = (maxPrice - minPrice) * 0.1; // 10% padding

    return [Math.max(0, minPrice - padding), maxPrice + padding];
  };

  // Enhanced date formatting logic
  const getXAxisTicks = () => {
    if (chartData.length === 0) return [];

    const sortedData = [...chartData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

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
          {data.earningsMarker && (
            <div className="mb-2 pb-2 border-b">
              <p className="flex items-center gap-2 text-sm font-semibold text-purple-600">
                <span>💎</span>
                <span>Earnings Event</span>
              </p>
              {data.earningsType && (
                <p className="text-xs text-muted-foreground ml-6">{data.earningsType}</p>
              )}
            </div>
          )}
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

  // Custom candlestick renderer using Bar component
  const renderCandlestick = (props: any) => {
    const { x, y, width, height, index } = props;
    const dataPoint = chartData[index];

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

        <div className="flex flex-wrap gap-4 items-end">
          {/* Preset time range buttons */}
          <div className="flex gap-1">
            {(['1M', '3M', '6M', '1Y', 'ALL'] as const).map(range => (
              <Button
                key={range}
                variant={timeRange === range && !dateFrom && !dateTo ? "default" : "outline"}
                size="sm"
                onClick={() => handlePresetRange(range)}
              >
                {range}
              </Button>
            ))}
          </div>

          {/* Custom date inputs */}
          <div className="flex gap-2 items-end">
            <div className="flex flex-col gap-1">
              <Label htmlFor="chart-date-from" className="text-xs font-semibold">
                From Date
              </Label>
              <Input
                id="chart-date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-8 text-sm"
              />
            </div>

            <div className="flex flex-col gap-1">
              <Label htmlFor="chart-date-to" className="text-xs font-semibold">
                To Date
              </Label>
              <Input
                id="chart-date-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
          </div>

          <Button
            variant={showVolume ? "default" : "outline"}
            size="sm"
            onClick={() => setShowVolume(!showVolume)}
          >
            <BarChart3 className="h-4 w-4 mr-1" />
            Volume
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
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
              {showVolume && (
                <YAxis
                  yAxisId="volume"
                  orientation="right"
                  className="text-muted-foreground"
                  tickFormatter={formatVolumeYAxisLabel}
                />
              )}
              <Tooltip content={<CustomTooltip />} />
              <Bar
                yAxisId="price"
                dataKey="high"
                shape={renderCandlestick}
                isAnimationActive={false}
              />
              {showVolume && (
                <Bar
                  yAxisId="volume"
                  dataKey="volume"
                  fill="hsl(var(--muted-foreground))"
                  fillOpacity={0.3}
                  name="Volume"
                />
              )}
              <Scatter
                yAxisId="price"
                dataKey="earningsMarker"
                fill="#9333EA"
                shape="diamond"
                name="Earnings"
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
