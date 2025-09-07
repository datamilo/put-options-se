import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { OptionData } from "@/types/options";
import { OptionsTable } from "@/components/options/OptionsTable";
import { useOptionsData } from "@/hooks/useOptionsData";
import { useRecalculatedOptions } from "@/hooks/useRecalculatedOptions";
import { useStockData } from "@/hooks/useStockData";
import { useSettings } from "@/contexts/SettingsContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { ArrowLeft, Target, ChevronDown } from "lucide-react";

const PortfolioGenerator = () => {
  console.log('🎯 PortfolioGenerator component mounted');
  console.log('🎯 PortfolioGenerator component mounted');
  const navigate = useNavigate();
  const { data: rawData, isLoading, error } = useOptionsData();
  const data = useRecalculatedOptions(rawData || []);
  console.log('📊 Recalculated data length:', data.length, 'Raw data length:', rawData?.length || 0);
  const { getLowPriceForPeriod } = useStockData();
  const { underlyingValue, setUnderlyingValue } = useSettings();
  console.log('🎛️ Current global underlyingValue:', underlyingValue);

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

  // Input validation functions with localStorage persistence
  const validateTotalPremium = (value: string) => {
    const num = parseInt(value) || 500;
    const clampedValue = Math.max(500, Math.min(1000000, num));
    setTotalPremiumTarget(clampedValue);
    setTotalPremiumInput(clampedValue.toString());
    localStorage.setItem('portfolioGenerator_totalPremiumTarget', clampedValue.toString());
  };


  const handleUnderlyingValueChange = (value: string) => {
    console.log('🔤 Input changed to:', value);
    setUnderlyingValueInput(value);
    // Only update global settings on blur, not on every keystroke
  };

  const handleUnderlyingValueBlur = () => {
    const num = parseInt(underlyingValueInput) || 10000;
    const clampedValue = Math.max(10000, Math.min(1000000, num));
    console.log('Portfolio Generator: Setting underlying value to', clampedValue);
    console.log('Portfolio Generator: Current underlying value before update:', underlyingValue);
    setUnderlyingValue(clampedValue); // This updates the global context and saves to 'underlyingValue' key
    setUnderlyingValueInput(clampedValue.toString());
    // Also save to portfolio generator specific key for form persistence
    localStorage.setItem('portfolioGenerator_underlyingStockValue', clampedValue.toString());
    console.log('Portfolio Generator: LocalStorage updated with', clampedValue);
    
    // Clear any existing generated portfolio so user needs to regenerate with new value
    if (portfolioGenerated) {
      setGeneratedPortfolio([]);
      setPortfolioGenerated(false);
      setPortfolioMessage("");
      localStorage.removeItem('portfolioGenerator_generatedPortfolio');
      localStorage.removeItem('portfolioGenerator_portfolioGenerated');
      localStorage.removeItem('portfolioGenerator_portfolioMessage');
      localStorage.removeItem('portfolioGenerator_totalUnderlyingValue');
      console.log('Portfolio Generator: Cleared previous portfolio due to underlying value change');
    }
  };

  // Helper function to get probability value with fallback
  const getProbabilityValue = (option: OptionData): number => {
    const primaryValue = option[selectedProbabilityField as keyof OptionData] as number;
    const fallbackValue = option['1_2_3_ProbOfWorthless_Weighted'];
    return primaryValue || fallbackValue || 0;
  };

  const generatePortfolio = () => {
    console.log('🚀 Generate Portfolio clicked! Current underlyingValue:', underlyingValue);
    try {
      const selectedOptions: OptionData[] = [];
      const usedStocks = new Set<string>();
      let totalPremium = 0;

      // Filter options based on criteria - use the recalculated data that includes updated premiums
      let filteredOptions = data.filter(option => {
        // Basic checks - use the recalculated Premium which is updated based on underlying value
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
      
      // Save to localStorage
      localStorage.setItem('portfolioGenerator_generatedPortfolio', JSON.stringify(selectedOptions));
      localStorage.setItem('portfolioGenerator_totalUnderlyingValue', calculatedUnderlyingValue.toString());
      localStorage.setItem('portfolioGenerator_portfolioMessage', message);
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
      <div style={{position: 'fixed', top: 0, left: 0, background: 'red', color: 'white', padding: '5px', zIndex: 9999}}>
        PORTFOLIO GENERATOR LOADED - underlyingValue: {underlyingValue}
      </div>
      <div style={{position: 'fixed', top: 0, left: 0, background: 'red', color: 'white', padding: '5px', zIndex: 9999}}>
        PORTFOLIO GENERATOR LOADED - underlyingValue: {underlyingValue}
      </div>
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={handleBackToMain} className="flex items-center gap-2">
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
              <p>Total Premium: {generatedPortfolio.reduce((sum, opt) => sum + opt.Premium, 0).toLocaleString()} SEK (Recalculated based on {underlyingValue.toLocaleString()} SEK underlying value)</p>
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
              enableFiltering={false}
            />
          </CardContent>
        </Card>
      )}

    </div>
  );
};

export default PortfolioGenerator;