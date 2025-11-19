/**
 * Lower Bound Expiry Statistics Table Component
 * Displays per-expiry aggregated statistics
 */

import React, { useMemo, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { LowerBoundExpiryStatistic } from '@/types/lowerBound';

type SortField = keyof LowerBoundExpiryStatistic | 'hitRate';
type SortDirection = 'asc' | 'desc';

interface LowerBoundExpiryTableProps {
  data: LowerBoundExpiryStatistic[];
  stock: string;
  isLoading?: boolean;
}

export const LowerBoundExpiryTable: React.FC<LowerBoundExpiryTableProps> = ({
  data,
  stock,
  isLoading = false,
}) => {
  const [sortField, setSortField] = useState<SortField>('ExpiryDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Filter data for selected stock and sort
  const tableData = useMemo(() => {
    const filtered = data.filter((d) => d.Stock === stock);

    return filtered.sort((a, b) => {
      let aVal: any;
      let bVal: any;

      if (sortField === 'hitRate') {
        const aHit = a.PredictionCount - a.BreachCount;
        const bHit = b.PredictionCount - b.BreachCount;
        aVal = (aHit / a.PredictionCount) * 100 || 0;
        bVal = (bHit / b.PredictionCount) * 100 || 0;
      } else {
        aVal = a[sortField];
        bVal = b[sortField];
      }

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = (bVal as string).toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, stock, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 text-slate-400" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-4 h-4 text-primary" />
    ) : (
      <ArrowDown className="w-4 h-4 text-primary" />
    );
  };

  const getHitRate = (stat: LowerBoundExpiryStatistic) => {
    if (stat.PredictionCount === 0) return 0;
    return ((stat.PredictionCount - stat.BreachCount) / stat.PredictionCount) * 100;
  };

  const getHitRateColor = (hitRate: number) => {
    if (hitRate >= 85) return 'bg-green-50 text-green-900';
    if (hitRate >= 75) return 'bg-blue-50 text-blue-900';
    if (hitRate >= 65) return 'bg-yellow-50 text-yellow-900';
    return 'bg-red-50 text-red-900';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 bg-slate-50 rounded-lg">
        <p className="text-slate-500">Loading table data...</p>
      </div>
    );
  }

  if (tableData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-slate-50 rounded-lg">
        <p className="text-slate-500">No expiry data available for this stock</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-slate-200">
      <Table>
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead className="cursor-pointer hover:bg-slate-100">
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 h-8"
                onClick={() => handleSort('ExpiryDate')}
              >
                Expiry Date
                <SortIcon field="ExpiryDate" />
              </Button>
            </TableHead>
            <TableHead className="text-right cursor-pointer hover:bg-slate-100">
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 h-8 ml-auto"
                onClick={() => handleSort('PredictionCount')}
              >
                Predictions
                <SortIcon field="PredictionCount" />
              </Button>
            </TableHead>
            <TableHead className="text-right cursor-pointer hover:bg-slate-100">
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 h-8 ml-auto"
                onClick={() => handleSort('BreachCount')}
              >
                Breaches
                <SortIcon field="BreachCount" />
              </Button>
            </TableHead>
            <TableHead className="text-right cursor-pointer hover:bg-slate-100">
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 h-8 ml-auto"
                onClick={() => handleSort('hitRate')}
              >
                Hit Rate %
                <SortIcon field="hitRate" />
              </Button>
            </TableHead>
            <TableHead className="text-right cursor-pointer hover:bg-slate-100">
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 h-8 ml-auto"
                onClick={() => handleSort('LowerBound_Min')}
              >
                Min Bound
                <SortIcon field="LowerBound_Min" />
              </Button>
            </TableHead>
            <TableHead className="text-right cursor-pointer hover:bg-slate-100">
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 h-8 ml-auto"
                onClick={() => handleSort('LowerBound_Max')}
              >
                Max Bound
                <SortIcon field="LowerBound_Max" />
              </Button>
            </TableHead>
            <TableHead className="text-right cursor-pointer hover:bg-slate-100">
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 h-8 ml-auto"
                onClick={() => handleSort('LowerBound_Median')}
              >
                Median
                <SortIcon field="LowerBound_Median" />
              </Button>
            </TableHead>
            <TableHead className="text-right cursor-pointer hover:bg-slate-100">
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 h-8 ml-auto"
                onClick={() => handleSort('ExpiryClosePrice')}
              >
                Close Price
                <SortIcon field="ExpiryClosePrice" />
              </Button>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tableData.map((stat, index) => {
            const hitRate = getHitRate(stat);
            const hitRateColor = getHitRateColor(hitRate);

            return (
              <TableRow
                key={`${stat.Stock}-${stat.ExpiryDate}-${index}`}
                className="hover:bg-slate-50 transition-colors"
              >
                <TableCell className="font-mono text-sm">
                  {stat.ExpiryDate}
                </TableCell>
                <TableCell className="text-right text-sm">
                  {stat.PredictionCount}
                </TableCell>
                <TableCell className="text-right text-sm text-red-600 font-medium">
                  {stat.BreachCount}
                </TableCell>
                <TableCell className="text-right text-sm">
                  <span className={`px-3 py-1 rounded-full font-semibold ${hitRateColor}`}>
                    {hitRate.toFixed(1)}%
                  </span>
                </TableCell>
                <TableCell className="text-right text-sm font-mono">
                  {stat.LowerBound_Min.toFixed(2)}
                </TableCell>
                <TableCell className="text-right text-sm font-mono">
                  {stat.LowerBound_Max.toFixed(2)}
                </TableCell>
                <TableCell className="text-right text-sm font-mono">
                  {stat.LowerBound_Median.toFixed(2)}
                </TableCell>
                <TableCell className="text-right text-sm font-mono font-bold">
                  {stat.ExpiryClosePrice ? stat.ExpiryClosePrice.toFixed(2) : 'N/A'}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 text-sm text-slate-600">
        <p>
          Showing {tableData.length} expir{tableData.length === 1 ? 'y' : 'ies'} | Total
          predictions: {tableData.reduce((sum, s) => sum + s.PredictionCount, 0)} | Total
          breaches:{' '}
          {tableData.reduce((sum, s) => sum + s.BreachCount, 0)}
        </p>
      </div>
    </div>
  );
};
