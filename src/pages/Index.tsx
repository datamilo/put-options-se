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
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, BarChart3, Table, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";

const Index = () => {
  const { data, isLoading, error, loadCSVFile, loadCSVFromGitHub, loadMockData } = useOptionsData();
  const [selectedOption, setSelectedOption] = useState<OptionData | null>(null);
  const [selectedStocks, setSelectedStocks] = useState<string[]>([]);
  const [selectedExpiryDates, setSelectedExpiryDates] = useState<string[]>([]);
  const [githubFilename, setGithubFilename] = useState<string>("");

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

  // Get filtered options to ensure filter dropdowns only show available combinations
  const getFilteredStocks = () => {
    if (selectedExpiryDates.length === 0) return [...new Set(data.map(option => option.StockName))].sort();
    return [...new Set(data.filter(option => selectedExpiryDates.includes(option.ExpiryDate)).map(option => option.StockName))].sort();
  };

  const getFilteredExpiryDates = () => {
    if (selectedStocks.length === 0) return [...new Set(data.map(option => option.ExpiryDate))].sort();
    return [...new Set(data.filter(option => selectedStocks.includes(option.StockName)).map(option => option.ExpiryDate))].sort();
  };

  const filteredStocks = getFilteredStocks();
  const filteredExpiryDates = getFilteredExpiryDates();
  
  const filteredData = data.filter(option => {
    const matchesStock = selectedStocks.length === 0 || selectedStocks.includes(option.StockName);
    const matchesExpiry = selectedExpiryDates.length === 0 || selectedExpiryDates.includes(option.ExpiryDate);
    return matchesStock && matchesExpiry;
  });

  const handleLoadMockData = () => {
    loadMockData();
    toast.success("Mock data loaded");
  };

  const handleGithubLoad = () => {
    if (!githubFilename.trim()) {
      toast.error("Please enter a filename");
      return;
    }
    loadCSVFromGitHub(githubFilename.trim());
    toast.success("Loading CSV from GitHub...");
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
              Loading Options Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">
                {error}
                <div className="mt-2 space-y-2">
                  <div className="text-center">
                    <Button onClick={handleLoadMockData} variant="outline" disabled={isLoading}>
                      Load Sample Data Instead
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {isLoading && (
              <div className="text-center text-sm text-muted-foreground">
                Loading test.csv from GitHub...
              </div>
            )}

            {!isLoading && !error && (
              <div className="text-center text-sm text-muted-foreground">
                Attempting to load test.csv...
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
                From {filteredStocks.length} different stocks
              </p>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="space-y-2">
                <Label>Filter by Stock</Label>
                <details className="relative">
                  <summary className="cursor-pointer px-3 py-2 border rounded-md min-w-[200px] bg-background hover:bg-accent">
                    {selectedStocks.length === 0 ? 'All Stocks' : 
                     selectedStocks.length === 1 ? selectedStocks[0] : 
                     `${selectedStocks.length} stocks selected`}
                  </summary>
                  <div className="absolute top-full left-0 mt-1 border rounded-md p-3 max-h-40 overflow-y-auto min-w-[200px] bg-background shadow-lg z-50">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 border-b pb-2">
                        <Checkbox
                          id="select-all-stocks"
                          checked={selectedStocks.length === filteredStocks.length && filteredStocks.length > 0}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedStocks(filteredStocks);
                            } else {
                              setSelectedStocks([]);
                            }
                          }}
                        />
                        <label htmlFor="select-all-stocks" className="text-sm cursor-pointer font-medium">
                          Select All
                        </label>
                      </div>
                      {filteredStocks.map(stock => (
                        <div key={stock} className="flex items-center space-x-2">
                          <Checkbox
                            id={`stock-${stock}`}
                            checked={selectedStocks.includes(stock)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedStocks(prev => [...prev, stock]);
                              } else {
                                setSelectedStocks(prev => prev.filter(s => s !== stock));
                              }
                            }}
                          />
                          <label htmlFor={`stock-${stock}`} className="text-sm cursor-pointer">
                            {stock}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </details>
              </div>

              <div className="space-y-2">
                <Label>Filter by Expiry Date</Label>
                <details className="relative">
                  <summary className="cursor-pointer px-3 py-2 border rounded-md min-w-[200px] bg-background hover:bg-accent">
                    {selectedExpiryDates.length === 0 ? 'All Expiry Dates' : 
                     selectedExpiryDates.length === 1 ? selectedExpiryDates[0] : 
                     `${selectedExpiryDates.length} dates selected`}
                  </summary>
                  <div className="absolute top-full left-0 mt-1 border rounded-md p-3 max-h-40 overflow-y-auto min-w-[200px] bg-background shadow-lg z-50">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 border-b pb-2">
                        <Checkbox
                          id="select-all-expiry"
                          checked={selectedExpiryDates.length === filteredExpiryDates.length && filteredExpiryDates.length > 0}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedExpiryDates(filteredExpiryDates);
                            } else {
                              setSelectedExpiryDates([]);
                            }
                          }}
                        />
                        <label htmlFor="select-all-expiry" className="text-sm cursor-pointer font-medium">
                          Select All
                        </label>
                      </div>
                      {filteredExpiryDates.map(date => (
                        <div key={date} className="flex items-center space-x-2">
                          <Checkbox
                            id={`expiry-${date}`}
                            checked={selectedExpiryDates.includes(date)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedExpiryDates(prev => [...prev, date]);
                              } else {
                                setSelectedExpiryDates(prev => prev.filter(d => d !== date));
                              }
                            }}
                          />
                          <label htmlFor={`expiry-${date}`} className="text-sm cursor-pointer">
                            {date}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </details>
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
