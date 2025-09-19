import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Check, ChevronsUpDown } from 'lucide-react';
import { VolatilityStats } from '@/types/volatility';

interface VolatilityStatsChartProps {
  data: VolatilityStats[];
}

export const VolatilityStatsChart: React.FC<VolatilityStatsChartProps> = ({ data }) => {
  const [selectedStocks, setSelectedStocks] = useState<string[]>([]);
  const [stockDropdownOpen, setStockDropdownOpen] = useState(false);

  // Get unique stock names
  const uniqueStocks = useMemo(() => {
    return Array.from(new Set(data.map(item => item.name))).sort();
  }, [data]);

  // Filter and prepare data based on selected stocks
  const filteredData = useMemo(() => {
    let filtered = data;
    if (selectedStocks.length > 0) {
      filtered = data.filter(item => selectedStocks.includes(item.name));
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
  }, [data, selectedStocks]);

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

  return (
    <div className="space-y-4">
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