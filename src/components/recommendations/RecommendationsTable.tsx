import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { ChevronDown, ChevronUp, ArrowUp, ArrowDown } from 'lucide-react';
import { ScoreBreakdownComponent } from './ScoreBreakdown';
import { OptionExplanation } from './OptionExplanation';
import type { RecommendedOption, RecommendationFilters } from '@/types/recommendations';

interface RecommendationsTableProps {
  recommendations: RecommendedOption[];
  getFullPath: (path: string) => string;
  filters: RecommendationFilters;
}

export const RecommendationsTable: React.FC<RecommendationsTableProps> = ({
  recommendations,
  getFullPath,
  filters,
}) => {
  type SortField = keyof RecommendedOption;
  type SortDirection = 'asc' | 'desc';

  const [sortField, setSortField] = useState<SortField>('compositeScore');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedRecommendations = useMemo(() => {
    return [...recommendations].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      if (aValue === null) aValue = -Infinity;
      if (bValue === null) bValue = -Infinity;

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();
      return sortDirection === 'asc'
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr);
    });
  }, [recommendations, sortField, sortDirection]);

  const SortableHeader = ({
    field,
    label,
    align = 'left',
  }: {
    field: SortField;
    label: string;
    align?: 'left' | 'right' | 'center';
  }) => (
    <TableHead
      className={`cursor-pointer hover:bg-muted/50 ${
        align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : ''
      }`}
      onClick={() => handleSort(field)}
    >
      <div className={`flex items-center gap-1 ${align === 'right' ? 'justify-end' : ''}`}>
        <span>{label}</span>
        {sortField === field &&
          (sortDirection === 'asc' ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          ))}
      </div>
    </TableHead>
  );

  const getScoreColor = (score: number): string => {
    if (score >= 70) return 'text-green-600 dark:text-green-400';
    if (score >= 50) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="space-y-4">
      <ScrollArea className="w-full">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Details</TableHead>
              <SortableHeader field="rank" label="Rank" align="center" />
              <SortableHeader field="stockName" label="Stock" />
              <SortableHeader field="optionName" label="Option" />
              <SortableHeader field="strikePrice" label="Strike" align="right" />
              <SortableHeader field="currentPrice" label="Current" align="right" />
              <SortableHeader field="rollingLow" label="Support" align="right" />
              <SortableHeader field="distanceToSupportPct" label="Distance %" align="right" />
              <SortableHeader field="daysSinceLastBreak" label="Days Since" align="right" />
              <SortableHeader field="currentProbability" label="Current PoW" align="right" />
              <SortableHeader field="historicalPeakProbability" label="Peak PoW" align="right" />
              <SortableHeader field="recoveryAdvantage" label="Recovery Rate %" align="right" />
              <SortableHeader field="monthlyPositiveRate" label="Monthly %" align="right" />
              <SortableHeader field="currentMonthPerformance" label="Curr Month" align="right" />
              <SortableHeader field="supportStrengthScore" label="Strength" align="right" />
              <SortableHeader field="premium" label="Premium" align="right" />
              <SortableHeader field="compositeScore" label="Score" align="right" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedRecommendations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={17} className="text-center text-muted-foreground py-8">
                  No recommendations found. Try adjusting your filters or click Analyze.
                </TableCell>
              </TableRow>
            ) : (
              sortedRecommendations.map((rec, idx) => (
                <React.Fragment key={rec.optionName}>
                  <TableRow className="hover:bg-muted/50">
                    <TableCell>
                      <button
                        onClick={() => setExpandedRow(expandedRow === idx ? null : idx)}
                        className="p-1 hover:bg-muted rounded"
                      >
                        {expandedRow === idx ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                    </TableCell>
                    <TableCell className="text-center font-semibold">{rec.rank}</TableCell>
                    <TableCell>
                      <button
                        onClick={() =>
                          window.open(
                            getFullPath(`/stock/${encodeURIComponent(rec.stockName)}`),
                            '_blank'
                          )
                        }
                        className="text-primary hover:underline cursor-pointer"
                      >
                        {rec.stockName}
                      </button>
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() =>
                          window.open(
                            getFullPath(`/option/${encodeURIComponent(rec.optionName)}`),
                            '_blank'
                          )
                        }
                        className="text-primary hover:underline cursor-pointer"
                      >
                        {rec.optionName}
                      </button>
                    </TableCell>
                    <TableCell className="text-right">
                      {rec.strikePrice.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      {rec.currentPrice.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      {rec.rollingLow !== null ? rec.rollingLow.toFixed(2) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {rec.distanceToSupportPct !== null
                        ? `${rec.distanceToSupportPct.toFixed(1)}%`
                        : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {rec.daysSinceLastBreak !== null ? rec.daysSinceLastBreak : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      {(rec.currentProbability * 100).toFixed(1)}%
                    </TableCell>
                    <TableCell className="text-right">
                      {rec.historicalPeakProbability !== null
                        ? `${(rec.historicalPeakProbability * 100).toFixed(1)}%`
                        : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {rec.recoveryAdvantage !== null
                        ? `${(rec.recoveryAdvantage * 100).toFixed(1)}%`
                        : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {rec.monthlyPositiveRate !== null
                        ? `${rec.monthlyPositiveRate.toFixed(1)}%`
                        : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {rec.currentMonthPerformance !== null
                        ? `${rec.currentMonthPerformance >= 0 ? '+' : ''}${rec.currentMonthPerformance.toFixed(2)}%`
                        : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {rec.supportStrengthScore !== null
                        ? rec.supportStrengthScore.toFixed(0)
                        : '-'}
                    </TableCell>
                    <TableCell className="text-right text-green-600 dark:text-green-400 font-semibold">
                      {rec.premium.toLocaleString()}
                    </TableCell>
                    <TableCell className={`text-right font-bold text-lg ${getScoreColor(rec.compositeScore)}`}>
                      {rec.compositeScore.toFixed(1)}
                    </TableCell>
                  </TableRow>
                  {expandedRow === idx && (
                    <TableRow>
                      <TableCell colSpan={17} className="bg-muted/30">
                        <div className="p-4 space-y-4">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <ScoreBreakdownComponent
                              breakdown={rec.scoreBreakdown}
                              compositeScore={rec.compositeScore}
                            />
                            <OptionExplanation
                              option={rec}
                              filters={{
                                rollingPeriod: filters.rollingPeriod,
                                minDaysSinceBreak: filters.minDaysSinceBreak,
                                probabilityMethod: filters.probabilityMethod,
                                historicalPeakThreshold: filters.historicalPeakThreshold,
                              }}
                            />
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))
            )}
          </TableBody>
        </Table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};
