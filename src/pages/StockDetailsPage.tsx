import { useParams, useNavigate } from "react-router-dom";
import { useStockData } from "@/hooks/useStockData";
import { usePageTitle } from "@/hooks/usePageTitle";
import { StockDetails } from "@/components/stock/StockDetails";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useState, useEffect, useMemo } from "react";

const StockDetailsPage = () => {
  const { stockName: paramStockName } = useParams<{ stockName: string }>();
  const navigate = useNavigate();
  const { getStockData, getStockSummary, isLoading, error, getAllStockNames } = useStockData();

  const isFromStock = paramStockName !== undefined;
  const decodedParamStockName = paramStockName ? decodeURIComponent(paramStockName) : '';

  const [selectedStock, setSelectedStock] = useState<string>(decodedParamStockName);
  const [allStocks, setAllStocks] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  // Load all available stocks
  useEffect(() => {
    const stocks = getAllStockNames();
    setAllStocks(stocks);

    // If no stock is selected yet and we have stocks, select the first one
    if (!selectedStock && stocks.length > 0) {
      setSelectedStock(stocks[0]);
    }
  }, [getAllStockNames]);

  const handleBackClick = () => {
    navigate(-1);
  };

  const handleStockChange = (newStock: string) => {
    setSelectedStock(newStock);
    // Reset dates when stock changes
    setDateFrom('');
    setDateTo('');
    // If accessed from /stock-analysis, update URL with new stock
    // If accessed from /stock/:stockName, navigate to new stock
    const encodedStock = encodeURIComponent(newStock);
    navigate(`/stock/${encodedStock}`);
  };

  // Get and filter stock data by date range
  const stockData = getStockData(selectedStock);

  const getFilteredStockData = useMemo(() => {
    if (!stockData || stockData.length === 0) return [];
    if (!dateFrom && !dateTo) return stockData;

    return stockData.filter(d => {
      const recordDate = new Date(d.date);

      if (dateFrom && dateTo) {
        return recordDate >= new Date(dateFrom) && recordDate <= new Date(dateTo);
      } else if (dateFrom) {
        return recordDate >= new Date(dateFrom);
      } else if (dateTo) {
        return recordDate <= new Date(dateTo);
      }

      return true;
    });
  }, [stockData, dateFrom, dateTo]);

  // Auto-initialize dates to full data range when stock data loads
  useEffect(() => {
    if (stockData.length > 0 && !dateFrom && !dateTo) {
      const sortedData = [...stockData].sort((a, b) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      const firstDate = sortedData[0].date.split('T')[0];
      const lastDate = sortedData[sortedData.length - 1].date.split('T')[0];

      setDateFrom(firstDate);
      setDateTo(lastDate);
    }
  }, [selectedStock, stockData, dateFrom, dateTo]);

  // Handle preset date range buttons
  const handlePresetRange = (range: '1M' | '3M' | '6M' | '1Y' | 'ALL') => {
    const allData = getStockData(selectedStock);
    if (allData.length === 0) return;

    const sortedData = [...allData].sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const latestDate = sortedData[sortedData.length - 1].date.split('T')[0];

    if (range === 'ALL') {
      setDateFrom(sortedData[0].date.split('T')[0]);
      setDateTo(latestDate);
      return;
    }

    const now = new Date(latestDate);
    const monthsBack = range === '1M' ? 1 : range === '3M' ? 3 : range === '6M' ? 6 : 12;
    const cutoffDate = new Date(now.getFullYear(), now.getMonth() - monthsBack, now.getDate());

    setDateFrom(cutoffDate.toISOString().split('T')[0]);
    setDateTo(latestDate);
  };

  usePageTitle('Stock Metrics and History', selectedStock);

  if (!selectedStock && isLoading) {
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
              Back to Options
            </Button>
          </div>
        )}
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <p className="text-muted-foreground">Loading stock data...</p>
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
              Back to Options
            </Button>
          </div>
        )}
        <div className="text-center">
          <h1 className="text-2xl font-bold">No Stock Selected</h1>
          <p className="text-muted-foreground mt-2">Please select a stock to view.</p>
        </div>
      </div>
    );
  }

  const stockSummary = getStockSummary(selectedStock);

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
              Back to Options
            </Button>
          </div>
        )}
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <p className="text-muted-foreground">Loading stock data...</p>
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
              Back to Options
            </Button>
          </div>
        )}
        <div className="text-center">
          <h1 className="text-2xl font-bold">Error Loading Stock Data</h1>
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
              Back to Options
            </Button>
          </div>
        )}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Stock Metrics and History</h1>
          </div>
          <div className="w-full max-w-xs">
            <Select value={selectedStock} onValueChange={handleStockChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a stock..." />
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
          <h2 className="text-2xl font-bold">Stock Not Found</h2>
          <p className="text-muted-foreground mt-2">
            No data available for "{selectedStock}".
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-3xl font-bold">Stock Metrics and History</h1>
        {isFromStock && (
          <Button
            variant="outline"
            onClick={handleBackClick}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Options
          </Button>
        )}
      </div>

      <div className="w-full max-w-xs">
        <Select value={selectedStock} onValueChange={handleStockChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select a stock..." />
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

      {/* Date Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter by Date Range</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Preset Buttons */}
          <div className="flex gap-1 mb-4 flex-wrap">
            {(['1M', '3M', '6M', '1Y', 'ALL'] as const).map(range => (
              <Button
                key={range}
                variant="outline"
                size="sm"
                onClick={() => handlePresetRange(range)}
              >
                {range}
              </Button>
            ))}
          </div>

          {/* Date Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col space-y-2">
              <Label htmlFor="date-from" className="font-semibold">
                From Date
              </Label>
              <Input
                id="date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            <div className="flex flex-col space-y-2">
              <Label htmlFor="date-to" className="font-semibold">
                To Date
              </Label>
              <Input
                id="date-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>

          {/* Validation Warning */}
          {dateFrom && dateTo && new Date(dateTo) < new Date(dateFrom) && (
            <p className="text-sm text-amber-600 mt-2">
              Warning: "To Date" is before "From Date". Showing all available data.
            </p>
          )}
        </CardContent>
      </Card>

      <StockDetails stockData={getFilteredStockData} stockSummary={stockSummary} />
    </div>
  );
};

export default StockDetailsPage;