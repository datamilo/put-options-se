import { useState, useCallback, useEffect } from 'react';
import Papa from 'papaparse';
import { OptionData } from '@/types/options';


export const useOptionsData = () => {
  const [data, setData] = useState<OptionData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const loadCSVFromGitHub = useCallback(async (filename: string) => {
    console.log('📥 Loading CSV:', filename);
    setIsLoading(true);
    setError(null);

    const githubUrl = `https://raw.githubusercontent.com/datamilo/put-options-se/main/data/${filename}?${Date.now()}`;

    try {
      const response = await fetch(githubUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch CSV from GitHub: ${response.status} ${response.statusText}`);
      }

      const csvText = await response.text();

      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(),
        transform: (value, field) => {
          const numericFields = [
            'X-Day', 'Premium', 'PoW_Simulation_Mean_Earnings', '100k_Invested_Loss_Mean',
            '1_2_3_ProbOfWorthless_Weighted', 'ProbWorthless_Bayesian_IsoCal', '1_ProbOfWorthless_Original', 
            '2_ProbOfWorthless_Calibrated', '3_ProbOfWorthless_Historical_IV', 'Lower_Bound_at_Accuracy',
            'LossAtBadDecline', 'LossAtWorstDecline', 'PoW_Stats_MedianLossPct',
            'PoW_Stats_WorstLossPct', 'PoW_Stats_MedianLoss', 'PoW_Stats_WorstLoss',
            'PoW_Stats_MedianProbOfWorthless', 'PoW_Stats_MinProbOfWorthless',
            'PoW_Stats_MaxProbOfWorthless', 'LossAt100DayWorstDecline',
            'LossAt_2008_100DayWorstDecline', 'Mean_Accuracy', 'Lower_Bound_HistMedianIV_at_Accuracy',
            'Lower_Bound', 'Lower_Bound_HistMedianIV', 'Bid_Ask_Mid_Price', 'Option_Price_Min',
            'NumberOfContractsBasedOnLimit', 'Bid', 'ProfitLossPctLeastBad', 'Loss_Least_Bad',
            'IV_AllMedianIV_Maximum100DaysToExp_Ratio', 'StockPrice', 'DaysToExpiry',
            'AskBidSpread', 'Underlying_Value', 'StrikePrice', 'StockPrice_After_2008_100DayWorstDecline',
            'LossAt50DayWorstDecline', 'LossAt_2008_50DayWorstDecline', 'ProfitLossPctBad',
            'ProfitLossPctWorst', 'ProfitLossPct100DayWorst', 'ImpliedVolatility',
            'TodayStockMedianIV_Maximum100DaysToExp', 'AllMedianIV_Maximum100DaysToExp',
            'ExpiryDate_Lower_Bound_Minus_Pct_Based_on_Accuracy', 'Ask', 'WorstHistoricalDecline',
            'BadHistoricalDecline', 'ImpliedVolatilityUntilExpiry', 'StockPrice_After_100DayWorstDecline',
            'StockPrice_After_50DayWorstDecline', 'StockPrice_After_2008_50DayWorstDecline',
            '100DayMaxPrice', '50DayMaxPrice', 'Historical100DaysWorstDecline',
            'Historical50DaysWorstDecline', '2008_100DaysWorstDecline', '2008_50DaysWorstDecline'
          ];
          
          if (typeof field === 'string' && numericFields.includes(field)) {
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
    } catch (error) {
      setError('Failed to load data from GitHub. Please try again.');
      setIsLoading(false);
    }
  }, []);

  const loadCSVFile = useCallback((file: File) => {
    setIsLoading(true);
    setError(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      transform: (value, field) => {
        const numericFields = [
          'X-Day', 'Premium', 'PoW_Simulation_Mean_Earnings', '100k_Invested_Loss_Mean',
          '1_2_3_ProbOfWorthless_Weighted', 'ProbWorthless_Bayesian_IsoCal', '1_ProbOfWorthless_Original', 
          '2_ProbOfWorthless_Calibrated', '3_ProbOfWorthless_Historical_IV', 'Lower_Bound_at_Accuracy',
          'LossAtBadDecline', 'LossAtWorstDecline', 'PoW_Stats_MedianLossPct',
          'PoW_Stats_WorstLossPct', 'PoW_Stats_MedianLoss', 'PoW_Stats_WorstLoss',
          'PoW_Stats_MedianProbOfWorthless', 'PoW_Stats_MinProbOfWorthless',
          'PoW_Stats_MaxProbOfWorthless', 'LossAt100DayWorstDecline',
          'LossAt_2008_100DayWorstDecline', 'Mean_Accuracy', 'Lower_Bound_HistMedianIV_at_Accuracy',
          'Lower_Bound', 'Lower_Bound_HistMedianIV', 'Bid_Ask_Mid_Price', 'Option_Price_Min',
          'NumberOfContractsBasedOnLimit', 'Bid', 'ProfitLossPctLeastBad', 'Loss_Least_Bad',
          'IV_AllMedianIV_Maximum100DaysToExp_Ratio', 'StockPrice', 'DaysToExpiry',
          'AskBidSpread', 'Underlying_Value', 'StrikePrice', 'StockPrice_After_2008_100DayWorstDecline',
          'LossAt50DayWorstDecline', 'LossAt_2008_50DayWorstDecline', 'ProfitLossPctBad',
          'ProfitLossPctWorst', 'ProfitLossPct100DayWorst', 'ImpliedVolatility',
          'TodayStockMedianIV_Maximum100DaysToExp', 'AllMedianIV_Maximum100DaysToExp',
          'ExpiryDate_Lower_Bound_Minus_Pct_Based_on_Accuracy', 'Ask', 'WorstHistoricalDecline',
          'BadHistoricalDecline', 'ImpliedVolatilityUntilExpiry', 'StockPrice_After_100DayWorstDecline',
          'StockPrice_After_50DayWorstDecline', 'StockPrice_After_2008_50DayWorstDecline',
          '100DayMaxPrice', '50DayMaxPrice', 'Historical100DaysWorstDecline',
          'Historical50DaysWorstDecline', '2008_100DaysWorstDecline', '2008_50DaysWorstDecline'
        ];
        
        if (typeof field === 'string' && numericFields.includes(field)) {
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
    console.log('📦 Loading mock data...');
    const mockData: OptionData[] = [
      {
        StockName: "AAK AB",
        OptionName: "AAK5T240",
        Premium: 250,
        ExpiryDate: "2024-12-15",
        '1_2_3_ProbOfWorthless_Weighted': 0.898455,
        ProbWorthless_Bayesian_IsoCal: 0.810947,
        '1_ProbOfWorthless_Original': 0.884279,
        '2_ProbOfWorthless_Calibrated': 0.85,
        '3_ProbOfWorthless_Historical_IV': 0.12,
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
        StrikeBelowLowerAtAcc: "Y",
        Ask: 255,
        'X-Day': 0,
        PoW_Simulation_Mean_Earnings: 12000,
        '100k_Invested_Loss_Mean': -15000,
        WorstHistoricalDecline: -0.45,
        BadHistoricalDecline: -0.35,
        ImpliedVolatilityUntilExpiry: 0.298,
        StockPrice_After_100DayWorstDecline: 210,
        StockPrice_After_50DayWorstDecline: 215,
        StockPrice_After_2008_50DayWorstDecline: 180,
        '100DayMaxPrice': 320,
        '50DayMaxPrice': 310,
        Historical100DaysWorstDecline: -0.42,
        Historical50DaysWorstDecline: -0.38,
        '2008_100DaysWorstDecline': -0.55,
        '2008_50DaysWorstDecline': -0.52
      }
    ];
    
    setData(mockData);
  }, []);

  // Data loading only
  useEffect(() => {
    const loadData = async () => {
      try {
        await loadCSVFromGitHub('data.csv');
      } catch {
        console.warn('❌ GitHub CSV failed, loading mock data');
        loadMockData();
      }
    };
    loadData();
  }, [loadCSVFromGitHub, loadMockData]);

  return {
    data,
    isLoading,
    error,
    loadCSVFile,
    loadCSVFromGitHub,
    loadMockData,
    setData
  };
};