import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Check, ChevronsUpDown } from 'lucide-react';
import { VolatilityStats, VolatilityEventData } from '@/types/volatility';

interface VolatilityStatsChartProps {
  data: VolatilityStats[];
  rawData: VolatilityEventData[];
}

export const VolatilityStatsChart: React.FC<VolatilityStatsChartProps> = ({ data, rawData }) => {
  const [selectedStocks, setSelectedStocks] = useState<string[]>([]);
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>(['Bokslutskommuniké', 'Kvartalsrapport']);
  const [stockDropdownOpen, setStockDropdownOpen] = useState(false);
  const [eventTypeDropdownOpen, setEventTypeDropdownOpen] = useState(false);

  // Get unique stock names and event types
  const uniqueStocks = useMemo(() => {
    return Array.from(new Set(data.map(item => item.name))).sort();
  }, [data]);

  const uniqueEventTypes = useMemo(() => {
    return Array.from(new Set(rawData.map(item => item.type_of_event))).sort();
  }, [rawData]);

  // Filter and recalculate data based on selected stocks and event types
  const filteredData = useMemo(() => {
    // First filter raw data by event types
    let filteredRawData = rawData;
    if (selectedEventTypes.length > 0) {
      filteredRawData = filteredRawData.filter(item => selectedEventTypes.includes(item.type_of_event));
    }

    // Recalculate statistics for the filtered raw data
    const grouped = filteredRawData.reduce((acc, row) => {
      const key = row.name;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(row);
      return acc;
    }, {} as Record<string, VolatilityEventData[]>);

    const recalculatedStats: VolatilityStats[] = [];

    for (const [name, stockData] of Object.entries(grouped)) {
      const validChanges = stockData
        .map(d => d.close_price_pct_change_from_previous_day)
        .filter(change => !isNaN(change));

      if (validChanges.length === 0) continue;

      const count = validChanges.length;
      const mean_change = validChanges.reduce((sum, val) => sum + val, 0) / count;
      
      // Calculate median
      const sortedChanges = [...validChanges].sort((a, b) => a - b);
      const median_change = count % 2 === 0 
        ? (sortedChanges[count / 2 - 1] + sortedChanges[count / 2]) / 2
        : sortedChanges[Math.floor(count / 2)];

      // Calculate standard deviation
      const variance = validChanges.reduce((sum, val) => sum + Math.pow(val - mean_change, 2), 0) / count;
      const std_dev = Math.sqrt(variance);

      const min_change = Math.min(...validChanges);
      const max_change = Math.max(...validChanges);

      // Calculate percentiles
      const p05 = count > 0 ? sortedChanges[Math.floor(count * 0.05)] : NaN;
      const p95 = count > 0 ? sortedChanges[Math.floor(count * 0.95)] : NaN;

      const mean_abs_change = validChanges.reduce((sum, val) => sum + Math.abs(val), 0) / count;
      const negative_count = validChanges.filter(val => val < 0).length;
      const negative_rate = negative_count / count;

      const se_mean = std_dev / Math.sqrt(count);
      const ci95_low = mean_change - 1.96 * se_mean;
      const ci95_high = mean_change + 1.96 * se_mean;

      // Calculate volume change average
      const validVolumeChanges = stockData
        .map(d => d.volume_pct_change_from_previous_day)
        .filter(change => !isNaN(change));
      const avg_volume_pct_change = validVolumeChanges.length > 0 
        ? validVolumeChanges.reduce((sum, val) => sum + val, 0) / validVolumeChanges.length
        : 0;

      // Calculate intraday spread average (taking absolute value)
      const validSpreadChanges = stockData
        .map(d => Math.abs(d.pct_intraday_high_low_movement))
        .filter(change => !isNaN(change));
      const avg_intraday_spread_pct = validSpreadChanges.length > 0
        ? validSpreadChanges.reduce((sum, val) => sum + val, 0) / validSpreadChanges.length
        : 0;

      recalculatedStats.push({
        name,
        count,
        mean_change,
        median_change,
        std_dev,
        min_change,
        max_change,
        p05,
        p95,
        mean_abs_change,
        negative_count,
        negative_rate,
        se_mean,
        ci95_low,
        ci95_high,
        avg_volume_pct_change,
        avg_intraday_spread_pct
      });
    }

    // Sort by mean absolute change
    let filtered = recalculatedStats.sort((a, b) => b.mean_abs_change - a.mean_abs_change);
    
    // Filter by selected stocks
    if (selectedStocks.length > 0) {
      filtered = filtered.filter(item => selectedStocks.includes(item.name));
    }
    
    // Convert decimal values to percentages and prepare chart data
    return filtered.map(item => ({
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
  }, [rawData, selectedStocks, selectedEventTypes]);

  // Take top 20 for readability
  const topStocks = filteredData.slice(0, 20);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {typeof entry.value === 'number' ? `${entry.value.toFixed(2)}%` : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const handleStockToggle = (stock: string) => {
    setSelectedStocks(prev => 
      prev.includes(stock) 
        ? prev.filter(s => s !== stock)
        : [...prev, stock]
    );
  };

  const handleEventTypeToggle = (eventType: string) => {
    setSelectedEventTypes(prev => 
      prev.includes(eventType) 
        ? prev.filter(e => e !== eventType)
        : [...prev, eventType]
    );
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Stock Filter */}
        <div className="space-y-2">
          <Label>Filter Stocks</Label>
        <Popover open={stockDropdownOpen} onOpenChange={setStockDropdownOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={stockDropdownOpen}
              className="w-full justify-between"
            >
              {selectedStocks.length === 0 
                ? "All stocks" 
                : selectedStocks.length === 1 
                ? selectedStocks[0]
                : `${selectedStocks.length} stocks selected`
              }
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command>
              <CommandInput placeholder="Search stocks..." />
              <CommandList>
                <CommandEmpty>No stock found.</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    onSelect={() => {
                      setSelectedStocks([]);
                      setStockDropdownOpen(false);
                    }}
                  >
                    <Check
                      className={`mr-2 h-4 w-4 ${selectedStocks.length === 0 ? "opacity-100" : "opacity-0"}`}
                    />
                    All stocks
                  </CommandItem>
                  {uniqueStocks.map((stock) => (
                    <CommandItem
                      key={stock}
                      onSelect={() => handleStockToggle(stock)}
                    >
                      <Check
                        className={`mr-2 h-4 w-4 ${selectedStocks.includes(stock) ? "opacity-100" : "opacity-0"}`}
                      />
                      {stock}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        </div>

        {/* Event Type Filter */}
        <div className="space-y-2">
          <Label>Filter Event Types</Label>
          <Popover open={eventTypeDropdownOpen} onOpenChange={setEventTypeDropdownOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={eventTypeDropdownOpen}
                className="w-full justify-between"
              >
                {selectedEventTypes.length === 0 
                  ? "All event types" 
                  : selectedEventTypes.length === 1 
                  ? selectedEventTypes[0]
                  : `${selectedEventTypes.length} event types selected`
                }
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command>
                <CommandInput placeholder="Search event types..." />
                <CommandList>
                  <CommandEmpty>No event type found.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      onSelect={() => {
                        setSelectedEventTypes([]);
                        setEventTypeDropdownOpen(false);
                      }}
                    >
                      <Check
                        className={`mr-2 h-4 w-4 ${selectedEventTypes.length === 0 ? "opacity-100" : "opacity-0"}`}
                      />
                      All event types
                    </CommandItem>
                    {uniqueEventTypes.map((eventType) => (
                      <CommandItem
                        key={eventType}
                        onSelect={() => handleEventTypeToggle(eventType)}
                      >
                        <Check
                          className={`mr-2 h-4 w-4 ${selectedEventTypes.includes(eventType) ? "opacity-100" : "opacity-0"}`}
                        />
                        {eventType}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>

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