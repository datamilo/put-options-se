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

const SINGLETON_TTL_MS = 30 * 60 * 1000;

interface ProbabilityHistorySingleton {
  data: ProbabilityHistoryData[];
  loaded: boolean;
  loadedAt: number;
  error: string | null;
}

const probabilityHistorySingleton: ProbabilityHistorySingleton = {
  data: [],
  loaded: false,
  loadedAt: 0,
  error: null,
};

export const useProbabilityHistory = (optionName?: string) => {
  const [allData, setAllData] = useState<ProbabilityHistoryData[]>(probabilityHistorySingleton.data);
  const [isLoading, setIsLoading] = useState(!probabilityHistorySingleton.loaded);
  const [error, setError] = useState<string | null>(probabilityHistorySingleton.error);

  useEffect(() => {
    loadProbabilityHistory();
  }, []);

  const loadProbabilityHistory = async () => {
    if (probabilityHistorySingleton.loaded && Date.now() - probabilityHistorySingleton.loadedAt < SINGLETON_TTL_MS) {
      setAllData(probabilityHistorySingleton.data);
      setIsLoading(false);
      setError(probabilityHistorySingleton.error);
      return;
    }
    probabilityHistorySingleton.loaded = false;

    try {
      setIsLoading(true);
      setError(null);

      const urls = [
        'https://raw.githubusercontent.com/datamilo/put-options-se/main/data/probability_history.csv',
        `${window.location.origin}${import.meta.env.BASE_URL}data/probability_history.csv`,
      ];

      let lastError: Error | null = null;
      let response: Response | null = null;

      for (const url of urls) {
        try {
          response = await fetch(url);
          if (response.ok) break;
        } catch (err) {
          lastError = err as Error;
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
            '3_ProbOfWorthless_Historical_IV',
          ];

          if (typeof field === 'string' && numericFields.includes(field)) {
            if (value === '' || value === null || value === undefined) return null;
            return parseFloat(value);
          }
          return value;
        },
        complete: (results) => {
          const data = results.data as ProbabilityHistoryData[];

          probabilityHistorySingleton.data = data;
          probabilityHistorySingleton.loaded = true;
          probabilityHistorySingleton.loadedAt = Date.now();
          probabilityHistorySingleton.error = null;

          setAllData(data);
          setIsLoading(false);
        },
        error: () => {
          const msg = 'Failed to parse probability history data';
          probabilityHistorySingleton.error = msg;
          setError(msg);
          setIsLoading(false);
        },
      });
    } catch (err) {
      const msg = 'Failed to load probability history data';
      probabilityHistorySingleton.error = msg;
      setError(msg);
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
    getProbabilityHistoryForOption,
  };
};
