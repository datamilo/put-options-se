import { useParams, useNavigate } from "react-router-dom";
import { useStockData } from "@/hooks/useStockData";
import { StockDetails } from "@/components/stock/StockDetails";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";

const StockDetailsPage = () => {
  const { stockName } = useParams<{ stockName: string }>();
  const navigate = useNavigate();
  const { getStockData, getStockSummary, isLoading, error } = useStockData();

  if (!stockName) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => navigate("/")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Options
          </Button>
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold">Invalid Stock</h1>
          <p className="text-muted-foreground mt-2">No stock name provided.</p>
        </div>
      </div>
    );
  }

  const decodedStockName = decodeURIComponent(stockName);
  const stockData = getStockData(decodedStockName);
  const stockSummary = getStockSummary(decodedStockName);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => navigate("/")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Options
          </Button>
        </div>
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
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => navigate("/")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Options
          </Button>
        </div>
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
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => navigate("/")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Options
          </Button>
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold">Stock Not Found</h1>
          <p className="text-muted-foreground mt-2">
            No data available for "{decodedStockName}".
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Stock Analysis</h1>
        <Button 
          variant="outline" 
          onClick={() => navigate("/")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Options
        </Button>
      </div>
      <StockDetails stockData={stockData} stockSummary={stockSummary} />
    </div>
  );
};

export default StockDetailsPage;