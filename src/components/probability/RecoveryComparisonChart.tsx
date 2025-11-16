import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { RecoveryScenario } from '@/types/probabilityRecovery';

interface RecoveryComparisonChartProps {
  scenarios: RecoveryScenario[];
}

export const RecoveryComparisonChart: React.FC<RecoveryComparisonChartProps> = ({ scenarios }) => {
  // Get available options first
  const thresholds = useMemo(() =>
    Array.from(new Set(scenarios.map(s => s.HistoricalPeakThreshold.toString()))).sort(),
    [scenarios]
  );

  const methods = useMemo(() =>
    Array.from(new Set(scenarios.map(s => s.ProbMethod))).sort(),
    [scenarios]
  );

  const probBins = useMemo(() =>
    Array.from(new Set(scenarios.map(s => s.CurrentProb_Bin))).sort(),
    [scenarios]
  );

  // Initialize with first available values, or defaults if no data
  const defaultThreshold = thresholds.length > 0 ? thresholds[0] : '0.8';
  const defaultMethod = methods.length > 0 ? methods[0] : 'Weighted Average';
  const defaultProbBin = probBins.length > 0 ? probBins[0] : '80-90%';

  const [threshold, setThreshold] = React.useState(defaultThreshold);
  const [method, setMethod] = React.useState(defaultMethod);
  const [probBin, setProbBin] = React.useState(defaultProbBin);

  // Update selections if they're not in available options
  React.useEffect(() => {
    if (thresholds.length > 0 && !thresholds.includes(threshold)) {
      setThreshold(thresholds[0]);
    }
  }, [thresholds, threshold]);

  React.useEffect(() => {
    if (methods.length > 0 && !methods.includes(method)) {
      setMethod(methods[0]);
    }
  }, [methods, method]);

  React.useEffect(() => {
    if (probBins.length > 0 && !probBins.includes(probBin)) {
      setProbBin(probBins[0]);
    }
  }, [probBins, probBin]);

  // Filter and prepare data - exclude rows with empty Advantage_pp (Baseline_N = 0)
  const chartData = useMemo(() => {
    const filtered = scenarios.filter(s =>
      s.HistoricalPeakThreshold.toString() === threshold &&
      s.ProbMethod === method &&
      s.CurrentProb_Bin === probBin &&
      s.Baseline_N > 0 && // Only include rows with baseline comparison
      s.Advantage_pp !== null && s.Advantage_pp !== undefined && s.Advantage_pp !== 0
    );

    const mapped = filtered
      .map(s => ({
        dteBin: s.DTE_Bin,
        advantage: s.Advantage_pp,
        recoveryCandidates: s.RecoveryCandidate_N,
        worthlessRate: s.RecoveryCandidate_WorthlessRate * 100,
        baseline: s.Baseline_N
      }))
      .sort((a, b) => {
        // Sort by DTE bins
        const order = ['0-7', '8-14', '15-21', '22-28', '29-35', '36+'];
        return order.indexOf(a.dteBin) - order.indexOf(b.dteBin);
      });

    return mapped;
  }, [scenarios, threshold, method, probBin]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;
    return (
      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
        <p className="font-semibold mb-2">DTE: {data.dteBin} days</p>
        <p className="text-sm text-green-600 dark:text-green-400">
          Advantage: {data.advantage.toFixed(2)} pp
        </p>
        <p className="text-sm opacity-70">
          Recovery Candidates: {data.recoveryCandidates.toLocaleString()}
        </p>
        <p className="text-sm opacity-70">
          Worthless Rate: {data.worthlessRate.toFixed(1)}%
        </p>
        <p className="text-sm opacity-70">
          Baseline: {data.baseline.toLocaleString()}
        </p>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recovery Advantage Analysis</CardTitle>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div>
            <Label>Historical Peak Threshold</Label>
            <Select value={threshold} onValueChange={setThreshold}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {thresholds.map(t => (
                  <SelectItem key={t} value={t}>
                    {(parseFloat(t) * 100).toFixed(0)}%
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Probability Method</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {methods.map(m => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Current Probability Bin</Label>
            <Select value={probBin} onValueChange={setProbBin}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {probBins.map(pb => (
                  <SelectItem key={pb} value={pb}>
                    {pb}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="dteBin"
              label={{ value: 'Days to Expiry', position: 'insideBottom', offset: -5 }}
              className="text-sm"
            />
            <YAxis
              label={{ value: 'Advantage (percentage points)', angle: -90, position: 'insideLeft' }}
              className="text-sm"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="advantage" fill="hsl(var(--primary))" name="Advantage (pp)" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.advantage > 0 ? 'hsl(142, 76%, 36%)' : 'hsl(0, 72%, 51%)'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
