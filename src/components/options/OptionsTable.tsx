import { useState, useEffect, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { OptionData } from "@/types/options";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown, Filter, Eye, EyeOff, Info, Download } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { ColumnManager } from "./ColumnManager";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { formatNumber } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { exportToExcel } from "@/utils/excelExport";
import { FieldInfoTooltip } from "@/components/ui/field-info-tooltip";
import { useTranslation } from "react-i18next";

interface OptionsTableProps {
  data: OptionData[];
  onRowClick?: (option: OptionData) => void;
  onStockClick?: (stockName: string) => void;
  columnFilters?: ColumnFilter[];
  onColumnFiltersChange?: (filters: ColumnFilter[]) => void;
  sortField: keyof OptionData | null;
  sortDirection: 'asc' | 'desc';
  onSortChange: (field: keyof OptionData | null, direction: 'asc' | 'desc') => void;
  enableFiltering?: boolean;
}

interface ColumnFilter {
  field: string;
  type: 'text' | 'number';
  textValue?: string;
  minValue?: number;
  maxValue?: number;
}

export const OptionsTable = ({
  data,
  onRowClick,
  onStockClick,
  columnFilters = [],
  onColumnFiltersChange = () => {},
  sortField,
  sortDirection,
  onSortChange,
  enableFiltering = true
}: OptionsTableProps) => {
  const { t } = useTranslation(['pages', 'tables']);
  const { columnPreferences, isLoading } = useUserPreferences();
  const [visibleColumns, setVisibleColumns] = useState<(keyof OptionData)[]>([]);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [filterInputs, setFilterInputs] = useState<{ minValue: string; maxValue: string }>({ minValue: '', maxValue: '' });
  const filterRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Default columns if no preferences exist
  const defaultColumns: (keyof OptionData)[] = [
    'StockName', 'OptionName', 'ExpiryDate', 'DaysToExpiry', 'StrikePrice',
    'Premium', 'NumberOfContractsBasedOnLimit', '1_2_3_ProbOfWorthless_Weighted'
  ];
  
  // Initialize visible columns from user preferences or defaults
  useEffect(() => {
    if (!isLoading) {
      if (columnPreferences.length > 0) {
        const visibleCols = columnPreferences
          .filter(col => col.visible)
          .sort((a, b) => a.order - b.order)
          .map(col => col.key as keyof OptionData);
        setVisibleColumns(visibleCols);
      } else {
        setVisibleColumns(defaultColumns);
      }
    }
  }, [columnPreferences, isLoading]);

  // Handle click outside to close filter dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setActiveFilter(null);
      }
    };

    if (activeFilter && enableFiltering) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [activeFilter, enableFiltering]);

  const formatColumnName = (field: string): string => {
    const translated = t(`tables:options.fields.${field}`, { defaultValue: '' });
    if (translated) return translated;
    return field
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/^\w/, c => c.toUpperCase())
      .replace(/\b\w/g, c => c.toUpperCase());
  };

  const handleSort = (field: keyof OptionData) => {
    if (sortField === field) {
      onSortChange(field, sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      onSortChange(field, 'asc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortField) return 0;
    
    const aVal = a[sortField];
    const bVal = b[sortField];
    
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    }
    
    const aStr = String(aVal).toLowerCase();
    const bStr = String(bVal).toLowerCase();
    
    if (sortDirection === 'asc') {
      return aStr.localeCompare(bStr);
    } else {
      return bStr.localeCompare(aStr);
    }
  });

  // Determine if a field is numeric based on the data
  const getFieldType = (field: string): 'text' | 'number' => {
    if (data.length === 0) return 'text';
    const sampleValue = data[0][field as keyof OptionData];
    return typeof sampleValue === 'number' ? 'number' : 'text';
  };

  // Apply column filters only if filtering is enabled
  const filteredData = enableFiltering ? sortedData.filter(option => {
    return columnFilters.every(filter => {
      const value = option[filter.field as keyof OptionData];
      
      if (filter.type === 'text') {
        if (!filter.textValue) return true;
        return String(value).toLowerCase().includes(filter.textValue.toLowerCase());
      } else {
        // For numeric filters, exclude non-numeric values (like "-" for missing data)
        if (typeof value !== 'number') return false;
        // If no filter values set, show all numeric values
        if (filter.minValue === undefined && filter.maxValue === undefined) return true;
        // Apply min/max filters
        if (filter.minValue !== undefined && value < filter.minValue) return false;
        if (filter.maxValue !== undefined && value > filter.maxValue) return false;
        return true;
      }
    });
  }) : sortedData;

  const rowVirtualizer = useVirtualizer({
    count: filteredData.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => 45,
    overscan: 15,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();
  const paddingTop = virtualItems.length > 0 ? virtualItems[0].start : 0;
  const paddingBottom = virtualItems.length > 0
    ? totalSize - virtualItems[virtualItems.length - 1].end
    : 0;

  const updateColumnFilter = (field: string, filterUpdate: Partial<ColumnFilter>) => {
    if (!enableFiltering) return;
    
    const prevFilters = columnFilters;
    const existingIndex = prevFilters.findIndex(f => f.field === field);
    const fieldType = getFieldType(field);
    
    let newFilters: ColumnFilter[];
    
    if (existingIndex >= 0) {
      // Update existing filter
      const updated = [...prevFilters];
      updated[existingIndex] = { ...updated[existingIndex], ...filterUpdate };
      
      // Remove filter if it's empty
      if (fieldType === 'text' && !updated[existingIndex].textValue) {
        newFilters = updated.filter((_, i) => i !== existingIndex);
      } else if (fieldType === 'number' && 
                 updated[existingIndex].minValue === undefined && 
                 updated[existingIndex].maxValue === undefined) {
        newFilters = updated.filter((_, i) => i !== existingIndex);
      } else {
        newFilters = updated;
      }
    } else {
      // Add new filter only if it has values
      if (fieldType === 'text' && !filterUpdate.textValue) {
        newFilters = prevFilters;
      } else if (fieldType === 'number' && 
          filterUpdate.minValue === undefined && 
          filterUpdate.maxValue === undefined) {
        newFilters = prevFilters;
      } else {
        newFilters = [...prevFilters, { field, type: fieldType, ...filterUpdate }];
      }
    }
    
    onColumnFiltersChange(newFilters);
  };

  const getColumnFilter = (field: string): ColumnFilter | undefined => {
    return columnFilters.find(f => f.field === field);
  };

  const formatValue = (value: any, field: string) => {
    return formatNumber(value, field);
  };

  const getRiskBadgeColor = (probOfWorthless: number) => {
    if (probOfWorthless < 0.3) return "bg-destructive text-destructive-foreground";
    if (probOfWorthless < 0.6) return "bg-warning text-warning-foreground";
    return "bg-success text-success-foreground";
  };

  const handleColumnVisibilityChange = (column: keyof OptionData, visible: boolean) => {
    if (visible) {
      // Add column if not already visible
      if (!visibleColumns.includes(column)) {
        setVisibleColumns(prev => [...prev, column]);
      }
    } else {
      // Remove column from visible columns
      setVisibleColumns(prev => prev.filter(col => col !== column));
    }
  };

  const handleColumnOrderChange = (newOrder: (keyof OptionData)[]) => {
    setVisibleColumns(newOrder);
  };

  const handleExport = () => {
    exportToExcel({
      filename: 'options_data',
      visibleColumns,
      data: filteredData
    });
  };

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          {enableFiltering && (
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4" />
              <span className="text-sm text-muted-foreground">
                {t('optionsTable.filterHint')}
              </span>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            {/* PoW Legend Info Button */}
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  title={t('optionsTable.powBtnTitle')}
                  className="gap-1"
                >
                  <Info className="h-4 w-4" />
                  <span className="text-xs">{t('optionsTable.powBtnLabel')}</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{t('optionsTable.powLegendTitle')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <p className="font-semibold text-sm mb-2">{t('optionsTable.powWhatIs')}</p>
                    <p className="text-sm text-muted-foreground">
                      <strong>{t('optionsTable.powDesc')}</strong>
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-sm mb-2">{t('optionsTable.powMethodsTitle')}</p>
                    <ul className="text-sm text-muted-foreground space-y-2 ml-4 list-disc">
                      <li><strong>{t('recommendations.explanation.methodWeighted')}:</strong> {t('optionsTable.powMethod1')}</li>
                      <li><strong>{t('recommendations.explanation.methodBayesian')}:</strong> {t('optionsTable.powMethod2')}</li>
                      <li><strong>{t('recommendations.explanation.methodOriginal')}:</strong> {t('optionsTable.powMethod3')}</li>
                      <li><strong>{t('recommendations.explanation.methodCalibrated')}:</strong> {t('optionsTable.powMethod4')}</li>
                      <li><strong>{t('recommendations.explanation.methodHistoricalIV')}:</strong> {t('optionsTable.powMethod5')}</li>
                    </ul>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              {t('optionsTable.exportExcel')}
            </Button>
            <ColumnManager
              visibleColumns={visibleColumns}
              onVisibilityChange={handleColumnVisibilityChange}
              onColumnOrderChange={handleColumnOrderChange}
            />
          </div>
        </div>

        <div
          ref={scrollContainerRef}
          className="w-full overflow-auto rounded-md border"
          style={{ height: '70vh' }}
        >
          <table className="w-full caption-bottom text-sm whitespace-nowrap">
          <TableHeader sticky className="bg-background">
            <TableRow>
              {visibleColumns.map(column => {
                const fieldType = getFieldType(column);
                const filter = getColumnFilter(column);
                const hasFilter = !!filter;
                
                return (
                  <TableHead
                    key={column}
                    className={column === 'StockName' ? "w-28 max-w-28" : "min-w-[120px]"}
                    aria-sort={sortField === column
                      ? (sortDirection === 'asc' ? 'ascending' : 'descending')
                      : undefined}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          onClick={() => handleSort(column as keyof OptionData)}
                          className="h-9 px-1 font-medium"
                          title={formatColumnName(column)}
                        >
                          {formatColumnName(column)} <ArrowUpDown className="ml-1 h-3 w-3" />
                        </Button>
                        <FieldInfoTooltip fieldName={column} />
                      </div>
                      
                      {enableFiltering && (
                        <div className="relative">
                          <Button
                            variant={hasFilter ? "default" : "outline"}
                            size="sm"
                            onClick={() => {
                              const isOpening = activeFilter !== column;
                              setActiveFilter(isOpening ? column : null);
                              if (isOpening) {
                                // Initialize input values when opening filter
                                const currentFilter = getColumnFilter(column);
                                setFilterInputs({
                                  minValue: currentFilter?.minValue !== undefined ? String(currentFilter.minValue).replace('.', ',') : '',
                                  maxValue: currentFilter?.maxValue !== undefined ? String(currentFilter.maxValue).replace('.', ',') : ''
                                });
                              }
                            }}
                            className="h-9 w-full text-xs"
                          >
                            <Filter className="h-3 w-3 mr-1" />
                            {hasFilter ? t('optionsTable.filtered') : t('optionsTable.filter')}
                          </Button>

                          {activeFilter === column && (
                            <div
                              ref={filterRef}
                              className="absolute top-8 left-0 z-50 bg-background border rounded-md shadow-md p-2 min-w-48"
                            >
                              {fieldType === 'text' ? (
                                <Input
                                  placeholder={t('optionsTable.searchPlaceholder')}
                                  aria-label={`Search ${formatColumnName(column)}`}
                                  value={filter?.textValue || ''}
                                  onChange={(e) => updateColumnFilter(column, { textValue: e.target.value.slice(0, 100) })}
                                  className="h-8"
                                  maxLength={100}
                                  autoFocus
                                />
                              ) : (
                                <div className="space-y-2">
                                  <Input
                                    type="text"
                                    inputMode="decimal"
                                    placeholder={t('optionsTable.minValue')}
                                    aria-label={`Minimum ${formatColumnName(column)}`}
                                    value={filterInputs.minValue}
                                    onChange={(e) => {
                                      const inputValue = e.target.value;
                                      setFilterInputs(prev => ({ ...prev, minValue: inputValue }));

                                      const normalizedValue = inputValue.replace(',', '.');
                                      if (normalizedValue === '') {
                                        updateColumnFilter(column, { minValue: undefined });
                                      } else {
                                        const numValue = parseFloat(normalizedValue);
                                        if (!isNaN(numValue) && isFinite(numValue)) {
                                          updateColumnFilter(column, { minValue: numValue });
                                        }
                                      }
                                    }}
                                    className="h-8"
                                    autoFocus
                                  />
                                  <Input
                                    type="text"
                                    inputMode="decimal"
                                    placeholder={t('optionsTable.maxValue')}
                                    aria-label={`Maximum ${formatColumnName(column)}`}
                                    value={filterInputs.maxValue}
                                    onChange={(e) => {
                                      const inputValue = e.target.value;
                                      setFilterInputs(prev => ({ ...prev, maxValue: inputValue }));

                                      const normalizedValue = inputValue.replace(',', '.');
                                      if (normalizedValue === '') {
                                        updateColumnFilter(column, { maxValue: undefined });
                                      } else {
                                        const numValue = parseFloat(normalizedValue);
                                        if (!isNaN(numValue) && isFinite(numValue)) {
                                          updateColumnFilter(column, { maxValue: numValue });
                                        }
                                      }
                                    }}
                                    className="h-8"
                                  />
                                </div>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  updateColumnFilter(column, { minValue: undefined, maxValue: undefined });
                                  setFilterInputs({ minValue: '', maxValue: '' });
                                  setActiveFilter(null);
                                }}
                                className="mt-2 h-9 w-full text-xs"
                              >
                                {t('optionsTable.clear')}
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paddingTop > 0 && (
              <tr style={{ height: paddingTop }}>
                <td colSpan={visibleColumns.length} />
              </tr>
            )}
            {virtualItems.map(virtualRow => {
              const option = filteredData[virtualRow.index];
              const getOptionNameColor = (column: string) => {
                if (column !== 'OptionName') return '';
                if (option.FinancialReport === 'Y') return 'text-orange-600 dark:text-orange-400';
                if (option['X-Day'] && String(option['X-Day']).toUpperCase() === 'Y') return 'text-red-600 dark:text-red-400';
                return 'text-primary';
              };
              return (
                <TableRow
                  key={`${option.StockName}-${option.OptionName}-${virtualRow.index}`}
                  className="hover:bg-muted/50"
                >
                  {visibleColumns.map(column => (
                    <TableCell
                      key={column}
                      className={`${column === 'StockName' ? "w-28 max-w-28 truncate" : "min-w-[120px]"} ${column === 'OptionName' || column === 'StockName' ? 'cursor-pointer hover:bg-accent/50 transition-colors' : ''}`}
                      onClick={column === 'OptionName' ? () => onRowClick?.(option) : column === 'StockName' ? () => onStockClick?.(option.StockName) : undefined}
                    >
                      {column === 'OptionName' ? (
                        <span className={`font-medium ${getOptionNameColor(column)} hover:opacity-80 transition-all`}>
                          {formatValue(option[column as keyof OptionData], column)}
                        </span>
                      ) : column === 'StockName' ? (
                        <span className="font-medium text-foreground hover:text-primary transition-colors">
                          {formatValue(option[column as keyof OptionData], column)}
                        </span>
                      ) : (
                        formatValue(option[column as keyof OptionData], column)
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
            {paddingBottom > 0 && (
              <tr style={{ height: paddingBottom }}>
                <td colSpan={visibleColumns.length} />
              </tr>
            )}
          </TableBody>
        </table>
      </div>
    </div>
    </TooltipProvider>
  );
};