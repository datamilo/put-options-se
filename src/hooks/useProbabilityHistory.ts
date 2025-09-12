import { useState, useEffect } from 'react';
import Papa from 'papaparse';

export interface ProbabilityHistoryData {
  OptionName: string;
  Update_date: string;
  '1_2_3_ProbOfWorthless_Weighted': number;
  'ProbWorthless_Bayesian_IsoCal': number;
  '1_ProbOfWorthless_Original': number;
  '2_ProbOfWorthless_Calibrated': number;
  '3_ProbOfWorthless_Historical_IV': number;
}

export const useProbabilityHistory = (optionName?: string) => {
  const [allData, setAllData] = useState<ProbabilityHistoryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProbabilityHistory();
  }, []);

  const loadProbabilityHistory = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Try multiple fallback URLs for better reliability on GitHub Pages
      const urls = [
        `https://raw.githubusercontent.com/datamilo/put-options-se/main/data/probability_history.csv?${Date.now()}`,
        `${window.location.origin}${import.meta.env.BASE_URL}data/probability_history.csv?${Date.now()}`
      ];
      
      let lastError: Error | null = null;
      let response: Response | null = null;
      
      for (const url of urls) {
        try {
          console.log('🔗 Trying probability history URL:', url);
          response = await fetch(url);
          if (response.ok) {
            console.log('✅ Successfully loaded CSV from:', url);
            break;
          }
        } catch (error) {
          console.warn('❌ Failed to load from:', url, error);
          lastError = error as Error;
        }
      }
      
      if (!response || !response.ok) {
        throw lastError || new Error('Failed to load probability history from any URL');
      }
      const csvText = await response.text();
      
      Papa.parse(csvText, {
        header: true,
        delimiter: '|',
        skipEmptyLines: true,
        transform: (value, field) => {
          const numericFields = [
            '1_2_3_ProbOfWorthless_Weighted',
            'ProbWorthless_Bayesian_IsoCal',
            '1_ProbOfWorthless_Original',
            '2_ProbOfWorthless_Calibrated',
            '3_ProbOfWorthless_Historical_IV'
          ];
          
          if (typeof field === 'string' && numericFields.includes(field)) {
            if (value === '' || value === null || value === undefined) {
              return null;
            }
            return parseFloat(value);
          }
          return value;
        },
        complete: (results) => {
          console.log('Probability history data loaded:', results.data.length, 'rows');
          setAllData(results.data as ProbabilityHistoryData[]);
          setIsLoading(false);
        },
        error: (error) => {
          console.error('Error parsing probability history CSV:', error);
          setError('Failed to parse probability history data');
          setIsLoading(false);
        }
      });
    } catch (error) {
      console.error('Error loading probability history data:', error);
      setError('Failed to load probability history data');
      setIsLoading(false);
    }
  };

  const getProbabilityHistoryForOption = (optionName: string): ProbabilityHistoryData[] => {
    return allData
      .filter(data => String(data.OptionName) === optionName)
      .sort((a, b) => new Date(a.Update_date).getTime() - new Date(b.Update_date).getTime());
  };

  const optionData = optionName ? getProbabilityHistoryForOption(optionName) : [];

  return {
    allData,
    optionData,
    isLoading,
    error,
    getProbabilityHistoryForOption
  };
};