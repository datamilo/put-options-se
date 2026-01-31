import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ScoredOptionsFilters } from '@/types/scoredOptions';
import { ChevronDown } from 'lucide-react';
import { InfoIconTooltip } from '@/components/ui/info-icon-tooltip';
import scoredOptionsTooltips from '@/utils/scoredOptionsTooltips';

interface ScoredOptionsFiltersComponentProps {
  filters: ScoredOptionsFilters;
  onFiltersChange: (filters: ScoredOptionsFilters) => void;
  availableStocks: string[];
  availableExpiryDates: string[];
}

export const ScoredOptionsFiltersComponent: React.FC<ScoredOptionsFiltersComponentProps> = ({
  filters,
  onFiltersChange,
  availableStocks,
  availableExpiryDates,
}) => {
  const handleExpiryChange = (value: string) => {
    onFiltersChange({
      ...filters,
      expiryDate: value,
    });
  };

  const handleStockChange = (stock: string) => {
    const newStocks = filters.stockNames.includes(stock)
      ? filters.stockNames.filter((s) => s !== stock)
      : [...filters.stockNames, stock];

    onFiltersChange({
      ...filters,
      stockNames: newStocks,
    });
  };

  const handleClearAllStocks = () => {
    onFiltersChange({
      ...filters,
      stockNames: [],
    });
  };

  const handleAgreementChange = (value: 'all' | 'agree' | 'disagree') => {
    onFiltersChange({
      ...filters,
      agreement: value,
    });
  };

  const handleMinScoreChange = (value: number[]) => {
    onFiltersChange({
      ...filters,
      minScore: value[0],
    });
  };

  const handleMinV21ScoreChange = (value: number[]) => {
    onFiltersChange({
      ...filters,
      minV21Score: value[0],
    });
  };

  const handleMinTAProbChange = (value: number[]) => {
    onFiltersChange({
      ...filters,
      minTAProb: value[0],
    });
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Expiry Date */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="expiry">Expiry Date</Label>
              <InfoIconTooltip
                content={scoredOptionsTooltips.filters.expiryDate.content}
                side="bottom"
              />
            </div>
            <Select value={filters.expiryDate} onValueChange={handleExpiryChange}>
              <SelectTrigger id="expiry">
                <SelectValue placeholder="Select expiry date" />
              </SelectTrigger>
              <SelectContent>
                {availableExpiryDates.map((date) => (
                  <SelectItem key={date} value={date}>
                    {new Date(date).toLocaleDateString('sv-SE')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Stock Names */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>Stocks</Label>
              <InfoIconTooltip
                content={scoredOptionsTooltips.filters.stocks.content}
                side="bottom"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <span className="truncate">
                    {filters.stockNames.length === 0
                      ? 'All stocks'
                      : `${filters.stockNames.length} selected`}
                  </span>
                  <ChevronDown className="h-4 w-4 ml-2 flex-shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 max-h-64 overflow-y-auto">
                {filters.stockNames.length > 0 && (
                  <>
                    <button
                      onClick={handleClearAllStocks}
                      className="w-full px-2 py-1.5 text-sm text-left hover:bg-accent hover:text-accent-foreground rounded-sm"
                    >
                      Clear all stocks
                    </button>
                    <DropdownMenuSeparator />
                  </>
                )}
                {availableStocks.map((stock) => (
                  <DropdownMenuCheckboxItem
                    key={stock}
                    checked={filters.stockNames.includes(stock)}
                    onCheckedChange={() => handleStockChange(stock)}
                  >
                    {stock}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Agreement Filter */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="agreement">Model Agreement</Label>
              <InfoIconTooltip
                content={scoredOptionsTooltips.filters.modelAgreement.content}
                side="bottom"
              />
            </div>
            <Select value={filters.agreement} onValueChange={handleAgreementChange}>
              <SelectTrigger id="agreement">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Options</SelectItem>
                <SelectItem value="agree">Models Agree</SelectItem>
                <SelectItem value="disagree">Models Disagree</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Min Combined Score */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>Min Combined Score: {filters.minScore}</Label>
              <InfoIconTooltip
                content={scoredOptionsTooltips.filters.minCombinedScore.content}
                side="bottom"
              />
            </div>
            <Slider
              value={[filters.minScore]}
              onValueChange={handleMinScoreChange}
              min={0}
              max={100}
              step={1}
              className="mt-2"
            />
          </div>

          {/* Min Probability Optimization Score */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>Min Probability Optimization Score: {filters.minV21Score}</Label>
              <InfoIconTooltip
                content={scoredOptionsTooltips.filters.minV21Score.content}
                side="bottom"
              />
            </div>
            <Slider
              value={[filters.minV21Score]}
              onValueChange={handleMinV21ScoreChange}
              min={0}
              max={100}
              step={1}
              className="mt-2"
            />
          </div>

          {/* Min TA Probability */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>Min TA Prob: {filters.minTAProb}%</Label>
              <InfoIconTooltip
                content={scoredOptionsTooltips.filters.minTAProb.content}
                side="bottom"
              />
            </div>
            <Slider
              value={[filters.minTAProb]}
              onValueChange={handleMinTAProbChange}
              min={0}
              max={100}
              step={1}
              className="mt-2"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
