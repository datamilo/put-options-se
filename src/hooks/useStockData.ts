import { useState, useEffect, useCallback } from 'react';
import Papa from 'papaparse';
import { StockData, StockSummary } from '@/types/stock';

const SINGLETON_TTL_MS = 30 * 60 * 1000;

interface StockSingleton {
  data: StockData[];
  dataByName: Map<string, StockData[]>; // pre-sorted ascending by date
  loaded: boolean;
  loadedAt: number;
  error: string | null;
}

const stockSingleton: StockSingleton = {
  data: [],
  dataByName: new Map(),
  loaded: false,
  loadedAt: 0,
  error: null,
};

function buildStockMap(data: StockData[]): Map<string, StockData[]> {
  const map = new Map<string, StockData[]>();
  for (const row of data) {
    if (!row.name) continue;
    if (!map.has(row.name)) map.set(row.name, []);
    map.get(row.name)!.push(row);
  }
  // Pre-sort each stock's rows by date ascending so callers get sorted data for free
  for (const rows of map.values()) {
    rows.sort((a, b) => a.date.localeCompare(b.date));
  }
  return map;
}

export const useStockData = () => {
  const [allStockData, setAllStockData] = useState<StockData[]>(stockSingleton.data);
  const [isLoading, setIsLoading] = useState(!stockSingleton.loaded);
  const [error, setError] = useState<string | null>(stockSingleton.error);

  useEffect(() => {
    if (stockSingleton.loaded && Date.now() - stockSingleton.loadedAt < SINGLETON_TTL_MS) {
      setAllStockData(stockSingleton.data);
      setIsLoading(false);
      setError(stockSingleton.error);
      return;
    }
    stockSingleton.loaded = false;
    loadStockData();
  }, []);

  const loadStockData = useCallback(async () => {
    if (stockSingleton.loaded && Date.now() - stockSingleton.loadedAt < SINGLETON_TTL_MS) {
      setAllStockData(stockSingleton.data);
      setIsLoading(false);
      setError(stockSingleton.error);
      return;
    }
    stockSingleton.loaded = false;

    try {
      setIsLoading(true);
      setError(null);

      const urls = [
        'https://raw.githubusercontent.com/datamilo/put-options-se/main/data/stock_data.csv',
        `${window.location.origin}${import.meta.env.BASE_URL}data/stock_data.csv`,
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
        throw lastError || new Error('Failed to load stock data from any URL');
      }

      const csvText = await response.text();

      Papa.parse(csvText, {
        header: true,
        delimiter: '|',
        skipEmptyLines: true,
        transform: (value, field) => {
          if (
            field === 'open' || field === 'high' || field === 'low' ||
            field === 'close' || field === 'volume' || field === 'pct_change_close'
          ) {
            if (value === '' || value === null || value === undefined) {
              return field === 'volume' ? 0 : null;
            }
            return parseFloat(value);
          }
          return value;
        },
        complete: (results) => {
          const data = results.data as StockData[];
          const map = buildStockMap(data);

          stockSingleton.data = data;
          stockSingleton.dataByName = map;
          stockSingleton.loaded = true;
          stockSingleton.loadedAt = Date.now();
          stockSingleton.error = null;

          setAllStockData(data);
          setIsLoading(false);
        },
        error: () => {
          const msg = 'Failed to parse stock data';
          stockSingleton.error = msg;
          setError(msg);
          setIsLoading(false);
        },
      });
    } catch (err) {
      const msg = 'Failed to load stock data';
      stockSingleton.error = msg;
      setError(msg);
      setIsLoading(false);
    }
  }, []);

  // O(1) lookup — data is pre-sorted ascending by date
  const getStockData = useCallback((stockName: string): StockData[] => {
    return stockSingleton.dataByName.get(stockName) ?? [];
  }, []);

  const getLowPriceForPeriod = useCallback((stockName: string, periodDays: number): number | null => {
    const stockData = getStockData(stockName);
    if (stockData.length === 0) return null;

    const periodAgo = new Date();
    periodAgo.setDate(periodAgo.getDate() - periodDays);

    const recentData = stockData.filter(d => new Date(d.date) >= periodAgo);
    if (recentData.length === 0) return null;

    return Math.min(...recentData.map(d => d.low));
  }, [getStockData]);

  const getPriceRangeForPeriod = useCallback(
    (stockName: string, periodDays: number): { high: number; low: number } | null => {
      const stockData = getStockData(stockName);
      if (stockData.length === 0) return null;

      const periodAgo = new Date();
      periodAgo.setDate(periodAgo.getDate() - periodDays);

      const recentData = stockData.filter(d => new Date(d.date) >= periodAgo);
      if (recentData.length === 0) return null;

      return {
        high: Math.max(...recentData.map(d => d.high)),
        low: Math.min(...recentData.map(d => d.low)),
      };
    },
    [getStockData]
  );

  const getStockSummary = useCallback((stockName: string): StockSummary | null => {
    // Data is pre-sorted ascending — last element is the most recent
    const stockData = getStockData(stockName);
    if (stockData.length === 0) return null;

    const latestData = stockData[stockData.length - 1];
    const previousData = stockData[stockData.length - 2];

    const priceChange = previousData ? latestData.close - previousData.close : 0;
    const priceChangePercent = previousData ? (priceChange / previousData.close) * 100 : 0;

    const currentDate = new Date(latestData.date);

    // Week-over-week change
    const startOfCurrentWeek = new Date(currentDate);
    const dayOfWeek = startOfCurrentWeek.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startOfCurrentWeek.setDate(startOfCurrentWeek.getDate() - daysToMonday);
    startOfCurrentWeek.setHours(0, 0, 0, 0);
    // .at(-1) on ascending-sorted filtered array gives the most recent entry before cutoff
    const previousWeekData = stockData.filter(d => new Date(d.date) < startOfCurrentWeek).at(-1);
    const priceChangePercentWeek = previousWeekData
      ? ((latestData.close - previousWeekData.close) / previousWeekData.close) * 100
      : 0;

    // Month-over-month change
    const startOfCurrentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const previousMonthData = stockData.filter(d => new Date(d.date) < startOfCurrentMonth).at(-1);
    const priceChangePercentMonth = previousMonthData
      ? ((latestData.close - previousMonthData.close) / previousMonthData.close) * 100
      : 0;

    // Year-over-year change
    const startOfCurrentYear = new Date(currentDate.getFullYear(), 0, 1);
    const previousYearData = stockData.filter(d => new Date(d.date) < startOfCurrentYear).at(-1);
    const priceChangePercentYear = previousYearData
      ? ((latestData.close - previousYearData.close) / previousYearData.close) * 100
      : 0;

    // 52-week high/low and volatility
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const recentData = stockData.filter(d => new Date(d.date) >= oneYearAgo);

    const highPrice52Week = Math.max(...recentData.map(d => d.high));
    const lowPrice52Week = Math.min(...recentData.map(d => d.low));

    const returns = recentData.slice(1).map((d, i) =>
      (d.close - recentData[i].close) / recentData[i].close
    );
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const volatility = Math.sqrt(variance) * Math.sqrt(252) * 100;

    const volumes = recentData.map(d => d.volume).sort((a, b) => a - b);
    const medianVolume =
      volumes.length % 2 === 0
        ? (volumes[volumes.length / 2 - 1] + volumes[volumes.length / 2]) / 2
        : volumes[Math.floor(volumes.length / 2)];

    return {
      name: stockName,
      currentPrice: latestData.close,
      priceChange,
      priceChangePercent,
      priceChangePercentWeek,
      priceChangePercentMonth,
      priceChangePercentYear,
      volume: latestData.volume,
      medianVolume,
      highPrice52Week,
      lowPrice52Week,
      volatility,
    };
  }, [getStockData]);

  const getAllStockNames = useCallback((): string[] => {
    return Array.from(stockSingleton.dataByName.keys()).sort();
  }, []);

  return {
    allStockData,
    isLoading,
    error,
    getStockData,
    getStockSummary,
    getLowPriceForPeriod,
    getPriceRangeForPeriod,
    loadStockData,
    getAllStockNames,
  };
};
