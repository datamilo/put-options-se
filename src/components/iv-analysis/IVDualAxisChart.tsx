// src/components/iv-analysis/IVDualAxisChart.tsx

import React, { useState, useMemo } from 'react';
import {
  ComposedChart,
  Line,
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

type DateRange = '3M' | '6M' | '1Y' | 'Allt';

interface Props {
  data: IVPerStockPerDay[];
  stockName: string;
}

function subtractMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() - months);
  return d.toISOString().split('T')[0];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="bg-background border rounded shadow-md p-2 text-xs space-y-1">
      <div className="font-medium">{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ color: p.color }}>
          {p.name === 'IV'
            ? `IV: ${p.value != null ? formatNordicDecimal(p.value * 100, 2) + '%' : '–'}`
            : `Kurs: ${p.value != null ? formatNordicDecimal(p.value, 2) : '–'}`}
        </div>
      ))}
    </div>
  );
};

export const IVDualAxisChart: React.FC<Props> = ({ data, stockName }) => {
  const [range, setRange] = useState<DateRange>('1Y');

  const sortedData = useMemo(
    () => [...data].sort((a, b) => a.Date.localeCompare(b.Date)),
    [data]
  );

  const filteredData = useMemo(() => {
    if (range === 'Allt' || sortedData.length === 0) return sortedData;
    const lastDate = sortedData[sortedData.length - 1].Date;
    const months = range === '3M' ? 3 : range === '6M' ? 6 : 12;
    const cutoff = subtractMonths(lastDate, months);
    return sortedData.filter(r => r.Date >= cutoff);
  }, [sortedData, range]);

  const chartData = filteredData.map(r => ({
    date: r.Date,
    iv: r.IV_30d,           // null renders as gap
    price: r.Stock_Price,
  }));

  const ranges: DateRange[] = ['3M', '6M', '1Y', 'Allt'];

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
            tickFormatter={v => v.slice(0, 7)} // YYYY-MM
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
          <Tooltip content={<CustomTooltip />} />
          <Legend />
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
            name="Kurs"
            stroke="hsl(var(--muted-foreground))"
            strokeWidth={1.5}
            dot={false}
            connectNulls={true}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
