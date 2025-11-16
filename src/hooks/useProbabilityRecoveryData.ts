import { useState, useCallback, useEffect } from 'react';
import Papa from 'papaparse';
import { ProbabilityRecoveryData, RecoveryScenario, RecoveryStockData } from '@/types/probabilityRecovery';

export const useProbabilityRecoveryData = () => {
  const [data, setData] = useState<ProbabilityRecoveryData[]>([]);
  const [scenarios, setScenarios] = useState<RecoveryScenario[]>([]);
  const [stockData, setStockData] = useState<RecoveryStockData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCSVFromGitHub = useCallback(async (filename: string) => {
    console.log('📥 Loading Recovery CSV:', filename);
    setIsLoading(true);
    setError(null);

    const urls = [
      `https://raw.githubusercontent.com/datamilo/put-options-se/main/data/${filename}?${Date.now()}`,
      `${window.location.origin}${import.meta.env.BASE_URL}data/${filename}?${Date.now()}`
    ];

    let lastError: Error | null = null;

    for (const url of urls) {
      try {
        console.log('🔗 Trying URL:', url);
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`);
        }

        const csvText = await response.text();

        if (!csvText || csvText.trim().length === 0) {
          throw new Error('Empty CSV file received');
        }

        console.log('✅ Successfully loaded Recovery CSV from:', url);

        const parseResult = await new Promise<ProbabilityRecoveryData[]>((resolve, reject) => {
          Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            delimiter: '|',
            transformHeader: (header) => header.trim(),
            transform: (value, field) => {
              const numericFields = [
                'HistoricalPeakThreshold',
                'RecoveryCandidate_N',
                'RecoveryCandidate_WorthlessRate',
                'RecoveryCandidate_AvgCurrentProb',
                'RecoveryCandidate_AvgPeakProb',
                'RecoveryCandidate_Premium_pp',
                'Baseline_N',
                'Baseline_WorthlessRate',
                'Baseline_AvgCurrentProb',
                'Baseline_AvgPeakProb',
                'Baseline_Premium_pp',
                'Advantage_pp'
              ];

              if (typeof field === 'string' && numericFields.includes(field)) {
                const num = parseFloat(value);
                return isNaN(num) ? 0 : num;
              }
              return value;
            },
            complete: (results) => {
              if (results.errors.length > 0) {
                console.warn('⚠️ CSV parsing warnings:', results.errors);
              }

              const parsedData = results.data as ProbabilityRecoveryData[];
              console.log(`✅ Parsed ${parsedData.length} recovery records`);
              resolve(parsedData);
            },
            error: (error) => {
              console.error('❌ CSV parsing error:', error);
              reject(error);
            }
          });
        });

        setData(parseResult);

        // Split into scenarios and stock data
        const scenarioData = parseResult.filter(row => row.DataType === 'scenario') as RecoveryScenario[];
        const stockRecoveryData = parseResult.filter(row => row.DataType === 'stock') as RecoveryStockData[];

        setScenarios(scenarioData);
        setStockData(stockRecoveryData);

        setIsLoading(false);
        return parseResult;

      } catch (err) {
        lastError = err as Error;
        console.warn(`⚠️ Failed to load from ${url}:`, err);
        continue;
      }
    }

    // All URLs failed
    const errorMessage = lastError?.message || 'Failed to load recovery CSV from all sources';
    console.error('❌ All CSV load attempts failed:', errorMessage);
    setError(errorMessage);
    setIsLoading(false);
    throw lastError;
  }, []);

  useEffect(() => {
    loadCSVFromGitHub('recovery_report_data.csv').catch(err => {
      console.error('Failed to load recovery data:', err);
    });
  }, [loadCSVFromGitHub]);

  return {
    data,
    scenarios,
    stockData,
    isLoading,
    error,
    reload: () => loadCSVFromGitHub('recovery_report_data.csv')
  };
};
