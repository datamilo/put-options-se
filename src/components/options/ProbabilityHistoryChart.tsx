import { useState } from "react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Activity } from "lucide-react";
import { useProbabilityHistory } from "@/hooks/useProbabilityHistory";

interface ProbabilityHistoryChartProps {
  optionName: string;
}

const PROBABILITY_LINES = [
  {
    key: '1_2_3_ProbOfWorthless_Weighted',
    name: 'Weighted Average',
    color: '#2563eb'
  },
  {
    key: 'ProbWorthless_Bayesian_IsoCal',
    name: 'Bayesian IsoCal',
    color: '#dc2626'
  },
  {
    key: '1_ProbOfWorthless_Original',
    name: 'Original',
    color: '#16a34a'
  },
  {
    key: '2_ProbOfWorthless_Calibrated',
    name: 'Calibrated',
    color: '#ca8a04'
  },
  {
    key: '3_ProbOfWorthless_Historical_IV',
    name: 'Historical IV',
    color: '#9333ea'
  }
];

export const ProbabilityHistoryChart = ({ optionName }: ProbabilityHistoryChartProps) => {
  const { optionData, isLoading, error } = useProbabilityHistory(optionName);
  const [visibleLines, setVisibleLines] = useState<Set<string>>(
    new Set(PROBABILITY_LINES.map(line => line.key))
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Probability History Chart</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 flex items-center justify-center">
            Loading probability history...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Probability History Chart</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 flex items-center justify-center text-muted-foreground">
            Error loading probability history: {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (optionData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Probability History Chart</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 flex items-center justify-center text-muted-foreground">
            No probability history data available for this option
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate dynamic Y-axis domain based on data
  const getYAxisDomain = () => {
    const visibleData = optionData.flatMap(item => 
      PROBABILITY_LINES
        .filter(line => visibleLines.has(line.key))
        .map(line => item[line.key as keyof typeof item])
        .filter(value => value !== null && value !== undefined) as number[]
    );
    
    if (visibleData.length === 0) return [0, 1];
    
    const min = Math.min(...visibleData);
    const max = Math.max(...visibleData);
    const padding = (max - min) * 0.1;
    
    const yMin = Math.max(0, min - padding);
    const yMax = Math.min(1, max + padding);
    
    return [yMin, yMax];
  };

  const formatTooltipValue = (value: number | null, name: string) => {
    if (value === null || value === undefined) return ['N/A', name];
    return [`${(value * 100).toFixed(2)}%`, name];
  };

  const formatYAxisLabel = (value: number) => {
    return `${(value * 100).toFixed(0)}%`;
  };

  const formatXAxisLabel = (tickItem: string) => {
    const date = new Date(tickItem);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: '2-digit'
    });
  };

  const toggleLineVisibility = (lineKey: string) => {
    const newVisibleLines = new Set(visibleLines);
    if (newVisibleLines.has(lineKey)) {
      newVisibleLines.delete(lineKey);
    } else {
      newVisibleLines.add(lineKey);
    }
    setVisibleLines(newVisibleLines);
  };

  return (
    <Card>
      <CardHeader className="space-y-4">
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Probability of Worthless History
        </CardTitle>
        

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Select probability types to display:</p>
          <div className="flex flex-wrap gap-4">
            {PROBABILITY_LINES.map(line => (
              <div key={line.key} className="flex items-center space-x-2">
                <Checkbox
                  id={line.key}
                  checked={visibleLines.has(line.key)}
                  onCheckedChange={() => toggleLineVisibility(line.key)}
                />
                <label
                  htmlFor={line.key}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  <span 
                    className="inline-block w-3 h-3 mr-2 rounded-full" 
                    style={{ backgroundColor: line.color }}
                  />
                  {line.name}
                </label>
              </div>
            ))}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={optionData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="Update_date" 
                tickFormatter={formatXAxisLabel}
                className="text-muted-foreground"
              />
              <YAxis 
                className="text-muted-foreground" 
                domain={getYAxisDomain()}
                tickFormatter={formatYAxisLabel}
              />
              <Tooltip 
                formatter={formatTooltipValue}
                labelFormatter={(label) => new Date(label).toLocaleDateString()}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius)'
                }}
              />
              <Legend />
              {PROBABILITY_LINES.map(line => (
                visibleLines.has(line.key) && (
                  <Line
                    key={line.key}
                    dataKey={line.key}
                    stroke={line.color}
                    strokeWidth={2}
                    dot={false}
                    name={line.name}
                    connectNulls={false}
                  />
                )
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};