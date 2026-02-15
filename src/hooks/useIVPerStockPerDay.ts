// src/hooks/useIVPerStockPerDay.ts

import { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
import { IVPerStockPerDay, IVStockSummary } from '@/types/ivAnalysis';

const GITHUB_URL = 'https://raw.githubusercontent.com/datamilo/put-options-se/main/data/iv_per_stock_per_day.csv';
const LOCAL_URL = '/data/iv_per_stock_per_day.csv';

function computeIVRank(currentIV: number, values: number[]): number | null {
  if (values.length === 0) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return 50;
  return Math.round(((currentIV - min) / (max - min)) * 100);
}

export const useIVPerStockPerDay = () => {
  const [rawData, setRawData] = useState<IVPerStockPerDay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);

        let csvText = '';
        for (const url of [GITHUB_URL, LOCAL_URL]) {
          try {
            const response = await fetch(url.includes('github') ? `${url}?${Date.now()}` : url);
            if (response.ok) {
              csvText = await response.text();
              break;
            }
          } catch {
            // try next
          }
        }

        if (!csvText) {
          throw new Error('Could not load IV data from GitHub or local source.');
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
          Strike_Price: row.Strike_Price && row.Strike_Price !== '' && row.Strike_Price !== 'nan'
            ? parseFloat(row.Strike_Price)
            : null,
          Implied_Volatility: row.Implied_Volatility && row.Implied_Volatility !== '' && row.Implied_Volatility !== 'nan'
            ? parseFloat(row.Implied_Volatility)
            : null,
          Expiry_Date: row.Expiry_Date && row.Expiry_Date !== '' && row.Expiry_Date !== 'nan'
            ? row.Expiry_Date.trim()
            : null,
        })).filter(row => row.Stock_Name && row.Date);

        setRawData(parsed);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
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
    // Sort each stock's rows by date ascending
    for (const rows of map.values()) {
      rows.sort((a, b) => a.Date.localeCompare(b.Date));
    }
    return map;
  }, [rawData]);

  // Compute summary metrics for all stocks
  const stockSummaries = useMemo((): IVStockSummary[] => {
    const summaries: IVStockSummary[] = [];

    for (const [stockName, rows] of dataByStock.entries()) {
      const validRows = rows.filter(r => r.Implied_Volatility !== null);
      if (validRows.length === 0) {
        // Stock has no valid IV at all — still include with nulls
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
      const currentIV = lastValid.Implied_Volatility!;
      const currentDate = lastValid.Date;

      // All-time IV values
      const allIVs = validRows.map(r => r.Implied_Volatility!);
      const ivRankAllTime = computeIVRank(currentIV, allIVs);

      // 52-week (252 trading days approx — use 365 calendar days for simplicity)
      const cutoff52w = new Date(currentDate);
      cutoff52w.setFullYear(cutoff52w.getFullYear() - 1);
      const cutoffStr = cutoff52w.toISOString().split('T')[0];
      const ivs52w = validRows
        .filter(r => r.Date >= cutoffStr)
        .map(r => r.Implied_Volatility!);
      const ivRank52w = computeIVRank(currentIV, ivs52w);

      // 1-day change: find the valid row just before the last valid row
      const prevValid = validRows.length >= 2 ? validRows[validRows.length - 2] : null;
      const ivChange1d = prevValid ? currentIV - prevValid.Implied_Volatility! : null;

      // 5-day change: find valid row 5+ positions back
      const fiveDayBack = validRows.length > 5 ? validRows[validRows.length - 6] : null;
      const ivChange5d = fiveDayBack ? currentIV - fiveDayBack.Implied_Volatility! : null;

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

  return {
    rawData,
    dataByStock,
    stockSummaries,
    isLoading,
    error,
  };
};
