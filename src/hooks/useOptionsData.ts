import { useState, useCallback } from 'react';
import Papa from 'papaparse';
import { OptionData } from '@/types/options';

export const useOptionsData = () => {
  const [data, setData] = useState<OptionData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCSVFile = useCallback((file: File) => {
    setIsLoading(true);
    setError(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      transform: (value, field) => {
        // Handle numeric fields
        if (typeof field === 'string' && (
          field.includes('Premium') || 
          field.includes('Prob') || 
          field.includes('Loss') || 
          field.includes('Price') || 
          field.includes('Days') || 
          field.includes('Strike') || 
          field.includes('IV') || 
          field.includes('Accuracy') ||
          field.includes('Pct') ||
          field.includes('Spread') ||
          field.includes('Value') ||
          field.includes('Bid') ||
          field.includes('Number')
        )) {
          const num = parseFloat(value);
          return isNaN(num) ? null : num;
        }
        return value;
      },
      complete: (results) => {
        if (results.errors.length > 0) {
          setError(`CSV parsing errors: ${results.errors.map(e => e.message).join(', ')}`);
        } else {
          setData(results.data as OptionData[]);
        }
        setIsLoading(false);
      },
      error: (error) => {
        setError(`Failed to parse CSV: ${error.message}`);
        setIsLoading(false);
      }
    });
  }, []);

  // Mock data for development/testing
  const loadMockData = useCallback(() => {
    const mockData: OptionData[] = [
      {
        StockName: "AAK AB",
        OptionName: "AAK5T240",
        Premium: 250,
        ProbFinal_Weighted: 0.898455,
        ProbWorthless_Bayesian_IsoCal: 0.810947,
        ProbOfWorthless: 0.884279,
        ProbCalibrated: 0.85,
        EstimatedProbAboveStrike: 0.12,
        Lower_Bound_at_Accuracy: 0.75,
        LossAtBadDecline: -21150,
        LossAtWorstDecline: -25000,
        PoW_Stats_MedianLossPct: 0.15,
        PoW_Stats_WorstLossPct: 0.25,
        PoW_Stats_MedianLoss: -18000,
        PoW_Stats_WorstLoss: -30000,
        PoW_Stats_MedianProbOfWorthless: 0.82,
        PoW_Stats_MinProbOfWorthless: 0.75,
        PoW_Stats_MaxProbOfWorthless: 0.95,
        LossAt100DayWorstDecline: -22000,
        LossAt_2008_100DayWorstDecline: -45000,
        Mean_Accuracy: 0.78,
        Lower_Bound_HistMedianIV_at_Accuracy: 0.22,
        Lower_Bound: 195,
        Lower_Bound_HistMedianIV: 0.21,
        Bid_Ask_Mid_Price: 248,
        Option_Price_Min: 240,
        NumberOfContractsBasedOnLimit: 400,
        Bid: 245,
        ProfitLossPctLeastBad: 0.02,
        Loss_Least_Bad: -5000,
        IV_AllMedianIV_Maximum100DaysToExp_Ratio: 1.15,
        StockPrice: 280,
        DaysToExpiry: 45,
        AskBidSpread: 10,
        Underlying_Value: 280,
        StrikePrice: 290,
        StockPrice_After_2008_100DayWorstDecline: 220,
        LossAt50DayWorstDecline: -21150,
        LossAt_2008_50DayWorstDecline: -48910,
        ProfitLossPctBad: 0.02,
        ProfitLossPctWorst: 0.01,
        ProfitLossPct100DayWorst: 0.021,
        ImpliedVolatility: 0.298041,
        TodayStockMedianIV_Maximum100DaysToExp: 0.22951,
        AllMedianIV_Maximum100DaysToExp: 0.216361,
        ExpiryDate_Lower_Bound_Minus_Pct_Based_on_Accuracy: 0.2,
        StrikeBelowLowerAtAcc: "Y"
      },
      {
        StockName: "VOLVO B",
        OptionName: "VOLV5T350",
        Premium: 180,
        ProbFinal_Weighted: 0.756123,
        ProbWorthless_Bayesian_IsoCal: 0.698547,
        ProbOfWorthless: 0.712456,
        ProbCalibrated: 0.72,
        EstimatedProbAboveStrike: 0.28,
        Lower_Bound_at_Accuracy: 0.68,
        LossAtBadDecline: -15200,
        LossAtWorstDecline: -18500,
        PoW_Stats_MedianLossPct: 0.12,
        PoW_Stats_WorstLossPct: 0.19,
        PoW_Stats_MedianLoss: -12000,
        PoW_Stats_WorstLoss: -22000,
        PoW_Stats_MedianProbOfWorthless: 0.71,
        PoW_Stats_MinProbOfWorthless: 0.65,
        PoW_Stats_MaxProbOfWorthless: 0.85,
        LossAt100DayWorstDecline: -16000,
        LossAt_2008_100DayWorstDecline: -32000,
        Mean_Accuracy: 0.82,
        Lower_Bound_HistMedianIV_at_Accuracy: 0.25,
        Lower_Bound: 165,
        Lower_Bound_HistMedianIV: 0.24,
        Bid_Ask_Mid_Price: 178,
        Option_Price_Min: 175,
        NumberOfContractsBasedOnLimit: 550,
        Bid: 176,
        ProfitLossPctLeastBad: 0.025,
        Loss_Least_Bad: -3500,
        IV_AllMedianIV_Maximum100DaysToExp_Ratio: 1.08,
        StockPrice: 245,
        DaysToExpiry: 30,
        AskBidSpread: 8,
        Underlying_Value: 245,
        StrikePrice: 250,
        StockPrice_After_2008_100DayWorstDecline: 185,
        LossAt50DayWorstDecline: -15200,
        LossAt_2008_50DayWorstDecline: -35000,
        ProfitLossPctBad: 0.025,
        ProfitLossPctWorst: 0.015,
        ProfitLossPct100DayWorst: 0.018,
        ImpliedVolatility: 0.265789,
        TodayStockMedianIV_Maximum100DaysToExp: 0.24568,
        AllMedianIV_Maximum100DaysToExp: 0.238945,
        ExpiryDate_Lower_Bound_Minus_Pct_Based_on_Accuracy: 0.18,
      }
    ];
    
    setData(mockData);
  }, []);

  return {
    data,
    isLoading,
    error,
    loadCSVFile,
    loadMockData,
    setData
  };
};