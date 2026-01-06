import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import type { RecommendationFilters } from '@/types/recommendations';

interface RecommendationFiltersProps {
  filters: RecommendationFilters;
  onFiltersChange: (filters: RecommendationFilters) => void;
  onAnalyze: () => void;
  availableExpiryDates: string[];
  isAnalyzing: boolean;
}

export const RecommendationFiltersComponent: React.FC<RecommendationFiltersProps> = ({
  filters,
  onFiltersChange,
  onAnalyze,
  availableExpiryDates,
  isAnalyzing,
}) => {
  const updateFilter = (key: keyof RecommendationFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Expiry Date */}
        <div className="space-y-2">
          <Label htmlFor="expiry-date">Expiry Date</Label>
          <Select
            value={filters.expiryDate}
            onValueChange={(value) => updateFilter('expiryDate', value)}
          >
            <SelectTrigger id="expiry-date">
              <SelectValue placeholder="Select expiry date" />
            </SelectTrigger>
            <SelectContent>
              {availableExpiryDates.map((date) => (
                <SelectItem key={date} value={date}>
                  {date}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Rolling Low Period */}
        <div className="space-y-2">
          <Label htmlFor="rolling-period">Rolling Low Period</Label>
          <Select
            value={filters.rollingPeriod.toString()}
            onValueChange={(value) => updateFilter('rollingPeriod', parseInt(value))}
          >
            <SelectTrigger id="rolling-period">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">30 days (1-Month)</SelectItem>
              <SelectItem value="90">90 days (3-Month)</SelectItem>
              <SelectItem value="180">180 days (6-Month)</SelectItem>
              <SelectItem value="270">270 days (9-Month)</SelectItem>
              <SelectItem value="365">365 days (1-Year)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Min Days Since Last Break */}
        <div className="space-y-2">
          <Label htmlFor="min-days-since-break">Min Days Since Last Break</Label>
          <Input
            id="min-days-since-break"
            type="number"
            min="0"
            step="5"
            value={filters.minDaysSinceBreak}
            onChange={(e) =>
              updateFilter('minDaysSinceBreak', parseInt(e.target.value) || 0)
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Probability Method */}
        <div className="space-y-2">
          <Label htmlFor="prob-method">Probability Method</Label>
          <Select
            value={filters.probabilityMethod}
            onValueChange={(value) => updateFilter('probabilityMethod', value)}
          >
            <SelectTrigger id="prob-method">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ProbWorthless_Bayesian_IsoCal">
                PoW - Bayesian Calibrated
              </SelectItem>
              <SelectItem value="1_2_3_ProbOfWorthless_Weighted">
                PoW - Weighted Average
              </SelectItem>
              <SelectItem value="1_ProbOfWorthless_Original">
                PoW - Original Black-Scholes
              </SelectItem>
              <SelectItem value="2_ProbOfWorthless_Calibrated">
                PoW - Bias Corrected
              </SelectItem>
              <SelectItem value="3_ProbOfWorthless_Historical_IV">
                PoW - Historical IV
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Historical Peak Threshold */}
        <div className="space-y-2">
          <Label htmlFor="peak-threshold">Historical Peak Threshold</Label>
          <Select
            value={filters.historicalPeakThreshold.toString()}
            onValueChange={(value) =>
              updateFilter('historicalPeakThreshold', parseFloat(value))
            }
          >
            <SelectTrigger id="peak-threshold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0.80">80%</SelectItem>
              <SelectItem value="0.90">90%</SelectItem>
              <SelectItem value="0.95">95%</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Analyze Button */}
        <div className="space-y-2 flex items-end">
          <Button
            onClick={onAnalyze}
            disabled={isAnalyzing || !filters.expiryDate}
            className="w-full"
            size="lg"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            {isAnalyzing ? 'Analyzing...' : 'Analyze'}
          </Button>
        </div>
      </div>
    </div>
  );
};
