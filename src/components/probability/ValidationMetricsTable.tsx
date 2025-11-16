import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MethodPerformance } from '@/types/probabilityValidation';

interface ValidationMetricsTableProps {
  performance: MethodPerformance[];
}

export const ValidationMetricsTable: React.FC<ValidationMetricsTableProps> = ({ performance }) => {
  const formatNumber = (value: number, decimals: number = 4) => {
    return value.toFixed(decimals);
  };

  const getBestMethod = (key: keyof MethodPerformance, lowerIsBetter: boolean = true) => {
    if (performance.length === 0) return null;

    const sorted = [...performance].sort((a, b) => {
      const aVal = a[key] as number;
      const bVal = b[key] as number;
      return lowerIsBetter ? aVal - bVal : bVal - aVal;
    });

    return sorted[0].method;
  };

  const isBest = (method: string, key: keyof MethodPerformance, lowerIsBetter: boolean = true) => {
    return method === getBestMethod(key, lowerIsBetter);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Detailed Performance Metrics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-bold">Method</TableHead>
                <TableHead className="text-right">Brier Score</TableHead>
                <TableHead className="text-right">Log Loss</TableHead>
                <TableHead className="text-right">AUC-ROC</TableHead>
                <TableHead className="text-right">Calibration Error</TableHead>
                <TableHead className="text-right">N Predictions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {performance.map((p) => (
                <TableRow key={p.method}>
                  <TableCell className="font-medium">{p.method}</TableCell>
                  <TableCell className={`text-right ${isBest(p.method, 'brierScore', true) ? 'font-bold text-green-600 dark:text-green-400' : ''}`}>
                    {formatNumber(p.brierScore)}
                  </TableCell>
                  <TableCell className={`text-right ${isBest(p.method, 'logLoss', true) ? 'font-bold text-green-600 dark:text-green-400' : ''}`}>
                    {formatNumber(p.logLoss)}
                  </TableCell>
                  <TableCell className={`text-right ${isBest(p.method, 'aucRoc', false) ? 'font-bold text-green-600 dark:text-green-400' : ''}`}>
                    {formatNumber(p.aucRoc)}
                  </TableCell>
                  <TableCell className={`text-right ${isBest(p.method, 'calibrationError', true) ? 'font-bold text-green-600 dark:text-green-400' : ''}`}>
                    {formatNumber(p.calibrationError)}
                  </TableCell>
                  <TableCell className="text-right">{p.sampleSize.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="mt-4 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg">
          <h3 className="font-semibold text-green-800 dark:text-green-300 mb-2">
            Best Overall Method: {getBestMethod('calibrationError', true)}
          </h3>
          <p className="text-sm text-green-700 dark:text-green-400">
            This method has the lowest calibration error, indicating the best overall probability accuracy.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
