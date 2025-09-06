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
import { ArrowLeft, Target, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const PortfolioGenerator = () => {
  const navigate = useNavigate();
  const { data: rawData, isLoading, error } = useOptionsData();
  const data = useRecalculatedOptions(rawData || []);
  const { getLowPriceForPeriod } = useStockData();

  // Form state
  const [totalPremiumTarget, setTotalPremiumTarget] = useState<number>(500);
  const [strikeBelowPeriod, setStrikeBelowPeriod] = useState<number | null>(null);
  const [minProbabilityOfWorthless, setMinProbabilityOfWorthless] = useState<number | null>(null);
  const [expiryDateFilter, setExpiryDateFilter] = useState<string>("");
  const [underlyingStockValue, setUnderlyingStockValue] = useState<number>(100000);
  
  // Generated portfolio state
  const [generatedPortfolio, setGeneratedPortfolio] = useState<OptionData[]>([]);
  const [portfolioGenerated, setPortfolioGenerated] = useState<boolean>(false);
  const [generationMessage, setGenerationMessage] = useState<string>("");

  // Safe portfolio generation
  const generatePortfolio = () => {
    try {
      if (totalPremiumTarget < 500) {
        toast.error("Total premium target must be at least 500");
        return;
      }

      let filteredOptions = [...data];

      // Apply filters with safety checks
      if (strikeBelowPeriod !== null) {
        filteredOptions = filteredOptions.filter(option => {
          try {
            const lowPrice = getLowPriceForPeriod(option.StockName, strikeBelowPeriod);
            return lowPrice !== null && lowPrice !== undefined && option.StrikePrice <= lowPrice;
          } catch (err) {
            return false;
          }
        });
      }

      if (minProbabilityOfWorthless !== null) {
        filteredOptions = filteredOptions.filter(option => {
          try {
            const prob = option.ProbWorthless_Bayesian_IsoCal ?? option['1_2_3_ProbOfWorthless_Weighted'] ?? 0;
            return prob >= minProbabilityOfWorthless / 100;
          } catch (err) {
            return false;
          }
        });
      }

      if (expiryDateFilter) {
        filteredOptions = filteredOptions.filter(option => option.ExpiryDate === expiryDateFilter);
      }

      // Recalculate with specified underlying value
      const recalculatedOptions = filteredOptions.map(option => {
        try {
          const numberOfContracts = Math.round((underlyingStockValue / option.StrikePrice) / 100);
          const bidAskMidPrice = (option.Bid + (option.Ask || option.Bid)) / 2;
          const premium = Math.round((bidAskMidPrice * numberOfContracts * 100) - 150);

          return {
            ...option,
            Premium: premium,
            NumberOfContractsBasedOnLimit: numberOfContracts,
            Bid_Ask_Mid_Price: bidAskMidPrice,
          };
        } catch (err) {
          return null;
        }
      }).filter(Boolean) as OptionData[];

      // Group by stock name
      const optionsByStock = new Map<string, OptionData[]>();
      recalculatedOptions.forEach(option => {
        if (!optionsByStock.has(option.StockName)) {
          optionsByStock.set(option.StockName, []);
        }
        optionsByStock.get(option.StockName)!.push(option);
      });

      // Select best option per stock
      const bestOptionsPerStock: OptionData[] = [];
      optionsByStock.forEach((options) => {
        try {
          const bestOption = options.reduce((best, current) => {
            const bestProb = best.ProbWorthless_Bayesian_IsoCal ?? best['1_2_3_ProbOfWorthless_Weighted'] ?? 0;
            const currentProb = current.ProbWorthless_Bayesian_IsoCal ?? current['1_2_3_ProbOfWorthless_Weighted'] ?? 0;
            
            if (currentProb > bestProb) return current;
            if (currentProb === bestProb && current.Premium > best.Premium) return current;
            return best;
          });
          
          if (bestOption.Premium > 0) {
            bestOptionsPerStock.push(bestOption);
          }
        } catch (err) {
          // Skip this stock if there's an error
        }
      });

      // Sort by probability
      bestOptionsPerStock.sort((a, b) => {
        const probA = a.ProbWorthless_Bayesian_IsoCal ?? a['1_2_3_ProbOfWorthless_Weighted'] ?? 0;
        const probB = b.ProbWorthless_Bayesian_IsoCal ?? b['1_2_3_ProbOfWorthless_Weighted'] ?? 0;
        
        if (probB !== probA) return probB - probA;
        return b.Premium - a.Premium;
      });

      // Select options until target premium is reached
      const selectedOptions: OptionData[] = [];
      let totalPremium = 0;

      for (const option of bestOptionsPerStock) {
        if (totalPremium + option.Premium <= totalPremiumTarget) {
          selectedOptions.push(option);
          totalPremium += option.Premium;
        }
      }

      setGeneratedPortfolio(selectedOptions);
      setPortfolioGenerated(true);

      if (totalPremium < totalPremiumTarget) {
        setGenerationMessage(`Portfolio generated with ${totalPremium.toLocaleString('sv-SE')} SEK premium (${(totalPremiumTarget - totalPremium).toLocaleString('sv-SE')} SEK short of target)`);
        toast.warning("Could not reach target premium with available options");
      } else {
        setGenerationMessage(`Portfolio generated successfully with ${totalPremium.toLocaleString('sv-SE')} SEK premium`);
        toast.success("Portfolio generated successfully");
      }
    } catch (error) {
      console.error("Error generating portfolio:", error);
      toast.error("Error generating portfolio");
    }
  };

  const totalUnderlyingValue = useMemo(() => {
    try {
      return generatedPortfolio.reduce((total, option) => {
        return total + (option.NumberOfContractsBasedOnLimit * option.StrikePrice * 100);
      }, 0);
    } catch (err) {
      return 0;
    }
  }, [generatedPortfolio]);

  const handleOptionClick = (option: OptionData) => {
    const optionId = encodeURIComponent(option.OptionName);
    navigate(`/option/${optionId}`);
  };

  const handleStockClick = (stockName: string) => {
    navigate(`/stock/${encodeURIComponent(stockName)}`);
  };

  const timePeriodOptions = [
    { label: "1 Week Low", days: 7 },
    { label: "1 Month Low", days: 30 },
    { label: "3 Months Low", days: 90 },
    { label: "6 Months Low", days: 180 },
    { label: "9 Months Low", days: 270 },
    { label: "1 Year Low", days: 365 },
  ];

  const uniqueExpiryDates = useMemo(() => {
    try {
      return [...new Set(data.map(option => option.ExpiryDate))].sort();
    } catch (err) {
      return [];
    }
  }, [data]);

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/")} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Options
          </Button>
          <h1 className="text-3xl font-bold">Automatic Portfolio Generator</h1>
        </div>
        <div className="text-center mt-8 text-red-500">Error loading data: {error}</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/")} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Options
          </Button>
          <h1 className="text-3xl font-bold">Automatic Portfolio Generator</h1>
        </div>
        <div className="text-center mt-8">Loading options data...</div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/")} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Options
          </Button>
          <h1 className="text-3xl font-bold">Automatic Portfolio Generator</h1>
        </div>
        <div className="text-center mt-8">No options data available</div>
      </div>
    );
  }

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
              <Label htmlFor="strikeBelowPeriod">Strike Price Below</Label>
              <Select value={strikeBelowPeriod?.toString() || ""} onValueChange={(value) => setStrikeBelowPeriod(value ? parseInt(value) : null)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select period (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No filter</SelectItem>
                  {timePeriodOptions.map(option => (
                    <SelectItem key={option.days} value={option.days.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

            <div className="space-y-2">
              <Label htmlFor="underlyingValue">Underlying Stock Value (SEK) *</Label>
              <Input
                id="underlyingValue"
                type="number"
                min="10000"
                max="1000000"
                value={underlyingStockValue}
                onChange={(e) => setUnderlyingStockValue(parseInt(e.target.value) || 100000)}
              />
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
            <CardTitle className="flex items-center gap-2">
              {generatedPortfolio.length === 0 ? (
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
              ) : (
                <Target className="h-5 w-5 text-green-500" />
              )}
              Generated Portfolio Results
            </CardTitle>
            {generationMessage && (
              <p className="text-sm text-muted-foreground">{generationMessage}</p>
            )}
            {generatedPortfolio.length > 0 && (
              <p className="text-sm text-muted-foreground">
                Total Underlying Stock Value: {totalUnderlyingValue.toLocaleString('sv-SE')} SEK
              </p>
            )}
          </CardHeader>
          <CardContent>
            {generatedPortfolio.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No options found matching your criteria. Try adjusting your filters.
              </div>
            ) : (
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
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PortfolioGenerator;