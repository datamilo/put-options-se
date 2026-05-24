import React, { useState, useMemo } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
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
import { useStockData } from '@/hooks/useStockData';
import { MonthlySeasonalityHeatmap } from '@/components/monthly/MonthlySeasonalityHeatmap';
import { MonthlyStatsTable } from '@/components/monthly/MonthlyStatsTable';
import { TimelinePerformanceChart } from '@/components/monthly/TimelinePerformanceChart';
import { DayOfMonthAnalysis } from '@/components/monthly/DayOfMonthAnalysis';
import { ArrowLeft, TrendingUp, TrendingDown, BarChart3, Calendar, Check, ChevronsUpDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const CURRENT_MONTH_NUMBER = new Date().getMonth() + 1;

export const MonthlyAnalysis = () => {
  usePageTitle('Monthly Analysis');
  const navigate = useNavigate();
  const { t } = useTranslation(['pages', 'common']);
  const { monthlyData, monthlyStats, isLoading, error } = useMonthlyStockData();
  const { allStockData } = useStockData();
  
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

  // Current month MTD performance + set of stocks with recent price data
  // MUST be declared before heatmapData (recentStocksSet used in its deps array)
  const { currentMonthPerformance, recentStocksSet } = useMemo(() => {
    const perfMap = new Map<string, number>();
    const recentSet = new Set<string>();

    if (allStockData.length === 0) return { currentMonthPerformance: perfMap, recentStocksSet: recentSet };

    const today = new Date();
    const startOfMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutoffStr = thirtyDaysAgo.toISOString().slice(0, 10);

    // Group rows by stock name
    const byStock = new Map<string, typeof allStockData>();
    allStockData.forEach(d => {
      if (!byStock.has(d.name)) byStock.set(d.name, []);
      byStock.get(d.name)!.push(d);
    });

    byStock.forEach((rows, name) => {
      const sorted = [...rows].sort((a, b) => a.date.localeCompare(b.date));
      const latest = sorted[sorted.length - 1];

      // Mark stock as having recent data if latest entry is within last 30 days
      if (latest.date >= cutoffStr) {
        recentSet.add(name);
      }

      // Only compute MTD if the latest data point is from the current month
      if (latest.date >= startOfMonthStr) {
        const prevMonthLast = sorted.filter(d => d.date < startOfMonthStr).pop();
        if (prevMonthLast) {
          const mtd = ((latest.close - prevMonthLast.close) / prevMonthLast.close) * 100;
          perfMap.set(name, mtd);
        }
      }
    });

    return { currentMonthPerformance: perfMap, recentStocksSet: recentSet };
  }, [allStockData]);

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

    // Exclude stocks with no price data in the last 30 days (stale/delisted)
    // Only apply once stock data has been loaded (recentStocksSet non-empty)
    if (recentStocksSet.size > 0) {
      filtered = filtered.filter(stat => recentStocksSet.has(stat.name));
    }

    return filtered;
  }, [monthlyStats, selectedStock, minHistory, recentStocksSet]);

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
          <p className="text-muted-foreground">{t('monthlyAnalysis.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">{t('monthlyAnalysis.errorTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => navigate('/')} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('monthlyAnalysis.backToMain')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <p className="eyebrow">03 · History · Monthly</p>
          <h1 className="page-title">{t('monthlyAnalysis.title')}</h1>
          <p className="page-desc">{t('monthlyAnalysis.subtitle')}</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>{t('monthlyAnalysis.filtersTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>{t('monthlyAnalysis.monthsLabel')}</Label>
                <div className="flex gap-2">
                <Popover open={monthDropdownOpen} onOpenChange={setMonthDropdownOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={monthDropdownOpen}
                      className="flex-1 justify-between"
                    >
                      {selectedMonths.length === 0
                        ? t('monthlyAnalysis.allMonthsPlaceholder')
                        : selectedMonths.length === 1
                        ? t(`common:monthNames.${selectedMonths[0]}`)
                        : t('monthlyAnalysis.monthsSelected', { count: selectedMonths.length })
                      }
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder={t('common:filter.searchMonths')} />
                      <CommandList>
                        <CommandEmpty>{t('common:filter.noMonthFound')}</CommandEmpty>
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
                            {t('common:filter.allMonths')}
                          </CommandItem>
                          {[1,2,3,4,5,6,7,8,9,10,11,12].map((monthNumber) => {
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
                                {t(`common:monthNames.${monthNumber}`)}
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <Button
                  variant={selectedMonths.length === 1 && selectedMonths[0] === CURRENT_MONTH_NUMBER ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedMonths(prev =>
                    prev.length === 1 && prev[0] === CURRENT_MONTH_NUMBER ? [] : [CURRENT_MONTH_NUMBER]
                  )}
                  title={t('monthlyAnalysis.filterCurrentMonthTitle')}
                >
                  {t(`common:monthNames.${CURRENT_MONTH_NUMBER}`)}
                </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t('monthlyAnalysis.selectStockLabel')}</Label>
                <Popover open={stockDropdownOpen} onOpenChange={setStockDropdownOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={stockDropdownOpen}
                      className="w-full justify-between"
                    >
                      {selectedStock || t('monthlyAnalysis.allStocksPlaceholder')}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder={t('common:filter.searchStocks')} />
                      <CommandList>
                        <CommandEmpty>{t('common:filter.noStockFound')}</CommandEmpty>
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
                            {t('common:filter.allStocks')}
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
                <Label>{t('monthlyAnalysis.minHistoryLabel', { value: minHistory[0] })}</Label>
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
                <Label>{t('monthlyAnalysis.filters.showTopN')}</Label>
                <Select value={topN.toString()} onValueChange={(value) => setTopN(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">{t('common:topN', { n: 10 })}</SelectItem>
                    <SelectItem value="25">{t('common:topN', { n: 25 })}</SelectItem>
                    <SelectItem value="50">{t('common:topN', { n: 50 })}</SelectItem>
                    <SelectItem value="100">{t('common:topN', { n: 100 })}</SelectItem>
                    <SelectItem value="200">{t('common:topN', { n: 200 })}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>


        {/* Seasonality Heatmap */}
        <Card>
          <CardHeader>
            <CardTitle>{t('monthlyAnalysis.sections.heatmap')}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {t('monthlyAnalysis.sections.heatmapDesc')}
            </p>
          </CardHeader>
          <CardContent>
            <MonthlySeasonalityHeatmap
              data={heatmapData}
              selectedMonths={selectedMonths}
              currentMonth={CURRENT_MONTH_NUMBER}
              currentMonthPerformance={currentMonthPerformance}
            />
          </CardContent>
        </Card>

        {/* Timeline Performance Chart */}
        <Card>
          <CardHeader>
            <CardTitle>{t('monthlyAnalysis.sections.timeline')}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {t('monthlyAnalysis.sections.timelineDesc')}
            </p>
          </CardHeader>
          <CardContent>
            <TimelinePerformanceChart data={monthlyData} selectedStock={selectedStock} />
          </CardContent>
        </Card>

        {/* Day-of-Month Analysis Section */}
        <DayOfMonthAnalysis
          monthlyData={monthlyData}
          selectedMonths={selectedMonths}
          selectedStock={selectedStock}
          minHistory={minHistory[0]}
        />

        {/* Interactive Table */}
        <Card>
          <CardHeader>
            <CardTitle>{t('monthlyAnalysis.sections.statistics')}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {t('monthlyAnalysis.sections.statisticsDesc')}
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