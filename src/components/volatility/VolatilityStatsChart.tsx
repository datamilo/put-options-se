import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Check, ChevronsUpDown } from 'lucide-react';
import { VolatilityStats, VolatilityEventData } from '@/types/volatility';

interface VolatilityStatsChartProps {
  data: VolatilityStats[];
  rawData: VolatilityEventData[];
  selectedStocks: string[];
}

export const VolatilityStatsChart: React.FC<VolatilityStatsChartProps> = ({ data, rawData, selectedStocks }) => {

  // Sanitize the data prop to ensure all numeric values are valid for Recharts
  const sanitizedDataProp = useMemo(() => {
    console.log('🔍 [VolatilityStatsChart] Incoming data prop:', {
      isUndefined: data === undefined,
      isNull: data === null,
      isArray: Array.isArray(data),
      length: data?.length,
      type: typeof data,
      sample: data?.slice(0, 2)
    });

    if (!data || !Array.isArray(data) || data.length === 0) {
      console.log('⚠️ [VolatilityStatsChart] data prop invalid, returning empty array');
      return [];
    }

    // Sanitize all values to prevent NaN/undefined issues in Recharts
    const safeNumber = (value: number) => {
      if (value === undefined || value === null || isNaN(value)) {
        return 0;
      }
      return value;
    };

    const sanitized = data.map(item => ({
      name: item.name || 'Unknown',
      count: item.count || 0,
      mean_abs_change: safeNumber(item.mean_abs_change),
      mean_change: safeNumber(item.mean_change),
      median_change: safeNumber(item.median_change),
      std_dev: safeNumber(item.std_dev),
      ci95_low: safeNumber(item.ci95_low),
      ci95_high: safeNumber(item.ci95_high),
      p05: safeNumber(item.p05),
      p95: safeNumber(item.p95),
      min_change: safeNumber(item.min_change),
      max_change: safeNumber(item.max_change),
      negative_count: item.negative_count || 0,
      negative_rate: safeNumber(item.negative_rate),
      se_mean: safeNumber(item.se_mean),
      avg_volume_pct_change: safeNumber(item.avg_volume_pct_change),
      avg_intraday_spread_pct: safeNumber(item.avg_intraday_spread_pct),
      min_event_type: item.min_event_type || '',
      min_event_date: item.min_event_date || '',
      max_event_type: item.max_event_type || '',
      max_event_date: item.max_event_date || ''
    }));

    console.log('✅ [VolatilityStatsChart] Sanitized data prop:', {
      length: sanitized.length,
      sample: sanitized.slice(0, 1)
    });

    return sanitized;
  }, [data]);

  // Filter and recalculate data based on selected stocks
  const filteredData = useMemo(() => {
    console.log('🔍 [VolatilityStatsChart] rawData:', {
      isUndefined: rawData === undefined,
      isNull: rawData === null,
      isArray: Array.isArray(rawData),
      length: rawData?.length,
      type: typeof rawData
    });
    console.log('🔍 [VolatilityStatsChart] selectedStocks:', selectedStocks);

    // Guard against undefined or null rawData
    if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
      console.log('⚠️ [VolatilityStatsChart] Returning empty array - no data');
      return [];
    }

    let filteredRawData = rawData;

    // Filter by selected stocks if any
    if (selectedStocks.length > 0) {
      filteredRawData = filteredRawData.filter(row => selectedStocks.includes(row.name));
    }

    // If filtering resulted in no data, return empty array
    if (filteredRawData.length === 0) {
      return [];
    }

    // Recalculate statistics for the filtered raw data
    const grouped = filteredRawData.reduce((acc, row) => {
      const key = row.name;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(row);
      return acc;
    }, {} as Record<string, VolatilityEventData[]>);

    const recalculatedStats: VolatilityStats[] = [];

    for (const [name, stockData] of Object.entries(grouped)) {
      const validChanges = stockData
        .map(d => d.close_price_pct_change_from_previous_day)
        .filter(change => !isNaN(change));

      if (validChanges.length === 0) continue;

      const count = validChanges.length;
      const mean_change = validChanges.reduce((sum, val) => sum + val, 0) / count;
      
      // Calculate median
      const sortedChanges = [...validChanges].sort((a, b) => a - b);
      const median_change = count % 2 === 0 
        ? (sortedChanges[count / 2 - 1] + sortedChanges[count / 2]) / 2
        : sortedChanges[Math.floor(count / 2)];

      // Calculate standard deviation
      const variance = validChanges.reduce((sum, val) => sum + Math.pow(val - mean_change, 2), 0) / count;
      const std_dev = Math.sqrt(variance);

      const min_change = Math.min(...validChanges);
      const max_change = Math.max(...validChanges);

      // Find the events that caused min/max changes
      const minIndex = validChanges.indexOf(min_change);
      const maxIndex = validChanges.indexOf(max_change);
      const minEvent = stockData.find(d => d.close_price_pct_change_from_previous_day === min_change);
      const maxEvent = stockData.find(d => d.close_price_pct_change_from_previous_day === max_change);

      // Calculate percentiles
      const p05 = count > 0 ? sortedChanges[Math.floor(count * 0.05)] : NaN;
      const p95 = count > 0 ? sortedChanges[Math.floor(count * 0.95)] : NaN;

      const mean_abs_change = validChanges.reduce((sum, val) => sum + Math.abs(val), 0) / count;
      const negative_count = validChanges.filter(val => val < 0).length;
      const negative_rate = negative_count / count;

      const se_mean = std_dev / Math.sqrt(count);
      const ci95_low = mean_change - 1.96 * se_mean;
      const ci95_high = mean_change + 1.96 * se_mean;

      // Calculate volume change average
      const validVolumeChanges = stockData
        .map(d => d.volume_pct_change_from_previous_day)
        .filter(change => !isNaN(change));
      const avg_volume_pct_change = validVolumeChanges.length > 0 
        ? validVolumeChanges.reduce((sum, val) => sum + val, 0) / validVolumeChanges.length
        : 0;

      // Calculate intraday spread average (taking absolute value)
      const validSpreadChanges = stockData
        .map(d => Math.abs(d.pct_intraday_high_low_movement))
        .filter(change => !isNaN(change));
      const avg_intraday_spread_pct = validSpreadChanges.length > 0
        ? validSpreadChanges.reduce((sum, val) => sum + val, 0) / validSpreadChanges.length
        : 0;

      recalculatedStats.push({
        name,
        count,
        mean_change,
        median_change,
        std_dev,
        min_change,
        max_change,
        p05,
        p95,
        mean_abs_change,
        negative_count,
        negative_rate,
        se_mean,
        ci95_low,
        ci95_high,
        avg_volume_pct_change,
        avg_intraday_spread_pct,
        min_event_type: minEvent?.type_of_event || '',
        min_event_date: minEvent?.date || '',
        max_event_type: maxEvent?.type_of_event || '',
        max_event_date: maxEvent?.date || ''
      });
    }

    // Sort by mean absolute change and convert decimal values to percentages
    // Ensure all values are valid numbers (not NaN or undefined) for Recharts
    const finalData = recalculatedStats.sort((a, b) => b.mean_abs_change - a.mean_abs_change).map(item => {
      const safeNumber = (value: number) => {
        if (value === undefined || value === null || isNaN(value)) {
          return 0;
        }
        return value;
      };

      return {
        name: item.name || 'Unknown', // Ensure name is always a string
        count: item.count || 0,
        mean_abs_change: safeNumber(item.mean_abs_change) * 100,
        mean_change: safeNumber(item.mean_change) * 100,
        median_change: safeNumber(item.median_change) * 100,
        std_dev: safeNumber(item.std_dev),
        ci95_low: safeNumber(item.ci95_low) * 100,
        ci95_high: safeNumber(item.ci95_high) * 100,
        p05: safeNumber(item.p05) * 100,
        p95: safeNumber(item.p95) * 100,
        min_change: safeNumber(item.min_change) * 100,
        max_change: safeNumber(item.max_change) * 100,
        negative_count: item.negative_count || 0,
        negative_rate: safeNumber(item.negative_rate),
        se_mean: safeNumber(item.se_mean),
        avg_volume_pct_change: safeNumber(item.avg_volume_pct_change) * 100,
        avg_intraday_spread_pct: Math.abs(safeNumber(item.avg_intraday_spread_pct)) * 100,
        min_event_type: item.min_event_type || '',
        min_event_date: item.min_event_date || '',
        max_event_type: item.max_event_type || '',
        max_event_date: item.max_event_date || ''
      };
    });

    console.log('✅ [VolatilityStatsChart] finalData:', {
      isArray: Array.isArray(finalData),
      length: finalData.length,
      sample: finalData.slice(0, 2),
      allHaveNames: finalData.every(d => d.name),
      sampleDataKeys: finalData.length > 0 ? Object.keys(finalData[0]) : []
    });

    return finalData;
  }, [rawData, selectedStocks]);

  // Take top 20 for readability
  const topStocks = filteredData.slice(0, 20);

  console.log('📊 [VolatilityStatsChart] topStocks for chart:', {
    isArray: Array.isArray(topStocks),
    length: topStocks.length,
    sample: topStocks.slice(0, 1),
    sampleFull: topStocks.length > 0 ? topStocks[0] : null
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const stockData = filteredData.find(item => item.name === label);
      
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index}>
              <p style={{ color: entry.color }}>
                {entry.name}: {typeof entry.value === 'number' ? `${entry.value.toFixed(2)}%` : entry.value}
              </p>
              {stockData && entry.dataKey === 'min_change' && (
                <p className="text-xs text-muted-foreground">
                  Event: {stockData.min_event_type} on {stockData.min_event_date}
                </p>
              )}
              {stockData && entry.dataKey === 'max_change' && (
                <p className="text-xs text-muted-foreground">
                  Event: {stockData.max_event_type} on {stockData.max_event_date}
                </p>
              )}
            </div>
          ))}
        </div>
      );
    }
    return null;
  };


  return (
    <div className="space-y-4">
      <Tabs defaultValue="volatility" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="volatility">Mean Volatility</TabsTrigger>
          <TabsTrigger value="distribution">Distribution Metrics</TabsTrigger>
          <TabsTrigger value="minmax">Min/Max Changes</TabsTrigger>
        </TabsList>

      <TabsContent value="volatility">
        <Card>
          <CardHeader>
            <CardTitle>Mean Absolute Price Change During Events</CardTitle>
            <p className="text-sm text-muted-foreground">
              Average absolute percentage change in closing price during corporate events
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={topStocks} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end" 
                  height={100}
                  className="text-xs"
                />
                <YAxis className="text-xs" label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="mean_abs_change" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="distribution">
        <Card>
          <CardHeader>
            <CardTitle>Price Change Distribution Metrics</CardTitle>
            <p className="text-sm text-muted-foreground">
              Statistical distribution of price changes: 5th percentile, median, and 95th percentile
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={topStocks} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end" 
                  height={100}
                  className="text-xs"
                />
                <YAxis className="text-xs" label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="p05" fill="hsl(var(--destructive))" name="5th Percentile" />
                <Bar dataKey="median_change" fill="hsl(var(--primary))" name="Median" />
                <Bar dataKey="p95" fill="hsl(220, 70%, 40%)" name="95th Percentile" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="minmax">
        <Card>
          <CardHeader>
            <CardTitle>Min/Max Price Changes During Events</CardTitle>
            <p className="text-sm text-muted-foreground">
              Largest positive and negative percentage changes observed for each stock during events
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={topStocks} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end" 
                  height={100}
                  className="text-xs"
                />
                <YAxis className="text-xs" label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="min_change" fill="hsl(var(--destructive))" name="Min Change" />
                <Bar dataKey="max_change" fill="hsl(220, 70%, 40%)" name="Max Change" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </TabsContent>
      </Tabs>
    </div>
  );
};