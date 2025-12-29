import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { DayOfMonthDistribution } from './DayOfMonthAnalysis';

interface DayDistributionHistogramProps {
  data: DayOfMonthDistribution[];
  analysisType: 'lows' | 'highs';
  medianDay: number;
  modeDay: number;
}

export const DayDistributionHistogram: React.FC<DayDistributionHistogramProps> = ({
  data,
  analysisType,
  medianDay,
  modeDay
}) => {
  const formatTooltip = (value: any, name: string) => {
    if (name === 'frequency') {
      return [`${value} occurrences`, 'Frequency'];
    }
    return [value, name];
  };

  const formatYAxis = (value: number) => value.toString();

  // Determine bar color based on analysis type
  const barColor = analysisType === 'lows' ? '#ef4444' : '#22c55e'; // Red for lows, green for highs
  const modeColor = analysisType === 'lows' ? '#dc2626' : '#16a34a'; // Darker shade for mode

  return (
    <div className="space-y-4">
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="day"
              className="fill-muted-foreground"
              tick={{ fontSize: 11 }}
              label={{
                value: 'Day of Month',
                position: 'insideBottom',
                offset: -10,
                style: { fontSize: '12px', fill: 'hsl(var(--muted-foreground))' }
              }}
            />
            <YAxis
              tickFormatter={formatYAxis}
              className="fill-muted-foreground"
              tick={{ fontSize: 11 }}
              label={{
                value: 'Frequency (Number of Occurrences)',
                angle: -90,
                position: 'insideLeft',
                style: { fontSize: '12px', fill: 'hsl(var(--muted-foreground))' }
              }}
            />
            <Tooltip
              formatter={formatTooltip}
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px'
              }}
              labelFormatter={(label) => `Day ${label}`}
            />

            {/* Reference line for median */}
            {medianDay > 0 && (
              <ReferenceLine
                x={medianDay}
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                strokeDasharray="5 5"
                label={{
                  value: `Median (Day ${medianDay})`,
                  position: 'top',
                  style: {
                    fontSize: '11px',
                    fill: 'hsl(var(--primary))',
                    fontWeight: 'bold'
                  }
                }}
              />
            )}

            <Bar dataKey="frequency" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.day === modeDay ? modeColor : barColor}
                  opacity={entry.day === modeDay ? 1 : 0.8}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Information */}
      <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t border-border/30">
        <p>
          • Each bar shows how many times stocks hit their monthly {analysisType === 'lows' ? 'low' : 'high'} on that specific day
        </p>
        <p>
          • <span className="font-semibold">Darker bar</span> indicates the most common day (mode) = Day {modeDay}
        </p>
        <p>
          • <span className="text-primary font-semibold">Dashed line</span> shows the median day = Day {medianDay} (50% occur before this day)
        </p>
        <p>
          • Hover over bars for exact frequency counts
        </p>
      </div>
    </div>
  );
};
