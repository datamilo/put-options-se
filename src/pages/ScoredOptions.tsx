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
    minDaysToExpiry: 0,
    maxDaysToExpiry: 999,
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

      // Min score filter
      if (option.combined_score < filters.minScore) {
        return false;
      }

      // Days to expiry filter
      if (option.days_to_expiry < filters.minDaysToExpiry) {
        return false;
      }
      if (option.days_to_expiry > filters.maxDaysToExpiry) {
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Scored Options Recommendations</h1>
          </div>
          <Button
            onClick={handleExport}
            disabled={filteredData.length === 0}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
        <p className="text-muted-foreground">
          Dual-model analysis combining V2.1 probability predictions with technical analysis indicators. Identifies high-probability put writing opportunities with model agreement validation.
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
                  <div>
                    <p className="text-sm text-muted-foreground">Total Options</p>
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
                  <div>
                    <p className="text-sm text-muted-foreground">Models Agree</p>
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
                  <div>
                    <p className="text-sm text-muted-foreground">Strong Agreement</p>
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
                  <div>
                    <p className="text-sm text-muted-foreground">Showing</p>
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

          {/* Filters */}
          <ScoredOptionsFiltersComponent
            filters={filters}
            onFiltersChange={setFilters}
            availableStocks={availableStocks}
            availableExpiryDates={availableExpiryDates}
          />

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
