// src/hooks/useEarningsDates.ts

import { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';

const GITHUB_URL = 'https://raw.githubusercontent.com/datamilo/put-options-se/main/data/Stock_Events_Volatility_Data.csv';
const LOCAL_URL = '/data/Stock_Events_Volatility_Data.csv';

export interface EarningsEvent {
  date: string;
  type: string;
}

interface RawRow {
  date: string;
  name: string;
  type_of_event: string;
}

function translateEventType(raw: string): string {
  const map: Record<string, string> = {
    'Kvartalsrapport': 'Quarterly Report',
    'Bokslutskommuniké': 'Annual Report',
    'Delårsrapport': 'Interim Report',
  };
  return map[raw?.trim()] ?? raw?.trim() ?? 'Earnings';
}

// Module-level cache so the CSV is only fetched once per session
let cachedRows: RawRow[] | null = null;
let pendingLoad: Promise<RawRow[]> | null = null;

async function fetchEarningsRows(): Promise<RawRow[]> {
  if (cachedRows) return cachedRows;
  if (pendingLoad) return pendingLoad;

  pendingLoad = (async () => {
    for (const url of [GITHUB_URL, LOCAL_URL]) {
      try {
        const res = await fetch(url.includes('github') ? `${url}?${Date.now()}` : url);
        if (!res.ok) continue;
        const text = await res.text();
        const parsed = Papa.parse<RawRow>(text, {
          header: true,
          skipEmptyLines: true,
          delimiter: '|',
        });
        cachedRows = parsed.data.filter(r => r.date && r.name);
        return cachedRows;
      } catch {}
    }
    cachedRows = [];
    return cachedRows;
  })();

  return pendingLoad;
}

export function useEarningsDates(stockName: string): EarningsEvent[] {
  const [rows, setRows] = useState<RawRow[]>([]);

  useEffect(() => {
    fetchEarningsRows().then(setRows);
  }, []);

  return useMemo(
    () =>
      rows
        .filter(r => r.name.trim() === stockName)
        .map(r => ({ date: r.date.trim(), type: translateEventType(r.type_of_event) })),
    [rows, stockName]
  );
}
