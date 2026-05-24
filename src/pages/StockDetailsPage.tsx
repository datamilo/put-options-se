import { useParams, useNavigate } from "react-router-dom";
import { useStockData } from "@/hooks/useStockData";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useTimestamps } from "@/hooks/useTimestamps";
import { useUpcomingEvents } from '@/hooks/useUpcomingEvents';
import { StockDetails } from "@/components/stock/StockDetails";
import { UpcomingEventCard } from '@/components/stock/UpcomingEventCard';
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { DataTimestamp } from "@/components/ui/data-timestamp";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const StockDetailsPage = () => {
  const { stockName: paramStockName } = useParams<{ stockName: string }>();
  const navigate = useNavigate();
  const { getStockData, getStockSummary, isLoading, error, getAllStockNames } = useStockData();
  const { timestamps } = useTimestamps();
  const { getEventForStock } = useUpcomingEvents();
  const { t } = useTranslation();

  const isFromStock = paramStockName !== undefined;
  const decodedParamStockName = paramStockName ? decodeURIComponent(paramStockName) : '';

  const [selectedStock, setSelectedStock] = useState<string>(decodedParamStockName);
  const [allStocks, setAllStocks] = useState<string[]>([]);

  // Load all available stocks — also depends on isLoading so the effect re-runs
  // when the CSV finishes fetching on a fresh page load (e.g. opened in new tab)
  useEffect(() => {
    const stocks = getAllStockNames();
    setAllStocks(stocks);

    // If no stock is selected yet and we have stocks, select the first one
    if (!selectedStock && stocks.length > 0) {
      setSelectedStock(stocks[0]);
    }
  }, [getAllStockNames, isLoading]);

  const handleBackClick = () => {
    navigate(-1);
  };

  const handleStockChange = (newStock: string) => {
    setSelectedStock(newStock);
    // If accessed from /stock-analysis, update URL with new stock
    // If accessed from /stock/:stockName, navigate to new stock
    const encodedStock = encodeURIComponent(newStock);
    navigate(`/stock/${encodedStock}`);
  };

  usePageTitle('Stock Metrics and History', selectedStock);

  // Get stock data
  const stockData = selectedStock ? getStockData(selectedStock) : [];
  const stockSummary = selectedStock ? getStockSummary(selectedStock) : null;
  const upcomingEvent = selectedStock ? getEventForStock(selectedStock) : null;

  if (isLoading && allStocks.length === 0) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        {isFromStock && (
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={handleBackClick}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('pages:optionDetails.back')}
            </Button>
          </div>
        )}
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <p className="text-muted-foreground">{t('pages:stockAnalysis.loading', 'Loading stock data...')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedStock || allStocks.length === 0) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        {isFromStock && (
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={handleBackClick}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('pages:optionDetails.back')}
            </Button>
          </div>
        )}
        <div className="space-y-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold">{t('pages:stockAnalysis.noStockSelected')}</h1>
            <p className="text-muted-foreground mt-2">{t('pages:stockAnalysis.pleaseSelect')}</p>
          </div>
          {allStocks.length > 0 && (
            <div className="w-full max-w-xs mx-auto">
              <Select value={selectedStock || undefined} onValueChange={handleStockChange}>
                <SelectTrigger>
                  <SelectValue placeholder={t('selectPlaceholder.stock')} />
                </SelectTrigger>
                <SelectContent>
                  {allStocks.map((stock) => (
                    <SelectItem key={stock} value={stock}>
                      {stock}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        {isFromStock && (
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={handleBackClick}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('pages:optionDetails.back')}
            </Button>
          </div>
        )}
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <p className="text-muted-foreground">{t('pages:stockAnalysis.loading', 'Loading stock data...')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        {isFromStock && (
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={handleBackClick}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('pages:optionDetails.back')}
            </Button>
          </div>
        )}
        <div className="text-center">
          <h1 className="text-2xl font-bold">{t('status.errorLoadingData')}</h1>
          <p className="text-muted-foreground mt-2">{error}</p>
        </div>
      </div>
    );
  }

  if (!stockSummary || stockData.length === 0) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        {isFromStock && (
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={handleBackClick}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('pages:optionDetails.back')}
            </Button>
          </div>
        )}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">{t('pages:stockAnalysis.title')}</h1>
          </div>
          <div className="w-full max-w-xs">
            <Select value={selectedStock || undefined} onValueChange={handleStockChange}>
              <SelectTrigger>
                <SelectValue placeholder={t('selectPlaceholder.stock')} />
              </SelectTrigger>
              <SelectContent>
                {allStocks.map((stock) => (
                  <SelectItem key={stock} value={stock}>
                    {stock}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold">{t('pages:stockAnalysis.stockNotFound')}</h2>
          <p className="text-muted-foreground mt-2">
            {t('pages:stockAnalysis.noDataFor', { stock: selectedStock })}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <p className="eyebrow">05 · Stocks</p>
          <h1 className="page-title">{t('pages:stockAnalysis.title')}</h1>
          {selectedStock && <p className="page-desc" style={{ fontFamily: 'var(--font-mono)' }}>{selectedStock}</p>}
          {timestamps && (
            <div className="timestamps">
              {timestamps.stockData?.lastUpdated && <span>Stocks · {timestamps.stockData.lastUpdated}</span>}
              {timestamps.analysisCompleted?.lastUpdated && <span>Analysis · {timestamps.analysisCompleted.lastUpdated}</span>}
            </div>
          )}
        </div>
        <div className="w-full max-w-xs">
          <Select value={selectedStock || undefined} onValueChange={handleStockChange}>
            <SelectTrigger>
              <SelectValue placeholder={t('selectPlaceholder.stock')} />
            </SelectTrigger>
            <SelectContent>
              {allStocks.map((stock) => (
                <SelectItem key={stock} value={stock}>
                  {stock}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-4">

      {upcomingEvent && <UpcomingEventCard event={upcomingEvent} stockName={selectedStock} />}

      <StockDetails stockData={stockData} stockSummary={stockSummary} />
      </div>
    </div>
  );
};

export default StockDetailsPage;