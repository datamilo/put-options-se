// src/hooks/useIVPerStockPerDay.ts

import { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
import { IVPerStockPerDay, IVStockSummary, IVMarketSummary } from '@/types/ivAnalysis';

const GITHUB_URL = 'https://cdn.jsdelivr.net/gh/datamilo/put-options-se@main/data/iv_per_stock_per_day.csv';
const LOCAL_URL = '/data/iv_per_stock_per_day.csv';

interface IVPerStockSingleton {
  stockRows: IVPerStockPerDay[];
  marketRows: IVPerStockPerDay[];
  loaded: boolean;
  error: string | null;
}

const ivPerStockSingleton: IVPerStockSingleton = {
  stockRows: [],
  marketRows: [],
  loaded: false,
  error: null,
};

function computeIVRank(currentIV: number, values: number[]): number | null {
  if (values.length === 0) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return 50;
  return Math.round(((currentIV - min) / (max - min)) * 100);
}

export const useIVPerStockPerDay = () => {
  const [rawData, setRawData] = useState<IVPerStockPerDay[]>(ivPerStockSingleton.stockRows);
  const [marketIVData, setMarketIVData] = useState<IVPerStockPerDay[]>(ivPerStockSingleton.marketRows);
  const [isLoading, setIsLoading] = useState(!ivPerStockSingleton.loaded);
  const [error, setError] = useState<string | null>(ivPerStockSingleton.error);

  useEffect(() => {
    if (ivPerStockSingleton.loaded) {
      setRawData(ivPerStockSingleton.stockRows);
      setMarketIVData(ivPerStockSingleton.marketRows);
      setIsLoading(false);
      setError(ivPerStockSingleton.error);
      return;
    }

    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);

        let csvText = '';
        for (const url of [GITHUB_URL, LOCAL_URL]) {
          try {
            const response = await fetch(url);
            if (response.ok) {
              csvText = await response.text();
              break;
            }
          } catch {
            // try next
          }
        }

        if (!csvText) {
          throw new Error('Could not load IV data from any source.');
        }

        const result = Papa.parse<Record<string, string>>(csvText, {
          header: true,
          skipEmptyLines: true,
          delimiter: '|',
        });

        const parsed: IVPerStockPerDay[] = result.data.map(row => ({
          Stock_Name: row.Stock_Name?.trim() ?? '',
          Date: row.Date?.trim() ?? '',
          Stock_Price: parseFloat(row.Stock_Price) || 0,
          IV_30d: row.IV_30d && row.IV_30d !== '' && row.IV_30d !== 'nan'
            ? parseFloat(row.IV_30d)
            : null,
          N_Stocks: row.N_Stocks && row.N_Stocks !== '' && row.N_Stocks !== 'nan'
            ? parseInt(row.N_Stocks, 10)
            : null,
          N_Excluded: row.N_Excluded && row.N_Excluded !== '' && row.N_Excluded !== 'nan'
            ? parseInt(row.N_Excluded, 10)
            : null,
        })).filter(row => row.Stock_Name && row.Date);

        const marketRows = parsed
          .filter(r => r.Stock_Name === 'MARKET_IV')
          .sort((a, b) => a.Date.localeCompare(b.Date));
        const stockRows = parsed.filter(r => r.Stock_Name !== 'MARKET_IV');

        ivPerStockSingleton.stockRows = stockRows;
        ivPerStockSingleton.marketRows = marketRows;
        ivPerStockSingleton.loaded = true;
        ivPerStockSingleton.error = null;

        setRawData(stockRows);
        setMarketIVData(marketRows);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        ivPerStockSingleton.error = msg;
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  // Pre-group data by stock for efficient lookups
  const dataByStock = useMemo(() => {
    const map = new Map<string, IVPerStockPerDay[]>();
    for (const row of rawData) {
      if (!map.has(row.Stock_Name)) map.set(row.Stock_Name, []);
      map.get(row.Stock_Name)!.push(row);
    }
    for (const rows of map.values()) {
      rows.sort((a, b) => a.Date.localeCompare(b.Date));
    }
    return map;
  }, [rawData]);

  // Compute summary metrics for all stocks
  const stockSummaries = useMemo((): IVStockSummary[] => {
    const summaries: IVStockSummary[] = [];

    for (const [stockName, rows] of dataByStock.entries()) {
      const validRows = rows.filter(r => r.IV_30d !== null);
      if (validRows.length === 0) {
        const last = rows[rows.length - 1];
        summaries.push({
          stockName,
          latestDate: last?.Date ?? '',
          currentIV: null,
          currentStockPrice: last?.Stock_Price ?? 0,
          ivRank52w: null,
          ivRankAllTime: null,
          ivChange1d: null,
          ivChange5d: null,
        });
        continue;
      }

      const lastValid = validRows[validRows.length - 1];
      const currentIV = lastValid.IV_30d!;
      const currentDate = lastValid.Date;

      const allIVs = validRows.map(r => r.IV_30d!);
      const ivRankAllTime = computeIVRank(currentIV, allIVs);

      const cutoff52w = new Date(currentDate);
      cutoff52w.setFullYear(cutoff52w.getFullYear() - 1);
      const cutoffStr = cutoff52w.toISOString().split('T')[0];
      const ivs52w = validRows.filter(r => r.Date >= cutoffStr).map(r => r.IV_30d!);
      const ivRank52w = computeIVRank(currentIV, ivs52w);

      const prevValid = validRows.length >= 2 ? validRows[validRows.length - 2] : null;
      const ivChange1d = prevValid ? currentIV - prevValid.IV_30d! : null;

      const fiveDayBack = validRows.length > 5 ? validRows[validRows.length - 6] : null;
      const ivChange5d = fiveDayBack ? currentIV - fiveDayBack.IV_30d! : null;

      summaries.push({
        stockName,
        latestDate: currentDate,
        currentIV,
        currentStockPrice: lastValid.Stock_Price,
        ivRank52w,
        ivRankAllTime,
        ivChange1d,
        ivChange5d,
      });
    }

    return summaries;
  }, [dataByStock]);

  const marketIVSummary = useMemo((): IVMarketSummary | null => {
    const validRows = marketIVData.filter(r => r.IV_30d !== null);
    if (validRows.length === 0) return null;

    const lastValid = validRows[validRows.length - 1];
    const currentIV = lastValid.IV_30d!;
    const currentDate = lastValid.Date;

    const allIVs = validRows.map(r => r.IV_30d!);
    const ivRankAllTime = computeIVRank(currentIV, allIVs);

    const cutoff52w = new Date(currentDate);
    cutoff52w.setFullYear(cutoff52w.getFullYear() - 1);
    const cutoffStr = cutoff52w.toISOString().split('T')[0];
    const ivs52w = validRows.filter(r => r.Date >= cutoffStr).map(r => r.IV_30d!);
    const ivRank52w = computeIVRank(currentIV, ivs52w);

    const prevValid = validRows.length >= 2 ? validRows[validRows.length - 2] : null;
    const ivChange1d = prevValid ? currentIV - prevValid.IV_30d! : null;

    const fiveDayBack = validRows.length > 5 ? validRows[validRows.length - 6] : null;
    const ivChange5d = fiveDayBack ? currentIV - fiveDayBack.IV_30d! : null;

    return {
      latestDate: currentDate,
      currentIV,
      ivRank52w,
      ivRankAllTime,
      ivChange1d,
      ivChange5d,
      nStocks: lastValid.N_Stocks,
      nExcluded: lastValid.N_Excluded,
    };
  }, [marketIVData]);

  return {
    rawData,
    dataByStock,
    stockSummaries,
    marketIVData,
    marketIVSummary,
    isLoading,
    error,
  };
};
