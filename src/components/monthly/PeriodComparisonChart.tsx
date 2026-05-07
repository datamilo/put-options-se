import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { WeeklyDistribution } from './DayOfMonthAnalysis';
import { useTranslation } from 'react-i18next';

interface PeriodComparisonChartProps {
  data: WeeklyDistribution[];
  analysisType: 'lows' | 'highs';
  selectedMonths: number[];
}

export const PeriodComparisonChart: React.FC<PeriodComparisonChartProps> = ({
  data,
  analysisType,
  selectedMonths
}) => {
  const { t } = useTranslation(['pages', 'common']);
  // Transform data for stacked bar chart
  const chartData = useMemo(() => {
    // Filter by selected months if any
    const filteredData = selectedMonths.length > 0
      ? data.filter(d => selectedMonths.includes(d.month))
      : data;

    return filteredData.map(d => ({
      month: t(`common:monthNamesShort.${d.month}`),
      monthNumber: d.month,
      'Days 1-7': Number(d.week1Pct.toFixed(1)),
      'Days 8-14': Number(d.week2Pct.toFixed(1)),
      'Days 15-21': Number(d.week3Pct.toFixed(1)),
      'Days 22-31': Number(d.week4Pct.toFixed(1)),
      week1Count: d.week1Count,
      week2Count: d.week2Count,
      week3Count: d.week3Count,
      week4Count: d.week4Count
    }));
  }, [data, selectedMonths]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const total = payload.reduce((sum: number, entry: any) => sum + entry.value, 0);

      return (
        <div
          style={{
            backgroundColor: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '6px',
            padding: '12px'
          }}
        >
          <p className="font-semibold mb-2">{label}</p>
          {payload.reverse().map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {entry.value.toFixed(1)}%
              {entry.payload[`week${4 - index}Count`] !== undefined && (
                <span className="text-muted-foreground text-xs ml-2">
                  ({entry.payload[`week${4 - index}Count`]} occurrences)
                </span>
              )}
            </p>
          ))}
          <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border/30">
            Total: {total.toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  const formatYAxis = (value: number) => `${value}%`;

  return (
    <div className="space-y-4">
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="month"
              className="fill-muted-foreground"
              tick={{ fontSize: 11 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis
              tickFormatter={formatYAxis}
              className="fill-muted-foreground"
              tick={{ fontSize: 11 }}
              label={{
                value: t('pages:monthlyAnalysis.periodComparison.yAxisLabel'),
                angle: -90,
                position: 'insideLeft',
                style: { fontSize: '12px', fill: 'hsl(var(--muted-foreground))' }
              }}
              domain={[0, 100]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="square"
            />

            {/* Stacked bars for each week period */}
            <Bar dataKey="Days 1-7" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
            <Bar dataKey="Days 8-14" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
            <Bar dataKey="Days 15-21" stackId="a" fill="#8b5cf6" radius={[0, 0, 0, 0]} />
            <Bar dataKey="Days 22-31" stackId="a" fill="#ec4899" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Information */}
      <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t border-border/30">
        <p>
          • {t('pages:monthlyAnalysis.chartInfo.periodCompInfo1', { type: analysisType === 'lows' ? t('pages:monthlyAnalysis.chartInfo.analysisTypeLows') : t('pages:monthlyAnalysis.chartInfo.analysisTypeHighs') })}
        </p>
        <p>
          • {t('pages:monthlyAnalysis.chartInfo.periodCompInfo2Prefix')} <span className="font-semibold text-[#3b82f6]">{t('pages:monthlyAnalysis.weeklyHeatmap.weekLabel1')}</span>, <span className="font-semibold text-[#f59e0b]">{t('pages:monthlyAnalysis.weeklyHeatmap.weekLabel2')}</span>, <span className="font-semibold text-[#8b5cf6]">{t('pages:monthlyAnalysis.weeklyHeatmap.weekLabel3')}</span>, <span className="font-semibold text-[#ec4899]">{t('pages:monthlyAnalysis.weeklyHeatmap.weekLabel4')}</span>
        </p>
        <p>
          • {t('pages:monthlyAnalysis.chartInfo.periodCompInfo3')}
        </p>
        <p>
          • {t('pages:monthlyAnalysis.chartInfo.periodCompInfo4')}
        </p>
        <p className="pt-1 font-medium">
          {t('pages:monthlyAnalysis.chartInfo.periodCompExPrefix')} <span className="text-[#ec4899]">{t('pages:monthlyAnalysis.chartInfo.periodCompExPink')}</span> {t('pages:monthlyAnalysis.chartInfo.periodCompExMid', { type: analysisType === 'lows' ? t('pages:monthlyAnalysis.chartInfo.analysisTypeLows') : t('pages:monthlyAnalysis.chartInfo.analysisTypeHighs') })} <span className="text-[#3b82f6]">{t('pages:monthlyAnalysis.chartInfo.periodCompExBlue')}</span> {t('pages:monthlyAnalysis.chartInfo.periodCompExSuffix', { type: analysisType === 'lows' ? t('pages:monthlyAnalysis.chartInfo.analysisTypeLows') : t('pages:monthlyAnalysis.chartInfo.analysisTypeHighs') })}
        </p>
      </div>
    </div>
  );
};
