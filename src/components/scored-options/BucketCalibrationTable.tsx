import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CalibrationBucket } from '@/types/calibration';
import { formatNordicDecimal, formatNordicNumber } from '@/utils/numberFormatting';

interface BucketCalibrationTableProps {
  title: string;
  buckets: CalibrationBucket[];
  modelType: 'v21' | 'v3';
}

export const BucketCalibrationTable: React.FC<BucketCalibrationTableProps> = ({
  title,
  buckets,
  modelType,
}) => {
  // For V2.1, only show buckets where actual worthless % >= 50%
  const filteredBuckets = modelType === 'v21'
    ? buckets.filter(bucket => bucket.hitRate >= 0.50)
    : buckets;

  const getActualWorthlessColor = (hitRate: number): string => {
    if (hitRate >= 0.80) return 'text-green-700 dark:text-green-400';
    if (hitRate >= 0.70) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getRowBgColor = (hitRate: number): string => {
    if (hitRate >= 0.80) return 'bg-green-50 dark:bg-green-950';
    if (hitRate >= 0.70) return 'bg-amber-50 dark:bg-amber-950';
    return 'bg-red-50 dark:bg-red-950';
  };

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        {title}
      </h3>
      <div className="overflow-x-auto border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-left font-semibold">
                {modelType === 'v21' ? 'Score Range' : 'Predicted Range'}
              </TableHead>
              <TableHead className="text-center font-semibold">Actual Worthless %</TableHead>
              <TableHead className="text-center font-semibold">Sample Size</TableHead>
              <TableHead className="text-center font-semibold">95% CI</TableHead>
              <TableHead className="text-left font-semibold">Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBuckets.map((bucket, idx) => (
              <TableRow
                key={`${bucket.rangeLabel}-${idx}`}
                className={`hover:bg-opacity-75 ${getRowBgColor(bucket.hitRate)}`}
              >
                <TableCell className="font-medium text-gray-900 dark:text-gray-100">
                  {bucket.rangeLabel}
                </TableCell>
                <TableCell className={`text-center font-bold ${getActualWorthlessColor(bucket.hitRate)}`}>
                  {formatNordicDecimal(bucket.hitRate * 100, 1)}%
                </TableCell>
                <TableCell className="text-center text-gray-700 dark:text-gray-300">
                  {formatNordicNumber(bucket.sampleSize)}
                </TableCell>
                <TableCell className="text-center text-sm text-gray-700 dark:text-gray-300">
                  [{formatNordicDecimal(bucket.confidenceIntervalLower * 100, 1)}% –{' '}
                  {formatNordicDecimal(bucket.confidenceIntervalUpper * 100, 1)}%]
                </TableCell>
                <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                  {bucket.isPremiumZone && (
                    <span className="inline-block bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 px-2 py-1 rounded text-xs font-semibold mr-2">
                      ✓ OPTIMAL
                    </span>
                  )}
                  {bucket.expectedNote}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
