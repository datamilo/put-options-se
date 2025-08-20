import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { OptionData } from "@/types/options";
import { OptionsTable } from "@/components/options/OptionsTable";
import { OptionsChart } from "@/components/options/OptionsChart";
import { OptionDetails } from "@/components/options/OptionDetails";
import { useOptionsData } from "@/hooks/useOptionsData";
import { useStockData } from "@/hooks/useStockData";
import { TimestampDisplay } from "@/components/TimestampDisplay";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { BarChart3, Table, FileSpreadsheet, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const Index = () => {
  console.log('🏠 Index component rendering');
  
  const navigate = useNavigate();
  const { data, isLoading, error, loadMockData } = useOptionsData();
  const { getStockSummary, getLowPriceForPeriod } = useStockData();
  const [selectedStocks, setSelectedStocks] = useState<string[]>([]);
  const [selectedExpiryDates, setSelectedExpiryDates] = useState<string[]>([]);
  const [strikeBelowPeriod, setStrikeBelowPeriod] = useState<number | null>(null);

  const timePeriodOptions = [
    { label: "1 Week Low", days: 7 },
    { label: "1 Month Low", days: 30 },
    { label: "3 Months Low", days: 90 },
    { label: "6 Months Low", days: 180 },
    { label: "9 Months Low", days: 270 },
    { label: "1 Year Low", days: 365 },
  ];

  // Auto-select the expiry date with most options when data changes
  useEffect(() => {
    if (data.length > 0 && selectedExpiryDates.length === 0) {
      // Group by expiry date and count occurrences
      const expiryDateCounts = data.reduce((acc, option) => {
        acc[option.ExpiryDate] = (acc[option.ExpiryDate] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Find the expiry date with the most options
      const mostPopularExpiryDate = Object.entries(expiryDateCounts)
        .reduce((max, [date, count]) => count > max.count ? { date, count } : max, { date: '', count: 0 })
        .date;

      if (mostPopularExpiryDate) {
        setSelectedExpiryDates([mostPopularExpiryDate]);
      }
    }
  }, [data, selectedExpiryDates.length]);
  
  const [stockSearch, setStockSearch] = useState("");
  const [expirySearch, setExpirySearch] = useState("");
  const [columnFilters, setColumnFilters] = useState<{field: string; type: 'text' | 'number'; textValue?: string; minValue?: number; maxValue?: number;}[]>([]);
  const [sortField, setSortField] = useState<keyof OptionData | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  const getFilteredStocks = () => {
    let filteredOptions = data;
    
    // Apply expiry date filter
    if (selectedExpiryDates.length > 0) {
      filteredOptions = filteredOptions.filter(option => selectedExpiryDates.includes(option.ExpiryDate));
    }
    
    // Apply strike below period filter
    if (strikeBelowPeriod !== null) {
      filteredOptions = filteredOptions.filter(option => {
        const lowPrice = getLowPriceForPeriod(option.StockName, strikeBelowPeriod);
        return lowPrice !== null && option.StrikePrice < lowPrice;
      });
    }
    
    const stocks = [...new Set(filteredOptions.map(option => option.StockName))];
    
    return stocks
      .filter(stock => stock.toLowerCase().includes(stockSearch.toLowerCase()))
      .sort();
  };

  const getFilteredExpiryDates = () => {
    let filteredOptions = data;
    
    // Apply stock filter
    if (selectedStocks.length > 0) {
      filteredOptions = filteredOptions.filter(option => selectedStocks.includes(option.StockName));
    }
    
    // Apply strike below period filter
    if (strikeBelowPeriod !== null) {
      filteredOptions = filteredOptions.filter(option => {
        const lowPrice = getLowPriceForPeriod(option.StockName, strikeBelowPeriod);
        return lowPrice !== null && option.StrikePrice < lowPrice;
      });
    }
    
    const dates = [...new Set(filteredOptions.map(option => option.ExpiryDate))];
    
    return dates
      .filter(date => date.toLowerCase().includes(expirySearch.toLowerCase()))
      .sort();
  };

  const filteredStocks = getFilteredStocks();
  const filteredExpiryDates = getFilteredExpiryDates();
  
  const filteredData = data.filter(option => {
    const matchesStock = selectedStocks.length === 0 || selectedStocks.includes(option.StockName);
    const matchesExpiry = selectedExpiryDates.length === 0 || selectedExpiryDates.includes(option.ExpiryDate);
    
    // Filter to only show options with strike price below selected period low if enabled
    if (strikeBelowPeriod !== null) {
      const lowPrice = getLowPriceForPeriod(option.StockName, strikeBelowPeriod);
      if (lowPrice === null || option.StrikePrice >= lowPrice) {
        return false;
      }
    }
    
    return matchesStock && matchesExpiry;
  });

  const handleLoadMockData = () => {
    loadMockData();
    toast.success("Mock data loaded");
  };

  const handleOptionClick = (option: OptionData) => {
    const optionId = encodeURIComponent(option.OptionName);
    navigate(`/option/${optionId}`);
  };

  const handleStockClick = (stockName: string) => {
    navigate(`/stock/${encodeURIComponent(stockName)}`);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div className="text-center flex-1 space-y-4">
          <h1 className="text-4xl font-bold">Put Options Data</h1>
          <TimestampDisplay />
        </div>
        <ThemeToggle />
      </div>

      {data.length === 0 ? (
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Loading Options Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">
                {error}
                <div className="mt-2 space-y-2">
                  <div className="text-center">
                    <Button onClick={handleLoadMockData} variant="outline" disabled={isLoading}>
                      Load Sample Data Instead
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {isLoading && (
              <div className="text-center text-sm text-muted-foreground">
                Loading...
              </div>
            )}

            {!isLoading && !error && (
              <div className="text-center text-sm text-muted-foreground">
                Loading...
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold">
                {data.length} Options Available
              </h2>
              <p className="text-muted-foreground">
                From {filteredStocks.length} different stocks
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              <div className="space-y-2">
                <Label>Quick Filters</Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="min-w-[200px] justify-between">
                      {strikeBelowPeriod === null 
                        ? 'Strike Below Period' 
                        : `✓ ${timePeriodOptions.find(opt => opt.days === strikeBelowPeriod)?.label}`}
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[200px]">
                    <DropdownMenuItem onClick={() => setStrikeBelowPeriod(null)}>
                      Clear Filter
                    </DropdownMenuItem>
                    {timePeriodOptions.map(option => (
                      <DropdownMenuItem 
                        key={option.days}
                        onClick={() => setStrikeBelowPeriod(option.days)}
                      >
                        {option.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <div className="space-y-2">
                <Label>Filter by Stock</Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="min-w-[200px] justify-between">
                      {selectedStocks.length === 0 ? 'All Stocks' : 
                       selectedStocks.length === 1 ? selectedStocks[0] : 
                       `${selectedStocks.length} stocks selected`}
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[200px] p-3 max-h-60 overflow-y-auto">
                    <div className="space-y-2">
                      <Input
                        placeholder="Search stocks..."
                        value={stockSearch}
                        onChange={(e) => setStockSearch(e.target.value.slice(0, 50))}
                        className="h-8"
                        maxLength={50}
                      />
                      <div className="flex items-center space-x-2 border-b pb-2">
                        <Checkbox
                          id="select-all-stocks"
                          checked={selectedStocks.length === filteredStocks.length && filteredStocks.length > 0}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedStocks(filteredStocks);
                            } else {
                              setSelectedStocks([]);
                            }
                          }}
                        />
                        <label htmlFor="select-all-stocks" className="text-sm cursor-pointer font-medium">
                          Select All
                        </label>
                      </div>
                      {filteredStocks.map(stock => (
                        <div key={stock} className="flex items-center space-x-2">
                          <Checkbox
                            id={`stock-${stock}`}
                            checked={selectedStocks.includes(stock)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedStocks(prev => [...prev, stock]);
                              } else {
                                setSelectedStocks(prev => prev.filter(s => s !== stock));
                              }
                            }}
                          />
                          <label htmlFor={`stock-${stock}`} className="text-sm cursor-pointer">
                            {stock}
                          </label>
                        </div>
                      ))}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="space-y-2">
                <Label>Filter by Expiry Date</Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="min-w-[200px] justify-between">
                      {selectedExpiryDates.length === 0 ? 'All Expiry Dates' : 
                       selectedExpiryDates.length === 1 ? selectedExpiryDates[0] : 
                       `${selectedExpiryDates.length} dates selected`}
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[200px] p-3 max-h-60 overflow-y-auto">
                    <div className="space-y-2">
                      <Input
                        placeholder="Search dates..."
                        value={expirySearch}
                        onChange={(e) => setExpirySearch(e.target.value.slice(0, 50))}
                        className="h-8"
                        maxLength={50}
                      />
                      <div className="flex items-center space-x-2 border-b pb-2">
                        <Checkbox
                          id="select-all-expiry"
                          checked={selectedExpiryDates.length === filteredExpiryDates.length && filteredExpiryDates.length > 0}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedExpiryDates(filteredExpiryDates);
                            } else {
                              setSelectedExpiryDates([]);
                            }
                          }}
                        />
                        <label htmlFor="select-all-expiry" className="text-sm cursor-pointer font-medium">
                          Select All
                        </label>
                      </div>
                      {filteredExpiryDates.map(date => (
                        <div key={date} className="flex items-center space-x-2">
                          <Checkbox
                            id={`expiry-${date}`}
                            checked={selectedExpiryDates.includes(date)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedExpiryDates(prev => [...prev, date]);
                              } else {
                                setSelectedExpiryDates(prev => prev.filter(d => d !== date));
                              }
                            }}
                          />
                          <label htmlFor={`expiry-${date}`} className="text-sm cursor-pointer">
                            {date}
                          </label>
                        </div>
                      ))}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          <Tabs defaultValue="table" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="table" className="flex items-center gap-2">
                <Table className="h-4 w-4" />
                Table View
              </TabsTrigger>
              <TabsTrigger value="charts" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Charts
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="table">
              <OptionsTable 
                data={filteredData} 
                onRowClick={handleOptionClick}
                onStockClick={handleStockClick}
                columnFilters={columnFilters}
                onColumnFiltersChange={setColumnFilters}
                sortField={sortField}
                sortDirection={sortDirection}
                onSortChange={(field, direction) => {
                  setSortField(field);
                  setSortDirection(direction);
                }}
              />
            </TabsContent>
            
            <TabsContent value="charts">
              <OptionsChart data={filteredData} />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};

export default Index;
