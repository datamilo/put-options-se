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
import { ArrowLeft, Target } from "lucide-react";

const PortfolioGenerator = () => {
  const navigate = useNavigate();
  const { data: rawData, isLoading, error } = useOptionsData();
  const data = useRecalculatedOptions(rawData || []);
  const { getLowPriceForPeriod } = useStockData();

  // Form state
  const [totalPremiumTarget, setTotalPremiumTarget] = useState<number>(500);
  const [generatedPortfolio, setGeneratedPortfolio] = useState<OptionData[]>([]);
  const [portfolioGenerated, setPortfolioGenerated] = useState<boolean>(false);

  // Simple portfolio generation - just take first 5 options that meet premium target
  const generatePortfolio = () => {
    try {
      const selectedOptions: OptionData[] = [];
      let totalPremium = 0;

      for (const option of data.slice(0, 50)) { // Only check first 50 options
        if (option.Premium > 0 && totalPremium + option.Premium <= totalPremiumTarget) {
          selectedOptions.push(option);
          totalPremium += option.Premium;
          if (selectedOptions.length >= 5) break; // Max 5 options
        }
      }

      setGeneratedPortfolio(selectedOptions);
      setPortfolioGenerated(true);
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
          
          <Button onClick={generatePortfolio} className="w-full md:w-auto">
            Generate Simple Portfolio
          </Button>
          
          <div className="text-center">
            <p>Testing simple portfolio generation...</p>
          </div>
        </CardContent>
      </Card>

      {portfolioGenerated && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Portfolio ({generatedPortfolio.length} options)</CardTitle>
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