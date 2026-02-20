// src/components/iv-analysis/IVScreeningTable.tsx

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { IVStockSummary } from '@/types/ivAnalysis';
import { formatNordicDecimal, formatNordicPercentagePoints } from '@/utils/numberFormatting';
import { InfoIconTooltip } from '@/components/ui/info-icon-tooltip';

type SortField = 'stockName' | 'currentIV' | 'ivRank52w' | 'ivRankAllTime' | 'ivChange1d' | 'ivChange5d' | 'currentStockPrice';
type SortDir = 'asc' | 'desc';
type RankMode = '52w' | 'allTime';

interface Props {
  summaries: IVStockSummary[];
  selectedStock: string;
  onSelectStock: (stock: string) => void;
}

function ivRankColor(rank: number | null): string {
  if (rank === null) return '';
  if (rank > 80) return 'text-red-600 dark:text-red-400 font-semibold';
  if (rank < 20) return 'text-green-600 dark:text-green-400 font-semibold';
  return 'text-muted-foreground';
}

function deltaColor(val: number | null): string {
  if (val === null) return '';
  if (val > 0) return 'text-red-600 dark:text-red-400';
  if (val < 0) return 'text-green-600 dark:text-green-400';
  return '';
}

function formatIV(val: number | null): string {
  if (val === null) return '–';
  return formatNordicDecimal(val * 100, 2) + '%';
}

function formatRank(val: number | null): string {
  if (val === null) return '–';
  return String(val);
}

function formatDelta(val: number | null): string {
  if (val === null) return '–';
  return formatNordicPercentagePoints(val * 100, 2);
}

export const IVScreeningTable: React.FC<Props> = ({ summaries, selectedStock, onSelectStock }) => {
  const [sortField, setSortField] = useState<SortField>('ivRank52w');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [rankMode, setRankMode] = useState<RankMode>('52w');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const sorted = useMemo(() => {
    return [...summaries].sort((a, b) => {
      let aVal: number | string | null = null;
      let bVal: number | string | null = null;

      switch (sortField) {
        case 'stockName': aVal = a.stockName; bVal = b.stockName; break;
        case 'currentIV': aVal = a.currentIV; bVal = b.currentIV; break;
        case 'ivRank52w': aVal = a.ivRank52w; bVal = b.ivRank52w; break;
        case 'ivRankAllTime': aVal = a.ivRankAllTime; bVal = b.ivRankAllTime; break;
        case 'ivChange1d': aVal = a.ivChange1d; bVal = b.ivChange1d; break;
        case 'ivChange5d': aVal = a.ivChange5d; bVal = b.ivChange5d; break;
        case 'currentStockPrice': aVal = a.currentStockPrice; bVal = b.currentStockPrice; break;
      }

      // Nulls always last
      if (aVal === null && bVal === null) return 0;
      if (aVal === null) return 1;
      if (bVal === null) return -1;

      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [summaries, sortField, sortDir]);

  const SortHeader = ({ field, label, tooltip }: { field: SortField; label: string; tooltip?: React.ReactNode }) => (
    <th
      scope="col"
      className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground select-none whitespace-nowrap"
      onClick={() => handleSort(field)}
      aria-sort={sortField === field
        ? (sortDir === 'asc' ? 'ascending' : 'descending')
        : undefined}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {sortField === field && (
          <span>{sortDir === 'asc' ? '↑' : '↓'}</span>
        )}
        {tooltip && (
          <span onClick={e => e.stopPropagation()}>
            <InfoIconTooltip content={tooltip} side="bottom" />
          </span>
        )}
      </span>
    </th>
  );

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-lg">IV Screening</CardTitle>
          <div className="flex items-center gap-1 border rounded-md p-0.5">
            <Button
              size="sm"
              variant={rankMode === '52w' ? 'default' : 'ghost'}
              className="h-7 text-xs px-2"
              onClick={() => setRankMode('52w')}
            >
              52 Weeks
            </Button>
            <Button
              size="sm"
              variant={rankMode === 'allTime' ? 'default' : 'ghost'}
              className="h-7 text-xs px-2"
              onClick={() => setRankMode('allTime')}
            >
              Historical
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <SortHeader field="stockName" label="Stock" />
                <SortHeader field="currentIV" label="Current IV" />
                <SortHeader
                  field={rankMode === '52w' ? 'ivRank52w' : 'ivRankAllTime'}
                  label={rankMode === '52w' ? 'IV Rank 52w' : 'IV Rank Hist.'}
                  tooltip={rankMode === '52w'
                    ? "Where today's IV sits within this stock's own 52-week range. 100 = IV at 52-week high (expensive options), 0 = IV at 52-week low (cheap options). Useful for comparing relative IV richness across stocks with different baseline volatility."
                    : "Where today's IV sits within this stock's full historical range in the dataset. 100 = IV at all-time high, 0 = IV at all-time low."}
                />
                <SortHeader field="ivChange1d" label="1-day Δ IV" />
                <SortHeader field="ivChange5d" label="5-day Δ IV" />
                <SortHeader field="currentStockPrice" label="Price" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sorted.map(row => {
                const rank = rankMode === '52w' ? row.ivRank52w : row.ivRankAllTime;
                const isSelected = row.stockName === selectedStock;
                return (
                  <tr
                    key={row.stockName}
                    onClick={() => onSelectStock(row.stockName)}
                    className={`cursor-pointer hover:bg-muted/50 transition-colors ${
                      isSelected ? 'bg-primary/10' : ''
                    }`}
                  >
                    <td className="px-3 py-2 font-medium">{row.stockName}</td>
                    <td className="px-3 py-2 tabular-nums">{formatIV(row.currentIV)}</td>
                    <td className={`px-3 py-2 tabular-nums ${ivRankColor(rank)}`}>
                      {formatRank(rank)}
                    </td>
                    <td className={`px-3 py-2 tabular-nums ${deltaColor(row.ivChange1d)}`}>
                      {formatDelta(row.ivChange1d)}
                    </td>
                    <td className={`px-3 py-2 tabular-nums ${deltaColor(row.ivChange5d)}`}>
                      {formatDelta(row.ivChange5d)}
                    </td>
                    <td className="px-3 py-2 tabular-nums">
                      {formatNordicDecimal(row.currentStockPrice, 2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
