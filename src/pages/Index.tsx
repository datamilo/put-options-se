import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { OptionData } from "@/types/options";
import { OptionsTable } from "@/components/options/OptionsTable";
import { OptionsChart } from "@/components/options/OptionsChart";
import { OptionDetails } from "@/components/options/OptionDetails";
import { useEnrichedOptionsData } from "@/hooks/useEnrichedOptionsData";
import { useStockData } from "@/hooks/useStockData";
import { TimestampDisplay } from "@/components/TimestampDisplay";
import { SettingsModal } from "@/components/SettingsModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { BarChart3, Table, FileSpreadsheet, ChevronDown, Info, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const Index = () => {
  console.log('🏠 Index component rendering');
  
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Use enriched data directly - it already includes recalculated options
  const { data, isLoading, error, loadMockData } = useEnrichedOptionsData();
  const { getStockSummary, getLowPriceForPeriod } = useStockData();
  
  // Initialize filter state from URL parameters
  const [selectedStocks, setSelectedStocks] = useState<string[]>(() => {
    const stocks = searchParams.get('stocks');
    if (!stocks) return [];
    
    // Use URL encoding to handle stock names with commas
    try {
      const decodedStocks = decodeURIComponent(stocks);
      const result = JSON.parse(decodedStocks);
      return Array.isArray(result) ? result : [];
    } catch {
      // Fallback to comma split for backward compatibility
      return stocks.split(',').filter(Boolean);
    }
  });
  const [selectedExpiryDates, setSelectedExpiryDates] = useState<string[]>(() => {
    const dates = searchParams.get('expiryDates');
    if (!dates) return [];
    
    try {
      const decodedDates = decodeURIComponent(dates);
      const result = JSON.parse(decodedDates);
      return Array.isArray(result) ? result : [];
    } catch {
      // Fallback to comma split for backward compatibility
      return dates.split(',').filter(Boolean);
    }
  });
  const [strikeBelowPeriod, setStrikeBelowPeriod] = useState<number | null>(() => {
    const period = searchParams.get('strikeBelowPeriod');
    return period ? parseInt(period, 10) : null;
  });
  const [selectedRiskLevels, setSelectedRiskLevels] = useState<string[]>(() => {
    const riskLevels = searchParams.get('riskLevels');
    if (!riskLevels) return [];
    
    try {
      const decodedRiskLevels = decodeURIComponent(riskLevels);
      const result = JSON.parse(decodedRiskLevels);
      return Array.isArray(result) ? result : [];
    } catch {
      // Fallback to comma split for backward compatibility
      return riskLevels.split(',').filter(Boolean);
    }
  });
  const [sortField, setSortField] = useState<keyof OptionData | null>(() => {
    const field = searchParams.get('sortField');
    return field as keyof OptionData || null;
  });
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(() => {
    const direction = searchParams.get('sortDirection');
    return (direction === 'desc' ? 'desc' : 'asc');
  });

  const timePeriodOptions = [
    { label: "1 Week Low", days: 7 },
    { label: "1 Month Low", days: 30 },
    { label: "3 Months Low", days: 90 },
    { label: "6 Months Low", days: 180 },
    { label: "9 Months Low", days: 270 },
    { label: "1 Year Low", days: 365 },
  ];

  const riskLevelOptions = [
    { value: "High Risk", label: "High Risk" },
    { value: "Medium Risk", label: "Medium Risk" },
    { value: "Low Risk", label: "Low Risk" },
  ];

  // Helper function to get risk level for an option
  const getRiskLevel = (option: OptionData) => {
    const probValue = option.ProbWorthless_Bayesian_IsoCal ?? option['1_2_3_ProbOfWorthless_Weighted'];
    if (probValue <= 0.6) return 'High Risk';
    if (probValue < 0.8) return 'Medium Risk';
    return 'Low Risk';
  };

  // Risk info component that works on both desktop and mobile
  const RiskInfoButton = () => (
    <>
      {/* Desktop tooltip */}
      <div className="hidden md:block">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3 w-3 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-sm bg-background border z-50">
              <div className="space-y-2 text-sm">
                <p className="font-medium">Risk Level Classification:</p>
                <div className="space-y-1">
                  <p><strong>High Risk:</strong> ≤60% probability of being worthless</p>
                  <p><strong>Medium Risk:</strong> {">"}60% and {"<"}80% probability of being worthless</p>
                  <p><strong>Low Risk:</strong> ≥80% probability of being worthless</p>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Based on ProbWorthless_Bayesian_IsoCal field, or 1_2_3_ProbOfWorthless_Weighted as fallback. No overlapping values between categories.
                </p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      {/* Mobile dialog */}
      <div className="md:hidden">
        <Dialog>
          <DialogTrigger asChild>
            <Info className="h-3 w-3 text-muted-foreground cursor-pointer" />
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <div className="space-y-3">
              <h3 className="font-medium">Risk Level Classification</h3>
              <div className="space-y-2 text-sm">
                <p><strong>High Risk:</strong> ≤60% probability of being worthless</p>
                <p><strong>Medium Risk:</strong> {">"}60% and {"<"}80% probability of being worthless</p>
                <p><strong>Low Risk:</strong> ≥80% probability of being worthless</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Based on ProbWorthless_Bayesian_IsoCal field, or 1_2_3_ProbOfWorthless_Weighted as fallback. No overlapping values between categories.
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );

  // Update URL parameters when filters and sorting change
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (selectedStocks.length > 0) {
      // Use JSON encoding to handle stock names with commas
      params.set('stocks', encodeURIComponent(JSON.stringify(selectedStocks)));
    }
    if (selectedExpiryDates.length > 0) {
      params.set('expiryDates', encodeURIComponent(JSON.stringify(selectedExpiryDates)));
    }
    if (strikeBelowPeriod !== null) {
      params.set('strikeBelowPeriod', strikeBelowPeriod.toString());
    }
    if (selectedRiskLevels.length > 0) {
      params.set('riskLevels', encodeURIComponent(JSON.stringify(selectedRiskLevels)));
    }
    if (sortField !== null) {
      params.set('sortField', sortField);
    }
    if (sortDirection !== 'asc') {
      params.set('sortDirection', sortDirection);
    }
    
    setSearchParams(params, { replace: true });
  }, [selectedStocks, selectedExpiryDates, strikeBelowPeriod, selectedRiskLevels, sortField, sortDirection, setSearchParams]);

  // Auto-select the expiry date closest to third Friday of next month (only if no filters from URL)
  useEffect(() => {
    if (data.length > 0 && selectedExpiryDates.length === 0 && !searchParams.has('expiryDates')) {
      // Calculate third Friday of next month
      const today = new Date();
      const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      
      // Find first Friday of next month
      const firstFriday = new Date(nextMonth);
      const dayOfWeek = firstFriday.getDay();
      const daysUntilFriday = (5 - dayOfWeek + 7) % 7;
      firstFriday.setDate(firstFriday.getDate() + daysUntilFriday);
      
      // Third Friday is 14 days after first Friday
      const thirdFriday = new Date(firstFriday);
      thirdFriday.setDate(thirdFriday.getDate() + 14);
      
      // Get all unique expiry dates
      const expiryDates = [...new Set(data.map(option => option.ExpiryDate))];
      
      // Find the expiry date closest to third Friday
      let closestDate = expiryDates[0];
      let smallestDiff = Infinity;
      
      expiryDates.forEach(dateStr => {
        const expiryDate = new Date(dateStr);
        const diff = Math.abs(expiryDate.getTime() - thirdFriday.getTime());
        if (diff < smallestDiff) {
          smallestDiff = diff;
          closestDate = dateStr;
        }
      });

      if (closestDate) {
        setSelectedExpiryDates([closestDate]);
      }
    }
  }, [data, selectedExpiryDates.length, searchParams]);
  
  const [stockSearch, setStockSearch] = useState("");
  const [expirySearch, setExpirySearch] = useState("");
  const [columnFilters, setColumnFilters] = useState<{field: string; type: 'text' | 'number'; textValue?: string; minValue?: number; maxValue?: number;}[]>([]);
  
  // Cache low prices for performance
  const lowPricesCache = useMemo(() => {
    if (strikeBelowPeriod === null) return new Map();
    
    const cache = new Map<string, number | null>();
    const uniqueStocks = [...new Set(data.map(option => option.StockName))];
    
    uniqueStocks.forEach(stockName => {
      cache.set(stockName, getLowPriceForPeriod(stockName, strikeBelowPeriod));
    });
    
    return cache;
  }, [data, strikeBelowPeriod, getLowPriceForPeriod]);

  // Memoized filtered data with optimized filtering
  const filteredData = useMemo(() => {
    return data.filter(option => {
      const matchesStock = selectedStocks.length === 0 || selectedStocks.includes(option.StockName);
      const matchesExpiry = selectedExpiryDates.length === 0 || selectedExpiryDates.includes(option.ExpiryDate);
      
      // Use cached low price for performance
      if (strikeBelowPeriod !== null) {
        const lowPrice = lowPricesCache.get(option.StockName);
        if (lowPrice === null || lowPrice === undefined || option.StrikePrice > lowPrice) {
          return false;
        }
      }
      
      // Risk level filter
      const matchesRiskLevel = selectedRiskLevels.length === 0 || selectedRiskLevels.includes(getRiskLevel(option));
      
      return matchesStock && matchesExpiry && matchesRiskLevel;
    });
  }, [data, selectedStocks, selectedExpiryDates, strikeBelowPeriod, selectedRiskLevels, lowPricesCache, getRiskLevel]);

  // Memoized filtered stocks
  const filteredStocks = useMemo(() => {
    let filteredOptions = data;
    
    // Apply expiry date filter
    if (selectedExpiryDates.length > 0) {
      filteredOptions = filteredOptions.filter(option => selectedExpiryDates.includes(option.ExpiryDate));
    }
    
    // Apply strike below period filter using cache
    if (strikeBelowPeriod !== null) {
      filteredOptions = filteredOptions.filter(option => {
        const lowPrice = lowPricesCache.get(option.StockName);
        return lowPrice !== null && lowPrice !== undefined && option.StrikePrice <= lowPrice;
      });
    }
    
    const stocks = [...new Set(filteredOptions.map(option => option.StockName))];
    
    return stocks
      .filter(stock => stock.toLowerCase().includes(stockSearch.toLowerCase()))
      .sort();
  }, [data, selectedExpiryDates, strikeBelowPeriod, lowPricesCache, stockSearch]);

  // Memoized filtered expiry dates
  const filteredExpiryDates = useMemo(() => {
    let filteredOptions = data;
    
    // Apply stock filter
    if (selectedStocks.length > 0) {
      filteredOptions = filteredOptions.filter(option => selectedStocks.includes(option.StockName));
    }
    
    // Apply strike below period filter using cache
    if (strikeBelowPeriod !== null) {
      filteredOptions = filteredOptions.filter(option => {
        const lowPrice = lowPricesCache.get(option.StockName);
        return lowPrice !== null && lowPrice !== undefined && option.StrikePrice <= lowPrice;
      });
    }
    
    const dates = [...new Set(filteredOptions.map(option => option.ExpiryDate))];
    
    return dates
      .filter(date => date.toLowerCase().includes(expirySearch.toLowerCase()))
      .sort();
  }, [data, selectedStocks, strikeBelowPeriod, lowPricesCache, expirySearch]);

  const handleLoadMockData = () => {
    loadMockData();
    toast.success("Mock data loaded");
  };

  const handleOptionClick = (option: OptionData) => {
    const optionId = encodeURIComponent(option.OptionName);
    navigate(`/option/${optionId}?${searchParams.toString()}`);
  };

  const handleStockClick = (stockName: string) => {
    navigate(`/stock/${encodeURIComponent(stockName)}?${searchParams.toString()}`);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Professional Finance Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-background via-muted/50 to-background border border-border rounded-lg">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5"></div>
        <div className="relative px-8 py-12 text-center">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent mb-3">
            Swedish Put Options
          </h1>
          <p className="text-xl text-muted-foreground mb-6 max-w-2xl mx-auto">
            Analysis and insights for Swedish equity put options
          </p>
        </div>
        <div className="absolute top-4 right-4 opacity-20">
          <BarChart3 className="h-24 w-24 text-primary" />
        </div>
      </div>

      {/* Discreet Timestamp Display */}
      <div className="flex justify-center">
        <TimestampDisplay />
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
                {filteredData.length} Options Available
              </h2>
              <p className="text-muted-foreground">
                From {filteredStocks.length} different stocks
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-1 min-h-5">
                  <Label>Strike Price Below</Label>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="min-w-[200px] justify-between">
                      {strikeBelowPeriod === null 
                        ? "Select Period" 
                        : `✓ ${timePeriodOptions.find(opt => opt.days === strikeBelowPeriod)?.label}`}
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[200px] bg-background z-50">
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
                <div className="flex items-center gap-1 min-h-5">
                  <Label>Risk Level</Label>
                  <RiskInfoButton />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="min-w-[200px] justify-between">
                      {selectedRiskLevels.length === 0 ? 'All Risk Levels' : 
                       selectedRiskLevels.length === 1 ? selectedRiskLevels[0] : 
                       `${selectedRiskLevels.length} levels selected`}
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[200px] p-3 bg-background z-50">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 border-b pb-2">
                        <Checkbox
                          id="select-all-risk"
                          checked={selectedRiskLevels.length === riskLevelOptions.length}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedRiskLevels(riskLevelOptions.map(r => r.value));
                            } else {
                              setSelectedRiskLevels([]);
                            }
                          }}
                        />
                        <label htmlFor="select-all-risk" className="text-sm cursor-pointer font-medium">
                          Select All
                        </label>
                      </div>
                      {riskLevelOptions.map(risk => (
                        <div key={risk.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`risk-${risk.value}`}
                            checked={selectedRiskLevels.includes(risk.value)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedRiskLevels(prev => [...prev, risk.value]);
                              } else {
                                setSelectedRiskLevels(prev => prev.filter(r => r !== risk.value));
                              }
                            }}
                          />
                          <label htmlFor={`risk-${risk.value}`} className="text-sm cursor-pointer">
                            {risk.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-1 min-h-5">
                  <Label>Filter by Stock</Label>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="min-w-[200px] justify-between">
                      {selectedStocks.length === 0 ? 'All Stocks' : 
                       selectedStocks.length === 1 ? selectedStocks[0] : 
                       `${selectedStocks.length} stocks selected`}
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[200px] p-3 max-h-60 overflow-y-auto bg-background z-50">
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
                <div className="flex items-center gap-1 min-h-5">
                  <Label>Filter by Expiry Date</Label>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="min-w-[200px] justify-between">
                      {selectedExpiryDates.length === 0 ? 'All Expiry Dates' : 
                       selectedExpiryDates.length === 1 ? selectedExpiryDates[0] : 
                       `${selectedExpiryDates.length} dates selected`}
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[200px] p-3 max-h-60 overflow-y-auto bg-background z-50">
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
                enableFiltering={true}
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
