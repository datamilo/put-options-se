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
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { ArrowLeft, Target, ChevronDown } from "lucide-react";

const PortfolioGenerator = () => {
  const navigate = useNavigate();
  const { data: rawData, isLoading, error } = useOptionsData();
  const data = useRecalculatedOptions(rawData || []);
  const { getLowPriceForPeriod } = useStockData();

  // Form state
  const [totalPremiumTarget, setTotalPremiumTarget] = useState<number>(500);
  const [totalPremiumInput, setTotalPremiumInput] = useState<string>("500");
  const [strikeBelowPeriod, setStrikeBelowPeriod] = useState<number | null>(null);
  const [minProbabilityWorthless, setMinProbabilityWorthless] = useState<number | null>(null);
  const [selectedExpiryDate, setSelectedExpiryDate] = useState<string>("");
  const [underlyingStockValue, setUnderlyingStockValue] = useState<number>(100000);
  const [underlyingValueInput, setUnderlyingValueInput] = useState<string>("100000");
  const [selectedProbabilityField, setSelectedProbabilityField] = useState<string>("ProbWorthless_Bayesian_IsoCal");
  const [generatedPortfolio, setGeneratedPortfolio] = useState<OptionData[]>([]);
  const [portfolioGenerated, setPortfolioGenerated] = useState<boolean>(false);
  const [totalUnderlyingValue, setTotalUnderlyingValue] = useState<number>(0);
  const [portfolioMessage, setPortfolioMessage] = useState<string>("");

  // Get dropdown options from data
  const timePeriodOptions = [
    { label: "1 Week Low", days: 7 },
    { label: "1 Month Low", days: 30 },
    { label: "3 Months Low", days: 90 },
    { label: "6 Months Low", days: 180 },
    { label: "9 Months Low", days: 270 },
    { label: "1 Year Low", days: 365 },
  ];

  const probabilityFieldOptions = [
    { value: "ProbWorthless_Bayesian_IsoCal", label: "Bayesian Calibrated" },
    { value: "1_2_3_ProbOfWorthless_Weighted", label: "Weighted Average" },
    { value: "1_ProbOfWorthless_Original", label: "Original" },
    { value: "2_ProbOfWorthless_Calibrated", label: "Calibrated" },
    { value: "3_ProbOfWorthless_Historical_IV", label: "Historical IV" },
  ];

  const availableExpiryDates = useMemo(() => {
    return [...new Set(data.map(option => option.ExpiryDate))].sort();
  }, [data]);

  // Input validation functions
  const validateTotalPremium = (value: string) => {
    const num = parseInt(value) || 500;
    const clampedValue = Math.max(500, Math.min(1000000, num));
    setTotalPremiumTarget(clampedValue);
    setTotalPremiumInput(clampedValue.toString());
  };

  const validateUnderlyingValue = (value: string) => {
    const num = parseInt(value) || 10000;
    const clampedValue = Math.max(10000, Math.min(1000000, num));
    setUnderlyingStockValue(clampedValue);
    setUnderlyingValueInput(clampedValue.toString());
  };

  // Helper function to get probability value with fallback
  const getProbabilityValue = (option: OptionData): number => {
    const primaryValue = option[selectedProbabilityField as keyof OptionData] as number;
    const fallbackValue = option['1_2_3_ProbOfWorthless_Weighted'];
    return primaryValue || fallbackValue || 0;
  };

  const generatePortfolio = () => {
    try {
      const selectedOptions: OptionData[] = [];
      const usedStocks = new Set<string>();
      let totalPremium = 0;

      // Filter options based on criteria
      let filteredOptions = data.filter(option => {
        // Basic checks
        if (option.Premium <= 0) return false;

        // Strike price below period filter
        if (strikeBelowPeriod) {
          const lowPrice = getLowPriceForPeriod(option.StockName, strikeBelowPeriod);
          if (!lowPrice || option.StrikePrice > lowPrice) return false;
        }

        // Expiry date filter
        if (selectedExpiryDate && option.ExpiryDate !== selectedExpiryDate) return false;

        // Probability filter - must meet minimum threshold if specified
        if (minProbabilityWorthless) {
          const prob = getProbabilityValue(option);
          // Convert user input from percentage (70) to decimal (0.70) for comparison
          const minProbDecimal = minProbabilityWorthless / 100;
          if (prob < minProbDecimal) return false;
        }

        return true;
      });

      // Sort by probability and premium for optimal selection
      filteredOptions.sort((a, b) => {
        const probA = getProbabilityValue(a);
        const probB = getProbabilityValue(b);
        
        if (minProbabilityWorthless) {
          // Convert user input from percentage to decimal for comparison
          const minProbDecimal = minProbabilityWorthless / 100;
          // When minimum probability is set, prioritize options closest to the target value
          const diffA = Math.abs(probA - minProbDecimal);
          const diffB = Math.abs(probB - minProbDecimal);
          if (diffA !== diffB) return diffA - diffB; // Closest to target first
        } else {
          // When no minimum is set, prioritize highest probability
          if (probB !== probA) return probB - probA; // Higher probability first
        }
        
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
                value={totalPremiumInput}
                onChange={(e) => setTotalPremiumInput(e.target.value)}
                onBlur={(e) => validateTotalPremium(e.target.value)}
                placeholder="500 - 1,000,000"
              />
              <p className="text-xs text-muted-foreground">Range: 500 - 1,000,000 SEK</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="underlyingValue">Underlying Stock Value (SEK) *</Label>
              <Input
                id="underlyingValue"
                type="number"
                value={underlyingValueInput}
                onChange={(e) => setUnderlyingValueInput(e.target.value)}
                onBlur={(e) => validateUnderlyingValue(e.target.value)}
                placeholder="10,000 - 1,000,000"
              />
              <p className="text-xs text-muted-foreground">Range: 10,000 - 1,000,000 SEK</p>
            </div>

            <div className="space-y-2">
              <Label>Strike Price Below</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    {strikeBelowPeriod === null 
                      ? "Select Period (Optional)" 
                      : timePeriodOptions.find(opt => opt.days === strikeBelowPeriod)?.label}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-full bg-background z-50">
                  <DropdownMenuItem onClick={() => setStrikeBelowPeriod(null)}>
                    No Filter
                  </DropdownMenuItem>
                  {timePeriodOptions.map(option => (
                    <DropdownMenuItem 
                      key={option.days}
                      onClick={() => setStrikeBelowPeriod(option.days)}
                    >
                      {option.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
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

            <div className="space-y-2">
              <Label>Probability Field to Use</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    {probabilityFieldOptions.find(opt => opt.value === selectedProbabilityField)?.label || "Select Field"}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-full bg-background z-50">
                  {probabilityFieldOptions.map(option => (
                    <DropdownMenuItem 
                      key={option.value}
                      onClick={() => setSelectedProbabilityField(option.value)}
                    >
                      {option.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Expiry Date</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    {selectedExpiryDate || "Select Expiry Date (Optional)"}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-full bg-background z-50 max-h-[200px] overflow-y-auto">
                  <DropdownMenuItem onClick={() => setSelectedExpiryDate("")}>
                    All Expiry Dates
                  </DropdownMenuItem>
                  {availableExpiryDates.map(date => (
                    <DropdownMenuItem 
                      key={date}
                      onClick={() => setSelectedExpiryDate(date)}
                    >
                      {date}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
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
            />
          </CardContent>
        </Card>
      )}

    </div>
  );
};

export default PortfolioGenerator;