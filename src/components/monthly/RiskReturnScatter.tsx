import React from 'react';
import { MonthlyStockStats } from '@/hooks/useMonthlyStockData';
import { Scatter, ScatterChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from 'recharts';

interface RiskReturnScatterProps {
  data: MonthlyStockStats[];
}

export const RiskReturnScatter: React.FC<RiskReturnScatterProps> = ({ data }) => {
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
        No data available for scatter plot
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
                      Avg Return: {data.x.toFixed(2)}%
                    </p>
                    <p className="text-orange-500">
                      Avg Drawdown: {data.y.toFixed(2)}%
                    </p>
                    <p className="text-muted-foreground text-sm">
                      History: {data.z} months
                    </p>
                    <p className="text-muted-foreground text-sm">
                      Score: {data.score}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      Positive Months: {data.posMonths.toFixed(1)}%
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
          <span>High Score (10+)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span>Medium Score (5-9)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
          <span>Low Score (2-4)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <span>Very Low (0-1)</span>
        </div>
        <span className="text-muted-foreground">• Bubble size = History depth</span>
      </div>
    </div>
  );
};