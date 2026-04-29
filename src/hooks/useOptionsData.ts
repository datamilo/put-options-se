import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Papa from 'papaparse';
import { OptionData } from '@/types/options';

const NUMERIC_FIELDS = [
  'Premium', 'PoW_Simulation_Mean_Earnings', '100k_Invested_Loss_Mean',
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
  'Historical50DaysWorstDecline', '2008_100DaysWorstDecline', '2008_50DaysWorstDecline',
  'IV_2sigma_Decline', 'BreakevenDecline', 'CVaR10pct_Decline',
];

export const OPTIONS_QUERY_KEY = ['optionsData'];

function parseOptionsCSV(csvText: string): Promise<OptionData[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      transform: (value, field) => {
        if (typeof field === 'string' && NUMERIC_FIELDS.includes(field)) {
          const num = parseFloat(value);
          return isNaN(num) ? null : num;
        }
        return value;
      },
      complete: (results) => {
        if (results.errors.length > 0) {
          const criticalErrors = results.errors.filter(
            (e) => e.type === 'Delimiter' || e.type === 'Quotes'
          );
          if (criticalErrors.length > 0) {
            reject(new Error(`CSV parsing errors: ${criticalErrors.map((e) => e.message).join(', ')}`));
            return;
          }
        }
        if (results.data && results.data.length > 0) {
          resolve(results.data as OptionData[]);
        } else {
          reject(new Error('No data found in CSV'));
        }
      },
      error: (error) => reject(new Error(`Failed to parse CSV: ${error.message}`)),
    });
  });
}

async function fetchOptionsData(): Promise<OptionData[]> {
  const urls = [
    'https://cdn.jsdelivr.net/gh/datamilo/put-options-se@main/data/data.csv',
    `${window.location.origin}${import.meta.env.BASE_URL}data/data.csv`,
  ];

  let lastError: Error | null = null;

  for (const url of urls) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      const csvText = await response.text();
      if (!csvText || csvText.trim().length === 0) throw new Error('Empty CSV received');
      return await parseOptionsCSV(csvText);
    } catch (error) {
      lastError = error as Error;
    }
  }

  throw lastError ?? new Error('Failed to load options data from any source');
}

const MOCK_DATA: OptionData[] = [
  {
    StockName: 'AAK AB',
    OptionName: 'AAK5T240',
    Premium: 250,
    ExpiryDate: '2024-12-15',
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
    StrikeBelowLowerAtAcc: 'Y',
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
    '2008_50DaysWorstDecline': -0.52,
  },
];

export const useOptionsData = () => {
  const queryClient = useQueryClient();
  // uploadedData overrides query data when a local CSV file is loaded
  const [uploadedData, setUploadedData] = useState<OptionData[] | null>(null);

  const { data: githubData, isLoading, error: queryError } = useQuery({
    queryKey: OPTIONS_QUERY_KEY,
    queryFn: fetchOptionsData,
    staleTime: 10 * 60 * 1000, // 10 minutes — reuse across navigations
    gcTime: 30 * 60 * 1000,    // 30 minutes — keep in memory
    retry: 1,
  });

  const data = uploadedData ?? githubData ?? [];
  const error = queryError ? (queryError as Error).message : null;

  const loadCSVFile = useCallback((file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      transform: (value, field) => {
        if (typeof field === 'string' && NUMERIC_FIELDS.includes(field)) {
          const num = parseFloat(value);
          return isNaN(num) ? null : num;
        }
        return value;
      },
      complete: (results) => {
        setUploadedData(results.data as OptionData[]);
      },
      error: () => {
        // File parse failed — keep existing data
      },
    });
  }, []);

  const loadCSVFromGitHub = useCallback(
    async (_filename: string) => {
      setUploadedData(null);
      await queryClient.invalidateQueries({ queryKey: OPTIONS_QUERY_KEY });
    },
    [queryClient]
  );

  const loadMockData = useCallback(() => {
    setUploadedData(MOCK_DATA);
  }, []);

  return {
    data,
    isLoading,
    error,
    loadCSVFile,
    loadCSVFromGitHub,
    loadMockData,
    setData: setUploadedData,
  };
};
