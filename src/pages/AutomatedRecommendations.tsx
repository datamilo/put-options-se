import React, { useState, useEffect, useMemo } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useAutomatedRecommendations } from '@/hooks/useAutomatedRecommendations';
import { useEnrichedOptionsData } from '@/hooks/useEnrichedOptionsData';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Sparkles, TrendingUp, Target, BarChart3, RotateCcw, ChevronDown, Building2, Download } from 'lucide-react';
import { exportRecommendationsToExcel } from '@/utils/recommendationsExport';
import { RecommendationFiltersComponent } from '@/components/recommendations/RecommendationFilters';
import { RecommendationsTable } from '@/components/recommendations/RecommendationsTable';
import { StockFilter } from '@/components/recommendations/StockFilter';
import { calculateDefaultExpiryDate } from '@/lib/utils';
import {
  DEFAULT_FILTERS,
  DEFAULT_WEIGHTS,
  type RecommendationFilters,
  type ScoreWeights,
  type RecommendedOption,
} from '@/types/recommendations';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useTranslation } from 'react-i18next';

export const AutomatedRecommendations = () => {
  usePageTitle('Option Recommendations');
  const { t } = useTranslation('pages');
  const { analyzeOptions, isLoading } = useAutomatedRecommendations();
  const { data: allOptionsData } = useEnrichedOptionsData();
  const { toast } = useToast();

  const [filters, setFilters] = useState<RecommendationFilters>(DEFAULT_FILTERS);
  const [weights, setWeights] = useState<ScoreWeights>(DEFAULT_WEIGHTS);
  const [recommendations, setRecommendations] = useState<RecommendedOption[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [weightsOpen, setWeightsOpen] = useState(false);
  const [selectedStocks, setSelectedStocks] = useState<string[]>([]);

  // Get available expiry dates
  const availableExpiryDates = useMemo(() => {
    if (!allOptionsData || allOptionsData.length === 0) return [];
    return [...new Set(allOptionsData.map((option) => option.ExpiryDate))].sort();
  }, [allOptionsData]);

  // Initialize default expiry date
  useEffect(() => {
    if (!filters.expiryDate && availableExpiryDates.length > 0) {
      const defaultDate = calculateDefaultExpiryDate(availableExpiryDates);
      if (defaultDate) {
        setFilters((prev) => ({ ...prev, expiryDate: defaultDate }));
      }
    }
  }, [availableExpiryDates, filters.expiryDate]);

  // Helper to get full path for links
  const getFullPath = (path: string) => {
    const isGitHubPages = window.location.hostname === 'datamilo.github.io';
    const basename = isGitHubPages ? '/put-options-se' : '';
    return basename + path;
  };

  // Handle analysis
  const handleAnalyze = () => {
    if (!filters.expiryDate) return;
    setIsAnalyzing(true);
    setTimeout(() => {
      // Auto-normalize weights to 100% for consistent scoring
      const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
      const normalizedWeights = totalWeight > 0
        ? Object.fromEntries(
            Object.entries(weights).map(([key, value]) => [
              key,
              (value / totalWeight) * 100
            ])
          ) as ScoreWeights
        : weights; // If all weights are 0, use as-is (will result in all neutral scores)

      const results = analyzeOptions(filters, normalizedWeights);
      setRecommendations(results);
      setIsAnalyzing(false);
    }, 100);
  };

  // Handle weight change
  const updateWeight = (key: keyof ScoreWeights, value: number) => {
    setWeights({ ...weights, [key]: value });
  };

  // Reset weights to defaults
  const resetWeights = () => {
    setWeights(DEFAULT_WEIGHTS);
  };

  // Handle Excel export
  const handleExport = () => {
    exportRecommendationsToExcel({
      filename: 'option-recommendations',
      data: filteredRecommendations
    });
    toast({
      title: t('recommendations.exportSuccess'),
      description: t('recommendations.exportSuccessDesc', { count: filteredRecommendations.length }),
    });
  };

  // Get unique stocks count
  const uniqueStocksCount = useMemo(() => {
    if (recommendations.length === 0) return 0;
    return new Set(recommendations.map((r) => r.stockName)).size;
  }, [recommendations]);

  // Filter recommendations by selected stocks
  const filteredRecommendations = useMemo(() => {
    if (selectedStocks.length === 0) return recommendations;
    return recommendations.filter((rec) => selectedStocks.includes(rec.stockName));
  }, [recommendations, selectedStocks]);

  // Summary stats
  const avgScore = useMemo(() => {
    if (filteredRecommendations.length === 0) return 0;
    return (
      filteredRecommendations.reduce((sum, r) => sum + r.compositeScore, 0) /
      filteredRecommendations.length
    );
  }, [filteredRecommendations]);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <p className="eyebrow">06 · Automated · Recs</p>
          <h1 className="page-title">{t('recommendations.title')}</h1>
          <p className="page-desc">{t('recommendations.subtitle')}</p>
        </div>
      </div>
      <div className="space-y-6">

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              {t('recommendations.loadingDataSources')}
            </div>
          </CardContent>
        </Card>
      )}

      {!isLoading && (
        <>
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>{t('recommendations.analysisParameters')}</CardTitle>
            </CardHeader>
            <CardContent>
              <RecommendationFiltersComponent
                filters={filters}
                onFiltersChange={setFilters}
                onAnalyze={handleAnalyze}
                availableExpiryDates={availableExpiryDates}
                isAnalyzing={isAnalyzing}
              />
            </CardContent>
          </Card>

          {/* Stock Filter */}
          {recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('recommendations.filterByStock')}</CardTitle>
              </CardHeader>
              <CardContent>
                <StockFilter
                  recommendations={recommendations}
                  selectedStocks={selectedStocks}
                  onSelectedStocksChange={setSelectedStocks}
                />
              </CardContent>
            </Card>
          )}

          {/* Score Weights Panel */}
          <Collapsible open={weightsOpen} onOpenChange={setWeightsOpen}>
            <Card>
              <CardHeader>
                <CollapsibleTrigger className="w-full hover:opacity-80 transition-opacity">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">
                        {t('recommendations.scoreWeightsConfig')}
                      </CardTitle>
                      <ChevronDown
                        className={`h-5 w-5 transition-transform ${weightsOpen ? 'rotate-180' : ''}`}
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        resetWeights();
                      }}
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      {t('recommendations.weightsReset')}
                    </Button>
                  </div>
                </CollapsibleTrigger>
              </CardHeader>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {t('recommendations.weightsHint')}
                  </p>
                  {(
                    [
                      {
                        key: 'recoveryAdvantage',
                        label: t('recommendations.weightRecoveryAdvantage'),
                        description: t('recommendations.weightRecoveryAdvantageDesc'),
                      },
                      {
                        key: 'supportStrength',
                        label: t('recommendations.weightSupportStrength'),
                        description: t('recommendations.weightSupportStrengthDesc'),
                      },
                      {
                        key: 'daysSinceBreak',
                        label: t('recommendations.weightDaysSinceBreak'),
                        description: t('recommendations.weightDaysSinceBreakDesc'),
                      },
                      {
                        key: 'historicalPeak',
                        label: t('recommendations.weightHistoricalPeak'),
                        description: t('recommendations.weightHistoricalPeakDesc'),
                      },
                      {
                        key: 'monthlySeasonality',
                        label: t('recommendations.weightMonthlySeasonality'),
                        description: t('recommendations.weightMonthlySeasonalityDesc'),
                      },
                      {
                        key: 'currentPerformance',
                        label: t('recommendations.weightCurrentPerformance'),
                        description: t('recommendations.weightCurrentPerformanceDesc'),
                      },
                    ] as const
                  ).map((item) => (
                    <div key={item.key} className="space-y-2">
                      <div className="flex justify-between">
                        <Label htmlFor={item.key}>{item.label}</Label>
                        <span className="text-sm font-medium">
                          {weights[item.key]}%
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.description}
                      </div>
                      <Slider
                        id={item.key}
                        value={[weights[item.key]]}
                        onValueChange={([value]) => updateWeight(item.key, value)}
                        min={0}
                        max={50}
                        step={5}
                      />
                    </div>
                  ))}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Summary KPIs */}
          {recommendations.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {t('recommendations.kpiUniqueStocks')}
                  </CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{uniqueStocksCount}</div>
                  <p className="text-xs text-muted-foreground">
                    {selectedStocks.length > 0 && selectedStocks.length < uniqueStocksCount
                      ? t('recommendations.kpiUniqueStocksSelected', { count: selectedStocks.length })
                      : t('recommendations.kpiUniqueStocksAvailable')}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {t('recommendations.kpiTotalRecommendations')}
                  </CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{filteredRecommendations.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {selectedStocks.length > 0 ? t('recommendations.kpiAfterFiltering') : t('recommendations.kpiMatchingCriteria')}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {t('recommendations.kpiAvgScore')}
                  </CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{avgScore.toFixed(1)}</div>
                  <p className="text-xs text-muted-foreground">{t('recommendations.kpiAvgScoreDesc')}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('recommendations.kpiTopScore')}</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {filteredRecommendations[0]?.compositeScore.toFixed(1) || '-'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {filteredRecommendations[0]?.stockName || 'N/A'}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Results Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {t('recommendations.recommendationsTitle')}{' '}
                  {filteredRecommendations.length > 0 && `(${filteredRecommendations.length})`}
                </CardTitle>
                {filteredRecommendations.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExport}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {t('recommendations.exportToExcel')}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <RecommendationsTable
                recommendations={filteredRecommendations}
                getFullPath={getFullPath}
                filters={filters}
                weights={weights}
              />
            </CardContent>
          </Card>
        </>
      )}
      </div>
    </div>
  );
};

export default AutomatedRecommendations;
