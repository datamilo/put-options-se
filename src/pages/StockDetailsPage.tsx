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
import { ArrowLeft, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

const StockDetailsPage = () => {
  const { stockName: paramStockName } = useParams<{ stockName: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { getStockData, getStockSummary, isLoading, error, getAllStockNames } = useStockData();

  const isFromStock = paramStockName !== undefined;
  const decodedParamStockName = paramStockName ? decodeURIComponent(paramStockName) : '';

  const [selectedStock, setSelectedStock] = useState<string>(decodedParamStockName);
  const [allStocks, setAllStocks] = useState<string[]>([]);

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
    // If accessed from /stock-analysis, update URL with new stock
    // If accessed from /stock/:stockName, navigate to new stock
    const encodedStock = encodeURIComponent(newStock);
    navigate(`/stock/${encodedStock}`);
  };

  usePageTitle('Stock Analysis', selectedStock);

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

  const stockData = getStockData(selectedStock);
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
            <h1 className="text-3xl font-bold">Stock Analysis</h1>
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
        <h1 className="text-3xl font-bold">Stock Analysis</h1>
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

      <StockDetails stockData={stockData} stockSummary={stockSummary} />
    </div>
  );
};

export default StockDetailsPage;