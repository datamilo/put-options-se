// src/components/iv-analysis/IVDualAxisChart.tsx

import React, { useState, useMemo } from 'react';
import {
  ComposedChart,
  Line,
  ReferenceLine,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { IVPerStockPerDay } from '@/types/ivAnalysis';
import { formatNordicDecimal } from '@/utils/numberFormatting';
import { useEarningsDates } from '@/hooks/useEarningsDates';

type DateRange = '3M' | '6M' | '1Y' | 'All';

interface Props {
  data: IVPerStockPerDay[];
  stockName: string;
}

function subtractMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() - months);
  return d.toISOString().split('T')[0];
}

// Small upward triangle rendered at the bottom of each earnings reference line
const EarningsMarker = (props: any) => {
  if (!props.viewBox) return null;
  const { x, y, height } = props.viewBox;
  const ty = y + height - 1;
  return (
    <polygon
      points={`${x},${ty - 7} ${x - 4},${ty} ${x + 4},${ty}`}
      fill="#f59e0b"
      opacity={0.85}
    />
  );
};

const CustomTooltip = ({
  active,
  payload,
  label,
  earningsMap,
}: any) => {
  if (!active || !payload || payload.length === 0) return null;
  const earnings = earningsMap?.get(label);
  return (
    <div className="bg-background border rounded shadow-md p-2 text-xs space-y-1">
      <div className="font-medium">{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ color: p.color }}>
          {p.name === 'IV'
            ? `IV: ${p.value != null ? formatNordicDecimal(p.value * 100, 2) + '%' : '–'}`
            : `Price: ${p.value != null ? formatNordicDecimal(p.value, 2) : '–'}`}
        </div>
      ))}
      {earnings && (
        <div className="text-amber-500 font-medium pt-0.5 border-t border-border">
          ▲ {earnings.type}
        </div>
      )}
    </div>
  );
};

export const IVDualAxisChart: React.FC<Props> = ({ data, stockName }) => {
  const [range, setRange] = useState<DateRange>('1Y');
  const earningsDates = useEarningsDates(stockName);

  const sortedData = useMemo(
    () => [...data].sort((a, b) => a.Date.localeCompare(b.Date)),
    [data]
  );

  const filteredData = useMemo(() => {
    if (range === 'All' || sortedData.length === 0) return sortedData;
    const lastDate = sortedData[sortedData.length - 1].Date;
    const months = range === '3M' ? 3 : range === '6M' ? 6 : 12;
    const cutoff = subtractMonths(lastDate, months);
    return sortedData.filter(r => r.Date >= cutoff);
  }, [sortedData, range]);

  const chartData = filteredData.map(r => ({
    date: r.Date,
    iv: r.IV_30d,
    price: r.Stock_Price,
  }));

  // Set of dates present in chartData for fast lookup
  const chartDateSet = useMemo(
    () => new Set(chartData.map(r => r.date)),
    [chartData]
  );

  // Only show earnings markers for dates visible in the current range
  const visibleEarnings = useMemo(
    () => earningsDates.filter(e => chartDateSet.has(e.date)),
    [earningsDates, chartDateSet]
  );

  // Map for O(1) tooltip lookup
  const earningsMap = useMemo(
    () => new Map(visibleEarnings.map(e => [e.date, e])),
    [visibleEarnings]
  );

  const ranges: DateRange[] = ['3M', '6M', '1Y', 'All'];

  return (
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

      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11 }}
            tickFormatter={v => v.slice(0, 7)}
            minTickGap={40}
          />
          <YAxis
            yAxisId="iv"
            orientation="left"
            tick={{ fontSize: 11 }}
            tickFormatter={v => `${Math.round(v * 100)}%`}
            width={45}
          />
          <YAxis
            yAxisId="price"
            orientation="right"
            tick={{ fontSize: 11 }}
            tickFormatter={v => formatNordicDecimal(v, 0)}
            width={60}
          />
          <Tooltip content={<CustomTooltip earningsMap={earningsMap} />} />
          <Legend />
          {visibleEarnings.map(e => (
            <ReferenceLine
              key={e.date}
              x={e.date}
              yAxisId="iv"
              stroke="#f59e0b"
              strokeDasharray="3 3"
              strokeWidth={1}
              strokeOpacity={0.7}
              label={<EarningsMarker />}
            />
          ))}
          <Line
            yAxisId="iv"
            type="monotone"
            dataKey="iv"
            name="IV"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={false}
            connectNulls={false}
          />
          <Line
            yAxisId="price"
            type="monotone"
            dataKey="price"
            name="Price"
            stroke="hsl(var(--muted-foreground))"
            strokeWidth={1.5}
            dot={false}
            connectNulls={true}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {visibleEarnings.length > 0 && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="text-amber-500">▲</span>
          <span>Earnings report</span>
        </div>
      )}
    </div>
  );
};
