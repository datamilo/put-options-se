import React, { useState, useMemo } from 'react';
import { MonthlyStockData } from '@/hooks/useMonthlyStockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { TrendingDown, TrendingUp, Calendar } from 'lucide-react';
import { DayDistributionHistogram } from './DayDistributionHistogram';
import { PeriodComparisonChart } from './PeriodComparisonChart';
import { WeeklyHeatmap } from './WeeklyHeatmap';

// TypeScript interfaces for data structures
export interface DayOfMonthDistribution {
  day: number; // 1-31
  frequency: number;
  percentage: number;
}

export interface PeriodDistribution {
  period: 'early' | 'mid' | 'late';
  dayRange: string; // "1-10", "11-20", "21-31"
  percentage: number;
  count: number;
}

export interface WeeklyDistribution {
  month: number; // 1-12
  week1Pct: number; // Days 1-7
  week2Pct: number; // Days 8-14
  week3Pct: number; // Days 15-21
  week4Pct: number; // Days 22-31
  week1Count: number;
  week2Count: number;
  week3Count: number;
  week4Count: number;
}

export interface DayOfMonthStats {
  dailyDistribution: DayOfMonthDistribution[];
  periodDistribution: PeriodDistribution[];
  weeklyDistribution: WeeklyDistribution[];
  medianDay: number;
  modeDay: number;
  modeDayFrequency: number;
  totalRecords: number;
  earlyPct: number;
  midPct: number;
  latePct: number;
}

interface DayOfMonthAnalysisProps {
  monthlyData: MonthlyStockData[];
  selectedMonths: number[];
  selectedStock: string;
  minHistory: number;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const DayOfMonthAnalysis: React.FC<DayOfMonthAnalysisProps> = ({
  monthlyData,
  selectedMonths,
  selectedStock,
  minHistory
}) => {
  const [analysisType, setAnalysisType] = useState<'lows' | 'highs'>('lows');
  const [chartType, setChartType] = useState<'histogram' | 'period-comparison' | 'heatmap'>('histogram');

  // Calculate median from an array of numbers
  const calculateMedian = (values: number[]): number => {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
      : sorted[mid];
  };

  // Calculate mode from frequency map
  const calculateMode = (frequencyMap: Record<number, number>): { mode: number; frequency: number } => {
    let maxFreq = 0;
    let modeDay = 1;

    Object.entries(frequencyMap).forEach(([day, freq]) => {
      if (freq > maxFreq) {
        maxFreq = freq;
        modeDay = parseInt(day);
      }
    });

    return { mode: modeDay, frequency: maxFreq };
  };

  // Main data processing - calculate all statistics
  const dayOfMonthStats = useMemo((): DayOfMonthStats => {
    // Filter by selected months and stock
    let filtered = monthlyData.filter(record => {
      // Filter by month selection
      if (selectedMonths.length > 0 && !selectedMonths.includes(record.month)) {
        return false;
      }
      // Filter by stock selection
      if (selectedStock && record.name !== selectedStock) {
        return false;
      }
      return true;
    });

    // Filter by minimum history (count occurrences per stock)
    if (!selectedStock && minHistory > 1) {
      const stockCounts = filtered.reduce((acc, record) => {
        acc[record.name] = (acc[record.name] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      filtered = filtered.filter(record => stockCounts[record.name] >= minHistory);
    }

    if (filtered.length === 0) {
      return {
        dailyDistribution: [],
        periodDistribution: [
          { period: 'early', dayRange: '1-10', percentage: 0, count: 0 },
          { period: 'mid', dayRange: '11-20', percentage: 0, count: 0 },
          { period: 'late', dayRange: '21-31', percentage: 0, count: 0 }
        ],
        weeklyDistribution: [],
        medianDay: 0,
        modeDay: 0,
        modeDayFrequency: 0,
        totalRecords: 0,
        earlyPct: 0,
        midPct: 0,
        latePct: 0
      };
    }

    const dayField = analysisType === 'lows' ? 'day_low_day_of_month' : 'day_high_day_of_month';

    // Count frequency for each day (1-31)
    const dayFrequency: Record<number, number> = {};
    const dayValues: number[] = [];

    filtered.forEach(record => {
      const day = record[dayField];
      if (day >= 1 && day <= 31) {
        dayFrequency[day] = (dayFrequency[day] || 0) + 1;
        dayValues.push(day);
      }
    });

    const totalRecords = dayValues.length;

    // Calculate daily distribution (for histogram)
    const dailyDistribution: DayOfMonthDistribution[] = Array.from({ length: 31 }, (_, i) => {
      const day = i + 1;
      const frequency = dayFrequency[day] || 0;
      return {
        day,
        frequency,
        percentage: totalRecords > 0 ? (frequency / totalRecords) * 100 : 0
      };
    });

    // Calculate period distribution (early/mid/late)
    const earlyCount = filtered.filter(r => r[dayField] >= 1 && r[dayField] <= 10).length;
    const midCount = filtered.filter(r => r[dayField] >= 11 && r[dayField] <= 20).length;
    const lateCount = filtered.filter(r => r[dayField] >= 21 && r[dayField] <= 31).length;

    const periodDistribution: PeriodDistribution[] = [
      {
        period: 'early',
        dayRange: '1-10',
        percentage: totalRecords > 0 ? (earlyCount / totalRecords) * 100 : 0,
        count: earlyCount
      },
      {
        period: 'mid',
        dayRange: '11-20',
        percentage: totalRecords > 0 ? (midCount / totalRecords) * 100 : 0,
        count: midCount
      },
      {
        period: 'late',
        dayRange: '21-31',
        percentage: totalRecords > 0 ? (lateCount / totalRecords) * 100 : 0,
        count: lateCount
      }
    ];

    // Calculate weekly distribution by calendar month
    const monthlyWeeklyData: Record<number, { week1: number; week2: number; week3: number; week4: number }> = {};

    for (let month = 1; month <= 12; month++) {
      monthlyWeeklyData[month] = { week1: 0, week2: 0, week3: 0, week4: 0 };
    }

    filtered.forEach(record => {
      const day = record[dayField];
      const month = record.month;

      if (!monthlyWeeklyData[month]) return;

      if (day >= 1 && day <= 7) {
        monthlyWeeklyData[month].week1++;
      } else if (day >= 8 && day <= 14) {
        monthlyWeeklyData[month].week2++;
      } else if (day >= 15 && day <= 21) {
        monthlyWeeklyData[month].week3++;
      } else if (day >= 22 && day <= 31) {
        monthlyWeeklyData[month].week4++;
      }
    });

    const weeklyDistribution: WeeklyDistribution[] = [];
    for (let month = 1; month <= 12; month++) {
      const data = monthlyWeeklyData[month];
      const monthTotal = data.week1 + data.week2 + data.week3 + data.week4;

      weeklyDistribution.push({
        month,
        week1Count: data.week1,
        week2Count: data.week2,
        week3Count: data.week3,
        week4Count: data.week4,
        week1Pct: monthTotal > 0 ? (data.week1 / monthTotal) * 100 : 0,
        week2Pct: monthTotal > 0 ? (data.week2 / monthTotal) * 100 : 0,
        week3Pct: monthTotal > 0 ? (data.week3 / monthTotal) * 100 : 0,
        week4Pct: monthTotal > 0 ? (data.week4 / monthTotal) * 100 : 0
      });
    }

    // Calculate median and mode
    const medianDay = calculateMedian(dayValues);
    const { mode: modeDay, frequency: modeDayFrequency } = calculateMode(dayFrequency);

    return {
      dailyDistribution,
      periodDistribution,
      weeklyDistribution,
      medianDay,
      modeDay,
      modeDayFrequency,
      totalRecords,
      earlyPct: periodDistribution[0].percentage,
      midPct: periodDistribution[1].percentage,
      latePct: periodDistribution[2].percentage
    };
  }, [monthlyData, selectedMonths, selectedStock, minHistory, analysisType]);

  // Generate insight text based on data
  const insightText = useMemo(() => {
    const { modeDay, modeDayFrequency, totalRecords, earlyPct } = dayOfMonthStats;

    if (totalRecords === 0) {
      return 'No data available for the selected filters';
    }

    const modePct = totalRecords > 0 ? ((modeDayFrequency / totalRecords) * 100).toFixed(1) : '0';
    const type = analysisType === 'lows' ? 'lows' : 'highs';

    if (selectedStock) {
      return `${selectedStock} typically hits monthly ${type} on day ${modeDay} (${modePct}% of months)`;
    } else {
      return `Across all stocks, ${earlyPct.toFixed(1)}% of ${type} occur in days 1-10, with day ${modeDay} being most common (${modePct}%)`;
    }
  }, [dayOfMonthStats, analysisType, selectedStock]);

  // Stat card component
  const StatCard: React.FC<{ title: string; value: string; subtitle: string; icon?: React.ReactNode }> = ({
    title,
    value,
    subtitle,
    icon
  }) => (
    <Card className="bg-gradient-to-br from-muted/20 to-muted/10 border-border/50">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          </div>
          {icon && <div className="text-muted-foreground opacity-50">{icon}</div>}
        </div>
      </CardContent>
    </Card>
  );

  if (dayOfMonthStats.totalRecords === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Day-of-Month Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <p>No data available for the selected filters. Try adjusting your month, stock, or minimum history filters.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Day-of-Month Analysis</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Analyze when stocks typically hit their monthly {analysisType === 'lows' ? 'lows' : 'highs'} during the month
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Controls */}
        <div className="flex flex-wrap items-center gap-6 p-6 bg-gradient-to-r from-muted/10 to-muted/20 rounded-xl border border-border/50">
          {/* Analysis Type Toggle */}
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Show:</Label>
            <ToggleGroup type="single" value={analysisType} onValueChange={(value: 'lows' | 'highs') => value && setAnalysisType(value)}>
              <ToggleGroupItem value="lows" className="px-4">
                Low Days
              </ToggleGroupItem>
              <ToggleGroupItem value="highs" className="px-4">
                High Days
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {/* Chart Type Selector */}
          <div className="flex items-center gap-2">
            <Label htmlFor="chart-select" className="text-sm font-medium">Chart:</Label>
            <Select value={chartType} onValueChange={(value: any) => setChartType(value)}>
              <SelectTrigger id="chart-select" className="w-48 bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background border shadow-lg z-50">
                <SelectItem value="histogram">Daily Distribution</SelectItem>
                <SelectItem value="period-comparison">Period Comparison</SelectItem>
                <SelectItem value="heatmap">Weekly Heatmap</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Insight Card */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              {analysisType === 'lows' ? (
                <TrendingDown className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              ) : (
                <TrendingUp className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              )}
              <div>
                <p className="text-sm font-medium">Key Pattern Detected</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {insightText}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chart Display */}
        <div className="mt-6">
          {chartType === 'histogram' && (
            <DayDistributionHistogram
              data={dayOfMonthStats.dailyDistribution}
              analysisType={analysisType}
              medianDay={dayOfMonthStats.medianDay}
              modeDay={dayOfMonthStats.modeDay}
            />
          )}
          {chartType === 'period-comparison' && (
            <PeriodComparisonChart
              data={dayOfMonthStats.weeklyDistribution}
              analysisType={analysisType}
              selectedMonths={selectedMonths}
            />
          )}
          {chartType === 'heatmap' && (
            <WeeklyHeatmap
              data={dayOfMonthStats.weeklyDistribution}
              analysisType={analysisType}
              selectedMonths={selectedMonths}
            />
          )}
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <StatCard
            title={`Median ${analysisType === 'lows' ? 'Low' : 'High'} Day`}
            value={`Day ${dayOfMonthStats.medianDay}`}
            subtitle={`50% of ${analysisType} occur before this day`}
            icon={<Calendar className="h-5 w-5" />}
          />
          <StatCard
            title={`Most Common ${analysisType === 'lows' ? 'Low' : 'High'} Day`}
            value={`Day ${dayOfMonthStats.modeDay}`}
            subtitle={`${((dayOfMonthStats.modeDayFrequency / dayOfMonthStats.totalRecords) * 100).toFixed(1)}% of months`}
            icon={<Calendar className="h-5 w-5" />}
          />
          <StatCard
            title="Early-Month Tendency"
            value={`${dayOfMonthStats.earlyPct.toFixed(1)}%`}
            subtitle={`${analysisType === 'lows' ? 'Lows' : 'Highs'} in days 1-10`}
            icon={<Calendar className="h-5 w-5" />}
          />
        </div>

        {/* Data Info */}
        <div className="text-xs text-muted-foreground pt-4 border-t border-border/30">
          <p>
            Analysis based on {dayOfMonthStats.totalRecords} historical monthly records
            {selectedMonths.length > 0 && ` for ${selectedMonths.map(m => MONTH_NAMES[m - 1]).join(', ')}`}
            {selectedStock && ` for ${selectedStock}`}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
