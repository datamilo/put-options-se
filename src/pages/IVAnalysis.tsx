// src/pages/IVAnalysis.tsx

import React, { useRef, useMemo, useState, useEffect } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useIVPerStockPerDay } from '@/hooks/useIVPerStockPerDay';
import { IVScreeningTable } from '@/components/iv-analysis/IVScreeningTable';
import { IVDetailSection } from '@/components/iv-analysis/IVDetailSection';
import { MarketIVPanel } from '@/components/iv-analysis/MarketIVPanel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const IVAnalysis: React.FC = () => {
  usePageTitle('IV Analysis');
  const { t } = useTranslation('pages');

  const { stockSummaries, dataByStock, marketIVData, marketIVSummary, isLoading, error } = useIVPerStockPerDay();
  const [selectedStock, setSelectedStock] = useState<string>('');
  const detailRef = useRef<HTMLDivElement>(null);

  const stockNames = useMemo(
    () => Array.from(dataByStock.keys()).sort(),
    [dataByStock]
  );

  // Set default stock once data is loaded
  useEffect(() => {
    if (stockSummaries.length > 0 && !selectedStock) {
      // Default to stock with highest 52w IV rank
      const sorted = [...stockSummaries].sort((a, b) =>
        (b.ivRank52w ?? -1) - (a.ivRank52w ?? -1)
      );
      setSelectedStock(sorted[0].stockName);
    }
  }, [stockSummaries, selectedStock]);

  const handleSelectStock = (stock: string) => {
    setSelectedStock(stock);
    // Scroll to detail section
    setTimeout(() => {
      detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">{t('ivAnalysis.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">{t('ivAnalysis.error')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <p className="eyebrow">03 · History · IV</p>
          <h1 className="page-title">{t('ivAnalysis.title')}</h1>
        </div>
      </div>
      <div className="space-y-8">
        {/* Data methodology explanation */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>{t('ivAnalysis.dataSourceLabel')}</strong> {t('ivAnalysis.dataSourceNote')}
          </AlertDescription>
        </Alert>

        {/* Market IV panel */}
        <MarketIVPanel marketIVData={marketIVData} marketIVSummary={marketIVSummary} />

        {/* Screening table */}
        <div className="max-h-96 overflow-y-auto border rounded-lg">
          <IVScreeningTable
            summaries={stockSummaries}
            selectedStock={selectedStock}
            onSelectStock={handleSelectStock}
          />
        </div>

        {/* Detail section */}
        <IVDetailSection
          ref={detailRef}
          selectedStock={selectedStock}
          onSelectStock={setSelectedStock}
          stockNames={stockNames}
          summaries={stockSummaries}
          dataByStock={dataByStock}
        />
      </div>
    </div>
  );
};
