import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useTimestamps } from "@/hooks/useTimestamps";
import { OptionData } from "@/types/options";
import { OptionsTable } from "@/components/options/OptionsTable";
import { OptionsChart } from "@/components/options/OptionsChart";
import { OptionDetails } from "@/components/options/OptionDetails";
import { useEnrichedOptionsData } from "@/hooks/useEnrichedOptionsData";
import { useStockData } from "@/hooks/useStockData";
import { TimestampDisplay } from "@/components/TimestampDisplay";
import { SettingsModal } from "@/components/SettingsModal";
import { useMainPagePreferences } from "@/hooks/useMainPagePreferences";
import { useAnalytics } from "@/hooks/useAnalytics";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { BarChart3, Table, FileSpreadsheet, ChevronDown, Info, TrendingUp, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { DataTimestamp } from "@/components/ui/data-timestamp";
import { ExportButton, exportToCSV } from "@/components/ui/export-button";

const Index = () => {
  console.log('🏠 Index component rendering');

  usePageTitle('Options Analysis');
  const navigate = useNavigate();
  const { t } = useTranslation('pages');
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Use enriched data directly - it already includes recalculated options
  const { data, isLoading, error, loadMockData } = useEnrichedOptionsData();
  const { getStockSummary, getLowPriceForPeriod } = useStockData();
  const { settings: savedFilters, isLoading: isLoadingPreferences, saveSettings: saveFilterSettings } = useMainPagePreferences();
  const { timestamps } = useTimestamps();
  const { trackFilterChange, trackExport } = useAnalytics();
  
  // Initialize filter state - will be populated from preferences or URL
  const [selectedStocks, setSelectedStocks] = useState<string[]>([]);
  const [selectedExpiryDates, setSelectedExpiryDates] = useState<string[]>([]);
  const urlParamsProcessed = useRef(false);
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
    { label: t('index.timePeriods.1w'), days: 7 },
    { label: t('index.timePeriods.1m'), days: 30 },
    { label: t('index.timePeriods.3m'), days: 90 },
    { label: t('index.timePeriods.6m'), days: 180 },
    { label: t('index.timePeriods.9m'), days: 270 },
    { label: t('index.timePeriods.1y'), days: 365 },
  ];

  const riskLevelOptions = [
    { value: "High Risk", label: t('index.riskLevelNames.High Risk') },
    { value: "Medium Risk", label: t('index.riskLevelNames.Medium Risk') },
    { value: "Low Risk", label: t('index.riskLevelNames.Low Risk') },
  ];

  const getRiskLevel = useCallback((option: OptionData) => {
    const probValue = option.ProbWorthless_Bayesian_IsoCal ?? option['1_2_3_ProbOfWorthless_Weighted'];
    if (probValue <= 0.6) return 'High Risk';
    if (probValue < 0.8) return 'Medium Risk';
    return 'Low Risk';
  }, []);

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
                <p className="font-medium">{t('index.riskLevel.heading')}:</p>
                <div className="space-y-1">
                  <p><strong>{t('index.riskLevelNames.High Risk')}:</strong> ≤60% {t('tooltips:riskLevel.high.description', 'probability of being worthless')}</p>
                  <p><strong>{t('index.riskLevelNames.Medium Risk')}:</strong> {">"}60% and {"<"}80% {t('tooltips:riskLevel.high.description', 'probability of being worthless')}</p>
                  <p><strong>{t('index.riskLevelNames.Low Risk')}:</strong> ≥80% {t('tooltips:riskLevel.high.description', 'probability of being worthless')}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {t('index.riskLevel.note')}
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
              <h3 className="font-medium">{t('index.riskLevel.heading')}</h3>
              <div className="space-y-2 text-sm">
                <p><strong>{t('index.riskLevelNames.High Risk')}:</strong> {t('index.riskLevel.high')}</p>
                <p><strong>{t('index.riskLevelNames.Medium Risk')}:</strong> {t('index.riskLevel.medium')}</p>
                <p><strong>{t('index.riskLevelNames.Low Risk')}:</strong> {t('index.riskLevel.low')}</p>
              </div>
              <p className="text-xs text-muted-foreground">
                {t('index.riskLevel.note')}
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );

  // Handle URL parameters for sharing (only on initial load)
  useEffect(() => {
    if (urlParamsProcessed.current || !data.length) return;
    
    const hasUrlParams = searchParams.has('stocks') || searchParams.has('expiryDates') || searchParams.has('riskLevels');
    if (hasUrlParams) {
      // Process URL params for sharing
      const stocks = searchParams.get('stocks');
      const dates = searchParams.get('expiryDates');
      const riskLevels = searchParams.get('riskLevels');
      
      if (stocks) {
        try {
          const result = JSON.parse(decodeURIComponent(stocks));
          if (Array.isArray(result)) setSelectedStocks(result);
        } catch {
          setSelectedStocks(stocks.split(',').filter(Boolean));
        }
      }
      
      if (dates) {
        try {
          const result = JSON.parse(decodeURIComponent(dates));
          if (Array.isArray(result)) setSelectedExpiryDates(result);
        } catch {
          setSelectedExpiryDates(dates.split(',').filter(Boolean));
        }
      }
      
      if (riskLevels) {
        try {
          const result = JSON.parse(decodeURIComponent(riskLevels));
          if (Array.isArray(result)) setSelectedRiskLevels(result);
        } catch {
          setSelectedRiskLevels(riskLevels.split(',').filter(Boolean));
        }
      }
      
      urlParamsProcessed.current = true;
    }
  }, [data.length, searchParams]);

  // Update URL parameters when filters and sorting change (removed to prevent interference with preferences)
  
  // Load saved preferences when data is available
  useEffect(() => {
    // Skip if URL params were processed (sharing link)
    if (urlParamsProcessed.current) return;
    if (data.length === 0 || isLoadingPreferences) return;
    
    console.log('📥 Loading preferences from Supabase:', savedFilters);
    
    const availableStocks = [...new Set(data.map(option => option.StockName))];
    const availableExpiryDates = [...new Set(data.map(option => option.ExpiryDate))];
    
    // Filter saved stocks to only include ones that exist in current data
    const validSavedStocks = savedFilters.selectedStocks.filter(stock => availableStocks.includes(stock));
    const validSavedExpiryDates = savedFilters.selectedExpiryDates.filter(date => availableExpiryDates.includes(date));
    
    console.log('✅ Valid saved stocks:', validSavedStocks);
    console.log('✅ Valid saved dates:', validSavedExpiryDates);
    
    // If no valid saved expiry dates, calculate third Friday of next month as default
    let expiryDatesToUse = validSavedExpiryDates;
    if (expiryDatesToUse.length === 0) {
      const defaultDate = calculateDefaultExpiryDate(availableExpiryDates);
      if (defaultDate) {
        expiryDatesToUse = [defaultDate];
      }
      console.log('🎯 Using default expiry date:', expiryDatesToUse);
    }
    
    setSelectedStocks(validSavedStocks);
    setSelectedExpiryDates(expiryDatesToUse);
    setSelectedRiskLevels(savedFilters.selectedRiskLevels);
    setStrikeBelowPeriod(savedFilters.strikeBelowPeriod || null);

    console.log('📝 Applied filters - stocks:', validSavedStocks, 'dates:', expiryDatesToUse, 'risk:', savedFilters.selectedRiskLevels, 'strikeBelowPeriod:', savedFilters.strikeBelowPeriod);
  }, [data, isLoadingPreferences, savedFilters]);
  
  // Helper function to calculate default expiry date (third Friday of next month)
  const calculateDefaultExpiryDate = (availableExpiryDates: string[]) => {
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
    
    // Find the expiry date closest to third Friday
    let closestDate = availableExpiryDates[0];
    let smallestDiff = Infinity;
    
    availableExpiryDates.forEach(dateStr => {
      const expiryDate = new Date(dateStr);
      const diff = Math.abs(expiryDate.getTime() - thirdFriday.getTime());
      if (diff < smallestDiff) {
        smallestDiff = diff;
        closestDate = dateStr;
      }
    });
    
    return closestDate;
  };
  
  // Reset filters to default
  const resetToDefault = () => {
    const availableExpiryDates = [...new Set(data.map(option => option.ExpiryDate))];
    const defaultDate = calculateDefaultExpiryDate(availableExpiryDates);
    
    setSelectedStocks([]);
    setSelectedExpiryDates(defaultDate ? [defaultDate] : []);
    setSelectedRiskLevels([]);
    setStrikeBelowPeriod(null);
    
    toast.success(t('index.toast.filtersReset'));
  };
  
  // Save preferences whenever filters change (debounced by only saving when user is done interacting)
  useEffect(() => {
    if (!isLoadingPreferences && data.length > 0 && !urlParamsProcessed.current) {
      const timeoutId = setTimeout(() => {
        console.log('💾 Saving preferences to Supabase:', {
          selectedStocks,
          selectedExpiryDates,
          selectedRiskLevels,
          strikeBelowPeriod
        });
        saveFilterSettings({
          selectedStocks,
          selectedExpiryDates,
          selectedRiskLevels,
          strikePriceFilter: 'all', // Not used, keeping for compatibility
          strikeBelowPeriod
        });
      }, 500); // Debounce to avoid saving too frequently

      return () => clearTimeout(timeoutId);
    }
  }, [selectedStocks, selectedExpiryDates, selectedRiskLevels, strikeBelowPeriod, isLoadingPreferences, data.length, saveFilterSettings]);
  
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
    toast.success(t('index.toast.mockDataLoaded'));
  };

  const handleOptionClick = (option: OptionData) => {
    const optionId = encodeURIComponent(option.OptionName);
    const base = import.meta.env.BASE_URL.replace(/\/$/, '');
    window.open(`${base}/option/${optionId}?${searchParams.toString()}`, '_blank');
  };

  const handleStockClick = (stockName: string) => {
    const base = import.meta.env.BASE_URL.replace(/\/$/, '');
    window.open(`${base}/stock/${encodeURIComponent(stockName)}?${searchParams.toString()}`, '_blank');
  };

  const handleExportCSV = () => {
    trackExport('export_csv_clicked', {
      export_type: 'csv',
      data_source: 'options_table',
      row_count: filteredData.length,
    });
    exportToCSV(filteredData, `swedish-put-options-${new Date().toISOString().split('T')[0]}.csv`);
    toast.success(t('index.toast.dataExported'));
  };

  return (
    <div className="container mx-auto p-4 space-y-4">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-1">{t('index.title')}</h1>
          <p className="text-muted-foreground">{t('index.headerDesc')}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <DataTimestamp timestamp={timestamps?.optionsData?.lastUpdated} label={t('index.optionsDataLabel')} />
          <DataTimestamp timestamp={timestamps?.stockData?.lastUpdated} label={t('common:dataTimestamp.stockData')} />
          <DataTimestamp timestamp={timestamps?.analysisCompleted?.lastUpdated} label={t('common:dataTimestamp.analysisUpdated')} />
        </div>
      </div>

      {data.length === 0 ? (
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              {t('index.empty.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">
                {error}
                <div className="mt-2 space-y-2">
                  <div className="text-center">
                    <Button onClick={handleLoadMockData} variant="outline" disabled={isLoading}>
                      {t('common:button.loadSampleData')}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {isLoading && (
              <div className="text-center text-sm text-muted-foreground">
                {t('common:status.loading')}
              </div>
            )}

            {!isLoading && !error && (
              <div className="text-center text-sm text-muted-foreground">
                {t('common:status.loading')}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">
                  {t('index.subtitle')}
                </h2>
                <ExportButton onExportCSV={handleExportCSV} size="sm" variant="ghost" />
              </div>
              <p className="text-sm text-muted-foreground">
                {t('index.showingOptions', { filtered: filteredData.length, total: data.length, pct: ((filteredData.length / data.length) * 100).toFixed(1) })}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-start gap-4 flex-wrap">
              <Button 
                onClick={resetToDefault} 
                variant="ghost"
                size="sm"
                className="self-start text-xs text-muted-foreground hover:text-foreground"
                title="Reset all filters to default (third Friday of next month)"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                {t('index.resetToDefault')}
              </Button>
              
              <div className="space-y-2">
                <div className="flex items-center gap-1 min-h-5">
                  <Label>{t('index.filters.strikePriceBelow')}</Label>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="min-w-[200px] justify-between">
                      {strikeBelowPeriod === null
                        ? t('index.selectPeriod')
                        : `✓ ${timePeriodOptions.find(opt => opt.days === strikeBelowPeriod)?.label}`}
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[200px] bg-background z-50">
                    <DropdownMenuItem onClick={() => {
                      trackFilterChange('filter_strike_below_period_changed', {
                        filter_type: 'strike_below_period',
                        old_value: strikeBelowPeriod,
                        new_value: null,
                        page: 'index',
                      });
                      setStrikeBelowPeriod(null);
                    }}>
                      {t('index.clearFilter')}
                    </DropdownMenuItem>
                    {timePeriodOptions.map(option => (
                      <DropdownMenuItem
                        key={option.days}
                        onClick={() => {
                          trackFilterChange('filter_strike_below_period_changed', {
                            filter_type: 'strike_below_period',
                            old_value: strikeBelowPeriod,
                            new_value: option.days,
                            page: 'index',
                          });
                          setStrikeBelowPeriod(option.days);
                        }}
                      >
                        {option.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1 min-h-5">
                  <Label>{t('index.filters.riskLevel')}</Label>
                  <RiskInfoButton />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="min-w-[200px] justify-between">
                      {selectedRiskLevels.length === 0
                        ? t('index.filters.allRiskLevels')
                        : selectedRiskLevels.length === 1
                        ? riskLevelOptions.find(r => r.value === selectedRiskLevels[0])?.label ?? selectedRiskLevels[0]
                        : t('index.levelsSelected', { count: selectedRiskLevels.length })}
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
                            const newValue = checked ? riskLevelOptions.map(r => r.value) : [];
                            trackFilterChange('filter_risk_levels_changed', {
                              filter_type: 'risk_levels',
                              old_value: selectedRiskLevels,
                              new_value: newValue,
                              page: 'index',
                            });
                            setSelectedRiskLevels(newValue);
                          }}
                        />
                        <label htmlFor="select-all-risk" className="text-sm cursor-pointer font-medium">
                          {t('index.selectAll')}
                        </label>
                      </div>
                      {riskLevelOptions.map(risk => (
                        <div key={risk.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`risk-${risk.value}`}
                            checked={selectedRiskLevels.includes(risk.value)}
                            onCheckedChange={(checked) => {
                              const newValue = checked
                                ? [...selectedRiskLevels, risk.value]
                                : selectedRiskLevels.filter(r => r !== risk.value);
                              trackFilterChange('filter_risk_levels_changed', {
                                filter_type: 'risk_levels',
                                old_value: selectedRiskLevels,
                                new_value: newValue,
                                page: 'index',
                              });
                              setSelectedRiskLevels(newValue);
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
                  <Label>{t('index.filters.filterByStock')}</Label>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="min-w-[200px] justify-between">
                      {selectedStocks.length === 0
                        ? t('index.filters.allStocks')
                        : selectedStocks.length === 1
                        ? selectedStocks[0]
                        : t('index.stocksSelected', { count: selectedStocks.length })}
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[200px] p-3 max-h-60 overflow-y-auto bg-background z-50">
                    <div className="space-y-2">
                      <Input
                        placeholder={t('index.filters.searchStocks')}
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
                            const newValue = checked ? filteredStocks : [];
                            trackFilterChange('filter_stocks_changed', {
                              filter_type: 'stocks',
                              old_value: selectedStocks,
                              new_value: newValue,
                              page: 'index',
                            });
                            setSelectedStocks(newValue);
                          }}
                        />
                        <label htmlFor="select-all-stocks" className="text-sm cursor-pointer font-medium">
                          {t('index.selectAll')}
                        </label>
                      </div>
                      {filteredStocks.map(stock => (
                        <div key={stock} className="flex items-center space-x-2">
                          <Checkbox
                            id={`stock-${stock}`}
                            checked={selectedStocks.includes(stock)}
                            onCheckedChange={(checked) => {
                              const newValue = checked
                                ? [...selectedStocks, stock]
                                : selectedStocks.filter(s => s !== stock);
                              trackFilterChange('filter_stocks_changed', {
                                filter_type: 'stocks',
                                old_value: selectedStocks,
                                new_value: newValue,
                                page: 'index',
                              });
                              setSelectedStocks(newValue);
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
                  <Label>{t('index.filters.filterByExpiryDate')}</Label>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="min-w-[200px] justify-between">
                      {selectedExpiryDates.length === 0
                        ? t('index.filters.allExpiryDates')
                        : selectedExpiryDates.length === 1
                        ? selectedExpiryDates[0]
                        : t('index.datesSelected', { count: selectedExpiryDates.length })}
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[200px] p-3 max-h-60 overflow-y-auto bg-background z-50">
                    <div className="space-y-2">
                      <Input
                        placeholder={t('index.filters.searchDates')}
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
                            const newValue = checked ? filteredExpiryDates : [];
                            trackFilterChange('filter_expiry_changed', {
                              filter_type: 'expiry_dates',
                              old_value: selectedExpiryDates,
                              new_value: newValue,
                              page: 'index',
                            });
                            setSelectedExpiryDates(newValue);
                          }}
                        />
                        <label htmlFor="select-all-expiry" className="text-sm cursor-pointer font-medium">
                          {t('index.selectAll')}
                        </label>
                      </div>
                      {filteredExpiryDates.map(date => (
                        <div key={date} className="flex items-center space-x-2">
                          <Checkbox
                            id={`expiry-${date}`}
                            checked={selectedExpiryDates.includes(date)}
                            onCheckedChange={(checked) => {
                              const newValue = checked
                                ? [...selectedExpiryDates, date]
                                : selectedExpiryDates.filter(d => d !== date);
                              trackFilterChange('filter_expiry_changed', {
                                filter_type: 'expiry_dates',
                                old_value: selectedExpiryDates,
                                new_value: newValue,
                                page: 'index',
                              });
                              setSelectedExpiryDates(newValue);
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
                {t('index.tabs.table')}
              </TabsTrigger>
              <TabsTrigger value="charts" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                {t('index.tabs.charts')}
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
