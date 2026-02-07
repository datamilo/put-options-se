import React, { useState, useEffect, useMemo } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useScoredOptionsData } from '@/hooks/useScoredOptionsData';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Target, Download, TrendingUp, CheckCircle, Database } from 'lucide-react';
import { calculateDefaultExpiryDate } from '@/lib/utils';
import { exportScoredOptionsToExcel } from '@/utils/scoredOptionsExport';
import { ScoredOptionsFiltersComponent } from '@/components/scored-options/ScoredOptionsFilters';
import { ScoredOptionsTable } from '@/components/scored-options/ScoredOptionsTable';
import { CalibrationMetrics } from '@/components/scored-options/CalibrationMetrics';
import { ScoredOptionsFilters } from '@/types/scoredOptions';
import { InfoIconTooltip } from '@/components/ui/info-icon-tooltip';
import scoredOptionsTooltips from '@/utils/scoredOptionsTooltips';
import { calculateFilteredKPIs } from '@/utils/scoredOptionsKpiCalculations';
import { KpiCard } from '@/components/scored-options/KpiCard';
import { calibrationMetricsData } from '@/data/calibrationMetrics';

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

      // Min Probability Optimization score filter - only exclude null values if minimum > 0
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
      currentlyShowing: filteredData.length,
    };
  }, [data, filteredData]);

  // Calculate dynamic KPI metrics
  const kpiMetrics = useMemo(() => {
    return calculateFilteredKPIs(filteredData, calibrationMetricsData);
  }, [filteredData, calibrationMetricsData]);

  // Helper to get color class for avg score
  const avgScoreColorClass = kpiMetrics.avgCombinedScore
    ? kpiMetrics.avgCombinedScore >= 75
      ? 'text-green-600'
      : kpiMetrics.avgCombinedScore >= 70
      ? 'text-orange-500'
      : 'text-red-600'
    : '';

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
          Dual-model consensus screening: probability-based analysis cross-validated with machine learning technical indicators.
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

            {/* Average Combined Score */}
            <KpiCard
              label="Avg Combined Score"
              value={kpiMetrics.avgCombinedScore !== null
                ? kpiMetrics.avgCombinedScore.toLocaleString('sv-SE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
                : null
              }
              icon={TrendingUp}
              iconColor={avgScoreColorClass || 'text-blue-600'}
              tooltipTitle={scoredOptionsTooltips.kpi.avgCombinedScore.title}
              tooltipContent={scoredOptionsTooltips.kpi.avgCombinedScore.content}
              valueClassName={avgScoreColorClass}
            />

            {/* Sample Size */}
            <KpiCard
              label="Sample Size"
              value={kpiMetrics.sampleSize}
              icon={Database}
              iconColor="text-blue-600"
              tooltipTitle={scoredOptionsTooltips.kpi.sampleSize.title}
              tooltipContent={scoredOptionsTooltips.kpi.sampleSize.content}
            />

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

          {/* Model Calibration & Accuracy Section */}
          <div className="mt-8">
            <CalibrationMetrics />
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
        </>
      )}
    </div>
  );
};
