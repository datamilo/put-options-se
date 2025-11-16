import React, { useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RecoveryScenario } from '@/types/probabilityRecovery';

interface RecoveryScenarioTableProps {
  scenarios: RecoveryScenario[];
  topN?: number;
  title?: string;
}

export const RecoveryScenarioTable: React.FC<RecoveryScenarioTableProps> = ({
  scenarios,
  topN = 5,
  title = 'Top Recovery Scenarios'
}) => {
  const topScenarios = useMemo(() => {
    return [...scenarios]
      .sort((a, b) => b.Advantage_pp - a.Advantage_pp)
      .slice(0, topN);
  }, [scenarios, topN]);

  const formatNumber = (value: number, decimals: number = 2) => {
    return value.toFixed(decimals);
  };

  const formatPercent = (value: number, decimals: number = 1) => {
    return `${(value * 100).toFixed(decimals)}%`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Method</TableHead>
                <TableHead>Threshold</TableHead>
                <TableHead>Prob Bin</TableHead>
                <TableHead>DTE</TableHead>
                <TableHead className="text-right">Advantage (pp)</TableHead>
                <TableHead className="text-right">Candidates</TableHead>
                <TableHead className="text-right">Worthless Rate</TableHead>
                <TableHead className="text-right">Avg Premium (pp)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topScenarios.map((scenario, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{scenario.ProbMethod}</TableCell>
                  <TableCell>{formatPercent(scenario.HistoricalPeakThreshold, 0)}</TableCell>
                  <TableCell>{scenario.CurrentProb_Bin}</TableCell>
                  <TableCell>{scenario.DTE_Bin}</TableCell>
                  <TableCell className="text-right font-semibold text-green-600 dark:text-green-400">
                    {formatNumber(scenario.Advantage_pp, 2)}
                  </TableCell>
                  <TableCell className="text-right">
                    {scenario.RecoveryCandidate_N.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatPercent(scenario.RecoveryCandidate_WorthlessRate)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatNumber(scenario.RecoveryCandidate_Premium_pp, 2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
