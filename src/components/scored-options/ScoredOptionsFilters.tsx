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
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ScoredOptionsFilters } from '@/types/scoredOptions';
import { ChevronDown } from 'lucide-react';

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

  const handleMinDTEChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10) || 0;
    onFiltersChange({
      ...filters,
      minDaysToExpiry: value,
    });
  };

  const handleMaxDTEChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10) || 999;
    onFiltersChange({
      ...filters,
      maxDaysToExpiry: value,
    });
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Expiry Date */}
          <div className="space-y-2">
            <Label htmlFor="expiry">Expiry Date</Label>
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
            <Label>Stocks</Label>
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
            <Label htmlFor="agreement">Model Agreement</Label>
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
            <Label>Min Combined Score: {filters.minScore}</Label>
            <Slider
              value={[filters.minScore]}
              onValueChange={handleMinScoreChange}
              min={0}
              max={100}
              step={1}
              className="mt-2"
            />
          </div>

          {/* Min Days to Expiry */}
          <div className="space-y-2">
            <Label htmlFor="minDte">Min Days to Expiry</Label>
            <Input
              id="minDte"
              type="number"
              min="0"
              max="365"
              value={filters.minDaysToExpiry}
              onChange={handleMinDTEChange}
              placeholder="0"
            />
          </div>

          {/* Max Days to Expiry */}
          <div className="space-y-2">
            <Label htmlFor="maxDte">Max Days to Expiry</Label>
            <Input
              id="maxDte"
              type="number"
              min="0"
              max="999"
              value={filters.maxDaysToExpiry}
              onChange={handleMaxDTEChange}
              placeholder="999"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
