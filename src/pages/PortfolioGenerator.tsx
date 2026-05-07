import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePageTitle } from "@/hooks/usePageTitle";
import { OptionData } from "@/types/options";
import { PortfolioOptionsTable } from "@/components/options/PortfolioOptionsTable";
import { useEnrichedOptionsData } from "@/hooks/useEnrichedOptionsData";
import { useRecalculatedOptions, RecalculatedOptionData } from "@/hooks/useRecalculatedOptions";
import { useStockData } from "@/hooks/useStockData";
import { useSettings } from "@/contexts/SettingsContext";
import { usePortfolioGeneratorPreferences } from "@/hooks/usePortfolioGeneratorPreferences";
import { useScoredOptionsData } from "@/hooks/useScoredOptionsData";
import { ScoredOptionData } from "@/types/scoredOptions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Settings, ChevronDown, Info, Download } from "lucide-react";
import { exportToExcel } from "@/utils/excelExport";
import { toast } from "@/hooks/use-toast";
import { useTranslation } from 'react-i18next';

const PortfolioGenerator = () => {
  // Force rebuild - 2026-03-06
  usePageTitle('Portfolio Generator');
  const { t } = useTranslation('pages');
  const navigate = useNavigate();
  const { data: rawData, isLoading, error } = useEnrichedOptionsData();
  const { getLowPriceForPeriod } = useStockData();
  const { transactionCost } = useSettings();
  const { settings, updateSetting, updateMultipleSettings, resetToDefaults, isLoading: preferencesLoading } = usePortfolioGeneratorPreferences();
  const { data: scoredOptionsData, isLoading: scoredLoading } = useScoredOptionsData();

  // Build a lookup map from option_name -> ScoredOptionData for fast joining
  const scoredDataMap = useMemo(() => {
    const map = new Map<string, ScoredOptionData>();
    if (scoredOptionsData) {
      for (const scored of scoredOptionsData) {
        map.set(scored.option_name, scored);
      }
    }
    return map;
  }, [scoredOptionsData]);

  // Add state to prevent validation during portfolio generation
  const [isGeneratingPortfolio, setIsGeneratingPortfolio] = useState(false);

  // Input states for form controls
  const [totalPremiumInput, setTotalPremiumInput] = useState<string>(settings.totalPremiumTarget.toString());
  const [underlyingValueInput, setUnderlyingValueInput] = useState<string>(settings.portfolioUnderlyingValue.toString());
  const [maxTotalCapitalInput, setMaxTotalCapitalInput] = useState<string>(settings.maxTotalCapital?.toString() || "");

  // Update input states when settings change
  useEffect(() => {
    setTotalPremiumInput(settings.totalPremiumTarget.toString());

    // Update underlying value input when settings change, unless user is currently editing it
    const currentInputValue = parseInt(underlyingValueInput) || 0;
    const settingsValue = settings.portfolioUnderlyingValue;
    
    // Only update if values are different (prevents overwriting during typing)
    // But always sync on initial load or when settings change significantly
    if (currentInputValue !== settingsValue) {
      setUnderlyingValueInput(settingsValue.toString());
    }

    setMaxTotalCapitalInput(settings.maxTotalCapital?.toString() || "");
  }, [settings]);

  // Custom recalculation function for Portfolio Generator using its own underlying value
  const recalculateOptionsForPortfolio = (options: OptionData[], underlyingValue: number): RecalculatedOptionData[] => {
    return options.map(option => {
      const numberOfContractsBasedOnLimit = Math.round((underlyingValue / option.StrikePrice) / 100);
      const bidAskMidPrice = (option.Bid + (option.Ask || option.Bid)) / 2;
      const recalculatedPremium = Math.round((bidAskMidPrice * numberOfContractsBasedOnLimit * 100) - transactionCost);
      const calculatedUnderlyingValue = numberOfContractsBasedOnLimit * option.StrikePrice * 100;

      // Recalculate decline-based loss fields using portfolio contracts
      const calcLossAtDecline = (declinePct: number | undefined | null): number | undefined => {
        if (declinePct == null) return undefined;
        const stockAfter = option.StockPrice * (1 + declinePct);
        return Math.min(0, (stockAfter - option.StrikePrice) * numberOfContractsBasedOnLimit * 100);
      };

      const lossAtBadDecline = calcLossAtDecline(option.BadHistoricalDecline) ?? option.LossAtBadDecline;
      const lossAtWorstDecline = calcLossAtDecline(option.WorstHistoricalDecline) ?? option.LossAtWorstDecline;
      const lossAt100DayWorstDecline = calcLossAtDecline(option.Historical100DaysWorstDecline) ?? option.LossAt100DayWorstDecline;
      const lossAt_2008_100DayWorstDecline = calcLossAtDecline(option['2008_100DaysWorstDecline']) ?? option.LossAt_2008_100DayWorstDecline;
      const lossAt50DayWorstDecline = calcLossAtDecline(option.Historical50DaysWorstDecline) ?? option.LossAt50DayWorstDecline;
      const lossAt_2008_50DayWorstDecline = calcLossAtDecline(option['2008_50DaysWorstDecline']) ?? option.LossAt_2008_50DayWorstDecline;

      // Loss_Least_Bad = least negative (max) of Bad, Worst, and 100-Day scenarios
      const lossLeastBad = Math.max(lossAtBadDecline, lossAtWorstDecline, lossAt100DayWorstDecline);

      // Recalculate SEK loss fields for the new decline percentage fields
      const lossAtIV2sigmaDecline = calcLossAtDecline(option.IV_2sigma_Decline) ?? null;
      const lossAtCVaR10pctDecline = calcLossAtDecline(option.CVaR10pct_Decline) ?? null;

      // Recalculate PotentialLossAtLowerBound using portfolio contracts and recalculated premium
      let potentialLossAtLowerBound: number | null = (option as any).PotentialLossAtLowerBound ?? null;
      const lowerBoundClosestToStrike = (option as any).LowerBoundClosestToStrike;
      if (lowerBoundClosestToStrike) {
        const underlyingValueInvestment = option.StrikePrice * numberOfContractsBasedOnLimit * 100;
        const underlyingValueLowerBound = numberOfContractsBasedOnLimit * lowerBoundClosestToStrike * 100;
        const lossLowerBound = underlyingValueLowerBound - underlyingValueInvestment;
        potentialLossAtLowerBound = recalculatedPremium + lossLowerBound;
        if (potentialLossAtLowerBound >= 0) {
          potentialLossAtLowerBound = 0;
        } else {
          potentialLossAtLowerBound = potentialLossAtLowerBound - (potentialLossAtLowerBound * 0.000075 + transactionCost);
        }
      }

      // Recalculate EstTotalMargin using portfolio contracts
      let estTotalMargin: number | null = (option as any).EstTotalMargin ?? null;
      const estMarginSEK = (option as any).Est_Margin_SEK;
      if (estMarginSEK) {
        estTotalMargin = Math.round(estMarginSEK * numberOfContractsBasedOnLimit);
      }

      return {
        ...option,
        originalPremium: option.Premium,
        recalculatedPremium,
        recalculatedNumberOfContracts: numberOfContractsBasedOnLimit,
        recalculatedBid_Ask_Mid_Price: bidAskMidPrice,
        Premium: recalculatedPremium,
        NumberOfContractsBasedOnLimit: numberOfContractsBasedOnLimit,
        Bid_Ask_Mid_Price: bidAskMidPrice,
        Underlying_Value: calculatedUnderlyingValue,
        LossAtBadDecline: lossAtBadDecline,
        LossAtWorstDecline: lossAtWorstDecline,
        LossAt100DayWorstDecline: lossAt100DayWorstDecline,
        LossAt_2008_100DayWorstDecline: lossAt_2008_100DayWorstDecline,
        LossAt50DayWorstDecline: lossAt50DayWorstDecline,
        LossAt_2008_50DayWorstDecline: lossAt_2008_50DayWorstDecline,
        Loss_Least_Bad: lossLeastBad,
        LossAtIV2sigmaDecline: lossAtIV2sigmaDecline,
        LossAtCVaR10pctDecline: lossAtCVaR10pctDecline,
        PotentialLossAtLowerBound: potentialLossAtLowerBound,
        EstTotalMargin: estTotalMargin,
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
    { label: t('index.timePeriods.1w'), days: 7 },
    { label: t('index.timePeriods.1m'), days: 30 },
    { label: t('index.timePeriods.3m'), days: 90 },
    { label: t('index.timePeriods.6m'), days: 180 },
    { label: t('index.timePeriods.9m'), days: 270 },
    { label: t('index.timePeriods.1y'), days: 365 },
  ];

  const probabilityFieldOptions = [
    { value: "ProbWorthless_Bayesian_IsoCal", label: t('charts:methods.bayesianCalibrated') },
    { value: "1_2_3_ProbOfWorthless_Weighted", label: t('charts:methods.weightedAverage') },
    { value: "1_ProbOfWorthless_Original", label: t('charts:methods.originalBlackScholes') },
    { value: "2_ProbOfWorthless_Calibrated", label: t('charts:methods.biasCorreected') },
    { value: "3_ProbOfWorthless_Historical_IV", label: t('charts:methods.historicalIV') },
  ];

  const optimizationStrategyOptions = [
    { value: "returns", label: t('portfolioGenerator.strategyReturnsLabel'), description: t('portfolioGenerator.strategyReturnsDesc') },
    { value: "capital", label: t('portfolioGenerator.strategyCapitalLabel'), description: t('portfolioGenerator.strategyCapitalDesc') },
    { value: "balanced", label: t('portfolioGenerator.strategyBalancedLabel'), description: t('portfolioGenerator.strategyBalancedDesc') },
    { value: "scored", label: t('portfolioGenerator.strategyScoredLabel'), description: t('portfolioGenerator.strategyScoredDesc') },
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
    
    // Save the value immediately to ensure persistence
    updateSetting('portfolioUnderlyingValue', clampedValue);
    setUnderlyingValueInput(clampedValue.toString());
    
    console.log('📝 Portfolio Generator - Saved underlying value:', clampedValue);

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
    
    // Show toast immediately
    toast({
      title: t('portfolioGenerator.toastGeneratingTitle'),
      description: t('portfolioGenerator.toastGeneratingDesc'),
    });
    
    // Defer the actual generation to allow UI to update with the toast
    setTimeout(() => {
      try {
      const selectedOptions: OptionData[] = [];
      const usedStocks = new Set<string>();
      let totalPremium = 0;

      // Recalculate options using the effective underlying value
      const recalculatedData = recalculateOptionsForPortfolio(rawData || [], effectiveUnderlyingValue);

      const isScored = settings.optimizationStrategy === 'scored';

      // Filter options based on criteria - use the recalculated data that includes updated premiums
      let filteredOptions = recalculatedData.filter(option => {
        // For scored strategy, option must exist in scored data
        if (isScored && !scoredDataMap.has(option.OptionName)) return false;

        // CRITICAL: Exclude options with missing required values first
        // For scored strategy, skip PotentialLossAtLowerBound requirement since we rank by model scores
        if (!isScored && !hasRequiredValues(option)) return false;
        if (isScored) {
          // Still need valid contracts and premium
          if (!option.NumberOfContractsBasedOnLimit || option.NumberOfContractsBasedOnLimit <= 0) return false;
        }

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

        // Probability filter - must meet min/max thresholds if specified
        if (settings.minProbabilityWorthless || settings.maxProbabilityWorthless) {
          const prob = getProbabilityValue(option);
          if (prob === null) return false;
          if (settings.minProbabilityWorthless) {
            const minProbDecimal = settings.minProbabilityWorthless / 100;
            if (prob < minProbDecimal) return false;
          }
          if (settings.maxProbabilityWorthless) {
            const maxProbDecimal = settings.maxProbabilityWorthless / 100;
            if (prob > maxProbDecimal) return false;
          }
        }

        return true;
      });

      // Calculate risk-adjusted scores and sort by best risk/return ratio
      filteredOptions.forEach(option => {
        const capitalRequired = option.NumberOfContractsBasedOnLimit * option.StrikePrice * 100;
        (option as any).capitalRequired = capitalRequired;

        if (isScored) {
          // Scored Models strategy: rank by weighted blend of V2.1 and TA scores
          const scored = scoredDataMap.get(option.OptionName)!;
          const v21 = scored.v21_score ?? 0;
          const ta = (scored.ta_probability ?? 0) * 100; // Scale 0-1 to 0-100
          const w = settings.v21Weight / 100;
          const finalScore = w * v21 + (1 - w) * ta;

          // Attach scored data onto the option for table display and expandable detail
          (option as any).scoredData = scored;
          (option as any).combined_score = scored.combined_score;
          (option as any).v21_score = scored.v21_score;
          (option as any).ta_probability = scored.ta_probability;
          (option as any).agreement_strength = scored.agreement_strength;
          (option as any).finalScore = finalScore;
        } else {
          const prob = getProbabilityValue(option);
          const potentialLoss = Math.abs((option as any).PotentialLossAtLowerBound);
          const premium = option.Premium;

          // At this point, we know prob and potentialLoss are valid (passed hasRequiredValues check)
          // Calculate Expected Value: Premium - (1 - ProbOfWorthless) × PotentialLoss
          const expectedValue = premium - (1 - prob!) * potentialLoss;

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
        }
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
      
      // Add strategy info to message
      const strategyLabel = optimizationStrategyOptions.find(s => s.value === settings.optimizationStrategy)?.label;
      if (isScored) {
        message += ` Strategy: ${strategyLabel} (V2.1: ${settings.v21Weight}% / TA: ${100 - settings.v21Weight}%).`;
      } else {
        const avgCapitalEfficiency = selectedOptions.length > 0
          ? selectedOptions.reduce((sum, opt) => sum + ((opt as any).capitalEfficiencyScore || 0), 0) / selectedOptions.length
          : 0;
        message += ` Strategy: ${strategyLabel}. Avg Capital Efficiency: ${(avgCapitalEfficiency * 100).toFixed(2)}%.`;
      }

      // Save all changes in a single batch update to prevent race conditions
      updateMultipleSettings({
        generatedPortfolio: selectedOptions,
        portfolioGenerated: true,
        portfolioMessage: message,
        totalUnderlyingValue: calculatedUnderlyingValue,
        totalPotentialLoss: totalPotentialLoss,
        portfolioUnderlyingValue: effectiveUnderlyingValue
      });

        toast({
          title: t('portfolioGenerator.toastGeneratedTitle'),
          description: t('portfolioGenerator.toastGeneratedDesc', { count: selectedOptions.length }),
        });

      } catch (error) {
        updateSetting('portfolioMessage', `Error generating portfolio: ${error}`);
        toast({
          title: t('portfolioGenerator.toastErrorTitle'),
          description: t('portfolioGenerator.toastErrorDesc'),
          variant: "destructive",
        });
      } finally {
        setIsGeneratingPortfolio(false);
      }
    }, 100); // Small delay to allow UI to update
  };

  const handleOptionClick = (option: OptionData) => {
    const optionId = encodeURIComponent(option.OptionName);
    // Extract the base path from the current URL (e.g., /put-options-se or /)
    const currentPath = window.location.pathname;
    const basePath = currentPath.includes('/put-options-se') ? '/put-options-se' : '';
    const url = `${window.location.origin}${basePath}/option/${optionId}`;
    window.open(url, '_blank');
  };

  const handleStockClick = (stockName: string) => {
    // Extract the base path from the current URL (e.g., /put-options-se or /)
    const currentPath = window.location.pathname;
    const basePath = currentPath.includes('/put-options-se') ? '/put-options-se' : '';
    const url = `${window.location.origin}${basePath}/stock/${encodeURIComponent(stockName)}`;
    window.open(url, '_blank');
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
          {t('portfolioGenerator.backToOptions')}
        </Button>
        <h1 className="text-3xl font-bold">{t('portfolioGenerator.title')}</h1>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDescription(!showDescription)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <Info className="h-4 w-4" />
            {t('portfolioGenerator.howItWorks')}
          </Button>

          {/* PoW Legend Info Button */}
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                title={t('portfolioGenerator.powLearnTitle')}
                className="gap-1"
              >
                <Info className="h-4 w-4" />
                <span className="text-xs">PoW ?</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{t('portfolioGenerator.powLegendTitle')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <p className="font-semibold text-sm mb-2">{t('portfolioGenerator.powWhatIsTitle')}</p>
                  <p className="text-sm text-muted-foreground">
                    {t('portfolioGenerator.powWhatIsDesc')}
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-sm mb-2">{t('portfolioGenerator.pow5MethodsTitle')}</p>
                  <ul className="text-sm text-muted-foreground space-y-2 ml-4 list-disc">
                    <li><strong>PoW - Weighted Average:</strong> {t('portfolioGenerator.powMethod1')}</li>
                    <li><strong>PoW - Bayesian Calibrated:</strong> {t('portfolioGenerator.powMethod2')}</li>
                    <li><strong>PoW - Original Black-Scholes:</strong> {t('portfolioGenerator.powMethod3')}</li>
                    <li><strong>PoW - Bias Corrected:</strong> {t('portfolioGenerator.powMethod4')}</li>
                    <li><strong>PoW - Historical IV:</strong> {t('portfolioGenerator.powMethod5')}</li>
                  </ul>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {showDescription && (
        <Card className="border-muted bg-muted/20">
          <CardContent className="pt-4">
             <p className="text-sm text-muted-foreground leading-relaxed">
               {t('portfolioGenerator.descriptionText')}
             </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {t('portfolioGenerator.configTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="totalPremium">{t('portfolioGenerator.labelTotalPremium')}</Label>
              <Input
                id="totalPremium"
                type="number"
                value={totalPremiumInput}
                onChange={(e) => setTotalPremiumInput(e.target.value)}
                onBlur={(e) => validateTotalPremium(e.target.value)}
                placeholder="500 - 1 000 000"
              />
              <p className="text-xs text-muted-foreground">{t('portfolioGenerator.rangeTotalPremium')}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="underlyingValue">{t('portfolioGenerator.labelUnderlyingValue')}</Label>
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
              <p className="text-xs text-muted-foreground">{t('portfolioGenerator.rangeUnderlyingValue')}</p>
            </div>

            <div className="space-y-2">
              <Label>{t('portfolioGenerator.labelStrikePriceBelow')}</Label>
                <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                     {settings.strikeBelowPeriod === null
                      ? t('portfolioGenerator.selectPeriodOptional')
                      : timePeriodOptions.find(opt => opt.days === settings.strikeBelowPeriod)?.label}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-full bg-background z-50">
                   <DropdownMenuItem onClick={() => {
                     updateSetting('strikeBelowPeriod', null);
                   }}>
                     {t('portfolioGenerator.noFilter')}
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
              <Label htmlFor="minProbability">{t('portfolioGenerator.labelMinProbability')}</Label>
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
                placeholder={t('portfolioGenerator.placeholderOptionalPct')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxProbability">{t('portfolioGenerator.labelMaxProbability')}</Label>
              <Input
                id="maxProbability"
                type="number"
                min="40"
                max="100"
                value={settings.maxProbabilityWorthless || ""}
                onChange={(e) => {
                  const value = e.target.value ? parseInt(e.target.value) : null;
                  updateSetting('maxProbabilityWorthless', value);
                }}
                placeholder={t('portfolioGenerator.placeholderOptionalPct')}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('portfolioGenerator.labelProbabilityField')}</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    {probabilityFieldOptions.find(opt => opt.value === settings.selectedProbabilityField)?.label || t('portfolioGenerator.selectField')}
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
              <Label>{t('portfolioGenerator.labelExpiryDate')}</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    {settings.selectedExpiryDate || t('portfolioGenerator.selectExpiryOptional')}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-full bg-background z-50 max-h-[200px] overflow-y-auto">
                   <DropdownMenuItem onClick={() => {
                     updateSetting('selectedExpiryDate', "");
                   }}>
                     {t('portfolioGenerator.allExpiryDates')}
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
              <Label>{t('portfolioGenerator.labelOptimizationStrategy')}</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    {optimizationStrategyOptions.find(opt => opt.value === settings.optimizationStrategy)?.label || t('portfolioGenerator.selectStrategy')}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-full bg-background z-50">
                  {optimizationStrategyOptions.map(option => (
                    <DropdownMenuItem 
                      key={option.value}
                       onClick={() => {
                         updateSetting('optimizationStrategy', option.value as 'returns' | 'capital' | 'balanced' | 'scored');
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

            {settings.optimizationStrategy === 'scored' && (
              <div className="space-y-2">
                <Label>{t('portfolioGenerator.labelModelWeight')}</Label>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>V2.1: {settings.v21Weight}%</span>
                    <span>TA: {100 - settings.v21Weight}%</span>
                  </div>
                  <Slider
                    value={[settings.v21Weight]}
                    onValueChange={([value]) => updateSetting('v21Weight', value)}
                    min={0}
                    max={100}
                    step={5}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{t('portfolioGenerator.modelWeightV21')}</span>
                    <span>{t('portfolioGenerator.modelWeightTA')}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="maxCapital">{t('portfolioGenerator.labelMaxCapital')}</Label>
              <Input
                id="maxCapital"
                type="number"
                value={maxTotalCapitalInput}
                onChange={(e) => setMaxTotalCapitalInput(e.target.value)}
                onBlur={(e) => {
                  const value = e.target.value ? parseInt(e.target.value) : null;
                  updateSetting('maxTotalCapital', value);
                }}
                placeholder={t('portfolioGenerator.placeholderMaxCapital')}
              />
              <p className="text-xs text-muted-foreground">
                {t('portfolioGenerator.maxCapitalDesc')}
              </p>
            </div>

            <div className="space-y-2">
              <Label>{t('portfolioGenerator.labelExcludeStocks')}</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    {settings.excludedStocks.length > 0
                      ? t('portfolioGenerator.stocksExcluded', { count: settings.excludedStocks.length })
                      : t('portfolioGenerator.noStocksExcluded')}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-full bg-background z-50 max-h-[200px] overflow-y-auto">
                   <DropdownMenuItem onClick={() => {
                     updateSetting('excludedStocks', []);
                   }}>
                     {t('portfolioGenerator.clearAllExclusions')}
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
                   {t('portfolioGenerator.excludedLabel', { stocks: settings.excludedStocks.join(', ') })}
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
             {isGeneratingPortfolio ? t('portfolioGenerator.generating') : t('portfolioGenerator.generate')}
            </Button>

        </CardContent>
      </Card>

      {settings.portfolioGenerated && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t('portfolioGenerator.generatedPortfolioTitle', { count: settings.generatedPortfolio.length })}</CardTitle>
                <div className="text-sm text-muted-foreground space-y-1 mt-2">
                  <p>{settings.portfolioMessage}</p>
                  <p>{t('portfolioGenerator.totalUnderlyingValue', { value: settings.totalUnderlyingValue.toLocaleString('sv-SE') })}</p>
                  <p>{t('portfolioGenerator.totalPremium', { value: settings.generatedPortfolio.reduce((sum, opt) => sum + opt.Premium, 0).toLocaleString('sv-SE'), underlying: settings.portfolioUnderlyingValue.toLocaleString('sv-SE'), cost: transactionCost })}</p>
                  <p>{t('portfolioGenerator.totalRiskOfLoss', { value: Math.round(settings.totalPotentialLoss).toLocaleString('sv-SE') })}</p>
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
              isScoredStrategy={settings.optimizationStrategy === 'scored'}
              selectedProbabilityField={settings.selectedProbabilityField}
            />
          </CardContent>
        </Card>
      )}

    </div>
  );
};

export default PortfolioGenerator;