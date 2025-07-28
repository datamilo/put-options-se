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
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { BarChart3, Table, FileSpreadsheet, ChevronDown } from "lucide-react";
import { toast } from "sonner";

const Index = () => {
  const { data, isLoading, error, loadMockData } = useOptionsData();
  const [selectedOption, setSelectedOption] = useState<OptionData | null>(null);
  const [selectedStocks, setSelectedStocks] = useState<string[]>([]);
  const [selectedExpiryDates, setSelectedExpiryDates] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [stockSearch, setStockSearch] = useState("");
  const [expirySearch, setExpirySearch] = useState("");
  const getFilteredStocks = () => {
    const stocks = selectedExpiryDates.length === 0 
      ? [...new Set(data.map(option => option.StockName))]
      : [...new Set(data.filter(option => selectedExpiryDates.includes(option.ExpiryDate)).map(option => option.StockName))];
    
    return stocks
      .filter(stock => stock.toLowerCase().includes(stockSearch.toLowerCase()))
      .sort();
  };

  const getFilteredExpiryDates = () => {
    const dates = selectedStocks.length === 0 
      ? [...new Set(data.map(option => option.ExpiryDate))]
      : [...new Set(data.filter(option => selectedStocks.includes(option.StockName)).map(option => option.ExpiryDate))];
    
    return dates
      .filter(date => date.toLowerCase().includes(expirySearch.toLowerCase()))
      .sort();
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
        <h1 className="text-4xl font-bold">Put Options Data</h1>
        <p className="text-xl text-muted-foreground">
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
                Loading...
              </div>
            )}

            {!isLoading && !error && (
              <div className="text-center text-sm text-muted-foreground">
                Loading...
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="min-w-[200px] justify-between">
                      {selectedStocks.length === 0 ? 'All Stocks' : 
                       selectedStocks.length === 1 ? selectedStocks[0] : 
                       `${selectedStocks.length} stocks selected`}
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[200px] p-3 max-h-60 overflow-y-auto">
                    <div className="space-y-2">
                      <Input
                        placeholder="Search stocks..."
                        value={stockSearch}
                        onChange={(e) => setStockSearch(e.target.value)}
                        className="h-8"
                      />
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
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="space-y-2">
                <Label>Filter by Expiry Date</Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="min-w-[200px] justify-between">
                      {selectedExpiryDates.length === 0 ? 'All Expiry Dates' : 
                       selectedExpiryDates.length === 1 ? selectedExpiryDates[0] : 
                       `${selectedExpiryDates.length} dates selected`}
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[200px] p-3 max-h-60 overflow-y-auto">
                    <div className="space-y-2">
                      <Input
                        placeholder="Search dates..."
                        value={expirySearch}
                        onChange={(e) => setExpirySearch(e.target.value)}
                        className="h-8"
                      />
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
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
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
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
              />
            </TabsContent>
            
            <TabsContent value="charts">
              <OptionsChart data={filteredData} />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};

export default Index;
