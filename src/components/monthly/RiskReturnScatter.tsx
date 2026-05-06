import React from 'react';
import { MonthlyStockStats } from '@/hooks/useMonthlyStockData';
import { Scatter, ScatterChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { useTranslation } from 'react-i18next';

interface RiskReturnScatterProps {
  data: MonthlyStockStats[];
}

export const RiskReturnScatter: React.FC<RiskReturnScatterProps> = ({ data }) => {
  const { t } = useTranslation('pages');
  const scatterData = data
    .filter(d => d.number_of_months_available >= 3)
    .slice(0, 50) // Limit to avoid overcrowding
    .map(d => ({
      x: d.return_month_mean_pct_return_month,
      y: Math.abs(d.open_to_low_mean_pct_return_month), // Use absolute value for better visualization
      z: d.number_of_months_available,
      name: d.name,
      score: d.top_5_accumulated_score,
      posMonths: d.pct_pos_return_months
    }));

  const getPointColor = (score: number) => {
    if (score >= 10) return '#10b981'; // Green for high scores
    if (score >= 5) return '#3b82f6';  // Blue for medium scores
    if (score >= 2) return '#f59e0b';  // Orange for low scores
    return '#ef4444'; // Red for very low scores
  };

  const getPointSize = (months: number) => {
    // Scale bubble size based on data history
    const minSize = 20;
    const maxSize = 100;
    const normalized = Math.min(months / 24, 1); // Normalize to 24 months max
    return minSize + (maxSize - minSize) * normalized;
  };

  if (scatterData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        {t('monthlyAnalysis.riskReturn.noData')}
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart
          data={scatterData}
          margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
        >
          <XAxis 
            type="number" 
            dataKey="x" 
            name="Avg Return"
            unit="%"
            domain={['dataMin - 1', 'dataMax + 1']}
          />
          <YAxis 
            type="number" 
            dataKey="y" 
            name="Avg Drawdown"
            unit="%"
            domain={[0, 'dataMax + 1']}
          />
          <Tooltip 
            cursor={{ strokeDasharray: '3 3' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-background border rounded-lg p-3 shadow-lg">
                    <p className="font-medium">{data.name}</p>
                    <p className="text-primary">
                      {t('monthlyAnalysis.riskReturn.tooltipAvgReturn')} {data.x.toFixed(2)}%
                    </p>
                    <p className="text-orange-500">
                      {t('monthlyAnalysis.riskReturn.tooltipAvgDrawdown')} {data.y.toFixed(2)}%
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {t('monthlyAnalysis.riskReturn.tooltipHistory', { months: data.z })}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {t('monthlyAnalysis.riskReturn.tooltipScore')} {data.score}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {t('monthlyAnalysis.riskReturn.tooltipPosMonths')} {data.posMonths.toFixed(1)}%
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Scatter dataKey="y" fill="#8884d8">
            {scatterData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={getPointColor(entry.score)}
                r={Math.sqrt(getPointSize(entry.z)) / 3} // Adjust size scaling
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span>{t('monthlyAnalysis.riskReturn.legendHigh')}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span>{t('monthlyAnalysis.riskReturn.legendMedium')}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
          <span>{t('monthlyAnalysis.riskReturn.legendLow')}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <span>{t('monthlyAnalysis.riskReturn.legendVeryLow')}</span>
        </div>
        <span className="text-muted-foreground">• {t('monthlyAnalysis.riskReturn.bubbleSizeNote')}</span>
      </div>
    </div>
  );
};