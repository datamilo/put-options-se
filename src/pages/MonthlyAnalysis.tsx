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
import { useMonthlyStockData, MonthlyStockStats } from '@/hooks/useMonthlyStockData';
import { MonthlySeasonalityHeatmap } from '@/components/monthly/MonthlySeasonalityHeatmap';
import { TopRankingChart } from '@/components/monthly/TopRankingChart';
import { RiskReturnScatter } from '@/components/monthly/RiskReturnScatter';
import { MonthlyStatsTable } from '@/components/monthly/MonthlyStatsTable';
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
  const [selectedMonth, setSelectedMonth] = useState(0); // 0 = All months
  const [selectedStock, setSelectedStock] = useState('');
  const [stockDropdownOpen, setStockDropdownOpen] = useState(false);
  const [minHistory, setMinHistory] = useState([3]);
  const [topN, setTopN] = useState(50);
  const [selectedMetric, setSelectedMetric] = useState<'pct_pos_return_months' | 'return_month_mean_pct_return_month' | 'top_5_accumulated_score'>('pct_pos_return_months');

  // Get unique stock names for dropdown
  const availableStocks = useMemo(() => {
    const stocks = Array.from(new Set(monthlyStats.map(stat => stat.name)));
    return stocks.sort();
  }, [monthlyStats]);

  // Filtered data for charts and tables (respects month filter)
  const filteredStats = useMemo(() => {
    let filtered = monthlyStats;

    if (selectedMonth > 0) {
      filtered = filtered.filter(stat => stat.month === selectedMonth);
    }

    if (selectedStock) {
      filtered = filtered.filter(stat => stat.name === selectedStock);
    }

    filtered = filtered.filter(stat => stat.number_of_months_available >= minHistory[0]);

    return filtered.slice(0, topN);
  }, [monthlyStats, selectedMonth, selectedStock, minHistory, topN]);

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

  // Aggregated data for charts that need stock-level summaries
  const aggregatedStockData = useMemo(() => {
    const stockMap = new Map<string, {
      name: string;
      totalScore: number;
      avgReturn: number;
      avgPosMonths: number;
      avgDrawdown: number;
      minDrawdown: number;
      maxDrawdown: number;
      totalMonths: number;
      totalPosMonths: number;
      monthCount: number;
    }>();

    monthlyStats.forEach(stat => {
      if (stat.number_of_months_available < minHistory[0]) return;
      
      if (!stockMap.has(stat.name)) {
        stockMap.set(stat.name, {
          name: stat.name,
          totalScore: 0,
          avgReturn: 0,
          avgPosMonths: 0,
          avgDrawdown: 0,
          minDrawdown: 0,
          maxDrawdown: 0,
          totalMonths: 0,
          totalPosMonths: 0,
          monthCount: 0
        });
      }
      
      const stock = stockMap.get(stat.name)!;
      stock.totalScore = Math.max(stock.totalScore, stat.top_5_accumulated_score);
      stock.avgReturn += stat.return_month_mean_pct_return_month;
      stock.avgPosMonths += stat.pct_pos_return_months;
      stock.avgDrawdown += stat.open_to_low_mean_pct_return_month;
      stock.minDrawdown = Math.min(stock.minDrawdown, stat.open_to_low_min_pct_return_month);
      stock.maxDrawdown = Math.max(stock.maxDrawdown, stat.open_to_low_max_pct_return_month);
      stock.totalMonths += stat.number_of_months_available;
      stock.totalPosMonths += stat.number_of_months_positive_return;
      stock.monthCount++;
    });

    // Calculate averages and create proper MonthlyStockStats objects
    const result: MonthlyStockStats[] = Array.from(stockMap.values()).map(stock => ({
      name: stock.name,
      month: 0, // Indicates aggregated data
      number_of_months_available: Math.round(stock.totalMonths / stock.monthCount),
      number_of_months_positive_return: Math.round(stock.totalPosMonths / stock.monthCount),
      pct_pos_return_months: stock.avgPosMonths / stock.monthCount,
      return_month_mean_pct_return_month: stock.avgReturn / stock.monthCount,
      open_to_low_mean_pct_return_month: stock.avgDrawdown / stock.monthCount,
      open_to_low_min_pct_return_month: stock.minDrawdown,
      open_to_low_max_pct_return_month: stock.maxDrawdown,
      top_5_accumulated_score: stock.totalScore
    }));

    return selectedStock 
      ? result.filter(stock => stock.name === selectedStock)
      : result.sort((a, b) => b.top_5_accumulated_score - a.top_5_accumulated_score).slice(0, 50);
  }, [monthlyStats, minHistory, selectedStock]);

  // KPI calculations
  const kpis = useMemo(() => {
    if (filteredStats.length === 0) return null;

    const avgPosReturnMonths = filteredStats.reduce((sum, stat) => sum + stat.pct_pos_return_months, 0) / filteredStats.length;
    const medianReturn = [...filteredStats].sort((a, b) => a.return_month_mean_pct_return_month - b.return_month_mean_pct_return_month)[Math.floor(filteredStats.length / 2)]?.return_month_mean_pct_return_month || 0;
    const stockCount = filteredStats.length;
    const avgScore = filteredStats.reduce((sum, stat) => sum + stat.top_5_accumulated_score, 0) / filteredStats.length;

    return {
      avgPosReturnMonths,
      medianReturn,
      stockCount,
      avgScore
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
                {selectedMonth === 0 ? 'All Months' : MONTH_NAMES[selectedMonth]}
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
                <Label>Month</Label>
                <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTH_NAMES.map((month, index) => (
                      <SelectItem key={index} value={index.toString()}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

        {/* KPIs */}
        {kpis && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Avg Positive Months</p>
                    <p className="text-2xl font-bold">{kpis.avgPosReturnMonths.toFixed(1)}%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Median Return</p>
                    <p className="text-2xl font-bold">{kpis.medianReturn.toFixed(2)}%</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Stocks in View</p>
                    <p className="text-2xl font-bold">{kpis.stockCount}</p>
                  </div>
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    {kpis.stockCount}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Avg Score</p>
                    <p className="text-2xl font-bold">{kpis.avgScore.toFixed(1)}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Seasonality Heatmap */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Monthly Seasonality Heatmap
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                        <path d="M12 17h.01"/>
                      </svg>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-3">
                      <h4 className="font-medium">How is the Score calculated?</h4>
                      <div className="text-sm text-muted-foreground space-y-2">
                        <p>The Score represents accumulated ranking points across all months based on three key metrics:</p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                          <li><strong>% Positive Months:</strong> Percentage of months with positive returns</li>
                          <li><strong>Average Return:</strong> Mean monthly return percentage</li>
                          <li><strong>Downside Protection:</strong> Average decline from open to low (higher is better)</li>
                        </ul>
                        <p>For each month, stocks are ranked on these metrics. Top 5 performers get points: 1st place = 5 points, 2nd = 4 points, etc. The Score is the sum of all points earned across months.</p>
                        <p className="text-xs italic">Note: Only stocks with at least 3 months of data are ranked to ensure reliability.</p>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Percentage of positive return months by stock and calendar month
              </p>
            </CardHeader>
            <CardContent>
              <MonthlySeasonalityHeatmap data={heatmapData} selectedMonth={selectedMonth} />
            </CardContent>
          </Card>

          {/* Top Ranking Chart */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Top Performers</CardTitle>
                <Select value={selectedMetric} onValueChange={(value: any) => setSelectedMetric(value)}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pct_pos_return_months">Positive Months %</SelectItem>
                    <SelectItem value="return_month_mean_pct_return_month">Avg Return</SelectItem>
                    <SelectItem value="top_5_accumulated_score">Score</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <TopRankingChart 
                data={selectedMonth === 0 ? aggregatedStockData : filteredStats} 
                metric={selectedMetric}
                month={selectedMonth}
              />
            </CardContent>
          </Card>

          {/* Risk Return Scatter */}
          <Card>
            <CardHeader>
              <CardTitle>Risk vs Return Analysis</CardTitle>
              <p className="text-sm text-muted-foreground">
                Average monthly return vs typical drawdown
              </p>
            </CardHeader>
            <CardContent>
              <RiskReturnScatter data={aggregatedStockData} />
            </CardContent>
          </Card>
        </div>

        {/* Interactive Table */}
        <Card>
          <CardHeader>
            <CardTitle>Detailed Statistics Table</CardTitle>
            <p className="text-sm text-muted-foreground">
              Complete monthly performance metrics for all filtered stocks
            </p>
          </CardHeader>
          <CardContent>
            <MonthlyStatsTable data={filteredStats} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};