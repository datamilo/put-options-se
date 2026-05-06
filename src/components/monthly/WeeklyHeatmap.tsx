import React, { useMemo } from 'react';
import { WeeklyDistribution } from './DayOfMonthAnalysis';
import { useTranslation } from 'react-i18next';

interface WeeklyHeatmapProps {
  data: WeeklyDistribution[];
  analysisType: 'lows' | 'highs';
  selectedMonths: number[];
}

export const WeeklyHeatmap: React.FC<WeeklyHeatmapProps> = ({
  data,
  analysisType,
  selectedMonths
}) => {
  const { t } = useTranslation(['pages', 'common']);
  const MONTH_NAMES = Array.from({ length: 12 }, (_, i) => t(`common:monthNamesShort.${i + 1}`));
  const WEEK_LABELS = [
    t('pages:monthlyAnalysis.weeklyHeatmap.weekLabel1'),
    t('pages:monthlyAnalysis.weeklyHeatmap.weekLabel2'),
    t('pages:monthlyAnalysis.weeklyHeatmap.weekLabel3'),
    t('pages:monthlyAnalysis.weeklyHeatmap.weekLabel4'),
  ];
  // Filter data by selected months
  const filteredData = useMemo(() => {
    if (selectedMonths.length === 0) return data;
    return data.filter(d => selectedMonths.includes(d.month));
  }, [data, selectedMonths]);

  // Calculate color thresholds based on all percentages
  const colorThresholds = useMemo(() => {
    const allPercentages: number[] = [];
    filteredData.forEach(d => {
      allPercentages.push(d.week1Pct, d.week2Pct, d.week3Pct, d.week4Pct);
    });

    if (allPercentages.length === 0) return null;

    const sorted = allPercentages.sort((a, b) => a - b);
    const getPercentile = (p: number) => {
      const index = Math.ceil(p * sorted.length / 100) - 1;
      return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
    };

    return {
      p20: getPercentile(20),
      p40: getPercentile(40),
      p60: getPercentile(60),
      p80: getPercentile(80)
    };
  }, [filteredData]);

  // Determine color class based on percentage value
  const getColorClass = (percentage: number) => {
    if (!colorThresholds) return 'bg-slate-100 dark:bg-slate-800';

    // Use gradient based on intensity - higher percentage = greener (more common)
    if (percentage <= colorThresholds.p20) return 'bg-gradient-to-br from-red-500 to-red-600';
    if (percentage <= colorThresholds.p40) return 'bg-gradient-to-br from-orange-400 to-orange-500';
    if (percentage <= colorThresholds.p60) return 'bg-gradient-to-br from-amber-400 to-amber-500';
    if (percentage <= colorThresholds.p80) return 'bg-gradient-to-br from-emerald-400 to-emerald-500';
    return 'bg-gradient-to-br from-emerald-500 to-emerald-600';
  };

  // Get opacity based on total count
  const getOpacity = (totalCount: number) => {
    if (totalCount < 5) return 'opacity-40';
    if (totalCount < 10) return 'opacity-70';
    return 'opacity-100';
  };

  // Format tooltip content
  const getTooltipContent = (monthName: string, weekLabel: string, percentage: number, count: number) => {
    return `${monthName} - ${weekLabel}\n${percentage.toFixed(1)}% of ${analysisType}\n${count} occurrences`;
  };

  if (filteredData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <p>{t('pages:monthlyAnalysis.weeklyHeatmap.noData')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Heatmap */}
      <div className="w-full overflow-x-auto bg-background rounded-lg border shadow-sm">
        <div className="min-w-[600px] p-6">
          {/* Header Row */}
          <div className="flex mb-3 pb-2 border-b border-border/50">
            <div className="w-24 flex-shrink-0 text-sm font-semibold text-foreground px-3 py-2">
              {t('pages:monthlyAnalysis.weeklyHeatmap.monthHeader')}
            </div>
            {WEEK_LABELS.map((label, index) => (
              <div
                key={index}
                className="flex-1 text-sm font-semibold text-center px-2 py-2 text-foreground"
              >
                {label}
              </div>
            ))}
          </div>

          {/* Month Rows */}
          <div className="space-y-2">
            {filteredData.map((monthData) => {
              const monthName = MONTH_NAMES[monthData.month - 1];
              const totalCount = monthData.week1Count + monthData.week2Count + monthData.week3Count + monthData.week4Count;

              const weeks = [
                { pct: monthData.week1Pct, count: monthData.week1Count, label: WEEK_LABELS[0] },
                { pct: monthData.week2Pct, count: monthData.week2Count, label: WEEK_LABELS[1] },
                { pct: monthData.week3Pct, count: monthData.week3Count, label: WEEK_LABELS[2] },
                { pct: monthData.week4Pct, count: monthData.week4Count, label: WEEK_LABELS[3] }
              ];

              return (
                <div key={monthData.month} className="flex items-center hover:bg-muted/5 rounded-lg transition-colors duration-200">
                  {/* Month Name */}
                  <div className="w-24 flex-shrink-0 text-sm font-medium px-3 py-2 text-foreground">
                    {monthName}
                  </div>

                  {/* Week Cells */}
                  {weeks.map((week, weekIndex) => (
                    <div
                      key={weekIndex}
                      className={`
                        flex-1 h-12 mx-1 rounded-md flex items-center justify-center
                        text-xs font-semibold text-white cursor-help transition-all duration-200
                        hover:scale-105 hover:shadow-lg hover:z-10 relative border border-white/20
                        ${getColorClass(week.pct)}
                        ${getOpacity(totalCount)}
                      `}
                      title={getTooltipContent(monthName, week.label, week.pct, week.count)}
                      onTouchStart={(e) => {
                        // Show tooltip on mobile touch
                        const title = getTooltipContent(monthName, week.label, week.pct, week.count);
                        const tooltip = document.createElement('div');
                        tooltip.className = 'fixed z-50 bg-black text-white text-xs p-2 rounded shadow-lg pointer-events-none whitespace-pre-line';
                        tooltip.textContent = title;
                        tooltip.style.top = `${e.touches[0].clientY - 60}px`;
                        tooltip.style.left = `${e.touches[0].clientX - 75}px`;
                        document.body.appendChild(tooltip);

                        setTimeout(() => {
                          document.body.removeChild(tooltip);
                        }, 2000);
                      }}
                    >
                      {week.pct.toFixed(1)}%
                      {totalCount < 5 && (
                        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/20 rounded-md pointer-events-none"></div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-4 p-6 bg-gradient-to-r from-muted/5 to-muted/10 rounded-xl border border-border/50">
        <div className="flex flex-wrap items-center gap-6">
          <span className="text-base font-semibold text-foreground">
            {t(`pages:monthlyAnalysis.weeklyHeatmap.intensityScale_${analysisType}`)}
          </span>

          {colorThresholds && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-gradient-to-br from-red-500 to-red-600 rounded-md shadow-sm"></div>
                <span className="text-sm font-medium">{t('pages:monthlyAnalysis.weeklyHeatmap.lowest20')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-gradient-to-br from-orange-400 to-orange-500 rounded-md shadow-sm"></div>
                <span className="text-sm font-medium">{t('pages:monthlyAnalysis.weeklyHeatmap.pct2040')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-gradient-to-br from-amber-400 to-amber-500 rounded-md shadow-sm"></div>
                <span className="text-sm font-medium">{t('pages:monthlyAnalysis.weeklyHeatmap.pct4060')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-md shadow-sm"></div>
                <span className="text-sm font-medium">{t('pages:monthlyAnalysis.weeklyHeatmap.pct6080')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-md shadow-sm"></div>
                <span className="text-sm font-medium">{t('pages:monthlyAnalysis.weeklyHeatmap.top20')}</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-6 text-sm text-muted-foreground pt-2 border-t border-border/30">
          <span className="font-medium">{t('pages:monthlyAnalysis.weeklyHeatmap.dataReliability')}</span>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-primary rounded-md opacity-40 shadow-sm"></div>
            <span>{t('pages:monthlyAnalysis.weeklyHeatmap.reliabilityLow')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-primary rounded-md opacity-70 shadow-sm"></div>
            <span>{t('pages:monthlyAnalysis.weeklyHeatmap.reliabilityMed')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-primary rounded-md shadow-sm"></div>
            <span>{t('pages:monthlyAnalysis.weeklyHeatmap.reliabilityHigh')}</span>
          </div>
        </div>
      </div>

      {/* Chart Information */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p>
          • Each cell shows what percentage of {analysisType} occurred in that week of that month
        </p>
        <p>
          • <span className="font-semibold text-green-600 dark:text-green-400">Green cells</span> = high frequency (this week is common for {analysisType})
        </p>
        <p>
          • <span className="font-semibold text-red-600 dark:text-red-400">Red cells</span> = low frequency (this week is rare for {analysisType})
        </p>
        <p>
          • Hover over cells for exact percentages and occurrence counts
        </p>
        <p className="pt-1 font-medium">
          Example insight: If December shows high green in "Days 22-31", it means December {analysisType} tend to occur late in the month
        </p>
      </div>
    </div>
  );
};
