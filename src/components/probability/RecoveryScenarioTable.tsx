import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
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
  title
}) => {
  const { t } = useTranslation('pages');
  const resolvedTitle = title ?? t('probabilityAnalysis.scenarioTable.defaultTitle');
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
        <CardTitle>{resolvedTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('probabilityAnalysis.scenarioTable.colMethod')}</TableHead>
                <TableHead>{t('probabilityAnalysis.scenarioTable.colThreshold')}</TableHead>
                <TableHead>{t('probabilityAnalysis.scenarioTable.colProbBin')}</TableHead>
                <TableHead>{t('probabilityAnalysis.scenarioTable.colDTE')}</TableHead>
                <TableHead className="text-right">{t('probabilityAnalysis.scenarioTable.colAdvantage')}</TableHead>
                <TableHead className="text-right">{t('probabilityAnalysis.scenarioTable.colCandidates')}</TableHead>
                <TableHead className="text-right">{t('probabilityAnalysis.scenarioTable.colWorthlessRate')}</TableHead>
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
                    {formatNumber(scenario.RecoveryAdvantage_pp, 2)}
                  </TableCell>
                  <TableCell className="text-right">
                    {scenario.RecoveryCandidate_N.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatPercent(scenario.RecoveryCandidate_WorthlessRate_pct / 100)}
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
