// src/components/iv-analysis/MarketIVPanel.tsx

import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { IVPerStockPerDay, IVMarketSummary } from '@/types/ivAnalysis';
import { formatNordicDecimal, formatNordicPercentagePoints } from '@/utils/numberFormatting';

type DateRange = '3M' | '6M' | '1Y' | 'All';

interface Props {
  marketIVData: IVPerStockPerDay[];
  marketIVSummary: IVMarketSummary | null;
}

function KPICard({ label, value, colorClass }: { label: string; value: string; colorClass?: string }) {
  return (
    <Card>
      <CardContent className="pt-4 pb-3 px-4">
        <div className="text-xs text-muted-foreground mb-1">{label}</div>
        <div className={`text-xl font-semibold tabular-nums ${colorClass ?? ''}`}>{value}</div>
      </CardContent>
    </Card>
  );
}

function ivRankColorClass(rank: number | null): string {
  if (rank === null) return '';
  if (rank > 80) return 'text-red-600 dark:text-red-400';
  if (rank < 20) return 'text-green-600 dark:text-green-400';
  return '';
}

function deltaColorClass(val: number | null): string {
  if (val === null) return '';
  return val > 0 ? 'text-red-600 dark:text-red-400' : val < 0 ? 'text-green-600 dark:text-green-400' : '';
}

function subtractMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() - months);
  return d.toISOString().split('T')[0];
}

const MarketTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="bg-background border rounded shadow-md p-2 text-xs space-y-1">
      <div className="font-medium">{label}</div>
      <div style={{ color: payload[0].color }}>
        IV: {payload[0].value != null ? formatNordicDecimal(payload[0].value * 100, 2) + '%' : '–'}
      </div>
    </div>
  );
};

export const MarketIVPanel: React.FC<Props> = ({ marketIVData, marketIVSummary }) => {
  const [range, setRange] = useState<DateRange>('1Y');
  const [rankMode, setRankMode] = useState<'52w' | 'allTime'>('52w');

  const filteredData = useMemo(() => {
    if (marketIVData.length === 0) return [];
    if (range === 'All') return marketIVData;
    const lastDate = marketIVData[marketIVData.length - 1].Date;
    const months = range === '3M' ? 3 : range === '6M' ? 6 : 12;
    const cutoff = subtractMonths(lastDate, months);
    return marketIVData.filter(r => r.Date >= cutoff);
  }, [marketIVData, range]);

  const chartData = filteredData.map(r => ({ date: r.Date, iv: r.IV_30d }));

  const s = marketIVSummary;
  const currentIVStr = s?.currentIV != null ? formatNordicDecimal(s.currentIV * 100, 2) + '%' : '–';
  const rank = rankMode === '52w' ? s?.ivRank52w ?? null : s?.ivRankAllTime ?? null;
  const rankStr = rank != null ? `${rank} / 100` : '–';
  const change1dStr = s?.ivChange1d != null ? formatNordicPercentagePoints(s.ivChange1d * 100, 2) : '–';
  const change5dStr = s?.ivChange5d != null ? formatNordicPercentagePoints(s.ivChange5d * 100, 2) : '–';
  const nStocksStr = s?.nStocks != null ? String(s.nStocks) : '–';
  const nExcludedStr = s?.nExcluded != null ? String(s.nExcluded) : '–';

  const ranges: DateRange[] = ['3M', '6M', '1Y', 'All'];

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-lg">Swedish Market IV</CardTitle>
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
      <CardContent className="space-y-4">
        {/* KPI strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <KPICard label="Current IV" value={currentIVStr} />
          <KPICard
            label={rankMode === '52w' ? 'IV Rank 52w' : 'IV Rank Historical'}
            value={rankStr}
            colorClass={ivRankColorClass(rank)}
          />
          <KPICard label="1-day Δ IV" value={change1dStr} colorClass={deltaColorClass(s?.ivChange1d ?? null)} />
          <KPICard label="5-day Δ IV" value={change5dStr} colorClass={deltaColorClass(s?.ivChange5d ?? null)} />
          <KPICard label="N Stocks" value={nStocksStr} />
          <KPICard label="N Excluded" value={nExcludedStr} />
        </div>

        {/* Chart */}
        <div className="space-y-2">
          <div className="flex items-center justify-end gap-1">
            {ranges.map(r => (
              <Button
                key={r}
                size="sm"
                variant={range === r ? 'default' : 'outline'}
                className="h-7 text-xs px-2"
                onClick={() => setRange(r)}
              >
                {r}
              </Button>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                tickFormatter={v => v.slice(0, 7)}
                minTickGap={40}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={v => `${Math.round(v * 100)}%`}
                width={45}
              />
              <Tooltip content={<MarketTooltip />} />
              <Line
                type="monotone"
                dataKey="iv"
                name="Market IV"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
