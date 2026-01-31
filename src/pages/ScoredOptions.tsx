import React, { useState, useEffect, useMemo } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useScoredOptionsData } from '@/hooks/useScoredOptionsData';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Target, Download, TrendingUp, CheckCircle } from 'lucide-react';
import { calculateDefaultExpiryDate } from '@/lib/utils';
import { exportScoredOptionsToExcel } from '@/utils/scoredOptionsExport';
import { ScoredOptionsFiltersComponent } from '@/components/scored-options/ScoredOptionsFilters';
import { ScoredOptionsTable } from '@/components/scored-options/ScoredOptionsTable';
import { ScoredOptionsFilters } from '@/types/scoredOptions';
import { InfoIconTooltip } from '@/components/ui/info-icon-tooltip';
import scoredOptionsTooltips from '@/utils/scoredOptionsTooltips';

export const ScoredOptions = () => {
  usePageTitle('Scored Options Recommendations');
  const { data, isLoading, error } = useScoredOptionsData();
  const { toast } = useToast();

  // Initialize filters with default values
  const [filters, setFilters] = useState<ScoredOptionsFilters>(() => ({
    expiryDate: '',
    stockNames: [],
    agreement: 'all',
    minScore: 70,
    minV21Score: 0,
    minTAProb: 0,
  }));

  // Get available expiry dates from data
  const availableExpiryDates = useMemo(() => {
    if (!data || data.length === 0) return [];
    return [...new Set(data.map((option) => option.expiry_date))].sort();
  }, [data]);

  // Get available stocks from data
  const availableStocks = useMemo(() => {
    if (!data || data.length === 0) return [];
    return [...new Set(data.map((option) => option.stock_name))].sort();
  }, [data]);

  // Initialize default expiry date
  useEffect(() => {
    if (!filters.expiryDate && availableExpiryDates.length > 0) {
      const defaultDate = calculateDefaultExpiryDate(availableExpiryDates);
      if (defaultDate) {
        setFilters((prev) => ({ ...prev, expiryDate: defaultDate }));
      }
    }
  }, [availableExpiryDates, filters.expiryDate]);

  // Filter data based on current filters
  const filteredData = useMemo(() => {
    return data.filter((option) => {
      // Expiry date filter
      if (filters.expiryDate && option.expiry_date !== filters.expiryDate) {
        return false;
      }

      // Stock filter
      if (filters.stockNames.length > 0 && !filters.stockNames.includes(option.stock_name)) {
        return false;
      }

      // Agreement filter
      if (filters.agreement === 'agree' && !option.models_agree) {
        return false;
      }
      if (filters.agreement === 'disagree' && option.models_agree) {
        return false;
      }

      // Min combined score filter - only exclude null values if minimum > 0
      if (option.combined_score == null) {
        if (filters.minScore > 0) {
          return false;
        }
      } else if (option.combined_score < filters.minScore) {
        return false;
      }

      // Min V2.1 score filter - only exclude null values if minimum > 0
      if (option.v21_score == null) {
        if (filters.minV21Score > 0) {
          return false;
        }
      } else if (option.v21_score < filters.minV21Score) {
        return false;
      }

      // Min TA probability filter - only exclude null values if minimum > 0 (convert to 0-100 scale)
      if (option.ta_probability == null) {
        if (filters.minTAProb > 0) {
          return false;
        }
      } else if (option.ta_probability * 100 < filters.minTAProb) {
        return false;
      }

      return true;
    });
  }, [data, filters]);

  // Calculate summary statistics
  const summary = useMemo(() => {
    return {
      totalOptions: data.length,
      bothAgreeCount: data.filter((opt) => opt.models_agree).length,
      strongAgreementCount: data.filter((opt) => opt.models_agree && opt.agreement_strength === 'Strong').length,
      currentlyShowing: filteredData.length,
    };
  }, [data, filteredData]);

  // Helper to get full path for links
  const getFullPath = (path: string) => {
    const isGitHubPages = window.location.hostname === 'datamilo.github.io';
    const basename = isGitHubPages ? '/put-options-se' : '';
    return basename + path;
  };

  // Handle Excel export
  const handleExport = () => {
    if (filteredData.length === 0) {
      toast({
        title: 'No data to export',
        description: 'Please adjust your filters to include at least one option.',
        variant: 'destructive',
      });
      return;
    }

    exportScoredOptionsToExcel({
      filename: 'scored-options',
      data: filteredData,
    });

    toast({
      title: 'Export successful',
      description: `Exported ${filteredData.length} scored options to Excel`,
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Target className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Scored Options Recommendations</h1>
        </div>
        <p className="text-muted-foreground">
          Dual-model analysis combining Probability Optimization Score with TA ML Model technical analysis indicators. Identifies high-probability put writing opportunities with model agreement validation.
        </p>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800">
              <strong>Error loading data:</strong> {error}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              Loading scored options data...
            </div>
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && (
        <>
          {/* Summary KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Options */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-sm text-muted-foreground">Total Options</p>
                      <InfoIconTooltip
                        title={scoredOptionsTooltips.kpi.totalOptions.title}
                        content={scoredOptionsTooltips.kpi.totalOptions.content}
                      />
                    </div>
                    <p className="text-3xl font-bold mt-2">{summary.totalOptions}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            {/* Models Agree Count */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-sm text-muted-foreground">Models Agree</p>
                      <InfoIconTooltip
                        title={scoredOptionsTooltips.kpi.modelsAgree.title}
                        content={scoredOptionsTooltips.kpi.modelsAgree.content}
                      />
                    </div>
                    <p className="text-3xl font-bold mt-2">{summary.bothAgreeCount}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {summary.totalOptions > 0
                        ? ((summary.bothAgreeCount / summary.totalOptions) * 100).toFixed(0)
                        : 0}
                      %
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            {/* Strong Agreement Count */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-sm text-muted-foreground">Strong Agreement</p>
                      <InfoIconTooltip
                        title={scoredOptionsTooltips.kpi.strongAgreement.title}
                        content={scoredOptionsTooltips.kpi.strongAgreement.content}
                      />
                    </div>
                    <p className="text-3xl font-bold mt-2">{summary.strongAgreementCount}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {summary.bothAgreeCount > 0
                        ? ((summary.strongAgreementCount / summary.bothAgreeCount) * 100).toFixed(0)
                        : 0}
                      %
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-700" />
                </div>
              </CardContent>
            </Card>

            {/* Currently Showing */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-sm text-muted-foreground">Showing</p>
                      <InfoIconTooltip
                        title={scoredOptionsTooltips.kpi.showing.title}
                        content={scoredOptionsTooltips.kpi.showing.content}
                      />
                    </div>
                    <p className="text-3xl font-bold mt-2">{summary.currentlyShowing}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {summary.totalOptions > 0
                        ? ((summary.currentlyShowing / summary.totalOptions) * 100).toFixed(0)
                        : 0}
                      %
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-amber-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Validation Metrics Section */}
          <div className="mt-8">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-2xl font-bold">Validation Metrics</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Walk-Forward AUC Card */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <p className="text-sm text-muted-foreground">Walk-Forward AUC</p>
                        <InfoIconTooltip
                          title={scoredOptionsTooltips.validation.walkForwardAUC.title}
                          content={scoredOptionsTooltips.validation.walkForwardAUC.content}
                        />
                      </div>
                      <p className="text-3xl font-bold mt-2">0.651</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Proves genuine future prediction ability
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Hit Rate Card */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <p className="text-sm text-muted-foreground">Hit Rate (70-80%)</p>
                        <InfoIconTooltip
                          title={scoredOptionsTooltips.validation.hitRate77.title}
                          content={scoredOptionsTooltips.validation.hitRate77.content}
                        />
                      </div>
                      <p className="text-3xl font-bold mt-2">77%</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        21+ months historical data
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Calibration Error Card */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <p className="text-sm text-muted-foreground">Calibration Error</p>
                        <InfoIconTooltip
                          title={scoredOptionsTooltips.validation.calibrationError.title}
                          content={scoredOptionsTooltips.validation.calibrationError.content}
                        />
                      </div>
                      <p className="text-3xl font-bold mt-2">2.4%</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Predictions match reality
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Coverage Card */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Coverage</p>
                      <p className="text-3xl font-bold mt-2">99.9%</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        5,738 of 5,743 options
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Filters */}
          <ScoredOptionsFiltersComponent
            filters={filters}
            onFiltersChange={setFilters}
            availableStocks={availableStocks}
            availableExpiryDates={availableExpiryDates}
          />

          {/* Export Button */}
          {filteredData.length > 0 && (
            <div className="flex justify-end">
              <Button
                onClick={handleExport}
                variant="outline"
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Export to Excel
              </Button>
            </div>
          )}

          {/* Table */}
          {filteredData.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-muted-foreground">
                  <p>No options found matching your filters.</p>
                  <p className="text-sm mt-2">Try adjusting your filter criteria.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <ScoredOptionsTable
              data={filteredData}
              filters={filters}
              getFullPath={getFullPath}
            />
          )}

          {/* Critical Disclaimers Section */}
          <div className="mt-12 p-6 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg space-y-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div className="flex-1">
                <h3 className="font-semibold text-amber-900 dark:text-amber-50 mb-3">
                  Critical Disclaimers & Risk Factors
                </h3>

                {/* Disclaimer 1: Hit Rate Reality */}
                <div className="mb-4 p-3 bg-white dark:bg-amber-900/30 rounded">
                  <div className="flex items-start gap-2 mb-2">
                    <span className="font-semibold text-amber-900 dark:text-amber-50">
                      77% Hit Rate ≠ No Losses
                    </span>
                    <InfoIconTooltip
                      title={scoredOptionsTooltips.disclaimers.riskHitRate.title}
                      content={scoredOptionsTooltips.disclaimers.riskHitRate.content}
                      side="left"
                    />
                  </div>
                  <p className="text-sm text-amber-800 dark:text-amber-100">
                    23% of options in the 70-80% range will expire in-the-money. Position sizing must account for expected losses.
                  </p>
                </div>

                {/* Disclaimer 2: Market Regime Risk */}
                <div className="mb-4 p-3 bg-white dark:bg-amber-900/30 rounded">
                  <div className="flex items-start gap-2 mb-2">
                    <span className="font-semibold text-amber-900 dark:text-amber-50">
                      Market Regime Changes
                    </span>
                    <InfoIconTooltip
                      title={scoredOptionsTooltips.disclaimers.marketRegimeRisk.title}
                      content={scoredOptionsTooltips.disclaimers.marketRegimeRisk.content}
                      side="left"
                    />
                  </div>
                  <p className="text-sm text-amber-800 dark:text-amber-100">
                    Models trained on 21+ months of data. Extreme market shocks (geopolitical, rate changes) may reduce pattern relevance. Monitor monthly performance.
                  </p>
                </div>

                {/* Disclaimer 3: No Guarantees */}
                <div className="p-3 bg-white dark:bg-amber-900/30 rounded">
                  <div className="flex items-start gap-2 mb-2">
                    <span className="font-semibold text-amber-900 dark:text-amber-50">
                      No Future Guarantees
                    </span>
                    <InfoIconTooltip
                      title={scoredOptionsTooltips.disclaimers.noGuarantees.title}
                      content={scoredOptionsTooltips.disclaimers.noGuarantees.content}
                      side="left"
                    />
                  </div>
                  <p className="text-sm text-amber-800 dark:text-amber-100">
                    Past walk-forward validation (0.651 AUC) does NOT guarantee future results. Use as screening tool component, not sole decision-maker.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
