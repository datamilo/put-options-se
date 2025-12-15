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
import { Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
  const [minSupportStability, setMinSupportStability] = useState<string>('85');
  const [minDaysSinceBreak, setMinDaysSinceBreak] = useState<string>('30');
  const [strikePosition, setStrikePosition] = useState<string>('below_median_drop');
  const [percentBelow, setPercentBelow] = useState<string>('5');
  const [selectedExpiryDate, setSelectedExpiryDate] = useState<string | null>(null);
  // Navigation handlers
  const handleOptionClick = (optionName: string) => {
    navigate(`/option/${encodeURIComponent(optionName)}`);
  };

  const handleStockClick = (stockName: string) => {
    navigate(`/stock/${encodeURIComponent(stockName)}`);
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
      minSupportStability: parseFloat(minSupportStability),
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
    minSupportStability,
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
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
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
                    <Label htmlFor="support-stability" className="text-sm">
                      Min Support Stability (%)
                    </Label>
                    <Input
                      id="support-stability"
                      type="number"
                      value={minSupportStability}
                      onChange={(e) => setMinSupportStability(e.target.value)}
                      min="0"
                      max="100"
                      step="5"
                    />
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
                  <TableHead className="text-right min-w-[80px]">PoW</TableHead>
                  <TableHead className="text-right min-w-[100px]">Days to Expiry</TableHead>
                  <TableHead className="text-right min-w-[130px]">Support Stability</TableHead>
                  <TableHead className="text-right min-w-[130px]">Days Since Break</TableHead>
                  <TableHead className="min-w-[100px]">Actions</TableHead>
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
                    <TableCell className="text-right">{(option.probOfWorthless * 100).toFixed(1)}%</TableCell>
                    <TableCell className="text-right">{option.daysToExpiry}d</TableCell>
                    <TableCell className="text-right">{option.supportStability.toFixed(1)}%</TableCell>
                    <TableCell className="text-right">
                      {option.daysSinceLastBreak !== null ? `${option.daysSinceLastBreak}d` : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2 text-xs">
                        <button
                          onClick={() => handleOptionClick(option.optionName)}
                          className="text-primary hover:underline cursor-pointer"
                        >
                          View
                        </button>
                        <button
                          onClick={() => navigate(`/consecutive-breaks?stock=${option.stockName}`)}
                          className="text-primary hover:underline cursor-pointer"
                        >
                          Support
                        </button>
                      </div>
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
