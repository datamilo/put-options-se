import { useState, useEffect, useRef } from "react";
import { OptionData } from "@/types/options";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown, Filter, Eye, EyeOff, Info } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { ColumnManager } from "./ColumnManager";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { formatNumber } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
  const { columnPreferences, isLoading } = useUserPreferences();
  const [visibleColumns, setVisibleColumns] = useState<(keyof OptionData)[]>([]);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const filterRef = useRef<HTMLDivElement>(null);

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

  const formatColumnName = (field: string) => {
    // Special case for recalculatedNumberOfContracts
    if (field === 'recalculatedNumberOfContracts') {
      return 'Number Of Contracts';
    }
    
    // Special formatting for IV fields
    const fieldMappings: { [key: string]: string } = {
      'IV_ClosestToStrike': 'IV Closest To Strike',
      'IV_UntilExpiryClosestToStrike': 'IV Until Expiry Closest To Strike',
      'LowerBoundClosestToStrike': 'Lower Bound Closest To Strike',
      'LowerBoundDistanceFromCurrentPrice': 'Lower Bound Distance From Current Price',
      'LowerBoundDistanceFromStrike': 'Lower Bound Distance From Strike',
      'ImpliedDownPct': 'Implied Down %',
      'ToStrikePct': 'To Strike %',
      'SafetyMultiple': 'Safety Multiple',
      'SigmasToStrike': 'Sigmas To Strike',
      'ProbAssignment': 'Prob Assignment',
      'SafetyCategory': 'Safety Category',
      'CushionMinusIVPct': 'Cushion Minus IV %',
      'PotentialLossAtLowerBound': 'Potential Loss At IV Lower Bound'
    };
    
    if (fieldMappings[field]) {
      return fieldMappings[field];
    }
    
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
        if (typeof value !== 'number') return true;
        if (filter.minValue !== undefined && value < filter.minValue) return false;
        if (filter.maxValue !== undefined && value > filter.maxValue) return false;
        return true;
      }
    });
  }) : sortedData;

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

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          {enableFiltering && (
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4" />
              <span className="text-sm text-muted-foreground">
                Click on column headers to filter
              </span>
            </div>
          )}
          
          <ColumnManager
            visibleColumns={visibleColumns}
            onVisibilityChange={handleColumnVisibilityChange}
            onColumnOrderChange={handleColumnOrderChange}
          />
        </div>

        <ScrollArea className="w-full whitespace-nowrap rounded-md border">
          <Table>
          <TableHeader>
            <TableRow>
              {visibleColumns.map(column => {
                const fieldType = getFieldType(column);
                const filter = getColumnFilter(column);
                const hasFilter = !!filter;
                
                return (
                  <TableHead key={column} className={column === 'StockName' ? "w-28 max-w-28" : "min-w-[120px]"}>
                    <div className="space-y-2">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          onClick={() => handleSort(column as keyof OptionData)}
                          className="h-8 p-0 font-medium"
                          title={formatColumnName(column)}
                        >
                          {formatColumnName(column)} <ArrowUpDown className="ml-1 h-3 w-3" />
                        </Button>
                        {column === 'OptionName' && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <div className="space-y-1 text-xs">
                                <div className="font-medium"></div>
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 bg-orange-500 rounded"></div>
                                  <span>Financial Report</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                                  <span>Ex-Dividend Day</span>
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        )}
                        {column === 'PotentialLossAtLowerBound' && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-md w-full z-50" align="center">
                              <div className="text-xs leading-relaxed p-1">
                                <p className="font-medium mb-2">How this field is calculated:</p>
                                <p className="mb-2">This field represents the maximum potential loss if the stock price falls to its IV-based lower bound at expiration.</p>
                                <p className="mb-2">Calculation: Premium + (LowerBoundValue × Contracts × 100) - (StrikePrice × Contracts × 100)</p>
                                <p>The lower bound is derived from implied volatility analysis to estimate worst-case scenarios for the option position.</p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                      
                      {enableFiltering && (
                        <div className="relative">
                          <Button
                            variant={hasFilter ? "default" : "outline"}
                            size="sm"
                            onClick={() => setActiveFilter(activeFilter === column ? null : column)}
                            className="h-6 w-full text-xs"
                          >
                            <Filter className="h-3 w-3 mr-1" />
                            {hasFilter ? 'Filtered' : 'Filter'}
                          </Button>
                          
                          {activeFilter === column && (
                            <div 
                              ref={filterRef}
                              className="absolute top-8 left-0 z-50 bg-background border rounded-md shadow-md p-2 min-w-48"
                            >
                              {fieldType === 'text' ? (
                                <Input
                                  placeholder="Search..."
                                  value={filter?.textValue || ''}
                                  onChange={(e) => updateColumnFilter(column, { textValue: e.target.value.slice(0, 100) })}
                                  className="h-8"
                                  maxLength={100}
                                  autoFocus
                                />
                              ) : (
                                <div className="space-y-2">
                                  <Input
                                    type="number"
                                    placeholder="Min value"
                                    value={filter?.minValue || ''}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      const numValue = value ? parseFloat(value) : undefined;
                                      if (numValue === undefined || (!isNaN(numValue) && isFinite(numValue))) {
                                        updateColumnFilter(column, { minValue: numValue });
                                      }
                                    }}
                                    className="h-8"
                                  />
                                  <Input
                                    type="number"
                                    placeholder="Max value"
                                    value={filter?.maxValue || ''}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      const numValue = value ? parseFloat(value) : undefined;
                                      if (numValue === undefined || (!isNaN(numValue) && isFinite(numValue))) {
                                        updateColumnFilter(column, { maxValue: numValue });
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
                                  updateColumnFilter(column, fieldType === 'text' ? { textValue: '' } : { minValue: undefined, maxValue: undefined });
                                  setActiveFilter(null);
                                }}
                                className="mt-2 h-6 w-full text-xs"
                              >
                                Clear
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
            {filteredData.map((option, index) => (
              <TableRow
                key={`${option.StockName}-${option.OptionName}-${index}`}
                className="hover:bg-muted/50"
              >
                  {visibleColumns.map(column => {
                    // Determine the color for OptionName based on FinancialReport and X-Day
                    const getOptionNameColor = () => {
                      if (column !== 'OptionName') return '';
                      if (option.FinancialReport === 'Y') return 'text-orange-600 dark:text-orange-400';
                      if (option['X-Day'] && String(option['X-Day']).toUpperCase() === 'Y') return 'text-red-600 dark:text-red-400';
                      return 'text-primary';
                    };

                    return (
                      <TableCell 
                        key={column} 
                        className={`${column === 'StockName' ? "w-28 max-w-28 truncate" : "min-w-[120px]"} ${column === 'OptionName' || column === 'StockName' ? 'cursor-pointer hover:bg-accent/50 transition-colors' : ''}`}
                        onClick={column === 'OptionName' ? () => onRowClick?.(option) : column === 'StockName' ? () => onStockClick?.(option.StockName) : undefined}
                      >
                        {column === 'OptionName' ? (
                          <span className={`font-medium ${getOptionNameColor()} hover:opacity-80 transition-all`}>
                            {formatValue(option[column as keyof OptionData], column)}
                          </span>
                        ) : column === 'StockName' ? (
                          <span className="font-medium text-secondary-foreground hover:text-primary transition-colors">
                            {formatValue(option[column as keyof OptionData], column)}
                          </span>
                        ) : (
                          formatValue(option[column as keyof OptionData], column)
                        )}
                      </TableCell>
                    );
                  })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
    </TooltipProvider>
  );
};