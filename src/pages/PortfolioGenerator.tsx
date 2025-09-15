import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { OptionData } from "@/types/options";
import { OptionsTable } from "@/components/options/OptionsTable";
import { useEnrichedOptionsData } from "@/hooks/useEnrichedOptionsData";
import { useRecalculatedOptions } from "@/hooks/useRecalculatedOptions";
import { useStockData } from "@/hooks/useStockData";
import { useSettings } from "@/contexts/SettingsContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { ArrowLeft, Settings, ChevronDown, Info } from "lucide-react";

const PortfolioGenerator = () => {
  const navigate = useNavigate();
  const { data: rawData, isLoading, error } = useEnrichedOptionsData();
  const data = useRecalculatedOptions(rawData || []);
  const { getLowPriceForPeriod } = useStockData();
  const { underlyingValue, setUnderlyingValue, transactionCost } = useSettings();

  // Removed originalSettings to avoid conflicts

  // Form state with localStorage persistence
  const [totalPremiumTarget, setTotalPremiumTarget] = useState<number>(() => {
    const saved = localStorage.getItem('portfolioGenerator_totalPremiumTarget');
    return saved ? parseInt(saved) : 500;
  });
  const [totalPremiumInput, setTotalPremiumInput] = useState<string>(() => {
    const saved = localStorage.getItem('portfolioGenerator_totalPremiumTarget');
    return saved ? saved : "500";
  });
  const [strikeBelowPeriod, setStrikeBelowPeriod] = useState<number | null>(() => {
    const saved = localStorage.getItem('portfolioGenerator_strikeBelowPeriod');
    return saved ? parseInt(saved) : null;
  });
  const [minProbabilityWorthless, setMinProbabilityWorthless] = useState<number | null>(() => {
    const saved = localStorage.getItem('portfolioGenerator_minProbabilityWorthless');
    return saved ? parseInt(saved) : null;
  });
  const [selectedExpiryDate, setSelectedExpiryDate] = useState<string>(() => {
    return localStorage.getItem('portfolioGenerator_selectedExpiryDate') || "";
  });
  const [underlyingValueInput, setUnderlyingValueInput] = useState<string>(() => {
    const saved = localStorage.getItem('portfolioGenerator_underlyingStockValue');
    return saved ? saved : underlyingValue.toString();
  });
  const [selectedProbabilityField, setSelectedProbabilityField] = useState<string>(() => {
    return localStorage.getItem('portfolioGenerator_selectedProbabilityField') || "ProbWorthless_Bayesian_IsoCal";
  });
  const [generatedPortfolio, setGeneratedPortfolio] = useState<OptionData[]>(() => {
    const saved = localStorage.getItem('portfolioGenerator_generatedPortfolio');
    return saved ? JSON.parse(saved) : [];
  });
  const [portfolioGenerated, setPortfolioGenerated] = useState<boolean>(() => {
    const saved = localStorage.getItem('portfolioGenerator_portfolioGenerated');
    return saved === 'true';
  });
  const [totalUnderlyingValue, setTotalUnderlyingValue] = useState<number>(() => {
    const saved = localStorage.getItem('portfolioGenerator_totalUnderlyingValue');
    return saved ? parseInt(saved) : 0;
  });
  const [portfolioMessage, setPortfolioMessage] = useState<string>(() => {
    return localStorage.getItem('portfolioGenerator_portfolioMessage') || "";
  });
  const [totalPotentialLoss, setTotalPotentialLoss] = useState<number>(() => {
    const saved = localStorage.getItem('portfolioGenerator_totalPotentialLoss');
    return saved ? parseFloat(saved) : 0;
  });
  const [excludedStocks, setExcludedStocks] = useState<string[]>(() => {
    const saved = localStorage.getItem('portfolioGenerator_excludedStocks');
    return saved ? JSON.parse(saved) : [];
  });

  // Portfolio table sorting state
  const [sortField, setSortField] = useState<keyof OptionData | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Description visibility state
  const [showDescription, setShowDescription] = useState(false);

  const handleSortChange = (field: keyof OptionData) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

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

  const availableStocks = useMemo(() => {
    return [...new Set(data.map(option => option.StockName))].sort();
  }, [data]);

  // Input validation functions with localStorage persistence
  const validateTotalPremium = (value: string) => {
    const num = parseInt(value) || 500;
    const clampedValue = Math.max(500, Math.min(1000000, num));
    setTotalPremiumTarget(clampedValue);
    setTotalPremiumInput(clampedValue.toString());
    localStorage.setItem('portfolioGenerator_totalPremiumTarget', clampedValue.toString());
  };


  const handleUnderlyingValueChange = (value: string) => {
    setUnderlyingValueInput(value);
    // Only update global settings on blur, not on every keystroke
  };

  const handleUnderlyingValueBlur = () => {
    const num = parseInt(underlyingValueInput) || 10000;
    const clampedValue = Math.max(10000, Math.min(1000000, num));
    setUnderlyingValue(clampedValue);
    setUnderlyingValueInput(clampedValue.toString());
    localStorage.setItem('portfolioGenerator_underlyingStockValue', clampedValue.toString());
    
    // Clear any existing generated portfolio so user needs to regenerate with new value
    if (portfolioGenerated) {
      setGeneratedPortfolio([]);
      setPortfolioGenerated(false);
      setPortfolioMessage("");
      setTotalPotentialLoss(0);
      localStorage.removeItem('portfolioGenerator_generatedPortfolio');
      localStorage.removeItem('portfolioGenerator_portfolioGenerated');
      localStorage.removeItem('portfolioGenerator_portfolioMessage');
      localStorage.removeItem('portfolioGenerator_totalUnderlyingValue');
      localStorage.removeItem('portfolioGenerator_totalPotentialLoss');
    }
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

      // Filter options based on criteria - use the recalculated data that includes updated premiums
      let filteredOptions = data.filter(option => {
        // Basic checks - use the recalculated Premium which is updated based on underlying value
        if (option.Premium <= 0) return false;

        // Exclude selected stocks
        if (excludedStocks.includes(option.StockName)) return false;

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

      // Calculate risk-adjusted scores and sort by best risk/return ratio
      filteredOptions.forEach(option => {
        const prob = getProbabilityValue(option);
        const potentialLoss = Math.abs((option as any).PotentialLossAtLowerBound || 1); // Use absolute value and avoid division by zero
        const premium = option.Premium;
        
        // Calculate Expected Value: Premium - (1 - ProbOfWorthless) × PotentialLoss
        const expectedValue = premium - (1 - prob) * potentialLoss;
        
        // Calculate capital required (investment amount)
        const capitalRequired = option.NumberOfContractsBasedOnLimit * option.StrikePrice * 100;
        
        // Calculate Expected Value per unit of capital
        const expectedValuePerCapital = capitalRequired > 0 ? expectedValue / capitalRequired : 0;
        
        // Calculate simplified risk-adjusted score: (Premium / PotentialLoss) × ProbOfWorthless
        const riskAdjustedScore = potentialLoss > 0 ? (premium / potentialLoss) * prob : prob;
        
        // Store calculated metrics on the option for potential display
        (option as any).expectedValue = expectedValue;
        (option as any).expectedValuePerCapital = expectedValuePerCapital;
        (option as any).riskAdjustedScore = riskAdjustedScore;
      });

      // Sort by risk-adjusted score (higher is better)
      filteredOptions.sort((a, b) => {
        const scoreA = (a as any).riskAdjustedScore || 0;
        const scoreB = (b as any).riskAdjustedScore || 0;
        
        // Primary sort: highest risk-adjusted score first
        if (scoreB !== scoreA) return scoreB - scoreA;
        
        // Secondary sort: highest expected value per capital first
        const evPerCapA = (a as any).expectedValuePerCapital || 0;
        const evPerCapB = (b as any).expectedValuePerCapital || 0;
        if (evPerCapB !== evPerCapA) return evPerCapB - evPerCapA;
        
        // Tertiary sort: highest premium first
        return b.Premium - a.Premium;
      });

      // Select maximum one option per stock
      for (const option of filteredOptions) {
        if (usedStocks.has(option.StockName)) continue;
        
        // Use the recalculated Premium which reflects the current underlying value
        if (totalPremium + option.Premium <= totalPremiumTarget) {
          selectedOptions.push(option);
          usedStocks.add(option.StockName);
          totalPremium += option.Premium; // This is the recalculated premium
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
            totalPremium += option.Premium; // Using recalculated premium
          }
        }
      }

      // Calculate total underlying value using the recalculated NumberOfContractsBasedOnLimit
      const calculatedUnderlyingValue = selectedOptions.reduce((sum, option) => {
        return sum + (option.NumberOfContractsBasedOnLimit * option.StrikePrice * 100);
      }, 0);

      // Calculate total potential loss at lower bound
      const totalPotentialLoss = selectedOptions.reduce((sum, option) => {
        const loss = (option as any).PotentialLossAtLowerBound || 0;
        return sum + loss;
      }, 0);

      // Generate status message
      let message = "";
      if (totalPremium < totalPremiumTarget) {
        const deficit = totalPremiumTarget - totalPremium;
        message = `Portfolio generated with ${totalPremium} SEK premium (${deficit} SEK below target). `;
      } else {
        message = `Portfolio successfully generated with ${totalPremium} SEK premium.`;
      }

      setGeneratedPortfolio(selectedOptions);
      setTotalUnderlyingValue(calculatedUnderlyingValue);
      setPortfolioMessage(message);
      setPortfolioGenerated(true);
      
      // Store total potential loss for display
      setTotalPotentialLoss(totalPotentialLoss);
      
      // Save to localStorage
      localStorage.setItem('portfolioGenerator_generatedPortfolio', JSON.stringify(selectedOptions));
      localStorage.setItem('portfolioGenerator_totalUnderlyingValue', calculatedUnderlyingValue.toString());
      localStorage.setItem('portfolioGenerator_portfolioMessage', message);
      localStorage.setItem('portfolioGenerator_totalPotentialLoss', totalPotentialLoss.toString());
      localStorage.setItem('portfolioGenerator_portfolioGenerated', 'true');
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

  // Simplified: No automatic value syncing to avoid conflicts

  // Handle navigation to main page
  const handleBackToMain = () => {
    navigate("/");
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4 mb-4">
        <Button variant="ghost" onClick={handleBackToMain} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Options
        </Button>
        <h1 className="text-3xl font-bold">Automatic Portfolio Generator</h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDescription(!showDescription)}
          className="ml-auto flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <Info className="h-4 w-4" />
          How it works
        </Button>
      </div>

      {showDescription && (
        <Card className="border-muted bg-muted/20">
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              The Portfolio Generator uses an algorithm to evaluate each option's probability of expiring worthless, potential loss, and premium. 
              It calculates risk-adjusted scores and expected values, ranks all options, and automatically 
              selects a diversified set that maximizes premium while minimizing risk.
              It will always pick just one option per stock.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Portfolio Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="totalPremium">Total Portfolio Premium</Label>
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
              <Label htmlFor="underlyingValue">Underlying Stock Value Per Option</Label>
                <Input
                id="underlyingValue"
                type="number"
                value={underlyingValueInput}
                onChange={(e) => handleUnderlyingValueChange(e.target.value)}
                onBlur={handleUnderlyingValueBlur}
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
                  <DropdownMenuItem onClick={() => {
                    setStrikeBelowPeriod(null);
                    localStorage.setItem('portfolioGenerator_strikeBelowPeriod', '');
                  }}>
                    No Filter
                  </DropdownMenuItem>
                  {timePeriodOptions.map(option => (
                    <DropdownMenuItem 
                      key={option.days}
                      onClick={() => {
                        setStrikeBelowPeriod(option.days);
                        localStorage.setItem('portfolioGenerator_strikeBelowPeriod', option.days.toString());
                      }}
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
                onChange={(e) => {
                  const value = e.target.value ? parseInt(e.target.value) : null;
                  setMinProbabilityWorthless(value);
                  localStorage.setItem('portfolioGenerator_minProbabilityWorthless', value ? value.toString() : '');
                }}
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
                      onClick={() => {
                        setSelectedProbabilityField(option.value);
                        localStorage.setItem('portfolioGenerator_selectedProbabilityField', option.value);
                      }}
                    >
                      {option.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="space-y-2">
              <Label>Expiry Date</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    {selectedExpiryDate || "Select Expiry Date (Optional)"}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-full bg-background z-50 max-h-[200px] overflow-y-auto">
                  <DropdownMenuItem onClick={() => {
                    setSelectedExpiryDate("");
                    localStorage.setItem('portfolioGenerator_selectedExpiryDate', '');
                  }}>
                    All Expiry Dates
                  </DropdownMenuItem>
                  {availableExpiryDates.map(date => (
                    <DropdownMenuItem 
                      key={date}
                      onClick={() => {
                        setSelectedExpiryDate(date);
                        localStorage.setItem('portfolioGenerator_selectedExpiryDate', date);
                      }}
                    >
                      {date}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="space-y-2">
              <Label>Exclude Stocks</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    {excludedStocks.length > 0 ? `${excludedStocks.length} stock(s) excluded` : "No stocks excluded"}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-full bg-background z-50 max-h-[200px] overflow-y-auto">
                  <DropdownMenuItem onClick={() => {
                    setExcludedStocks([]);
                    localStorage.setItem('portfolioGenerator_excludedStocks', JSON.stringify([]));
                  }}>
                    Clear All Exclusions
                  </DropdownMenuItem>
                  {availableStocks.map(stock => (
                    <DropdownMenuItem 
                      key={stock}
                      onClick={() => {
                        const newExcluded = excludedStocks.includes(stock)
                          ? excludedStocks.filter(s => s !== stock)
                          : [...excludedStocks, stock];
                        setExcludedStocks(newExcluded);
                        localStorage.setItem('portfolioGenerator_excludedStocks', JSON.stringify(newExcluded));
                      }}
                    >
                      {excludedStocks.includes(stock) ? '✓ ' : ''}{stock}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              {excludedStocks.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Excluded: {excludedStocks.join(', ')}
                </p>
              )}
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
              <p>Total Premium: {generatedPortfolio.reduce((sum, opt) => sum + opt.Premium, 0).toLocaleString()} SEK (Based on {underlyingValue.toLocaleString()} SEK underlying value, {transactionCost} SEK transaction cost per option included)</p>
              <p>Total Calculated Risk of Loss: {Math.round(totalPotentialLoss).toLocaleString()} SEK</p>
            </div>
          </CardHeader>
          <CardContent>
            <OptionsTable
              data={generatedPortfolio}
              onRowClick={handleOptionClick}
              onStockClick={handleStockClick}
              sortField={sortField}
              sortDirection={sortDirection}
              onSortChange={handleSortChange}
              enableFiltering={false}
            />
          </CardContent>
        </Card>
      )}

    </div>
  );
};

export default PortfolioGenerator;