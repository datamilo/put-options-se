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

export const LowerBoundAnalysis: React.FC = () => {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-slate-900">
            Lower Bound Validation Analysis
          </h1>
          <p className="text-lg text-slate-600">
            Analyzing IV-based lower bound predictions against historical stock prices
          </p>
        </div>

        {/* Error State */}
        {hasError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Data</AlertTitle>
            <AlertDescription>
              Failed to load lower bound analysis data. Please try refreshing the page.
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
            <CardTitle className="text-lg">Analysis Controls</CardTitle>
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
              <AlertTitle>How to Use</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1 mt-2 text-sm">
                  <li>
                    Select a stock from the dropdown to view its detailed analysis
                  </li>
                  <li>
                    The <strong>Trend Analysis</strong> tab shows monthly hit rate evolution
                  </li>
                  <li>
                    The <strong>Distribution</strong> tab displays prediction ranges and breaches
                  </li>
                  <li>
                    The <strong>Statistics</strong> tab provides sortable per-expiry metrics
                  </li>
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
              <TabsTrigger value="trends">Trend Analysis</TabsTrigger>
              <TabsTrigger value="distribution">Distribution</TabsTrigger>
              <TabsTrigger value="statistics">Statistics</TabsTrigger>
            </TabsList>

            {/* Trend Analysis Tab */}
            <TabsContent value="trends" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Monthly Hit Rate Trends - {selectedStock}
                  </CardTitle>
                  <p className="text-sm text-slate-600 mt-2">
                    Hit rate evolution by expiry month with prediction volume
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
                    Prediction Distribution & Breaches - {selectedStock}
                  </CardTitle>
                  <p className="text-sm text-slate-600 mt-2">
                    Prediction ranges, median/mean bounds, and expiry close prices
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
                    Expiry Statistics - {selectedStock}
                  </CardTitle>
                  <p className="text-sm text-slate-600 mt-2">
                    Click column headers to sort. Hit rate color-coded: green (85%+), blue (75-85%), yellow (65-75%), red (&lt;65%)
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
            <p className="mt-4 text-slate-600">Loading analysis data...</p>
          </div>
        )}

        {/* Data Information */}
        <Card className="bg-slate-50 border-slate-200">
          <CardHeader>
            <CardTitle className="text-sm">Data Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-600">
            {allDataQuery.isSuccess && allDataQuery.data && (
              <>
                <p>
                  <strong>Analysis Period:</strong> {allDataQuery.data.summaryMetrics.dateRangeStart} to{' '}
                  {allDataQuery.data.summaryMetrics.dateRangeEnd}
                </p>
                <p>
                  <strong>Data Source:</strong> Lower bound historical validation dataset
                </p>
                <p>
                  <strong>Methodology:</strong> IV-based lower bound predictions at 1σ (68% confidence level)
                </p>
                <p>
                  <strong>Last Updated:</strong> {new Date().toLocaleDateString()}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-slate-500 pt-8 border-t border-slate-200">
          <p>Lower Bound Validation Analysis Dashboard</p>
          <p className="mt-1">
            Built with React, Recharts, and TanStack Query
          </p>
        </div>
      </div>
    </div>
  );
};
