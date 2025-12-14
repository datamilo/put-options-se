import React, { useState, useMemo } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useSupportBasedOptionFinder, FilterCriteria } from '@/hooks/useSupportBasedOptionFinder';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Link } from 'react-router-dom';

export const SupportBasedOptionFinder = () => {
  usePageTitle('Smart Option Finder');
  const { findOptions, isLoading } = useSupportBasedOptionFinder();

  // Filter state
  const [rollingPeriod] = useState<number>(90);
  const [minSupportStability, setMinSupportStability] = useState<string>('85');
  const [minDaysSinceBreak, setMinDaysSinceBreak] = useState<string>('30');
  const [strikePosition, setStrikePosition] = useState<string>('below_median_drop');
  const [percentBelow, setPercentBelow] = useState<string>('5');
  const [minProbOfWorthless, setMinProbOfWorthless] = useState<string>('0.70');
  const [maxDaysToExpiry, setMaxDaysToExpiry] = useState<string>('90');
  const [minPremium, setMinPremium] = useState<string>('1000');
  const [requireStrikeBelowLowerAtAcc, setRequireStrikeBelowLowerAtAcc] = useState<boolean>(true);
  const [maxBidAskSpread, setMaxBidAskSpread] = useState<string>('10');

  // Find options based on current criteria
  const results = useMemo(() => {
    const criteria: FilterCriteria = {
      rollingPeriod,
      minSupportStability: parseFloat(minSupportStability),
      minDaysSinceBreak: parseInt(minDaysSinceBreak),
      strikePosition: strikePosition as FilterCriteria['strikePosition'],
      percentBelow: strikePosition === 'percent_below' ? parseFloat(percentBelow) : undefined,
      minProbOfWorthless: parseFloat(minProbOfWorthless),
      maxDaysToExpiry: parseInt(maxDaysToExpiry),
      minPremium: parseFloat(minPremium),
      requireStrikeBelowLowerAtAcc,
      maxBidAskSpread: parseFloat(maxBidAskSpread),
    };

    return findOptions(criteria);
  }, [
    rollingPeriod,
    minSupportStability,
    minDaysSinceBreak,
    strikePosition,
    percentBelow,
    minProbOfWorthless,
    maxDaysToExpiry,
    minPremium,
    requireStrikeBelowLowerAtAcc,
    maxBidAskSpread,
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
            Smart Option Finder
          </h1>
          <p className="text-muted-foreground">
            Find put options strategically positioned relative to support levels
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

              {/* Option Criteria */}
              <div>
                <h3 className="text-sm font-semibold mb-3 text-gray-700">Option Criteria</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex flex-col space-y-2">
                    <Label htmlFor="min-pow" className="text-sm">
                      Min Probability of Worthless
                    </Label>
                    <Input
                      id="min-pow"
                      type="number"
                      value={minProbOfWorthless}
                      onChange={(e) => setMinProbOfWorthless(e.target.value)}
                      min="0"
                      max="1"
                      step="0.05"
                    />
                  </div>
                  <div className="flex flex-col space-y-2">
                    <Label htmlFor="max-days" className="text-sm">
                      Max Days to Expiry
                    </Label>
                    <Input
                      id="max-days"
                      type="number"
                      value={maxDaysToExpiry}
                      onChange={(e) => setMaxDaysToExpiry(e.target.value)}
                      min="1"
                      step="10"
                    />
                  </div>
                  <div className="flex flex-col space-y-2">
                    <Label htmlFor="min-premium" className="text-sm">
                      Min Premium (SEK)
                    </Label>
                    <Input
                      id="min-premium"
                      type="number"
                      value={minPremium}
                      onChange={(e) => setMinPremium(e.target.value)}
                      min="0"
                      step="500"
                    />
                  </div>
                  <div className="flex flex-col space-y-2">
                    <Label htmlFor="max-spread" className="text-sm">
                      Max Bid-Ask Spread (SEK)
                    </Label>
                    <Input
                      id="max-spread"
                      type="number"
                      value={maxBidAskSpread}
                      onChange={(e) => setMaxBidAskSpread(e.target.value)}
                      min="0"
                      step="1"
                    />
                  </div>
                </div>
              </div>

              {/* Safety Filters */}
              <div>
                <h3 className="text-sm font-semibold mb-3 text-gray-700">Safety Filters</h3>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="require-lower-acc"
                    checked={requireStrikeBelowLowerAtAcc}
                    onChange={(e) => setRequireStrikeBelowLowerAtAcc(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="require-lower-acc" className="text-sm cursor-pointer">
                    Require Strike Below Lower Bound at Accuracy
                  </Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            Found <span className="font-bold text-foreground">{results.length}</span> options matching criteria
          </p>
        </div>

        {/* Results Table */}
        {results.length > 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-blue-50">
                      <TableHead className="text-blue-900">Stock</TableHead>
                      <TableHead className="text-blue-900">Option</TableHead>
                      <TableHead className="text-blue-900 text-right">Current Price</TableHead>
                      <TableHead className="text-blue-900 text-right">Strike</TableHead>
                      <TableHead className="text-blue-900 text-right">Support (90d)</TableHead>
                      <TableHead className="text-blue-900 text-right">Distance to Support</TableHead>
                      <TableHead className="text-blue-900 text-right">Strike vs Support</TableHead>
                      <TableHead className="text-blue-900 text-right">Median Drop/Break</TableHead>
                      <TableHead className="text-blue-900 text-right">Premium</TableHead>
                      <TableHead className="text-blue-900 text-right">PoW</TableHead>
                      <TableHead className="text-blue-900 text-right">Days to Expiry</TableHead>
                      <TableHead className="text-blue-900 text-right">Support Stability</TableHead>
                      <TableHead className="text-blue-900 text-right">Days Since Break</TableHead>
                      <TableHead className="text-blue-900">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((option, idx) => (
                      <TableRow key={idx} className="hover:bg-blue-50">
                        <TableCell className="font-medium">{option.stockName}</TableCell>
                        <TableCell className="font-mono text-xs">{option.optionName}</TableCell>
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
                            <Link
                              to={`/?search=${option.optionName}`}
                              className="text-blue-600 hover:underline"
                            >
                              View
                            </Link>
                            <Link
                              to={`/consecutive-breaks?stock=${option.stockName}`}
                              className="text-blue-600 hover:underline"
                            >
                              Support
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
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
