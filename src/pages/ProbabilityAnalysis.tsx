import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTimestamps } from '@/hooks/useTimestamps';
import { useProbabilityRecoveryData } from '@/hooks/useProbabilityRecoveryData';
import { useProbabilityValidationData } from '@/hooks/useProbabilityValidationData';
import { RecoveryComparisonChart } from '@/components/probability/RecoveryComparisonChart';
import { CalibrationChart } from '@/components/probability/CalibrationChart';
import { MethodComparisonChart } from '@/components/probability/MethodComparisonChart';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, ArrowLeft, LineChart, TrendingUp, Info, Activity, Target, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { KPICard } from '@/components/ui/kpi-card';
import { DataTimestamp } from '@/components/ui/data-timestamp';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Link } from 'react-router-dom';
import { formatNordicDecimal, formatNordicPercentagePoints } from '@/utils/numberFormatting';
import { useTranslation } from 'react-i18next';

export const ProbabilityAnalysis: React.FC = () => {
  const { t } = useTranslation('pages');
  const navigate = useNavigate();
  const [isStockPerformanceExpanded, setIsStockPerformanceExpanded] = React.useState(false);
  const { timestamps } = useTimestamps();
  const { isLoading: recoveryLoading, error: recoveryError, stocks, scenarios, chartData, stockChartData } = useProbabilityRecoveryData();
  const { calibrationData, isLoading: validationLoading, error: validationError, getCalibrationPoints } = useProbabilityValidationData();
  const isLoading = recoveryLoading || validationLoading;
  const error = recoveryError || validationError;

  const calibrationPoints = useMemo(() => {
    return calibrationData.map(d => ({
      predicted: d.PredictedProb,
      actual: d.ActualRate,
      count: d.Count,
      method: d.ProbMethod,
      Bin: d.Bin,
      DTE_Bin: d.DTE_Bin,
      Stock: d.Stock,
      DataType: d.DataType
    }));
  }, [calibrationData]);

  // Get unique stocks for calibration chart filter
  const availableStocks = useMemo(() => {
    const stocks = calibrationData
      .filter(d => d.DataType === 'calibration_by_stock' && d.Stock)
      .map(d => d.Stock);
    return Array.from(new Set(stocks)).sort();
  }, [calibrationData]);

  // Calculate KPI metrics from recovery scenarios
  const kpiMetrics = useMemo(() => {
    if (!scenarios || !scenarios.length || !calibrationData.length) return null;

    const totalRecoveryCandidates = scenarios.reduce((sum, s) => sum + s.RecoveryCandidate_N, 0);
    const totalAllOptions = scenarios.reduce((sum, s) => sum + s.AllOptions_N, 0);

    const avgAccuracy = calibrationData.length > 0
      ? (calibrationData.reduce((sum, d) => sum + d.ActualRate, 0) / calibrationData.length) * 100
      : 0;

    return {
      totalRecoveryCandidates,
      totalAllOptions,
      avgAccuracy,
      stocksAnalyzed: stocks.length,
    };
  }, [scenarios, stocks, calibrationData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>{t('probabilityAnalysis.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-destructive">
          <p className="font-semibold">{t('probabilityAnalysis.errorTitle')}</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <p className="eyebrow">04 · Validation · Probability</p>
          <h1 className="page-title">{t('probabilityAnalysis.title')}</h1>
          <p className="page-desc">{t('probabilityAnalysis.subtitle')}</p>
          {timestamps && (
            <div className="timestamps">
              {timestamps.optionsData?.lastUpdated && <span>Options · {timestamps.optionsData.lastUpdated}</span>}
              {timestamps.analysisCompleted?.lastUpdated && <span>Analysis · {timestamps.analysisCompleted.lastUpdated}</span>}
            </div>
          )}
        </div>
      </div>
      <div className="space-y-4">

      {/* KPI Cards */}
      {kpiMetrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title={t('probabilityAnalysis.kpi.recoveryCandidates')}
            value={kpiMetrics.totalRecoveryCandidates}
            subtitle={t('probabilityAnalysis.kpi.recoveryCandidatesSubtitle')}
            icon={TrendingUp}
            variant="success"
          />
          <KPICard
            title={t('probabilityAnalysis.kpi.allOptions')}
            value={kpiMetrics.totalAllOptions}
            subtitle={t('probabilityAnalysis.kpi.allOptionsSubtitle')}
            icon={Activity}
            variant="default"
          />
          <KPICard
            title={t('probabilityAnalysis.kpi.avgAccuracy')}
            value={`${kpiMetrics.avgAccuracy.toFixed(1)}%`}
            subtitle={t('probabilityAnalysis.kpi.avgAccuracySubtitle')}
            icon={Target}
            variant="info"
          />
          <KPICard
            title={t('probabilityAnalysis.kpi.stocksAnalyzed')}
            value={kpiMetrics.stocksAnalyzed}
            subtitle={t('probabilityAnalysis.kpi.stocksAnalyzedSubtitle')}
            icon={CheckCircle2}
            variant="default"
          />
        </div>
      )}

      {/* Main Content */}
      <div className="space-y-6">
        {/* Executive Overview - Two Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Calibration Analysis Overview */}
            <Card className="border-blue-500/20 bg-blue-500/5">
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-center gap-2">
                  <LineChart className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold">{t('probabilityAnalysis.sections.calibration')}</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t('probabilityAnalysis.sections.calibrationCardDesc')}
                </p>
              </CardContent>
            </Card>

            {/* Recovery Analysis Overview */}
            <Card className="border-green-500/20 bg-green-500/5">
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold">{t('probabilityAnalysis.sections.recoveryCard')}</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t('probabilityAnalysis.sections.recoveryCardDesc')}
                </p>
              </CardContent>
            </Card>
        </div>

        {/* Calibration Analysis Section */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center gap-3">
            <LineChart className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold">{t('probabilityAnalysis.sections.calibration')}</h2>
              <p className="text-sm text-muted-foreground">{t('probabilityAnalysis.sections.calibrationSubtitle')}</p>
            </div>
          </div>

          {/* How to Read the Calibration Chart */}
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="pt-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-3">{t('probabilityAnalysis.howToRead')}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {t('probabilityAnalysis.howToReadCalibration1')}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t('probabilityAnalysis.howToReadCalibration2')}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Calibration Chart */}
          <Card>
            <CardContent className="pt-6">
              <CalibrationChart
                calibrationPoints={calibrationPoints}
                availableStocks={availableStocks}
                getCalibrationPoints={getCalibrationPoints}
              />
            </CardContent>
          </Card>
        </div>

        {/* Section Separator */}
        <div className="border-t-2 border-border my-8" />

        {/* Stock Performance Comparison Section - Collapsible */}
        <div className="space-y-4 pt-4">
          <div
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => setIsStockPerformanceExpanded(!isStockPerformanceExpanded)}
          >
            <LineChart className="h-6 w-6 text-purple-600" />
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{t('probabilityAnalysis.sections.stockPerformance')}</h2>
              <p className="text-sm text-muted-foreground">{t('probabilityAnalysis.sections.stockPerformanceSubtitle')}</p>
            </div>
            {isStockPerformanceExpanded ? (
              <ChevronUp className="h-6 w-6 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-6 w-6 text-muted-foreground" />
            )}
          </div>

          {isStockPerformanceExpanded && (
            <>
              {/* How to Read the Stock Comparison */}
              <Card className="border-l-4 border-l-purple-500">
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">{t('probabilityAnalysis.howToRead')}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {t('probabilityAnalysis.howToReadStockPerf1')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t('probabilityAnalysis.howToReadStockPerf2')}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Stock Performance Chart */}
              <Card>
                <CardContent className="pt-6">
                  <MethodComparisonChart calibrationPoints={calibrationPoints} />
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Section Separator */}
        <div className="border-t-2 border-border my-8" />

        {/* Probability Recovery Analysis Section */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-6 w-6 text-green-600" />
            <div>
              <h2 className="text-2xl font-bold">{t('probabilityAnalysis.sections.recoveryAnalysis')}</h2>
              <p className="text-sm text-muted-foreground">{t('probabilityAnalysis.sections.recoveryAnalysisSubtitle')}</p>
            </div>
          </div>

          {/* Key Finding Summary */}
          <Card className="border-l-4 border-l-green-600 bg-green-50 dark:bg-green-950/30">
            <CardContent className="pt-6 space-y-3">
              <div className="space-y-2">
                <h3 className="font-semibold text-green-900 dark:text-green-100">{t('probabilityAnalysis.finding')}</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">{t('probabilityAnalysis.recoveryCandidatesLabel')}</p>
                    <p className="font-bold text-base">{formatNordicDecimal(87.59, 2)}% worthless</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t('probabilityAnalysis.allOptionsLabel')}</p>
                    <p className="font-bold text-base">{formatNordicDecimal(74.88, 2)}% worthless</p>
                  </div>
                </div>
                <p className="text-sm font-semibold text-green-700 dark:text-green-300">{formatNordicPercentagePoints(12.71, 2)} advantage (statistically significant, p &lt; 0,001)</p>
                <p className="text-xs text-muted-foreground">{t('probabilityAnalysis.statsFootnote')}</p>
              </div>
            </CardContent>
          </Card>

          {/* How to Read the Recovery Chart */}
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="pt-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-3">{t('probabilityAnalysis.recoveryWhatTitle')}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {t('probabilityAnalysis.recoveryWhatDesc')}
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  <strong>{t('probabilityAnalysis.recoveryWhyMattersLabel')}</strong>{' '}
                  {t('probabilityAnalysis.recoveryWhyMatters', {
                    adv1: formatNordicPercentagePoints(17.18, 2),
                    adv2: formatNordicPercentagePoints(3.01, 2),
                    gap: formatNordicPercentagePoints(14.18, 2),
                  })}
                </p>

                <h3 className="text-lg font-semibold mb-3 pt-2">{t('probabilityAnalysis.howToRead')}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {t('probabilityAnalysis.howToReadRecovery')}
                </p>

                <h3 className="text-base font-semibold mb-2">{t('probabilityAnalysis.bestOpportunitiesTitle')}</h3>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                  <li><strong>DTE:</strong> {t('probabilityAnalysis.bestOpportunitiesDTE', { adv1: formatNordicPercentagePoints(15.21, 2), adv2: formatNordicPercentagePoints(7.94, 2) })}</li>
                  <li><strong>Probability Bin:</strong> {t('probabilityAnalysis.bestOpportunitiesBin', { adv1: formatNordicPercentagePoints(23.61, 2), adv2: formatNordicPercentagePoints(4.46, 2) })}</li>
                  <li><strong>Method:</strong> {t('probabilityAnalysis.bestOpportunitiesMethod', { adv1: formatNordicPercentagePoints(16.06, 2) })}</li>
                </ul>
                <p className="text-sm text-muted-foreground mt-4">
                  {t('probabilityAnalysis.bestOpportunitiesFilter')}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Recovery Advantage Analysis Chart */}
          <Card>
            <CardContent className="pt-6">
              <RecoveryComparisonChart stocks={stocks} chartData={chartData} stockChartData={stockChartData} />
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    </div>
  );
};
