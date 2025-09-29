import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { OptionData } from "@/types/options";
import { PortfolioOptionsTable } from "@/components/options/PortfolioOptionsTable";
import { useEnrichedOptionsData } from "@/hooks/useEnrichedOptionsData";
import { useRecalculatedOptions, RecalculatedOptionData } from "@/hooks/useRecalculatedOptions";
import { useStockData } from "@/hooks/useStockData";
import { useSettings } from "@/contexts/SettingsContext";
import { usePortfolioGeneratorPreferences } from "@/hooks/usePortfolioGeneratorPreferences";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { ArrowLeft, Settings, ChevronDown, Info, Download } from "lucide-react";
import { exportToExcel } from "@/utils/excelExport";

const PortfolioGenerator = () => {
  const navigate = useNavigate();
  const { data: rawData, isLoading, error } = useEnrichedOptionsData();
  const { getLowPriceForPeriod } = useStockData();
  const { transactionCost } = useSettings();
  const { settings, updateSetting, updateMultipleSettings, resetToDefaults, isLoading: preferencesLoading } = usePortfolioGeneratorPreferences();

  // Add state to prevent validation during portfolio generation
  const [isGeneratingPortfolio, setIsGeneratingPortfolio] = useState(false);

  // Input states for form controls
  const [totalPremiumInput, setTotalPremiumInput] = useState<string>(settings.totalPremiumTarget.toString());
  const [underlyingValueInput, setUnderlyingValueInput] = useState<string>(settings.portfolioUnderlyingValue.toString());
  const [maxTotalCapitalInput, setMaxTotalCapitalInput] = useState<string>(settings.maxTotalCapital?.toString() || "");

  // Update input states when settings change
  useEffect(() => {
    setTotalPremiumInput(settings.totalPremiumTarget.toString());

    // Only update underlying value input on initial load or major changes from external sources
    if (underlyingValueInput === '' || underlyingValueInput === '0') {
      setUnderlyingValueInput(settings.portfolioUnderlyingValue.toString());
    }

    setMaxTotalCapitalInput(settings.maxTotalCapital?.toString() || "");
  }, [settings]);

  // Custom recalculation function for Portfolio Generator using its own underlying value
  const recalculateOptionsForPortfolio = (options: OptionData[], underlyingValue: number): RecalculatedOptionData[] => {
    return options.map(option => {
      const numberOfContractsBasedOnLimit = Math.round((underlyingValue / option.StrikePrice) / 100);
      const bidAskMidPrice = (option.Bid + (option.Ask || option.Bid)) / 2;
      const recalculatedPremium = Math.round((bidAskMidPrice * numberOfContractsBasedOnLimit * 100) - transactionCost);
      // Calculate the actual underlying value based on portfolio settings
      const calculatedUnderlyingValue = numberOfContractsBasedOnLimit * option.StrikePrice * 100;

      return {
        ...option,
        originalPremium: option.Premium,
        recalculatedPremium,
        recalculatedNumberOfContracts: numberOfContractsBasedOnLimit,
        recalculatedBid_Ask_Mid_Price: bidAskMidPrice,
        Premium: recalculatedPremium,
        NumberOfContractsBasedOnLimit: numberOfContractsBasedOnLimit,
        Bid_Ask_Mid_Price: bidAskMidPrice,
        // Override the Underlying_Value field with the calculated value based on portfolio settings
        Underlying_Value: calculatedUnderlyingValue,
      };
    });
  };

  // Use portfolio-specific recalculated data instead of global settings
  const data = useMemo(() => {
    return recalculateOptionsForPortfolio(rawData || [], settings.portfolioUnderlyingValue);
  }, [rawData, settings.portfolioUnderlyingValue, transactionCost]);

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

  const optimizationStrategyOptions = [
    { value: "returns", label: "Maximize Returns", description: "Prioritize highest risk-adjusted returns" },
    { value: "capital", label: "Minimize Capital", description: "Prioritize lowest capital requirements" },
    { value: "balanced", label: "Balanced", description: "Balance returns and capital efficiency" },
  ];

  const availableExpiryDates = useMemo(() => {
    return [...new Set(data.map(option => option.ExpiryDate))].sort();
  }, [data]);

  const availableStocks = useMemo(() => {
    return [...new Set(data.map(option => option.StockName))].sort();
  }, [data]);

  // Input validation functions
  const validateTotalPremium = (value: string) => {
    const num = parseInt(value) || 500;
    const clampedValue = Math.max(500, Math.min(1000000, num));
    updateSetting('totalPremiumTarget', clampedValue);
    setTotalPremiumInput(clampedValue.toString());
  };


  const handleUnderlyingValueChange = (value: string) => {
    setUnderlyingValueInput(value);
    // Only update global settings on blur, not on every keystroke
  };

  const handleUnderlyingValueBlur = () => {
    // Don't validate during portfolio generation to prevent interference
    if (isGeneratingPortfolio) {
      return;
    }

    const num = parseInt(underlyingValueInput) || 10000;
    const clampedValue = Math.max(10000, Math.min(1000000, num));
    updateSetting('portfolioUnderlyingValue', clampedValue);
    setUnderlyingValueInput(clampedValue.toString());

    // Clear any existing generated portfolio so user needs to regenerate with new value
    if (settings.portfolioGenerated) {
      updateMultipleSettings({
        generatedPortfolio: [],
        portfolioGenerated: false,
        portfolioMessage: "",
        totalPotentialLoss: 0,
        totalUnderlyingValue: 0,
        portfolioUnderlyingValue: clampedValue
      });
    }
  };

  // Helper function to get probability value with fallback
  const getProbabilityValue = (option: OptionData): number | null => {
    const primaryValue = option[settings.selectedProbabilityField as keyof OptionData] as number;
    const fallbackValue = option['1_2_3_ProbOfWorthless_Weighted'];
    
    // Return null if both primary and fallback values are missing/invalid
    if ((primaryValue === null || primaryValue === undefined || isNaN(primaryValue)) && 
        (fallbackValue === null || fallbackValue === undefined || isNaN(fallbackValue))) {
      return null;
    }
    
    return primaryValue || fallbackValue || 0;
  };

  // Helper function to check if option has all required values for portfolio calculation
  const hasRequiredValues = (option: OptionData): boolean => {
    // Check if probability value is available
    const probValue = getProbabilityValue(option);
    if (probValue === null) return false;
    
    // Check if PotentialLossAtLowerBound is available (used in risk calculations)
    const potentialLoss = (option as any).PotentialLossAtLowerBound;
    if (potentialLoss === null || potentialLoss === undefined || isNaN(potentialLoss)) return false;
    
    // Check if NumberOfContractsBasedOnLimit is valid
    if (!option.NumberOfContractsBasedOnLimit || option.NumberOfContractsBasedOnLimit <= 0) return false;
    
    return true;
  };

  const generatePortfolio = (useUnderlyingValue?: number) => {
    // Use the provided underlying value or fall back to settings
    const effectiveUnderlyingValue = useUnderlyingValue || settings.portfolioUnderlyingValue;

    // Early return if no data
    if (!data || data.length === 0) {
      updateSetting('portfolioMessage', 'No options data available for portfolio generation');
      return;
    }

    setIsGeneratingPortfolio(true);
    
    try {
      const selectedOptions: OptionData[] = [];
      const usedStocks = new Set<string>();
      let totalPremium = 0;

      // Recalculate options using the effective underlying value
      const recalculatedData = recalculateOptionsForPortfolio(rawData || [], effectiveUnderlyingValue);

      // Filter options based on criteria - use the recalculated data that includes updated premiums
      let filteredOptions = recalculatedData.filter(option => {
        // CRITICAL: Exclude options with missing required values first
        if (!hasRequiredValues(option)) return false;
        
        // Basic checks - use the recalculated Premium which is updated based on underlying value
        if (option.Premium <= 0) return false;

        // Exclude selected stocks
        if (settings.excludedStocks.includes(option.StockName)) return false;

        // Strike price below period filter
        if (settings.strikeBelowPeriod) {
          const lowPrice = getLowPriceForPeriod(option.StockName, settings.strikeBelowPeriod);
          if (!lowPrice || option.StrikePrice > lowPrice) return false;
        }

        // Expiry date filter
        if (settings.selectedExpiryDate && option.ExpiryDate !== settings.selectedExpiryDate) return false;

        // Probability filter - must meet minimum threshold if specified
        if (settings.minProbabilityWorthless) {
          const prob = getProbabilityValue(option);
          // Convert user input from percentage (70) to decimal (0.70) for comparison
          const minProbDecimal = settings.minProbabilityWorthless / 100;
          if (prob === null || prob < minProbDecimal) return false;
        }

        return true;
      });

      // Calculate risk-adjusted scores and sort by best risk/return ratio
      filteredOptions.forEach(option => {
        const prob = getProbabilityValue(option);
        const potentialLoss = Math.abs((option as any).PotentialLossAtLowerBound);
        const premium = option.Premium;
        
        // At this point, we know prob and potentialLoss are valid (passed hasRequiredValues check)
        // Calculate Expected Value: Premium - (1 - ProbOfWorthless) × PotentialLoss
        const expectedValue = premium - (1 - prob!) * potentialLoss;
        
        // Calculate capital required (investment amount)
        const capitalRequired = option.NumberOfContractsBasedOnLimit * option.StrikePrice * 100;
        
        // Calculate Expected Value per unit of capital (Capital Efficiency Score)
        const expectedValuePerCapital = capitalRequired > 0 ? expectedValue / capitalRequired : 0;
        
        // Calculate Capital Efficiency Score = ExpectedValue / UnderlyingValue
        const capitalEfficiencyScore = capitalRequired > 0 ? expectedValue / capitalRequired : 0;
        
        // Calculate simplified risk-adjusted score: (Premium / PotentialLoss) × ProbOfWorthless
        const riskAdjustedScore = potentialLoss > 0 ? (premium / potentialLoss) * prob! : prob!;
        
        // Calculate combined score based on optimization strategy
        let finalScore = 0;
        if (settings.optimizationStrategy === 'returns') {
          finalScore = riskAdjustedScore;
        } else if (settings.optimizationStrategy === 'capital') {
          // For capital minimization, prefer lower capital requirement with good returns
          finalScore = capitalEfficiencyScore * (prob! * 2); // Weight by probability
        } else { // balanced
          finalScore = (riskAdjustedScore * 0.6) + (capitalEfficiencyScore * 0.4);
        }
        
        // Store calculated metrics on the option for potential display
        (option as any).expectedValue = expectedValue;
        (option as any).expectedValuePerCapital = expectedValuePerCapital;
        (option as any).capitalEfficiencyScore = capitalEfficiencyScore;
        (option as any).riskAdjustedScore = riskAdjustedScore;
        (option as any).finalScore = finalScore;
        (option as any).capitalRequired = capitalRequired;
      });

      // Sort by final score based on optimization strategy
      filteredOptions.sort((a, b) => {
        const scoreA = (a as any).finalScore || 0;
        const scoreB = (b as any).finalScore || 0;
        
        // Primary sort: highest final score first
        if (scoreB !== scoreA) return scoreB - scoreA;
        
        // Secondary sort based on optimization strategy
        if (settings.optimizationStrategy === 'capital') {
          // For capital strategy, prefer lower capital requirement
          const capitalA = (a as any).capitalRequired || 0;
          const capitalB = (b as any).capitalRequired || 0;
          if (capitalA !== capitalB) return capitalA - capitalB;
        } else {
          // For returns and balanced, prefer higher expected value per capital
          const evPerCapA = (a as any).expectedValuePerCapital || 0;
          const evPerCapB = (b as any).expectedValuePerCapital || 0;
          if (evPerCapB !== evPerCapA) return evPerCapB - evPerCapA;
        }
        
        // Tertiary sort: highest premium first
        return b.Premium - a.Premium;
      });

      // Select maximum one option per stock with capital constraint check
      let totalCapitalUsed = 0;
      for (const option of filteredOptions) {
        if (usedStocks.has(option.StockName)) continue;
        
        const optionCapital = (option as any).capitalRequired || 0;
        const newTotalCapital = totalCapitalUsed + optionCapital;
        
        // Check both premium target and optional capital constraint
        const premiumOk = totalPremium + option.Premium <= settings.totalPremiumTarget;
        const capitalOk = !settings.maxTotalCapital || newTotalCapital <= settings.maxTotalCapital;
        
        if (premiumOk && capitalOk) {
          selectedOptions.push(option);
          usedStocks.add(option.StockName);
          totalPremium += option.Premium; // This is the recalculated premium
          totalCapitalUsed = newTotalCapital;
        }
      }

      // If we haven't reached target, try to get as close as possible by replacing options
      if (totalPremium < settings.totalPremiumTarget) {
        // Sort remaining options by how close they get us to target
        const remainingOptions = filteredOptions.filter(option => {
          const optionCapital = (option as any).capitalRequired || 0;
          const premiumOk = !usedStocks.has(option.StockName) && option.Premium <= (settings.totalPremiumTarget - totalPremium);
          const capitalOk = !settings.maxTotalCapital || (totalCapitalUsed + optionCapital) <= settings.maxTotalCapital;
          return premiumOk && capitalOk;
        });

        for (const option of remainingOptions) {
          const optionCapital = (option as any).capitalRequired || 0;
          const premiumOk = totalPremium + option.Premium <= settings.totalPremiumTarget;
          const capitalOk = !settings.maxTotalCapital || (totalCapitalUsed + optionCapital) <= settings.maxTotalCapital;
          
          if (premiumOk && capitalOk) {
            selectedOptions.push(option);
            usedStocks.add(option.StockName);
            totalPremium += option.Premium; // Using recalculated premium
            totalCapitalUsed += optionCapital;
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
      if (totalPremium < settings.totalPremiumTarget) {
        const deficit = settings.totalPremiumTarget - totalPremium;
        message = `Portfolio generated with ${totalPremium.toLocaleString('sv-SE')} SEK premium (${deficit.toLocaleString('sv-SE')} SEK below target). `;
      } else {
        message = `Portfolio successfully generated with ${totalPremium.toLocaleString('sv-SE')} SEK premium.`;
      }
      
      // Add capital efficiency info to message
      const avgCapitalEfficiency = selectedOptions.length > 0 
        ? selectedOptions.reduce((sum, opt) => sum + ((opt as any).capitalEfficiencyScore || 0), 0) / selectedOptions.length 
        : 0;
      message += ` Strategy: ${optimizationStrategyOptions.find(s => s.value === settings.optimizationStrategy)?.label}. Avg Capital Efficiency: ${(avgCapitalEfficiency * 100).toFixed(2)}%.`;

      // Save all changes in a single batch update to prevent race conditions
      updateMultipleSettings({
        generatedPortfolio: selectedOptions,
        portfolioGenerated: true,
        portfolioMessage: message,
        totalUnderlyingValue: calculatedUnderlyingValue,
        totalPotentialLoss: totalPotentialLoss,
        portfolioUnderlyingValue: effectiveUnderlyingValue
      });

    } catch (error) {
      updateSetting('portfolioMessage', `Error generating portfolio: ${error}`);
    } finally {
      setIsGeneratingPortfolio(false);
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
               It calculates risk-adjusted scores and expected values, ranks all options based on your selected optimization strategy, and automatically 
               selects a diversified set. <strong>Maximize Returns</strong> prioritizes highest risk-adjusted returns. <strong>Minimize Capital</strong> prioritizes 
               lowest capital requirements while maintaining quality. <strong>Balanced</strong> optimizes for both return and capital efficiency.
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
                placeholder="500 - 1 000 000"
              />
              <p className="text-xs text-muted-foreground">Range: 500 - 1 000 000 SEK</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="underlyingValue">Underlying Stock Value Per Option</Label>
                <Input
                id="underlyingValue"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={underlyingValueInput}
                onChange={(e) => handleUnderlyingValueChange(e.target.value)}
                onBlur={handleUnderlyingValueBlur}
                placeholder="10 000 - 1 000 000"
                className="text-left"
              />
              <p className="text-xs text-muted-foreground">Range: 10 000 - 1 000 000 SEK</p>
            </div>

            <div className="space-y-2">
              <Label>Strike Price Below</Label>
                <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                     {settings.strikeBelowPeriod === null 
                      ? "Select Period (Optional)" 
                      : timePeriodOptions.find(opt => opt.days === settings.strikeBelowPeriod)?.label}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-full bg-background z-50">
                   <DropdownMenuItem onClick={() => {
                     updateSetting('strikeBelowPeriod', null);
                   }}>
                     No Filter
                   </DropdownMenuItem>
                   {timePeriodOptions.map(option => (
                     <DropdownMenuItem 
                       key={option.days}
                       onClick={() => {
                         updateSetting('strikeBelowPeriod', option.days);
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
                value={settings.minProbabilityWorthless || ""}
                onChange={(e) => {
                  const value = e.target.value ? parseInt(e.target.value) : null;
                  updateSetting('minProbabilityWorthless', value);
                }}
                placeholder="40-100% (Optional)"
              />
            </div>

            <div className="space-y-2">
              <Label>Probability Field to Use</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    {probabilityFieldOptions.find(opt => opt.value === settings.selectedProbabilityField)?.label || "Select Field"}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-full bg-background z-50">
                  {probabilityFieldOptions.map(option => (
                    <DropdownMenuItem 
                      key={option.value}
                       onClick={() => {
                         updateSetting('selectedProbabilityField', option.value);
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
                    {settings.selectedExpiryDate || "Select Expiry Date (Optional)"}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-full bg-background z-50 max-h-[200px] overflow-y-auto">
                   <DropdownMenuItem onClick={() => {
                     updateSetting('selectedExpiryDate', "");
                   }}>
                     All Expiry Dates
                   </DropdownMenuItem>
                   {availableExpiryDates.map(date => (
                     <DropdownMenuItem 
                       key={date}
                       onClick={() => {
                         updateSetting('selectedExpiryDate', date);
                       }}
                     >
                       {date}
                     </DropdownMenuItem>
                   ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="space-y-2">
              <Label>Optimization Strategy</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    {optimizationStrategyOptions.find(opt => opt.value === settings.optimizationStrategy)?.label || "Select Strategy"}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-full bg-background z-50">
                  {optimizationStrategyOptions.map(option => (
                    <DropdownMenuItem 
                      key={option.value}
                       onClick={() => {
                         updateSetting('optimizationStrategy', option.value as 'returns' | 'capital' | 'balanced');
                       }}
                    >
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-muted-foreground">{option.description}</div>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxCapital">Maximum Total Capital (Optional)</Label>
              <Input
                id="maxCapital"
                type="number"
                value={maxTotalCapitalInput}
                onChange={(e) => setMaxTotalCapitalInput(e.target.value)}
                onBlur={(e) => {
                  const value = e.target.value ? parseInt(e.target.value) : null;
                  updateSetting('maxTotalCapital', value);
                }}
                placeholder="e.g., 5 000 000 SEK"
              />
              <p className="text-xs text-muted-foreground">
                Limits total underlying value across all options
              </p>
            </div>

            <div className="space-y-2">
              <Label>Exclude Stocks</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    {settings.excludedStocks.length > 0 ? `${settings.excludedStocks.length} stock(s) excluded` : "No stocks excluded"}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-full bg-background z-50 max-h-[200px] overflow-y-auto">
                   <DropdownMenuItem onClick={() => {
                     updateSetting('excludedStocks', []);
                   }}>
                     Clear All Exclusions
                   </DropdownMenuItem>
                   {availableStocks.map(stock => (
                     <DropdownMenuItem 
                       key={stock}
                       onClick={() => {
                         const newExcluded = settings.excludedStocks.includes(stock)
                           ? settings.excludedStocks.filter(s => s !== stock)
                           : [...settings.excludedStocks, stock];
                         updateSetting('excludedStocks', newExcluded);
                       }}
                     >
                       {settings.excludedStocks.includes(stock) ? '✓ ' : ''}{stock}
                     </DropdownMenuItem>
                   ))}
                 </DropdownMenuContent>
               </DropdownMenu>
               {settings.excludedStocks.length > 0 && (
                 <p className="text-xs text-muted-foreground">
                   Excluded: {settings.excludedStocks.join(', ')}
                 </p>
               )}
            </div>
          </div>
          
           <Button
             onClick={() => {
               const inputValue = parseInt(underlyingValueInput) || 100000;
               const clampedValue = Math.max(10000, Math.min(1000000, inputValue));

               if (!data || data.length === 0) {
                 return;
               }

               generatePortfolio(clampedValue);
             }}
             disabled={isGeneratingPortfolio || (!data || data.length === 0)}
             type="button"
             className="w-full md:w-auto"
             size="lg"
           >
             {isGeneratingPortfolio ? 'Generating...' : 'Generate Portfolio Automatically'}
            </Button>

        </CardContent>
      </Card>

      {settings.portfolioGenerated && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Generated Portfolio ({settings.generatedPortfolio.length} options)</CardTitle>
                <div className="text-sm text-muted-foreground space-y-1 mt-2">
                  <p>{settings.portfolioMessage}</p>
                  <p>Total Underlying Stock Value: {settings.totalUnderlyingValue.toLocaleString('sv-SE')} SEK</p>
                  <p>Total Premium: {settings.generatedPortfolio.reduce((sum, opt) => sum + opt.Premium, 0).toLocaleString('sv-SE')} SEK (Based on {settings.portfolioUnderlyingValue.toLocaleString('sv-SE')} SEK underlying value, {transactionCost} SEK transaction cost per option included)</p>
                  <p>Total Calculated Risk of Loss: {Math.round(settings.totalPotentialLoss).toLocaleString('sv-SE')} SEK</p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <PortfolioOptionsTable
              data={settings.generatedPortfolio}
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