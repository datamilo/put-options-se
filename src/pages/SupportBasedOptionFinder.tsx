import React, { useState, useMemo, useEffect } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useSupportBasedOptionFinder, FilterCriteria, SupportBasedOption } from '@/hooks/useSupportBasedOptionFinder';
import { useEnrichedOptionsData } from '@/hooks/useEnrichedOptionsData';
import { useSupportLevelMetrics } from '@/hooks/useSupportLevelMetrics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Target, Info, ArrowUp, ArrowDown, ChevronDown, ChevronUp } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { calculateDefaultExpiryDate } from '@/lib/utils';
import { SupportMetricsBreakdown } from '@/components/SupportMetricsBreakdown';
import { useTranslation } from 'react-i18next';

export const SupportBasedOptionFinder = () => {
  usePageTitle('Support Level Options List');
  const { t } = useTranslation('pages');
  const { findOptions, isLoading } = useSupportBasedOptionFinder();
  const { data: allOptionsData } = useEnrichedOptionsData();
  const { getMetricsForStock } = useSupportLevelMetrics();

  // Construct the proper base URL for links (GitHub Pages vs other deployments)
  const getFullPath = (path: string) => {
    const isGitHubPages = window.location.hostname === 'datamilo.github.io';
    const basename = isGitHubPages ? '/put-options-se' : '';
    return basename + path;
  };

  // Filter state
  const [rollingPeriod, setRollingPeriod] = useState<string>('90');
  const [minDaysSinceBreak, setMinDaysSinceBreak] = useState<string>('30');
  const [selectedExpiryDate, setSelectedExpiryDate] = useState<string | null>(null);

  // Sorting state
  type SortField = keyof SupportBasedOption;
  type SortDirection = 'asc' | 'desc';
  const [sortField, setSortField] = useState<SortField>('premium');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Expanded row state
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  // Toggle row expansion
  const toggleRowExpansion = (idx: number) => {
    setExpandedRow(expandedRow === idx ? null : idx);
  };

  // Navigation handlers - open in new tab
  const handleOptionClick = (optionName: string) => {
    window.open(getFullPath(`/option/${encodeURIComponent(optionName)}`), '_blank');
  };

  const handleStockClick = (stockName: string) => {
    window.open(getFullPath(`/stock/${encodeURIComponent(stockName)}`), '_blank');
  };

  // Initialize default expiry date on load
  useEffect(() => {
    if (selectedExpiryDate === null && allOptionsData.length > 0) {
      const availableExpiryDates = [...new Set(allOptionsData.map(option => option.ExpiryDate))].sort();
      const defaultDate = calculateDefaultExpiryDate(availableExpiryDates);
      if (defaultDate) {
        setSelectedExpiryDate(defaultDate);
      }
    }
  }, [allOptionsData, selectedExpiryDate]);

  // Sorting function
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if same field is clicked
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New field: default to descending
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Find options based on current criteria (only recalculate when filters change)
  const filteredResults = useMemo(() => {
    const criteria: FilterCriteria = {
      rollingPeriod: parseInt(rollingPeriod),
      minDaysSinceBreak: parseInt(minDaysSinceBreak),
      strikePosition: 'any',
      minProbOfWorthless: 0,
      maxDaysToExpiry: 999,
      minPremium: 0,
      requireStrikeBelowLowerAtAcc: false,
      maxBidAskSpread: 999,
      expiryDate: selectedExpiryDate || undefined,
    };

    return findOptions(criteria);
  }, [
    rollingPeriod,
    minDaysSinceBreak,
    selectedExpiryDate,
    findOptions,
  ]);

  // Sort filtered results (only recalculate sorting, not filtering)
  const supportBasedResults = useMemo(() => {
    const sorted = [...filteredResults].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      // Handle null values
      if (aValue === null) aValue = -Infinity;
      if (bValue === null) bValue = -Infinity;

      // Numeric comparison
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      // String comparison
      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();
      return sortDirection === 'asc'
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr);
    });

    return sorted;
  }, [filteredResults, sortField, sortDirection]);


  // Helper component for sortable headers
  const SortableHeader = ({
    field,
    label,
    align = 'left'
  }: {
    field: SortField;
    label: string;
    align?: 'left' | 'right'
  }) => {
    const isActive = sortField === field;
    const isSupportAnalysis = field === 'numBreaks'; // Support Analysis column is non-sortable

    return (
      <TableHead
        className={`min-w-[100px] cursor-pointer hover:bg-muted/50 transition-colors ${align === 'right' ? 'text-right' : ''}`}
        onClick={() => !isSupportAnalysis && handleSort(field)}
      >
        <div className={`flex items-center gap-1 ${align === 'right' ? 'justify-end' : ''}`}>
          <span>{label}</span>
          {isActive && (
            sortDirection === 'asc' ?
              <ArrowUp className="h-4 w-4" /> :
              <ArrowDown className="h-4 w-4" />
          )}
        </div>
      </TableHead>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">{t('supportLevelOptions.loading')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <p className="eyebrow">02 · Support · Options</p>
          <h1 className="page-title">{t('supportLevelOptions.title')}</h1>
          <p className="page-desc">{t('supportLevelOptions.subtitle')}</p>
        </div>
      </div>
      <div className="space-y-6">

        {/* Configuration Panel */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{t('supportLevelOptions.filterCriteria')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Support Analysis Parameters */}
              <div>
                <h3 className="text-sm font-semibold mb-3 text-gray-700">{t('supportLevelOptions.supportAnalysisSection')}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="flex flex-col space-y-2">
                    <Label htmlFor="rolling-period" className="text-sm">
                      {t('supportLevelOptions.rollingLowPeriod')}
                    </Label>
                    <Select value={rollingPeriod} onValueChange={setRollingPeriod}>
                      <SelectTrigger id="rolling-period">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">{t('consecutiveBreaks.period1Month')}</SelectItem>
                        <SelectItem value="90">{t('consecutiveBreaks.period3Month')}</SelectItem>
                        <SelectItem value="180">{t('consecutiveBreaks.period6Month')}</SelectItem>
                        <SelectItem value="270">{t('consecutiveBreaks.period9Month')}</SelectItem>
                        <SelectItem value="365">{t('consecutiveBreaks.period1Year')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <Label htmlFor="days-since-break" className="text-sm">
                      {t('supportLevelOptions.minDaysSinceBreak')}
                    </Label>
                    <Input
                      id="days-since-break"
                      type="number"
                      value={minDaysSinceBreak}
                      onChange={(e) => setMinDaysSinceBreak(e.target.value)}
                      min="0"
                      step="5"
                    />
                  </div>
                  <div className="flex flex-col space-y-2">
                    <Label htmlFor="expiry-date" className="text-sm">
                      {t('supportLevelOptions.expiryDate')}
                    </Label>
                    <Select value={selectedExpiryDate || ''} onValueChange={setSelectedExpiryDate}>
                      <SelectTrigger id="expiry-date">
                        <SelectValue placeholder={t('common:filter.selectExpiryDate')} />
                      </SelectTrigger>
                      <SelectContent>
                        {[...new Set(allOptionsData.map(option => option.ExpiryDate))].sort().map(date => (
                          <SelectItem key={date} value={date}>
                            {date}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            {t('supportLevelOptions.foundOptions', { count: supportBasedResults.length })}
          </p>
        </div>

        {/* Results Table */}
        {supportBasedResults.length > 0 ? (
          <ScrollArea className="w-full rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">{t('supportLevelOptions.colDetails')}</TableHead>
                  <SortableHeader field="stockName" label={t('supportLevelOptions.colStock')} />
                  <SortableHeader field="optionName" label={t('supportLevelOptions.colOption')} />
                  <TableHead className="min-w-[100px]">{t('supportLevelOptions.colSupportAnalysis')}</TableHead>
                  <SortableHeader field="currentPrice" label={t('supportLevelOptions.colCurrentPrice')} align="right" />
                  <SortableHeader field="strikePrice" label={t('supportLevelOptions.colStrike')} align="right" />
                  <SortableHeader field="rollingLow" label={t('supportLevelOptions.colSupport', { period: rollingPeriod })} align="right" />
                  <SortableHeader field="distanceToSupport" label={t('supportLevelOptions.colDistanceToSupport')} align="right" />
                  <SortableHeader field="strikeVsSupport" label={t('supportLevelOptions.colStrikeVsSupport')} align="right" />
                  <SortableHeader field="medianDropPerBreak" label={t('supportLevelOptions.colMedianDropPerBreak')} align="right" />
                  <SortableHeader field="premium" label={t('supportLevelOptions.colPremium')} align="right" />
                  <SortableHeader field="powBayesianCalibrated" label={t('supportLevelOptions.colPowBayesian')} align="right" />
                  <SortableHeader field="powOriginal" label={t('supportLevelOptions.colPowOriginal')} align="right" />
                  <SortableHeader field="daysToExpiry" label={t('supportLevelOptions.colDaysToExpiry')} align="right" />
                  <TableHead
                    className="text-right min-w-[130px] cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleSort('supportStability')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>{t('supportLevelOptions.colSupportStability')}</span>
                      {sortField === 'supportStability' && (
                        sortDirection === 'asc' ?
                          <ArrowUp className="h-4 w-4" /> :
                          <ArrowDown className="h-4 w-4" />
                      )}
                      <TooltipProvider>
                        <Tooltip delayDuration={300}>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs bg-background border">
                            <p>{t('supportLevelOptions.tooltipStability')}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TableHead>
                  <SortableHeader field="daysSinceLastBreak" label={t('supportLevelOptions.colDaysSinceBreak')} align="right" />
                  <TableHead
                    className="text-right min-w-[130px] cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleSort('supportStrengthScore')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>{t('supportLevelOptions.colSupportStrength')}</span>
                      {sortField === 'supportStrengthScore' && (
                        sortDirection === 'asc' ?
                          <ArrowUp className="h-4 w-4" /> :
                          <ArrowDown className="h-4 w-4" />
                      )}
                      <TooltipProvider>
                        <Tooltip delayDuration={300}>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs bg-background border">
                            <p className="font-semibold mb-1">{t('supportLevelOptions.tooltipStrengthTitle')}</p>
                            <p className="mb-2">{t('supportLevelOptions.tooltipStrengthDesc')}</p>
                            <p className="text-xs">{t('supportLevelOptions.tooltipStrengthScale')}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TableHead>
                  <TableHead
                    className="text-left min-w-[150px] cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleSort('patternType')}
                  >
                    <div className="flex items-center gap-1">
                      <span>{t('supportLevelOptions.colPattern')}</span>
                      {sortField === 'patternType' && (
                        sortDirection === 'asc' ?
                          <ArrowUp className="h-4 w-4" /> :
                          <ArrowDown className="h-4 w-4" />
                      )}
                      <TooltipProvider>
                        <Tooltip delayDuration={300}>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-md bg-background border">
                            <p className="font-semibold mb-1">{t('supportLevelOptions.tooltipPatternTitle')}</p>
                            <div className="text-xs space-y-1">
                              <p><span className="text-green-600 font-semibold">never_breaks:</span> {t('supportLevelOptions.tooltipPatternNeverBreaks')}</p>
                              <p><span className="text-blue-600 font-semibold">exhausted_cascade:</span> {t('supportLevelOptions.tooltipPatternExhausted')}</p>
                              <p><span className="text-green-600 font-semibold">shallow_breaker:</span> {t('supportLevelOptions.tooltipPatternShallow')}</p>
                              <p><span className="text-red-600 font-semibold">volatile:</span> {t('supportLevelOptions.tooltipPatternVolatile')}</p>
                              <p><span className="text-green-600">stable:</span> {t('supportLevelOptions.tooltipPatternStable')}</p>
                              <p><span className="text-gray-600">predictable_cycles:</span> {t('supportLevelOptions.tooltipPatternPredictable')}</p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TableHead>
                  <TableHead
                    className="text-left min-w-[110px] cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleSort('stabilityTrend')}
                  >
                    <div className="flex items-center gap-1">
                      <span>{t('supportLevelOptions.colTrend')}</span>
                      {sortField === 'stabilityTrend' && (
                        sortDirection === 'asc' ?
                          <ArrowUp className="h-4 w-4" /> :
                          <ArrowDown className="h-4 w-4" />
                      )}
                      <TooltipProvider>
                        <Tooltip delayDuration={300}>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs bg-background border">
                            <p className="font-semibold mb-1">{t('supportLevelOptions.tooltipTrendTitle')}</p>
                            <p className="mb-2">{t('supportLevelOptions.tooltipTrendDesc')}</p>
                            <div className="text-xs space-y-1">
                              <p><span className="text-green-600">↑ improving:</span> {t('supportLevelOptions.tooltipTrendImproving')}</p>
                              <p><span className="text-gray-600">→ stable:</span> {t('supportLevelOptions.tooltipTrendStableDesc')}</p>
                              <p><span className="text-red-600">↓ weakening:</span> {t('supportLevelOptions.tooltipTrendWeakening')}</p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TableHead>
                  <TableHead
                    className="text-right min-w-[130px] cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleSort('maxConsecutiveBreaks')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>{t('supportLevelOptions.colMaxConsecutive')}</span>
                      {sortField === 'maxConsecutiveBreaks' && (
                        sortDirection === 'asc' ?
                          <ArrowUp className="h-4 w-4" /> :
                          <ArrowDown className="h-4 w-4" />
                      )}
                      <TooltipProvider>
                        <Tooltip delayDuration={300}>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs bg-background border">
                            <p className="font-semibold mb-1">{t('supportLevelOptions.tooltipMaxConsecTitle')}</p>
                            <p className="mb-2">{t('supportLevelOptions.tooltipMaxConsecDesc')}</p>
                            <div className="text-xs">
                              <p>{t('supportLevelOptions.tooltipMaxConsecScale')}</p>
                              <p className="mt-1">{t('supportLevelOptions.tooltipMaxConsecWorstCase')}</p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TableHead>
                  <TableHead
                    className="text-right min-w-[150px] cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleSort('currentConsecutiveBreaks')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>{t('supportLevelOptions.colCurrentConsecutive')}</span>
                      {sortField === 'currentConsecutiveBreaks' && (
                        sortDirection === 'asc' ?
                          <ArrowUp className="h-4 w-4" /> :
                          <ArrowDown className="h-4 w-4" />
                      )}
                      <TooltipProvider>
                        <Tooltip delayDuration={300}>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs bg-background border">
                            <p className="font-semibold mb-1">{t('supportLevelOptions.tooltipCurrConsecTitle')}</p>
                            <p className="mb-2">{t('supportLevelOptions.tooltipCurrConsecDesc')}</p>
                            <div className="text-xs space-y-1">
                              <p><strong>0:</strong> {t('supportLevelOptions.tooltipCurrConsec0')}</p>
                              <p><strong>1-2:</strong> {t('supportLevelOptions.tooltipCurrConsec12')}</p>
                              <p><strong>3-5:</strong> {t('supportLevelOptions.tooltipCurrConsec35')}</p>
                              <p><strong>6+:</strong> {t('supportLevelOptions.tooltipCurrConsec6plus')}</p>
                              <p className="mt-1 text-blue-600">{t('supportLevelOptions.tooltipCurrConsecNote')}</p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {supportBasedResults.map((option, idx) => {
                  const isExpanded = expandedRow === idx;
                  const metrics = getMetricsForStock(option.stockName, parseInt(rollingPeriod));

                  return (
                    <React.Fragment key={idx}>
                      <TableRow className="hover:bg-muted/50">
                        <TableCell className="text-center">
                          <button
                            onClick={() => toggleRowExpansion(idx)}
                            className="p-1 hover:bg-accent rounded transition-colors"
                            aria-label={isExpanded ? t('supportLevelOptions.ariaCollapseDetails') : t('supportLevelOptions.ariaExpandDetails')}
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </button>
                        </TableCell>
                        <TableCell
                          className="font-medium cursor-pointer hover:bg-accent/50 transition-colors"
                          onClick={() => handleStockClick(option.stockName)}
                        >
                          <span className="text-secondary-foreground hover:text-primary transition-colors">
                            {option.stockName}
                          </span>
                        </TableCell>
                    <TableCell
                      className="cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() => handleOptionClick(option.optionName)}
                    >
                      <span className="font-medium text-primary hover:opacity-80 transition-all">
                        {option.optionName}
                      </span>
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => window.open(getFullPath(`/consecutive-breaks?stock=${encodeURIComponent(option.stockName)}&period=${rollingPeriod}`), '_blank')}
                        className="text-primary hover:underline cursor-pointer text-xs"
                      >
                        {t('supportLevelOptions.viewAnalysis')}
                      </button>
                    </TableCell>
                    <TableCell className="text-right">{option.currentPrice.toFixed(2)} kr</TableCell>
                    <TableCell className="text-right font-semibold">{option.strikePrice.toFixed(2)} kr</TableCell>
                    <TableCell className="text-right">
                      {option.rollingLow ? `${option.rollingLow.toFixed(2)} kr` : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {option.distanceToSupport !== null ? `${option.distanceToSupport.toFixed(1)}%` : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {option.strikeVsSupport !== null ? (
                        <span className={option.strikeVsSupport < 0 ? 'text-green-600 font-semibold' : ''}>
                          {option.strikeVsSupport.toFixed(1)}%
                        </span>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {option.medianDropPerBreak !== null ? `${option.medianDropPerBreak.toFixed(2)}%` : '-'}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-green-700">
                      {option.premium.toFixed(0)} kr
                    </TableCell>
                    <TableCell className="text-right">{(option.powBayesianCalibrated * 100).toFixed(1)}%</TableCell>
                    <TableCell className="text-right">{(option.powOriginal * 100).toFixed(1)}%</TableCell>
                    <TableCell className="text-right">{option.daysToExpiry}d</TableCell>
                    <TableCell className="text-right">{option.supportStability.toFixed(1)}%</TableCell>
                    <TableCell className="text-right">
                      {option.daysSinceLastBreak !== null ? `${option.daysSinceLastBreak}d` : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={
                        option.supportStrengthScore && option.supportStrengthScore >= 70 ? 'text-green-600 font-semibold' :
                        option.supportStrengthScore && option.supportStrengthScore >= 50 ? 'text-yellow-600' :
                        'text-red-600'
                      }>
                        {option.supportStrengthScore?.toFixed(1) ?? '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={
                        option.patternType === 'never_breaks' ? 'text-green-700 font-semibold' :
                        option.patternType === 'exhausted_cascade' ? 'text-blue-600 font-semibold' :
                        option.patternType === 'shallow_breaker' ? 'text-green-600' :
                        option.patternType === 'volatile' ? 'text-red-600' :
                        'text-gray-600'
                      }>
                        {option.patternType ? option.patternType.replace(/_/g, ' ') : '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={
                        option.stabilityTrend === 'improving' ? 'text-green-600' :
                        option.stabilityTrend === 'weakening' ? 'text-red-600' :
                        'text-gray-600'
                      }>
                        {option.stabilityTrend === 'improving' ? '↑' : option.stabilityTrend === 'weakening' ? '↓' : '→'} {option.stabilityTrend ?? '-'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {option.maxConsecutiveBreaks ?? '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={option.currentConsecutiveBreaks && option.currentConsecutiveBreaks > 0 ? 'text-orange-600 font-semibold' : ''}>
                        {option.currentConsecutiveBreaks ?? '0'}
                      </span>
                    </TableCell>
                  </TableRow>

                  {/* Expanded row showing metric breakdown */}
                  {isExpanded && metrics && (
                    <TableRow>
                      <TableCell colSpan={20} className="p-0 bg-muted/20">
                        <SupportMetricsBreakdown
                          metrics={metrics}
                          rollingPeriod={parseInt(rollingPeriod)}
                        />
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })}
              </TableBody>
            </Table>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-center">
                {t('supportLevelOptions.noOptionsMatch')}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SupportBasedOptionFinder;
