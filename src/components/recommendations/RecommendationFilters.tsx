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
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation('pages');

  const updateFilter = (key: keyof RecommendationFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Expiry Date */}
        <div className="space-y-2">
          <Label htmlFor="expiry-date">{t('recommendations.filterExpiryDate')}</Label>
          <Select
            value={filters.expiryDate}
            onValueChange={(value) => updateFilter('expiryDate', value)}
          >
            <SelectTrigger id="expiry-date">
              <SelectValue placeholder={t('common:filter.selectExpiryDate')} />
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
          <Label htmlFor="rolling-period">{t('recommendations.filterRollingLowPeriod')}</Label>
          <Select
            value={filters.rollingPeriod.toString()}
            onValueChange={(value) => updateFilter('rollingPeriod', parseInt(value))}
          >
            <SelectTrigger id="rolling-period">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">{t('recommendations.rollingPeriod30')}</SelectItem>
              <SelectItem value="90">{t('recommendations.rollingPeriod90')}</SelectItem>
              <SelectItem value="180">{t('recommendations.rollingPeriod180')}</SelectItem>
              <SelectItem value="270">{t('recommendations.rollingPeriod270')}</SelectItem>
              <SelectItem value="365">{t('recommendations.rollingPeriod365')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Min Days Since Last Break */}
        <div className="space-y-2">
          <Label htmlFor="min-days-since-break">{t('recommendations.filterMinDaysSinceBreak')}</Label>
          <Input
            id="min-days-since-break"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={filters.minDaysSinceBreak}
            onChange={(e) => {
              const value = e.target.value.trim();
              if (value === '') {
                updateFilter('minDaysSinceBreak', 0);
                return;
              }
              if (!/^\d+$/.test(value)) {
                return;
              }
              const parsed = parseInt(value, 10);
              if (!isNaN(parsed) && parsed >= 0) {
                updateFilter('minDaysSinceBreak', parsed);
              }
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Probability Method */}
        <div className="space-y-2">
          <Label htmlFor="prob-method">{t('recommendations.filterProbabilityMethod')}</Label>
          <Select
            value={filters.probabilityMethod}
            onValueChange={(value) => updateFilter('probabilityMethod', value)}
          >
            <SelectTrigger id="prob-method">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ProbWorthless_Bayesian_IsoCal">
                {t('charts:methods.bayesianCalibrated')}
              </SelectItem>
              <SelectItem value="1_2_3_ProbOfWorthless_Weighted">
                {t('charts:methods.weightedAverage')}
              </SelectItem>
              <SelectItem value="1_ProbOfWorthless_Original">
                {t('charts:methods.originalBlackScholes')}
              </SelectItem>
              <SelectItem value="2_ProbOfWorthless_Calibrated">
                {t('charts:methods.biasCorreected')}
              </SelectItem>
              <SelectItem value="3_ProbOfWorthless_Historical_IV">
                {t('charts:methods.historicalIV')}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Historical Peak Threshold */}
        <div className="space-y-2">
          <Label htmlFor="peak-threshold">{t('recommendations.filterHistoricalPeakThreshold')}</Label>
          <Select
            value={filters.historicalPeakThreshold.toFixed(2)}
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
            {isAnalyzing ? t('recommendations.analyzing') : t('recommendations.analyze')}
          </Button>
        </div>
      </div>
    </div>
  );
};
