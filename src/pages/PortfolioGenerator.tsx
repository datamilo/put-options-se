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
  const [strikePriceBelow, setStrikePriceBelow] = useState<number | null>(null);
  const [minProbabilityWorthless, setMinProbabilityWorthless] = useState<number | null>(null);
  const [expiryDate, setExpiryDate] = useState<string>("");
  const [underlyingStockValue, setUnderlyingStockValue] = useState<number>(100000);
  const [generatedPortfolio, setGeneratedPortfolio] = useState<OptionData[]>([]);
  const [portfolioGenerated, setPortfolioGenerated] = useState<boolean>(false);
  const [totalUnderlyingValue, setTotalUnderlyingValue] = useState<number>(0);
  const [portfolioMessage, setPortfolioMessage] = useState<string>("");

  const generatePortfolio = () => {
    try {
      const selectedOptions: OptionData[] = [];
      const usedStocks = new Set<string>();
      let totalPremium = 0;

      // Filter options based on criteria
      let filteredOptions = data.filter(option => {
        // Basic checks
        if (option.Premium <= 0) return false;

        // Strike price filter
        if (strikePriceBelow && option.StrikePrice >= strikePriceBelow) return false;

        // Expiry date filter
        if (expiryDate) {
          const optionExpiry = new Date(option.ExpiryDate);
          const targetExpiry = new Date(expiryDate);
          if (optionExpiry > targetExpiry) return false;
        }

        // Probability filter (use ProbWorthless_Bayesian_IsoCal or fallback to 1_2_3_ProbOfWorthless_Weighted)
        if (minProbabilityWorthless) {
          const probability = option.ProbWorthless_Bayesian_IsoCal || option['1_2_3_ProbOfWorthless_Weighted'];
          if (!probability || probability < minProbabilityWorthless) return false;
        }

        return true;
      });

      // Sort by probability (highest first) and premium (highest first) for optimal selection
      filteredOptions.sort((a, b) => {
        const probA = a.ProbWorthless_Bayesian_IsoCal || a['1_2_3_ProbOfWorthless_Weighted'] || 0;
        const probB = b.ProbWorthless_Bayesian_IsoCal || b['1_2_3_ProbOfWorthless_Weighted'] || 0;
        
        if (probB !== probA) return probB - probA; // Higher probability first
        return b.Premium - a.Premium; // Higher premium first if probability equal
      });

      // Select maximum one option per stock
      for (const option of filteredOptions) {
        if (usedStocks.has(option.StockName)) continue;
        
        if (totalPremium + option.Premium <= totalPremiumTarget) {
          selectedOptions.push(option);
          usedStocks.add(option.StockName);
          totalPremium += option.Premium;
        }
      }

      // If we haven't reached target, try to get as close as possible by replacing options
      if (totalPremium < totalPremiumTarget) {
        // Sort remaining options by how close they get us to target
        const remainingOptions = filteredOptions.filter(option => 
          !usedStocks.has(option.StockName) && 
          option.Premium <= (totalPremiumTarget - totalPremium)
        );

        for (const option of remainingOptions) {
          if (totalPremium + option.Premium <= totalPremiumTarget) {
            selectedOptions.push(option);
            usedStocks.add(option.StockName);
            totalPremium += option.Premium;
          }
        }
      }

      // Calculate total underlying value
      const calculatedUnderlyingValue = selectedOptions.reduce((sum, option) => {
        return sum + (option.NumberOfContractsBasedOnLimit * option.StrikePrice * 100);
      }, 0);

      // Generate status message
      let message = "";
      if (totalPremium < totalPremiumTarget) {
        const deficit = totalPremiumTarget - totalPremium;
        message = `Portfolio generated with ${totalPremium} SEK premium (${deficit} SEK below target). Available options could not reach the full target amount.`;
      } else {
        message = `Portfolio successfully generated with ${totalPremium} SEK premium, meeting your target.`;
      }

      setGeneratedPortfolio(selectedOptions);
      setTotalUnderlyingValue(calculatedUnderlyingValue);
      setPortfolioMessage(message);
      setPortfolioGenerated(true);
    } catch (error) {
      console.error("Error:", error);
      setPortfolioMessage(`Error generating portfolio: ${error}`);
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              <Label htmlFor="underlyingValue">Underlying Stock Value (SEK) *</Label>
              <Input
                id="underlyingValue"
                type="number"
                min="1000"
                value={underlyingStockValue}
                onChange={(e) => setUnderlyingStockValue(parseInt(e.target.value) || 100000)}
                placeholder="Default 100,000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="strikePriceBelow">Strike Price Below (SEK)</Label>
              <Input
                id="strikePriceBelow"
                type="number"
                value={strikePriceBelow || ""}
                onChange={(e) => setStrikePriceBelow(e.target.value ? parseInt(e.target.value) : null)}
                placeholder="Optional"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="minProbability">Minimum Probability of Worthless (%)</Label>
              <Input
                id="minProbability"
                type="number"
                min="40"
                max="100"
                value={minProbabilityWorthless || ""}
                onChange={(e) => setMinProbabilityWorthless(e.target.value ? parseInt(e.target.value) : null)}
                placeholder="40-100% (Optional)"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="expiryDate">Expiry Date Before</Label>
              <Input
                id="expiryDate"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>
          </div>
          
          <Button onClick={generatePortfolio} className="w-full md:w-auto" size="lg">
            Generate Portfolio Automatically
          </Button>
        </CardContent>
      </Card>

      {portfolioGenerated && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Portfolio ({generatedPortfolio.length} options)</CardTitle>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>{portfolioMessage}</p>
              <p>Total Underlying Stock Value: {totalUnderlyingValue.toLocaleString()} SEK</p>
              <p>Total Premium: {generatedPortfolio.reduce((sum, opt) => sum + opt.Premium, 0).toLocaleString()} SEK</p>
            </div>
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

    </div>
  );
};

export default PortfolioGenerator;