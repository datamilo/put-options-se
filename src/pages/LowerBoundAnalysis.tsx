/**
 * Lower Bound Validation Analysis Page
 * Main dashboard for viewing lower bound prediction accuracy across stocks
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useAllLowerBoundData, useLowerBoundStockData } from '@/hooks/useLowerBoundData';
import { LowerBoundTrendChart } from '@/components/lower-bound/LowerBoundTrendChart';
import { LowerBoundDistributionChart } from '@/components/lower-bound/LowerBoundDistributionChart';
import { LowerBoundExpiryTable } from '@/components/lower-bound/LowerBoundExpiryTable';
import {
  StockSelector,
  SummaryMetrics,
  StockSummaryMetrics,
} from '@/components/lower-bound/LowerBoundControls';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useTranslation } from 'react-i18next';

export const LowerBoundAnalysis: React.FC = () => {
  const { t } = useTranslation('pages');
  // Load all data
  const allDataQuery = useAllLowerBoundData();
  const [selectedStock, setSelectedStock] = useState<string>('');
  const stockDataQuery = useLowerBoundStockData(selectedStock);

  // Set default stock when data loads
  useEffect(() => {
    if (allDataQuery.isSuccess && allDataQuery.data && !selectedStock && allDataQuery.data.stocks.length > 0) {
      setSelectedStock(allDataQuery.data.stocks[0]);
    }
  }, [allDataQuery.isSuccess, allDataQuery.data, selectedStock]);

  const isLoading = allDataQuery.isLoading || stockDataQuery.isLoading;
  const hasError = allDataQuery.isError || stockDataQuery.isError;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <p className="eyebrow">04 · Validation · Lower Bound</p>
          <h1 className="page-title">{t('lowerBoundAnalysis.title')}</h1>
          <p className="page-desc">{t('lowerBoundAnalysis.subtitle')}</p>
        </div>
      </div>
      <div className="space-y-8">

        {/* Error State */}
        {hasError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t('lowerBoundAnalysis.errorTitle')}</AlertTitle>
            <AlertDescription>
              {t('lowerBoundAnalysis.errorDesc')}
            </AlertDescription>
          </Alert>
        )}

        {/* Summary Metrics */}
        {allDataQuery.isSuccess && allDataQuery.data && (
          <SummaryMetrics
            metrics={allDataQuery.data.summaryMetrics}
            isLoading={isLoading}
          />
        )}

        {/* Controls Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('lowerBoundAnalysis.analysisControls')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Stock Selector */}
            {allDataQuery.isSuccess && allDataQuery.data && (
              <StockSelector
                stocks={allDataQuery.data.stocks}
                selectedStock={selectedStock}
                onStockChange={setSelectedStock}
                isLoading={isLoading}
              />
            )}

            {/* Information Alert */}
            <Alert className="bg-blue-50 border-blue-200 text-blue-900">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertTitle>{t('lowerBoundAnalysis.howToUse')}</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1 mt-2 text-sm">
                  <li>{t('lowerBoundAnalysis.howToUseSteps.selectStock')}</li>
                  <li>{t('lowerBoundAnalysis.howToUseSteps.trendTab')}</li>
                  <li>{t('lowerBoundAnalysis.howToUseSteps.distributionTab')}</li>
                  <li>{t('lowerBoundAnalysis.howToUseSteps.statisticsTab')}</li>
                </ul>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Stock Summary (if stock selected) */}
        {selectedStock && stockDataQuery.isSuccess && stockDataQuery.data && (
          <StockSummaryMetrics
            stock={selectedStock}
            totalPredictions={stockDataQuery.data.totalPredictions}
            totalBreaches={stockDataQuery.data.totalBreaches}
            overallHitRate={stockDataQuery.data.overallHitRate}
            isLoading={isLoading}
          />
        )}

        {/* Main Content Tabs */}
        {selectedStock && (
          <Tabs defaultValue="trends" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="trends">{t('lowerBoundAnalysis.tabs.trends')}</TabsTrigger>
              <TabsTrigger value="distribution">{t('lowerBoundAnalysis.tabs.distribution')}</TabsTrigger>
              <TabsTrigger value="statistics">{t('lowerBoundAnalysis.tabs.statistics')}</TabsTrigger>
            </TabsList>

            {/* Trend Analysis Tab */}
            <TabsContent value="trends" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {t('lowerBoundAnalysis.monthlyHitRateTrends', { stock: selectedStock })}
                  </CardTitle>
                  <p className="text-sm text-slate-600 mt-2">
                    {t('lowerBoundAnalysis.hitRateEvolution')}
                  </p>
                </CardHeader>
                <CardContent>
                  {allDataQuery.isSuccess && allDataQuery.data && (
                    <LowerBoundTrendChart
                      data={allDataQuery.data.monthlyTrends}
                      stock={selectedStock}
                      isLoading={isLoading}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Distribution Tab */}
            <TabsContent value="distribution" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {t('lowerBoundAnalysis.predictionDistribution', { stock: selectedStock })}
                  </CardTitle>
                  <p className="text-sm text-slate-600 mt-2">
                    {t('lowerBoundAnalysis.predictionDesc')}
                  </p>
                </CardHeader>
                <CardContent>
                  {stockDataQuery.isSuccess && stockDataQuery.data && (
                    <LowerBoundDistributionChart
                      data={stockDataQuery.data.expiryStats}
                      dailyPredictions={stockDataQuery.data.dailyPredictions}
                      stock={selectedStock}
                      isLoading={isLoading}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Statistics Tab */}
            <TabsContent value="statistics" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {t('lowerBoundAnalysis.expiryStatistics', { stock: selectedStock })}
                  </CardTitle>
                  <p className="text-sm text-slate-600 mt-2">
                    {t('lowerBoundAnalysis.expiryStatsDesc')}
                  </p>
                </CardHeader>
                <CardContent>
                  {stockDataQuery.isSuccess && stockDataQuery.data && (
                    <LowerBoundExpiryTable
                      data={stockDataQuery.data.expiryStats}
                      stock={selectedStock}
                      isLoading={isLoading}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {/* Loading State */}
        {isLoading && !selectedStock && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="mt-4 text-slate-600">{t('lowerBoundAnalysis.loading')}</p>
          </div>
        )}

        {/* Data Information */}
        <Card className="bg-slate-50 border-slate-200">
          <CardHeader>
            <CardTitle className="text-sm">{t('lowerBoundAnalysis.dataInfoTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-600">
            {allDataQuery.isSuccess && allDataQuery.data && (
              <>
                <p>
                  <strong>{t('lowerBoundAnalysis.analysisPeriod')}</strong> {allDataQuery.data.summaryMetrics.dateRangeStart} to{' '}
                  {allDataQuery.data.summaryMetrics.dateRangeEnd}
                </p>
                <p>
                  <strong>{t('lowerBoundAnalysis.dataSource')}</strong> {t('lowerBoundAnalysis.dataSourceValue')}
                </p>
                <p>
                  <strong>{t('lowerBoundAnalysis.methodology')}</strong> {t('lowerBoundAnalysis.methodologyValue')}
                </p>
                <p>
                  <strong>{t('lowerBoundAnalysis.lastUpdated')}</strong> {new Date().toLocaleDateString()}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-slate-500 pt-8 border-t border-slate-200">
          <p>{t('lowerBoundAnalysis.footerTitle')}</p>
          <p className="mt-1">
            {t('lowerBoundAnalysis.footerBuiltWith')}
          </p>
        </div>
      </div>
    </div>
  );
};
