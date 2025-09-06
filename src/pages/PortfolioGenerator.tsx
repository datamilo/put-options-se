import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { OptionData } from "@/types/options";
import { OptionsTable } from "@/components/options/OptionsTable";
import { useOptionsData } from "@/hooks/useOptionsData";
import { useRecalculatedOptions } from "@/hooks/useRecalculatedOptions";
import { useStockData } from "@/hooks/useStockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Target } from "lucide-react";
import { toast } from "sonner";

const PortfolioGenerator = () => {
  const navigate = useNavigate();
  const { data: rawData, isLoading, error } = useOptionsData();
  const data = useRecalculatedOptions(rawData || []);
  const { getLowPriceForPeriod } = useStockData();

  // Form state
  const [totalPremiumTarget, setTotalPremiumTarget] = useState<number>(500);
  const [minProbabilityOfWorthless, setMinProbabilityOfWorthless] = useState<number | null>(null);
  const [expiryDateFilter, setExpiryDateFilter] = useState<string>("");
  const [generatedPortfolio, setGeneratedPortfolio] = useState<OptionData[]>([]);
  const [portfolioGenerated, setPortfolioGenerated] = useState<boolean>(false);
  const [generationMessage, setGenerationMessage] = useState<string>("");

  // Simple portfolio generation that works
  const generatePortfolio = () => {
    console.log("Simple generatePortfolio started");
    
    try {
      // Take only first 50 options for testing
      const limitedData = data.slice(0, 50);
      
      // Simple selection - just take first 5 with positive premium
      const validOptions = limitedData.filter(option => option.Premium > 0);
      const selectedOptions = validOptions.slice(0, 5);
      
      console.log("Selected options:", selectedOptions.length);
      
      setGeneratedPortfolio(selectedOptions);
      setPortfolioGenerated(true);
      setGenerationMessage(`Generated ${selectedOptions.length} options (simple test)`);
      
    } catch (error) {
      console.error("Generation error:", error);
    }
  };

  const handleOptionClick = (option: OptionData) => {
    const optionId = encodeURIComponent(option.OptionName);
    navigate(`/option/${optionId}`);
  };

  const handleStockClick = (stockName: string) => {
    navigate(`/stock/${encodeURIComponent(stockName)}`);
  };

  const uniqueExpiryDates = useMemo(() => {
    try {
      return [...new Set(data.map(option => option.ExpiryDate))].sort();
    } catch (err) {
      return [];
    }
  }, [data]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate("/")} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Options
        </Button>
        <h1 className="text-3xl font-bold">Automatic Portfolio Generator</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Portfolio Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="totalPremium">Total Premium to Receive (SEK) *</Label>
              <Input
                id="totalPremium"
                type="number"
                min="500"
                value={totalPremiumTarget}
                onChange={(e) => setTotalPremiumTarget(parseInt(e.target.value) || 500)}
                placeholder="Minimum 500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="minProbability">Min Probability of Worthless (%)</Label>
              <Input
                id="minProbability"
                type="number"
                min="40"
                max="100"
                value={minProbabilityOfWorthless || ""}
                onChange={(e) => setMinProbabilityOfWorthless(e.target.value ? parseInt(e.target.value) : null)}
                placeholder="40-100% (optional)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiryDate">Expiry Date</Label>
              <Select value={expiryDateFilter} onValueChange={setExpiryDateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select expiry date (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All dates</SelectItem>
                  {uniqueExpiryDates.map(date => (
                    <SelectItem key={date} value={date}>
                      {date}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Button onClick={generatePortfolio} className="w-full md:w-auto">
            Generate Portfolio
          </Button>
        </CardContent>
      </Card>

      {portfolioGenerated && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Portfolio ({generatedPortfolio.length} options)</CardTitle>
            {generationMessage && (
              <p className="text-sm text-muted-foreground">{generationMessage}</p>
            )}
          </CardHeader>
          <CardContent>
            <OptionsTable
              data={generatedPortfolio}
              onRowClick={handleOptionClick}
              onStockClick={handleStockClick}
              sortField={null}
              sortDirection="asc"
              onSortChange={() => {}}
              columnFilters={[]}
              onColumnFiltersChange={() => {}}
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Test - First 10 Options</CardTitle>
        </CardHeader>
        <CardContent>
          <OptionsTable
            data={data.slice(0, 10)}
            onRowClick={handleOptionClick}
            onStockClick={handleStockClick}
            sortField={null}
            sortDirection="asc"
            onSortChange={() => {}}
            columnFilters={[]}
            onColumnFiltersChange={() => {}}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default PortfolioGenerator;