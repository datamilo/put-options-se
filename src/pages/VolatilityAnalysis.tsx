import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { useVolatilityData } from '@/hooks/useVolatilityData';
import { VolatilityStatsChart } from '@/components/volatility/VolatilityStatsChart';
import { VolatilityDataTable } from '@/components/volatility/VolatilityDataTable';
import { ArrowLeft, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const VolatilityAnalysis = () => {
  const navigate = useNavigate();
  const { volatilityData, volatilityStats, isLoading, error } = useVolatilityData();

  // Unified stock filter state
  const [selectedStocks, setSelectedStocks] = useState<string[]>([]);
  const [stockDropdownOpen, setStockDropdownOpen] = useState(false);

  // Get unique stock names from the data
  const uniqueStocks = useMemo(() => {
    if (!volatilityData || volatilityData.length === 0) return [];
    return Array.from(new Set(volatilityData.map(item => item.name))).sort();
  }, [volatilityData]);

  // Filter data based on selected stocks
  const filteredVolatilityData = useMemo(() => {
    if (selectedStocks.length === 0) return volatilityData;
    return volatilityData.filter(item => selectedStocks.includes(item.name));
  }, [volatilityData, selectedStocks]);

  const filteredVolatilityStats = useMemo(() => {
    if (selectedStocks.length === 0) return volatilityStats;
    return volatilityStats.filter(item => selectedStocks.includes(item.name));
  }, [volatilityStats, selectedStocks]);

  const handleStockToggle = (stock: string) => {
    setSelectedStocks(prev =>
      prev.includes(stock)
        ? prev.filter(s => s !== stock)
        : [...prev, stock]
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading volatility analysis data...</p>
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

  // Calculate some summary statistics for display (using filtered data)
  const totalEvents = filteredVolatilityData.length;
  const avgVolatilityDecimal = filteredVolatilityStats.length > 0
    ? filteredVolatilityStats.reduce((sum, stat) => sum + stat.mean_abs_change, 0) / filteredVolatilityStats.length
    : 0;
  const avgVolatility = avgVolatilityDecimal * 100; // Convert to percentage
  const highVolatilityStocks = filteredVolatilityStats.filter(stat => stat.mean_abs_change > avgVolatilityDecimal).length;

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
                <h1 className="text-2xl font-bold">Financial Reporting Volatility</h1>
                <p className="text-muted-foreground">Stock price behavior during financial reporting days</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {totalEvents.toLocaleString('sv-SE')} events analyzed
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Events</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalEvents.toLocaleString('sv-SE')}</div>
              <p className="text-xs text-muted-foreground">
                Financial reports analyzed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Volatility</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgVolatility.toFixed(2)}%</div>
              <p className="text-xs text-muted-foreground">
                Mean absolute price change
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Volatility Stocks</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{highVolatilityStocks}</div>
              <p className="text-xs text-muted-foreground">
                Above average volatility
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Stock Filter */}
        <Card>
          <CardHeader>
            <CardTitle>Filter by Stock</CardTitle>
            <p className="text-sm text-muted-foreground">
              Select one or more stocks to analyze (default: all stocks)
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Stock Selection</Label>
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
          </CardContent>
        </Card>

        {/* Volatility Statistics Charts */}
        <Card>
          <CardHeader>
            <CardTitle>Volatility Statistics Visualization</CardTitle>
            <p className="text-sm text-muted-foreground">
              Interactive charts showing price volatility patterns during financial reporting days
            </p>
          </CardHeader>
          <CardContent>
            <VolatilityStatsChart data={filteredVolatilityStats} rawData={filteredVolatilityData} />
          </CardContent>
        </Card>

        {/* Event Data Table */}
        <Card>
          <CardHeader>
            <CardTitle>Event Data Details</CardTitle>
            <p className="text-sm text-muted-foreground">
              Complete event-by-event data with filtering and sorting capabilities
            </p>
          </CardHeader>
          <CardContent>
            <VolatilityDataTable data={filteredVolatilityData} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};