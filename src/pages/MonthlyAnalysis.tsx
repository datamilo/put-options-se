import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useMonthlyStockData, MonthlyStockStats } from '@/hooks/useMonthlyStockData';
import { MonthlySeasonalityHeatmap } from '@/components/monthly/MonthlySeasonalityHeatmap';
import { MonthlyStatsTable } from '@/components/monthly/MonthlyStatsTable';
import { TimelinePerformanceChart } from '@/components/monthly/TimelinePerformanceChart';
import { ArrowLeft, TrendingUp, TrendingDown, BarChart3, Calendar, Check, ChevronsUpDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MONTH_NAMES = [
  'All Months', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const MonthlyAnalysis = () => {
  const navigate = useNavigate();
  const { monthlyData, monthlyStats, isLoading, error } = useMonthlyStockData();
  
  // Filter states
  const [selectedMonths, setSelectedMonths] = useState<number[]>([]); // Empty array = All months
  const [selectedStock, setSelectedStock] = useState('');
  const [stockDropdownOpen, setStockDropdownOpen] = useState(false);
  const [monthDropdownOpen, setMonthDropdownOpen] = useState(false);
  const [minHistory, setMinHistory] = useState([10]);
  const [topN, setTopN] = useState(50);
  

  // Get unique stock names for dropdown
  const availableStocks = useMemo(() => {
    const stocks = Array.from(new Set(monthlyStats.map(stat => stat.name)));
    return stocks.sort();
  }, [monthlyStats]);

  // Filtered data for charts and tables (respects month filter)
  const filteredStats = useMemo(() => {
    let filtered = monthlyStats;

    if (selectedMonths.length > 0) {
      filtered = filtered.filter(stat => selectedMonths.includes(stat.month));
    }

    if (selectedStock) {
      filtered = filtered.filter(stat => stat.name === selectedStock);
    }

    filtered = filtered.filter(stat => stat.number_of_months_available >= minHistory[0]);

    return filtered.slice(0, topN);
  }, [monthlyStats, selectedMonths, selectedStock, minHistory, topN]);

  // Heatmap data that respects filters but always shows all months per stock
  const heatmapData = useMemo(() => {
    let filtered = monthlyStats;

    // Filter by minimum history requirement
    filtered = filtered.filter(stat => stat.number_of_months_available >= minHistory[0]);

    // Filter by selected stock if any
    if (selectedStock) {
      filtered = filtered.filter(stat => stat.name === selectedStock);
    }

    return filtered;
  }, [monthlyStats, selectedStock, minHistory]);


  // KPI calculations
  const kpis = useMemo(() => {
    if (filteredStats.length === 0) return null;

    const avgPosReturnMonths = filteredStats.reduce((sum, stat) => sum + stat.pct_pos_return_months, 0) / filteredStats.length;
    const medianReturn = [...filteredStats].sort((a, b) => a.return_month_mean_pct_return_month - b.return_month_mean_pct_return_month)[Math.floor(filteredStats.length / 2)]?.return_month_mean_pct_return_month || 0;
    const stockCount = filteredStats.length;

    return {
      avgPosReturnMonths,
      medianReturn,
      stockCount
    };
  }, [filteredStats]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading monthly analysis data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Data</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => navigate('/')} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Main Page
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button onClick={() => navigate('/')} variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Options
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Monthly Stock Analysis</h1>
                <p className="text-muted-foreground">Historical seasonal patterns and performance metrics</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {selectedMonths.length === 0
                  ? 'All Months'
                  : selectedMonths.length === 1
                    ? MONTH_NAMES[selectedMonths[0]]
                    : `${selectedMonths.length} months selected`
                }
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters & Controls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Months</Label>
                <Popover open={monthDropdownOpen} onOpenChange={setMonthDropdownOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={monthDropdownOpen}
                      className="w-full justify-between"
                    >
                      {selectedMonths.length === 0
                        ? "All months..."
                        : selectedMonths.length === 1
                        ? MONTH_NAMES[selectedMonths[0]]
                        : `${selectedMonths.length} months selected`
                      }
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search months..." />
                      <CommandList>
                        <CommandEmpty>No month found.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            onSelect={() => {
                              setSelectedMonths([]);
                            }}
                          >
                            <Checkbox
                              checked={selectedMonths.length === 0}
                              className="mr-2"
                            />
                            All months
                          </CommandItem>
                          {MONTH_NAMES.slice(1).map((month, index) => {
                            const monthNumber = index + 1;
                            const isSelected = selectedMonths.includes(monthNumber);
                            return (
                              <CommandItem
                                key={monthNumber}
                                onSelect={() => {
                                  if (isSelected) {
                                    setSelectedMonths(prev => prev.filter(m => m !== monthNumber));
                                  } else {
                                    setSelectedMonths(prev => [...prev, monthNumber]);
                                  }
                                }}
                              >
                                <Checkbox
                                  checked={isSelected}
                                  className="mr-2"
                                />
                                {month}
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Select Stock</Label>
                <Popover open={stockDropdownOpen} onOpenChange={setStockDropdownOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={stockDropdownOpen}
                      className="w-full justify-between"
                    >
                      {selectedStock || "All stocks..."}
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
                            value=""
                            onSelect={() => {
                              setSelectedStock('');
                              setStockDropdownOpen(false);
                            }}
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${selectedStock === '' ? "opacity-100" : "opacity-0"}`}
                            />
                            All stocks
                          </CommandItem>
                          {availableStocks.map((stock) => (
                            <CommandItem
                              key={stock}
                              value={stock}
                              onSelect={(currentValue) => {
                                setSelectedStock(currentValue === selectedStock ? '' : currentValue);
                                setStockDropdownOpen(false);
                              }}
                            >
                              <Check
                                className={`mr-2 h-4 w-4 ${selectedStock === stock ? "opacity-100" : "opacity-0"}`}
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

              <div className="space-y-2">
                <Label>Min History (months): {minHistory[0]}</Label>
                <Slider
                  value={minHistory}
                  onValueChange={setMinHistory}
                  min={1}
                  max={50}
                  step={1}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label>Show Top N Stocks</Label>
                <Select value={topN.toString()} onValueChange={(value) => setTopN(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">Top 10</SelectItem>
                    <SelectItem value="25">Top 25</SelectItem>
                    <SelectItem value="50">Top 50</SelectItem>
                    <SelectItem value="100">Top 100</SelectItem>
                    <SelectItem value="200">Top 200</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>


        {/* Seasonality Heatmap */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Seasonality Heatmap</CardTitle>
            <p className="text-sm text-muted-foreground">
              Percentage of positive return months by stock and calendar month
            </p>
          </CardHeader>
          <CardContent>
            <MonthlySeasonalityHeatmap data={heatmapData} selectedMonths={selectedMonths} />
          </CardContent>
        </Card>

        {/* Timeline Performance Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Timeline Performance Chart</CardTitle>
            <p className="text-sm text-muted-foreground">
              Historical monthly returns over time - analyze when good/bad months occurred
            </p>
          </CardHeader>
          <CardContent>
            <TimelinePerformanceChart data={monthlyData} selectedStock={selectedStock} />
          </CardContent>
        </Card>

        {/* Interactive Table */}
        <Card>
          <CardHeader>
            <CardTitle>Detailed Statistics Table</CardTitle>
            <p className="text-sm text-muted-foreground">
              Complete monthly performance metrics for all stocks
            </p>
          </CardHeader>
          <CardContent>
            <MonthlyStatsTable data={monthlyStats} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};