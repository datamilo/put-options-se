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
import { ArrowUpDown, Filter, Eye, EyeOff } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface OptionsTableProps {
  data: OptionData[];
  onRowClick?: (option: OptionData) => void;
  columnFilters: ColumnFilter[];
  onColumnFiltersChange: (filters: ColumnFilter[]) => void;
  sortField: keyof OptionData | null;
  sortDirection: 'asc' | 'desc';
  onSortChange: (field: keyof OptionData | null, direction: 'asc' | 'desc') => void;
}

interface ColumnFilter {
  field: string;
  type: 'text' | 'number';
  textValue?: string;
  minValue?: number;
  maxValue?: number;
}

export const OptionsTable = ({ data, onRowClick, columnFilters, onColumnFiltersChange, sortField, sortDirection, onSortChange }: OptionsTableProps) => {
  const [showColumnManager, setShowColumnManager] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
  const [activeGroups, setActiveGroups] = useState<Set<string>>(new Set());
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  // Define column groups for better organization
  const columnGroups = {
    basic: ['StockName', 'OptionName', 'Premium','ProbWorthless_Bayesian_IsoCal', '1_2_3_ProbOfWorthless_Weighted', '1_ProbOfWorthless_Original', '2_ProbOfWorthless_Calibrated', '3_ProbOfWorthless_Historical_IV'],
    'reportOrXDay': ['FinancialReport', 'X-Day'],
    risk: ['1_2_3_ProbOfWorthless_Weighted', '1_ProbOfWorthless_Original', '2_ProbOfWorthless_Calibrated', '3_ProbOfWorthless_Historical_IV','ProbWorthless_Bayesian_IsoCal'],
    loss: ['LossAtBadDecline', 'LossAtWorstDecline', 'LossAt100DayWorstDecline', 'LossAt_2008_100DayWorstDecline', 'LossAt50DayWorstDecline', 'LossAt_2008_50DayWorstDecline'],
    statistics: ['PoW_Stats_MedianLossPct', 'PoW_Stats_WorstLossPct', 'PoW_Stats_MedianLoss', 'PoW_Stats_WorstLoss', 'PoW_Stats_MedianProbOfWorthless', 'PoW_Stats_MinProbOfWorthless', 'PoW_Stats_MaxProbOfWorthless'],
    profitloss: ['ProfitLossPctLeastBad', 'ProfitLossPctBad', 'ProfitLossPctWorst', 'ProfitLossPct100DayWorst', 'Loss_Least_Bad'],
    pricing: ['StockPrice', 'NumberOfContractsBasedOnLimit', 'Bid', 'Bid_Ask_Mid_Price', 'Option_Price_Min', 'Underlying_Value', 'AskBidSpread'],
    volatility: ['ImpliedVolatility', 'TodayStockMedianIV_Maximum100DaysToExp', 'AllMedianIV_Maximum100DaysToExp', 'IV_AllMedianIV_Maximum100DaysToExp_Ratio'],
    bounds: ['Lower_Bound', 'Lower_Bound_at_Accuracy', 'Lower_Bound_HistMedianIV', 'Lower_Bound_HistMedianIV_at_Accuracy'],
    other: ['FinancialReport', 'X-Day', 'PoW_Simulation_Mean_Earnings', '100k_Invested_Loss_Mean', 'Mean_Accuracy',  'StockPrice_After_2008_100DayWorstDecline', 'ExpiryDate_Lower_Bound_Minus_Pct_Based_on_Accuracy', 'StrikeBelowLowerAtAcc']
  };

  // Get all available columns from data
  const allColumns = data.length > 0 ? Object.keys(data[0]) : [];
  
  // Initialize visible columns on first load
  useEffect(() => {
    if (visibleColumns.length === 0 && allColumns.length > 0) {
      setVisibleColumns(columnGroups.basic);
    }
  }, [allColumns.length, visibleColumns.length]);

  // Handle click outside to close filter dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setActiveFilter(null);
      }
    };

    if (activeFilter) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [activeFilter]);

  const formatColumnName = (field: string) => {
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

  // Apply column filters
  const filteredData = sortedData.filter(option => {
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
  });

  const updateColumnFilter = (field: string, filterUpdate: Partial<ColumnFilter>) => {
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
    if (value === null || value === undefined || value === 'NaN' || value === '') return '-';
    
    if (typeof value === 'number') {
      if (field.includes('Pct') || field.includes('Prob') || field === 'ImpliedVolatility' || field.includes('Accuracy')) {
        return `${(value * 100).toFixed(2)}%`;
      }
      if (field.includes('Loss') || field === 'Premium' || field.includes('Price') || field.includes('Bid') || field.includes('Value')) {
        return value.toLocaleString('sv-SE');
      }
      if (field === 'DaysToExpiry' || field === 'X-Day' || field.includes('Number')) {
        return Math.round(value).toString();
      }
      return value.toFixed(2);
    }
    
    return String(value);
  };

  const getRiskBadgeColor = (probOfWorthless: number) => {
    if (probOfWorthless < 0.3) return "bg-destructive text-destructive-foreground";
    if (probOfWorthless < 0.6) return "bg-warning text-warning-foreground";
    return "bg-success text-success-foreground";
  };

  const toggleColumn = (column: string) => {
    setVisibleColumns(prev => 
      prev.includes(column) 
        ? prev.filter(col => col !== column)
        : [...prev, column]
    );
  };

  const toggleColumnGroup = (groupName: keyof typeof columnGroups) => {
    const isActive = activeGroups.has(groupName);
    
    if (isActive) {
      // Remove columns from this group
      setVisibleColumns(prev => 
        prev.filter(col => !columnGroups[groupName].includes(col))
      );
      setActiveGroups(prev => {
        const newSet = new Set(prev);
        newSet.delete(groupName);
        return newSet;
      });
    } else {
      // Add columns from this group
      setVisibleColumns(prev => {
        if (groupName === 'reportOrXDay') {
          // Insert reportOrXDay columns at positions 2 and 3 (third and fourth from left)
          const newCols = [...prev];
          const columnsToAdd = columnGroups[groupName].filter(col => !newCols.includes(col));
          
          // Insert at position 2 (after StockName and OptionName)
          newCols.splice(2, 0, ...columnsToAdd);
          return newCols;
        } else {
          // For other groups, append at the end
          const newCols = [...new Set([...prev, ...columnGroups[groupName]])];
          return newCols;
        }
      });
      setActiveGroups(prev => new Set([...prev, groupName]));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4" />
          <span className="text-sm text-muted-foreground">
            Click on column headers to filter
          </span>
        </div>
        
        <Button
          variant="outline"
          onClick={() => setShowColumnManager(!showColumnManager)}
          className="flex items-center gap-2"
        >
          {showColumnManager ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          Columns ({visibleColumns.length})
        </Button>
      </div>

      {showColumnManager && (
        <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
          <div className="flex flex-wrap gap-2">
            {Object.entries(columnGroups).map(([groupName, columns]) => (
              <Button
                key={groupName}
                variant={activeGroups.has(groupName) ? "default" : "outline"}
                size="sm"
                onClick={() => toggleColumnGroup(groupName as keyof typeof columnGroups)}
              >
                {groupName === 'reportOrXDay' ? 'Report or X Day' : groupName.charAt(0).toUpperCase() + groupName.slice(1)}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setVisibleColumns(allColumns)}
            >
              Show All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setVisibleColumns(columnGroups.basic)}
            >
              Reset to Basic
            </Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-40 overflow-y-auto">
            {allColumns.map(column => (
              <div key={column} className="flex items-center space-x-2">
                <Checkbox
                  id={column}
                  checked={visibleColumns.includes(column)}
                  onCheckedChange={() => toggleColumn(column)}
                />
                <label 
                  htmlFor={column} 
                  className="text-sm cursor-pointer truncate"
                  title={formatColumnName(column)}
                >
                  {formatColumnName(column)}
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

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
                      <Button
                        variant="ghost"
                        onClick={() => handleSort(column as keyof OptionData)}
                        className="h-8 p-0 font-medium"
                        title={formatColumnName(column)}
                      >
                        {formatColumnName(column)} <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                      
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
                                onChange={(e) => updateColumnFilter(column, { textValue: e.target.value })}
                                className="h-8"
                                autoFocus
                              />
                            ) : (
                              <div className="space-y-2">
                                <Input
                                  type="number"
                                  placeholder="Min value"
                                  value={filter?.minValue || ''}
                                  onChange={(e) => updateColumnFilter(column, { 
                                    minValue: e.target.value ? parseFloat(e.target.value) : undefined 
                                  })}
                                  className="h-8"
                                />
                                <Input
                                  type="number"
                                  placeholder="Max value"
                                  value={filter?.maxValue || ''}
                                  onChange={(e) => updateColumnFilter(column, { 
                                    maxValue: e.target.value ? parseFloat(e.target.value) : undefined 
                                  })}
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
                {visibleColumns.map(column => (
                  <TableCell 
                    key={column} 
                    className={`${column === 'StockName' ? "w-28 max-w-28 truncate" : "min-w-[120px]"} ${column === 'OptionName' ? 'cursor-pointer hover:bg-accent/50 transition-colors' : ''}`}
                    onClick={column === 'OptionName' ? () => onRowClick?.(option) : undefined}
                  >
                    {column === 'OptionName' ? (
                      <span className="font-medium text-primary hover:text-primary/80 transition-colors">
                        {formatValue(option[column as keyof OptionData], column)}
                      </span>
                    ) : (
                      formatValue(option[column as keyof OptionData], column)
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};