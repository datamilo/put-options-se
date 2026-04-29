import { useState, useCallback, useEffect } from 'react';
import Papa from 'papaparse';
import { ProbabilityRecoveryData, RecoveryScenario, RecoveryStockData } from '@/types/probabilityRecovery';
import { normalizeProbMethod } from '@/utils/probabilityMethods';

interface ChartDataPoint {
  recovery_candidate_n: number;
  recovery_candidate_rate: number;
  baseline_n: number;
  baseline_rate: number | null;
  advantage: number | null;
}

type ChartDataStructure = Record<string, Record<string, Record<string, Record<string, Record<string, ChartDataPoint>>>>>;

const SINGLETON_TTL_MS = 30 * 60 * 1000;

interface RecoverySingleton {
  data: ProbabilityRecoveryData[];
  scenarios: RecoveryScenario[];
  stockData: RecoveryStockData[];
  stocks: string[];
  chartData: ChartDataStructure;
  stockChartData: ChartDataStructure;
  loaded: boolean;
  loadedAt: number;
  error: string | null;
}

const recoverySingleton: RecoverySingleton = {
  data: [],
  scenarios: [],
  stockData: [],
  stocks: [],
  chartData: {},
  stockChartData: {},
  loaded: false,
  loadedAt: 0,
  error: null,
};

export const useProbabilityRecoveryData = () => {
  const [data, setData] = useState<ProbabilityRecoveryData[]>(recoverySingleton.data);
  const [scenarios, setScenarios] = useState<RecoveryScenario[]>(recoverySingleton.scenarios);
  const [stockData, setStockData] = useState<RecoveryStockData[]>(recoverySingleton.stockData);
  const [isLoading, setIsLoading] = useState(!recoverySingleton.loaded);
  const [error, setError] = useState<string | null>(recoverySingleton.error);
  const [stocks, setStocks] = useState<string[]>(recoverySingleton.stocks);
  const [chartData, setChartData] = useState<ChartDataStructure>(recoverySingleton.chartData);
  const [stockChartData, setStockChartData] = useState<ChartDataStructure>(recoverySingleton.stockChartData);

  const buildChartDataStructure = useCallback((rows: ProbabilityRecoveryData[]) => {
    const aggregatedChart: ChartDataStructure = {};
    const stockChart: ChartDataStructure = {};
    const uniqueStocks = new Set<string>();

    for (const row of rows) {
      const threshold = row.HistoricalPeakThreshold.toFixed(2);
      const method = row.ProbMethod;
      const probBin = row.CurrentProb_Bin;
      const dte = row.DTE_Bin;
      const stock = row.Stock || '';

      const recovery_candidate_rate = row.RecoveryCandidate_WorthlessRate_pct / 100;
      const all_options_rate = row.AllOptions_N > 0 && row.AllOptions_WorthlessRate_pct !== undefined
        ? row.AllOptions_WorthlessRate_pct / 100
        : null;

      const dataPoint: ChartDataPoint = {
        recovery_candidate_n: row.RecoveryCandidate_N,
        recovery_candidate_rate,
        baseline_n: row.AllOptions_N,
        baseline_rate: all_options_rate,
        advantage: row.RecoveryAdvantage_pp
      };

      if (row.DataType === 'scenario' || stock === '') {
        if (!aggregatedChart[threshold]) aggregatedChart[threshold] = {};
        if (!aggregatedChart[threshold][method]) aggregatedChart[threshold][method] = {};
        if (!aggregatedChart[threshold][method][probBin]) aggregatedChart[threshold][method][probBin] = {};
        aggregatedChart[threshold][method][probBin][dte] = dataPoint;
      } else {
        if (!stockChart[threshold]) stockChart[threshold] = {};
        if (!stockChart[threshold][stock]) stockChart[threshold][stock] = {};
        if (!stockChart[threshold][stock][method]) stockChart[threshold][stock][method] = {};
        if (!stockChart[threshold][stock][method][probBin]) stockChart[threshold][stock][method][probBin] = {};
        stockChart[threshold][stock][method][probBin][dte] = dataPoint;
        uniqueStocks.add(stock);
      }
    }

    return { aggregatedChart, stockChart, uniqueStocks: Array.from(uniqueStocks).sort() };
  }, []);

  const loadCSVFromGitHub = useCallback(async (filename: string, forceReload = false) => {
    const isFresh = recoverySingleton.loaded && Date.now() - recoverySingleton.loadedAt < SINGLETON_TTL_MS;
    if (isFresh && !forceReload) {
      setData(recoverySingleton.data);
      setScenarios(recoverySingleton.scenarios);
      setStockData(recoverySingleton.stockData);
      setStocks(recoverySingleton.stocks);
      setChartData(recoverySingleton.chartData);
      setStockChartData(recoverySingleton.stockChartData);
      setIsLoading(false);
      setError(recoverySingleton.error);
      return recoverySingleton.data;
    }
    recoverySingleton.loaded = false;

    setIsLoading(true);
    setError(null);

    const urls = [
      `https://raw.githubusercontent.com/datamilo/put-options-se/main/data/${filename}`,
      `${window.location.origin}${import.meta.env.BASE_URL}data/${filename}`,
    ];

    let lastError: Error | null = null;

    for (const url of urls) {
      try {
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`);
        }

        const csvText = await response.text();

        if (!csvText || csvText.trim().length === 0) {
          throw new Error('Empty CSV file received');
        }

        const parseResult = await new Promise<ProbabilityRecoveryData[]>((resolve, reject) => {
          Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            delimiter: '|',
            transformHeader: (header) => header.trim(),
            transform: (value, field) => {
              const numericFields = [
                'HistoricalPeakThreshold', 'RecoveryCandidate_N', 'RecoveryCandidate_WorthlessCount',
                'RecoveryCandidate_WorthlessRate_pct', 'AllOptions_N', 'AllOptions_WorthlessCount',
                'AllOptions_WorthlessRate_pct', 'RecoveryAdvantage_pp'
              ];

              if (typeof field === 'string' && numericFields.includes(field)) {
                const num = parseFloat(value);
                return isNaN(num) ? 0 : num;
              }

              if (field === 'ProbMethod') {
                return normalizeProbMethod(value);
              }

              return value;
            },
            complete: (results) => {
              resolve(results.data as ProbabilityRecoveryData[]);
            },
            error: (err) => {
              reject(err);
            }
          });
        });

        const scenarioData = parseResult.filter(row => row.DataType === 'scenario') as RecoveryScenario[];
        const stockRecoveryData = parseResult.filter(row => row.DataType === 'stock') as RecoveryStockData[];
        const { aggregatedChart, stockChart, uniqueStocks } = buildChartDataStructure(parseResult);
        const stocksList = ['All Stocks', ...uniqueStocks];

        recoverySingleton.data = parseResult;
        recoverySingleton.scenarios = scenarioData;
        recoverySingleton.stockData = stockRecoveryData;
        recoverySingleton.stocks = stocksList;
        recoverySingleton.chartData = aggregatedChart;
        recoverySingleton.stockChartData = stockChart;
        recoverySingleton.loaded = true;
        recoverySingleton.loadedAt = Date.now();
        recoverySingleton.error = null;

        setData(parseResult);
        setScenarios(scenarioData);
        setStockData(stockRecoveryData);
        setChartData(aggregatedChart);
        setStockChartData(stockChart);
        setStocks(stocksList);
        setIsLoading(false);
        return parseResult;

      } catch (err) {
        lastError = err as Error;
        continue;
      }
    }

    const errorMessage = lastError?.message || 'Failed to load recovery CSV from all sources';
    recoverySingleton.error = errorMessage;
    setError(errorMessage);
    setIsLoading(false);
    throw lastError;
  }, [buildChartDataStructure]);

  useEffect(() => {
    loadCSVFromGitHub('recovery_report_data.csv').catch(() => {});
  }, [loadCSVFromGitHub]);

  return {
    data,
    scenarios,
    stockData,
    isLoading,
    error,
    stocks,
    chartData,
    stockChartData,
    reload: () => {
      recoverySingleton.loaded = false;
      return loadCSVFromGitHub('recovery_report_data.csv', true);
    },
  };
};
