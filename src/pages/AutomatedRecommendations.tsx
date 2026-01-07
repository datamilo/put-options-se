import React, { useState, useEffect, useMemo } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useAutomatedRecommendations } from '@/hooks/useAutomatedRecommendations';
import { useEnrichedOptionsData } from '@/hooks/useEnrichedOptionsData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Sparkles, TrendingUp, Target, BarChart3, RotateCcw } from 'lucide-react';
import { RecommendationFiltersComponent } from '@/components/recommendations/RecommendationFilters';
import { RecommendationsTable } from '@/components/recommendations/RecommendationsTable';
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

export const AutomatedRecommendations = () => {
  usePageTitle('Option Recommendations');
  const { analyzeOptions, isLoading } = useAutomatedRecommendations();
  const { data: allOptionsData } = useEnrichedOptionsData();

  const [filters, setFilters] = useState<RecommendationFilters>(DEFAULT_FILTERS);
  const [weights, setWeights] = useState<ScoreWeights>(DEFAULT_WEIGHTS);
  const [recommendations, setRecommendations] = useState<RecommendedOption[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [weightsOpen, setWeightsOpen] = useState(false);

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
      const results = analyzeOptions(filters, weights);
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

  // Calculate total weight
  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);

  // Summary stats
  const avgScore = useMemo(() => {
    if (recommendations.length === 0) return 0;
    return (
      recommendations.reduce((sum, r) => sum + r.compositeScore, 0) /
      recommendations.length
    );
  }, [recommendations]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Automated Put Option Recommendations</h1>
        </div>
        <p className="text-muted-foreground">
          Evaluates 6 weighted analysis factors—support strength, support stability, recovery potential, historical peaks, monthly seasonality, and current performance—to identify optimal put writing opportunities.
        </p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              Loading data sources...
            </div>
          </CardContent>
        </Card>
      )}

      {!isLoading && (
        <>
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Analysis Parameters</CardTitle>
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

          {/* Score Weights Panel */}
          <Collapsible open={weightsOpen} onOpenChange={setWeightsOpen}>
            <Card>
              <CardHeader>
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      Score Weights Configuration
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm ${
                          totalWeight === 100 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        Total: {totalWeight}%
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          resetWeights();
                        }}
                      >
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Reset
                      </Button>
                    </div>
                  </div>
                </CollapsibleTrigger>
              </CardHeader>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  {(
                    [
                      {
                        key: 'recoveryAdvantage',
                        label: 'Recovery Advantage',
                        description: 'Statistical advantage from probability recovery',
                      },
                      {
                        key: 'supportStrength',
                        label: 'Support Strength',
                        description: 'Pre-calculated support level robustness',
                      },
                      {
                        key: 'daysSinceBreak',
                        label: 'Days Since Break',
                        description: 'Time since support was last broken',
                      },
                      {
                        key: 'historicalPeak',
                        label: 'Historical Peak',
                        description: 'Recovery candidate from high past probability',
                      },
                      {
                        key: 'monthlySeasonality',
                        label: 'Monthly Seasonality',
                        description: 'Historical % of positive months',
                      },
                      {
                        key: 'currentPerformance',
                        label: 'Current Performance',
                        description: 'Underperformance suggests bounce potential',
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
                  {totalWeight !== 100 && (
                    <div className="mt-4 p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg text-sm">
                      Warning: Total weight should be 100% for accurate scoring.
                    </div>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Summary KPIs */}
          {recommendations.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Recommendations
                  </CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{recommendations.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Matching filter criteria
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Average Composite Score
                  </CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{avgScore.toFixed(1)}</div>
                  <p className="text-xs text-muted-foreground">Across all options</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Top Score</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {recommendations[0]?.compositeScore.toFixed(1) || '-'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {recommendations[0]?.stockName || 'N/A'}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Results Table */}
          <Card>
            <CardHeader>
              <CardTitle>
                Recommendations{' '}
                {recommendations.length > 0 && `(${recommendations.length})`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RecommendationsTable
                recommendations={recommendations}
                getFullPath={getFullPath}
                filters={filters}
                weights={weights}
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default AutomatedRecommendations;
