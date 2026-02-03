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
import { ScoredOptionData, ScoredOptionsFilters } from '@/types/scoredOptions';
import { V21Breakdown } from './V21Breakdown';
import { TABreakdown } from './TABreakdown';
import { AgreementAnalysis } from './AgreementAnalysis';
import { formatNordicNumber, formatNordicDecimal, formatNordicCurrency } from '@/utils/numberFormatting';
import { InfoIconTooltip } from '@/components/ui/info-icon-tooltip';
import scoredOptionsTooltips from '@/utils/scoredOptionsTooltips';

interface ScoredOptionsTableProps {
  data: ScoredOptionData[];
  filters: ScoredOptionsFilters;
  getFullPath: (path: string) => string;
}

export const ScoredOptionsTable: React.FC<ScoredOptionsTableProps> = ({
  data,
  filters,
  getFullPath,
}) => {
  type SortField = keyof ScoredOptionData | 'expanded';
  type SortDirection = 'asc' | 'desc';

  const [sortField, setSortField] = useState<SortField>('combined_score');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  // Filter data
  const filteredData = useMemo(() => {
    return data.filter((option) => {
      // Expiry date filter
      if (filters.expiryDate && option.expiry_date !== filters.expiryDate) {
        return false;
      }

      // Stock filter
      if (filters.stockNames.length > 0 && !filters.stockNames.includes(option.stock_name)) {
        return false;
      }

      // Agreement filter
      if (filters.agreement === 'agree' && !option.models_agree) {
        return false;
      }
      if (filters.agreement === 'disagree' && option.models_agree) {
        return false;
      }

      // Min combined score filter - only exclude null values if minimum > 0
      if (option.combined_score == null) {
        if (filters.minScore > 0) {
          return false;
        }
      } else if (option.combined_score < filters.minScore) {
        return false;
      }

      // Min Probability Optimization score filter - only exclude null values if minimum > 0
      if (option.v21_score == null) {
        if (filters.minV21Score > 0) {
          return false;
        }
      } else if (option.v21_score < filters.minV21Score) {
        return false;
      }

      // Min TA probability filter - only exclude null values if minimum > 0 (convert to 0-100 scale)
      if (option.ta_probability == null) {
        if (filters.minTAProb > 0) {
          return false;
        }
      } else if (option.ta_probability * 100 < filters.minTAProb) {
        return false;
      }

      return true;
    });
  }, [data, filters]);

  // Sort data
  const sortedData = useMemo(() => {
    if (sortField === 'expanded') return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortField as keyof ScoredOptionData];
      const bValue = b[sortField as keyof ScoredOptionData];

      // Handle null/undefined values - always put them at the bottom
      const aIsNull = aValue == null;
      const bIsNull = bValue == null;

      if (aIsNull && bIsNull) return 0;
      if (aIsNull) return 1; // a goes to bottom
      if (bIsNull) return -1; // b goes to bottom

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return 0;
    });
  }, [filteredData, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const SortableHeader = ({
    field,
    label,
    align = 'left',
    tooltipTitle,
    tooltipContent,
  }: {
    field: SortField;
    label: string;
    align?: 'left' | 'right' | 'center';
    tooltipTitle?: string;
    tooltipContent?: string;
  }) => (
    <TableHead
      className={`cursor-pointer hover:bg-muted/50 ${
        align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : ''
      }`}
      onClick={() => handleSort(field)}
    >
      <div className={`flex items-center gap-1.5 ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : ''}`}>
        <span>{label}</span>
        {sortField === field &&
          (sortDirection === 'asc' ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          ))}
        {tooltipContent && (
          <InfoIconTooltip
            title={tooltipTitle}
            content={tooltipContent}
            side="bottom"
          />
        )}
      </div>
    </TableHead>
  );

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 70) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBgColor = (score: number): string => {
    if (score >= 80) return 'bg-green-50';
    if (score >= 70) return 'bg-amber-50';
    return 'bg-red-50';
  };

  const getAgreementIcon = (agree: boolean): string => {
    return agree ? '✓' : '✕';
  };

  const getAgreementColor = (agree: boolean): string => {
    return agree ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="space-y-4">
      <ScrollArea className="w-full border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Details</TableHead>
              <SortableHeader field="stock_name" label="Stock" />
              <SortableHeader field="option_name" label="Option" />
              <SortableHeader field="strike_price" label="Strike" align="right" />
              <SortableHeader field="expiry_date" label="Expiry" />
              <SortableHeader field="days_to_expiry" label="DTE" align="right" />
              <SortableHeader field="premium" label="Premium" align="right" />
              <SortableHeader
                field="v21_score"
                label="Probability Score"
                align="right"
                tooltipTitle={scoredOptionsTooltips.columns.v21Score.title}
                tooltipContent={scoredOptionsTooltips.columns.v21Score.content}
              />
              <SortableHeader
                field="ta_probability"
                label="TA Prob"
                align="right"
                tooltipTitle={scoredOptionsTooltips.columns.taProbability.title}
                tooltipContent={scoredOptionsTooltips.columns.taProbability.content}
              />
              <SortableHeader
                field="combined_score"
                label="Combined"
                align="right"
                tooltipTitle={scoredOptionsTooltips.columns.combined.title}
                tooltipContent={scoredOptionsTooltips.columns.combined.content}
              />
              <SortableHeader
                field="models_agree"
                label="Agree"
                align="center"
                tooltipTitle={scoredOptionsTooltips.columns.agree.title}
                tooltipContent={scoredOptionsTooltips.columns.agree.content}
              />
              <SortableHeader
                field="agreement_strength"
                label="Strength"
                tooltipTitle={scoredOptionsTooltips.columns.strength.title}
                tooltipContent={scoredOptionsTooltips.columns.strength.content}
              />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={12} className="text-center text-muted-foreground py-8">
                  No options found matching your filters.
                </TableCell>
              </TableRow>
            ) : (
              sortedData.map((option, idx) => (
                <React.Fragment key={`${option.option_name}-${idx}`}>
                  <TableRow className="hover:bg-muted/50">
                    <TableCell>
                      <button
                        onClick={() => setExpandedRow(expandedRow === idx ? null : idx)}
                        className="p-1 hover:bg-muted rounded text-gray-600 dark:text-gray-400"
                      >
                        {expandedRow === idx ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() =>
                          window.open(
                            getFullPath(`/stock/${encodeURIComponent(option.stock_name)}`),
                            '_blank'
                          )
                        }
                        className="text-primary hover:underline cursor-pointer font-medium"
                      >
                        {option.stock_name}
                      </button>
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() =>
                          window.open(
                            getFullPath(`/option/${encodeURIComponent(option.option_name)}`),
                            '_blank'
                          )
                        }
                        className="text-primary hover:underline cursor-pointer font-medium"
                      >
                        {option.option_name}
                      </button>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNordicNumber(option.strike_price, 0)}
                    </TableCell>
                    <TableCell>
                      {new Date(option.expiry_date).toLocaleDateString('sv-SE')}
                    </TableCell>
                    <TableCell className="text-right">
                      {option.days_to_expiry}
                    </TableCell>
                    <TableCell className="text-right text-green-600 dark:text-green-400 font-semibold">
                      {formatNordicCurrency(option.premium, 0)}
                    </TableCell>
                    <TableCell className={`text-right font-semibold ${option.v21_score != null ? getScoreColor(option.v21_score) : ''}`}>
                      {option.v21_score != null ? formatNordicDecimal(option.v21_score, 1) : '-'}
                    </TableCell>
                    <TableCell className={`text-right font-semibold ${option.ta_probability != null ? getScoreColor(option.ta_probability * 100) : ''}`}>
                      {option.ta_probability != null ? formatNordicDecimal(option.ta_probability * 100, 0) : '-'}
                    </TableCell>
                    <TableCell
                      className={`text-right font-bold text-lg ${getScoreColor(option.combined_score)}`}
                    >
                      <div className={`px-2 py-1 rounded ${getScoreBgColor(option.combined_score)}`}>
                        {formatNordicDecimal(option.combined_score, 1)}
                      </div>
                    </TableCell>
                    <TableCell className={`text-center font-bold ${getAgreementColor(option.models_agree)}`}>
                      {getAgreementIcon(option.models_agree)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {option.agreement_strength}
                    </TableCell>
                  </TableRow>
                  {expandedRow === idx && (
                    <TableRow>
                      <TableCell colSpan={12} className="bg-muted/30 p-0">
                        <div className="p-6 overflow-x-auto">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 min-w-full">
                            <V21Breakdown option={option} />
                            <TABreakdown option={option} />
                            <AgreementAnalysis option={option} />
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
