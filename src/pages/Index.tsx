import { useState } from "react";
import { OptionData } from "@/types/options";
import { OptionsTable } from "@/components/options/OptionsTable";
import { OptionsChart } from "@/components/options/OptionsChart";
import { OptionDetails } from "@/components/options/OptionDetails";
import { useOptionsData } from "@/hooks/useOptionsData";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, BarChart3, Table, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";

const Index = () => {
  const { data, isLoading, error, loadCSVFile, loadMockData } = useOptionsData();
  const [selectedOption, setSelectedOption] = useState<OptionData | null>(null);
  const [selectedStock, setSelectedStock] = useState<string>("");

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        toast.error("Please select a CSV file");
        return;
      }
      loadCSVFile(file);
      toast.success("Loading CSV file...");
    }
  };

  const uniqueStocks = [...new Set(data.map(option => option.StockName))].sort();
  
  const filteredData = selectedStock 
    ? data.filter(option => option.StockName === selectedStock)
    : data;

  const handleLoadMockData = () => {
    loadMockData();
    toast.success("Mock data loaded");
  };

  if (selectedOption) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Option Details</h1>
          <Button 
            variant="outline" 
            onClick={() => setSelectedOption(null)}
          >
            Back to Overview
          </Button>
        </div>
        <OptionDetails option={selectedOption} />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Options Data Visualizer</h1>
        <p className="text-xl text-muted-foreground">
          Analyze Swedish stock market options data
        </p>
      </div>

      {data.length === 0 ? (
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Load Options Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="csv-upload">Upload CSV File</Label>
              <Input
                id="csv-upload"
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                disabled={isLoading}
              />
            </div>
            
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Or try with sample data
              </p>
              <Button onClick={handleLoadMockData} variant="outline">
                Load Mock Data
              </Button>
            </div>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">
                {error}
              </div>
            )}

            {isLoading && (
              <div className="text-center text-sm text-muted-foreground">
                Loading data...
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold">
                {data.length} Options Available
              </h2>
              <p className="text-muted-foreground">
                From {uniqueStocks.length} different stocks
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="space-y-1">
                <Label htmlFor="stock-filter">Filter by Stock</Label>
                <select
                  id="stock-filter"
                  value={selectedStock}
                  onChange={(e) => setSelectedStock(e.target.value)}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="">All Stocks</option>
                  {uniqueStocks.map(stock => (
                    <option key={stock} value={stock}>{stock}</option>
                  ))}
                </select>
              </div>
              
              <Button
                variant="outline"
                onClick={() => {
                  const input = document.getElementById('csv-upload') as HTMLInputElement;
                  input?.click();
                }}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload New Data
              </Button>
            </div>
          </div>

          <Tabs defaultValue="table" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="table" className="flex items-center gap-2">
                <Table className="h-4 w-4" />
                Table View
              </TabsTrigger>
              <TabsTrigger value="charts" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Charts
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="table">
              <OptionsTable 
                data={filteredData} 
                onRowClick={setSelectedOption}
              />
            </TabsContent>
            
            <TabsContent value="charts">
              <OptionsChart data={filteredData} />
            </TabsContent>
          </Tabs>
        </div>
      )}

      <input
        id="csv-upload"
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  );
};

export default Index;
