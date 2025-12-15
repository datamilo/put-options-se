import React, { useState, useMemo, useEffect } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useSupportBasedOptionFinder, FilterCriteria, SupportBasedOption } from '@/hooks/useSupportBasedOptionFinder';
import { useEnrichedOptionsData } from '@/hooks/useEnrichedOptionsData';
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
import { Target, Info } from 'lucide-react';
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

export const SupportBasedOptionFinder = () => {
  usePageTitle('Support Level Options List');
  const navigate = useNavigate();
  const { findOptions, isLoading } = useSupportBasedOptionFinder();
  const { data: allOptionsData } = useEnrichedOptionsData();

  // Filter state
  const [rollingPeriod, setRollingPeriod] = useState<string>('90');
  const [minDaysSinceBreak, setMinDaysSinceBreak] = useState<string>('30');
  const [strikePosition, setStrikePosition] = useState<string>('below_median_drop');
  const [percentBelow, setPercentBelow] = useState<string>('5');
  const [selectedExpiryDate, setSelectedExpiryDate] = useState<string | null>(null);
  // Navigation handlers - open in new tab
  const handleOptionClick = (optionName: string) => {
    window.open(`/option/${encodeURIComponent(optionName)}`, '_blank');
  };

  const handleStockClick = (stockName: string) => {
    window.open(`/stock/${encodeURIComponent(stockName)}`, '_blank');
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

  // Find options based on current criteria
  const supportBasedResults = useMemo(() => {
    const criteria: FilterCriteria = {
      rollingPeriod: parseInt(rollingPeriod),
      minDaysSinceBreak: parseInt(minDaysSinceBreak),
      strikePosition: strikePosition as FilterCriteria['strikePosition'],
      percentBelow: strikePosition === 'percent_below' ? parseFloat(percentBelow) : undefined,
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
    strikePosition,
    percentBelow,
    selectedExpiryDate,
    findOptions,
  ]);


  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">Loading data...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
            <Target className="h-8 w-8" />
            Support Level Options List
          </h1>
          <p className="text-muted-foreground">
            Filter put options by support levels and analyze positioning relative to support
          </p>
        </div>

        {/* Configuration Panel */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Filter Criteria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Support Analysis Parameters */}
              <div>
                <h3 className="text-sm font-semibold mb-3 text-gray-700">Support Analysis</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="flex flex-col space-y-2">
                    <Label htmlFor="rolling-period" className="text-sm">
                      Rolling Low Period
                    </Label>
                    <Select value={rollingPeriod} onValueChange={setRollingPeriod}>
                      <SelectTrigger id="rolling-period">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">1-Month (30 days)</SelectItem>
                        <SelectItem value="90">3-Month (90 days)</SelectItem>
                        <SelectItem value="180">6-Month (180 days)</SelectItem>
                        <SelectItem value="270">9-Month (270 days)</SelectItem>
                        <SelectItem value="365">1-Year (365 days)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <Label htmlFor="days-since-break" className="text-sm">
                      Min Days Since Last Break
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
                      Expiry Date
                    </Label>
                    <Select value={selectedExpiryDate || ''} onValueChange={setSelectedExpiryDate}>
                      <SelectTrigger id="expiry-date">
                        <SelectValue placeholder="Select expiry date" />
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

              {/* Strike Position */}
              <div>
                <h3 className="text-sm font-semibold mb-3 text-gray-700">Strike Position</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col space-y-2">
                    <Label htmlFor="strike-position" className="text-sm">
                      Position Strategy
                    </Label>
                    <Select value={strikePosition} onValueChange={setStrikePosition}>
                      <SelectTrigger id="strike-position">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="at_support">At Support Level</SelectItem>
                        <SelectItem value="below_median_drop">At Median Drop Below Support</SelectItem>
                        <SelectItem value="percent_below">Custom % Below Support</SelectItem>
                        <SelectItem value="any">Any Position</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {strikePosition === 'percent_below' && (
                    <div className="flex flex-col space-y-2">
                      <Label htmlFor="percent-below" className="text-sm">
                        Percent Below Support
                      </Label>
                      <Input
                        id="percent-below"
                        type="number"
                        value={percentBelow}
                        onChange={(e) => setPercentBelow(e.target.value)}
                        min="0"
                        max="50"
                        step="1"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            Found <span className="font-bold text-foreground">{supportBasedResults.length}</span> options matching criteria
          </p>
        </div>

        {/* Results Table */}
        {supportBasedResults.length > 0 ? (
          <ScrollArea className="w-full rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[100px]">Stock</TableHead>
                  <TableHead className="min-w-[150px]">Option</TableHead>
                  <TableHead className="text-right min-w-[120px]">Current Price</TableHead>
                  <TableHead className="text-right min-w-[100px]">Strike</TableHead>
                  <TableHead className="text-right min-w-[120px]">Support ({rollingPeriod}d)</TableHead>
                  <TableHead className="text-right min-w-[140px]">Distance to Support</TableHead>
                  <TableHead className="text-right min-w-[140px]">Strike vs Support</TableHead>
                  <TableHead className="text-right min-w-[140px]">Median Drop/Break</TableHead>
                  <TableHead className="text-right min-w-[100px]">Premium</TableHead>
                  <TableHead className="text-right min-w-[130px]">PoW - Bayesian Calibrated</TableHead>
                  <TableHead className="text-right min-w-[130px]">PoW - Original</TableHead>
                  <TableHead className="text-right min-w-[100px]">Days to Expiry</TableHead>
                  <TableHead className="text-right min-w-[130px]">
                    <div className="flex items-center justify-end gap-1">
                      <span>Support Stability</span>
                      <TooltipProvider>
                        <Tooltip delayDuration={300}>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs bg-background border">
                            <p>Percentage of trading days within the rolling period where the rolling low held without being broken. Higher percentage indicates more stable support. For example, 85% means the support level held on 85% of days and was broken on 15% of days.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TableHead>
                  <TableHead className="text-right min-w-[130px]">Days Since Break</TableHead>
                  <TableHead className="min-w-[100px]">Support Analysis</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {supportBasedResults.map((option, idx) => (
                  <TableRow key={idx} className="hover:bg-muted/50">
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
                    <TableCell className="text-right">{option.currentPrice.toFixed(2)} kr</TableCell>
                    <TableCell className="text-right font-semibold">{option.strikePrice.toFixed(2)} kr</TableCell>
                    <TableCell className="text-right">
                      {option.rollingLow ? `${option.rollingLow.toFixed(2)} kr` : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {option.distanceToSupport !== null ? (
                        <span className={option.distanceToSupport < 5 ? 'text-orange-600 font-semibold' : ''}>
                          {option.distanceToSupport.toFixed(1)}%
                        </span>
                      ) : '-'}
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
                    <TableCell>
                      <button
                        onClick={() => window.open(`/consecutive-breaks?stock=${option.stockName}`, '_blank')}
                        className="text-primary hover:underline cursor-pointer text-xs"
                      >
                        View Analysis
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-center">
                No options match the current criteria. Try relaxing some filters.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SupportBasedOptionFinder;
