import React, { useState, useMemo } from 'react';
import { MonthlyStockStats } from '@/hooks/useMonthlyStockData';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Label } from '@/components/ui/label';
import { ArrowUpDown, ArrowUp, ArrowDown, Check, ChevronsUpDown } from 'lucide-react';

interface MonthlyStatsTableProps {
  data: MonthlyStockStats[];
}

type SortKey = keyof MonthlyStockStats;

const MONTH_NAMES = [
  'All Months', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const MonthlyStatsTable: React.FC<MonthlyStatsTableProps> = ({ data }) => {
  const [sortKey, setSortKey] = useState<SortKey>('pct_pos_return_months');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMonth, setSelectedMonth] = useState(0); // 0 = All months
  const [selectedStock, setSelectedStock] = useState('');
  const [stockDropdownOpen, setStockDropdownOpen] = useState(false);
  const itemsPerPage = 20;

  // Get unique stock names for dropdown
  const availableStocks = useMemo(() => {
    const stocks = Array.from(new Set(data.map(stat => stat.name)));
    return stocks.sort();
  }, [data]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('desc');
    }
    setCurrentPage(1);
  };

  const filteredAndSortedData = useMemo(() => {
    let filtered = data;

    // Apply independent filters
    if (selectedMonth > 0) {
      filtered = filtered.filter(stat => stat.month === selectedMonth);
    }

    if (selectedStock) {
      filtered = filtered.filter(stat => stat.name === selectedStock);
    }

    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Create a new array to avoid mutating the original
    return [...filtered].sort((a, b) => {
      let aValue: any = a[sortKey];
      let bValue: any = b[sortKey];
      
      // Handle string sorting for name field
      if (sortKey === 'name') {
        const result = String(aValue).localeCompare(String(bValue));
        return sortDirection === 'asc' ? result : -result;
      }
      
      // Handle numeric sorting for all other fields
      aValue = Number(aValue) || 0;
      bValue = Number(bValue) || 0;
      
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });
  }, [data, searchTerm, sortKey, sortDirection, selectedMonth, selectedStock]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedData, currentPage]);

  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);

  const getSortIcon = (key: SortKey) => {
    if (sortKey !== key) return <ArrowUpDown className="h-4 w-4" />;
    return sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  const formatNumber = (value: number, decimals: number = 2) => {
    return value.toFixed(decimals);
  };

  const getMonthName = (month: number) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[month - 1] || 'All';
  };

  return (
    <div className="space-y-4">
      {/* Independent Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/20 rounded-lg">
        <div className="space-y-2">
          <Label>Month Filter</Label>
          <Select value={selectedMonth.toString()} onValueChange={(value) => {
            setSelectedMonth(parseInt(value));
            setCurrentPage(1);
          }}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background border shadow-lg z-50">
              {MONTH_NAMES.map((month, index) => (
                <SelectItem key={index} value={index.toString()}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Stock Filter</Label>
          <Popover open={stockDropdownOpen} onOpenChange={setStockDropdownOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={stockDropdownOpen}
                className="w-full justify-between"
              >
                {selectedStock || "All stocks..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0 bg-background border shadow-lg z-50" align="start">
              <Command>
                <CommandInput placeholder="Search stocks..." />
                <CommandList>
                  <CommandEmpty>No stock found.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      value=""
                      onSelect={() => {
                        setSelectedStock('');
                        setStockDropdownOpen(false);
                        setCurrentPage(1);
                      }}
                    >
                      <Check
                        className={`mr-2 h-4 w-4 ${selectedStock === '' ? "opacity-100" : "opacity-0"}`}
                      />
                      All stocks
                    </CommandItem>
                    {availableStocks.map((stock) => (
                      <CommandItem
                        key={stock}
                        value={stock}
                        onSelect={(currentValue) => {
                          setSelectedStock(currentValue === selectedStock ? '' : currentValue);
                          setStockDropdownOpen(false);
                          setCurrentPage(1);
                        }}
                      >
                        <Check
                          className={`mr-2 h-4 w-4 ${selectedStock === stock ? "opacity-100" : "opacity-0"}`}
                        />
                        {stock}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>Search</Label>
          <Input
            placeholder="Search stocks..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {filteredAndSortedData.length} results
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('name')}
                    className="h-auto p-0 font-medium"
                  >
                    Stock {getSortIcon('name')}
                  </Button>
                </TableHead>
                <TableHead className="w-16">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('month')}
                    className="h-auto p-0 font-medium"
                  >
                    Month {getSortIcon('month')}
                  </Button>
                </TableHead>
                <TableHead className="w-20">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('number_of_months_available')}
                    className="h-auto p-0 font-medium text-xs"
                  >
                    History {getSortIcon('number_of_months_available')}
                  </Button>
                </TableHead>
                <TableHead className="w-20">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('pct_pos_return_months')}
                    className="h-auto p-0 font-medium text-xs"
                  >
                    Pos % {getSortIcon('pct_pos_return_months')}
                  </Button>
                </TableHead>
                <TableHead className="w-20">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('return_month_mean_pct_return_month')}
                    className="h-auto p-0 font-medium text-xs"
                  >
                    Avg Ret % {getSortIcon('return_month_mean_pct_return_month')}
                  </Button>
                </TableHead>
                <TableHead className="w-20">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('open_to_low_mean_pct_return_month')}
                    className="h-auto p-0 font-medium text-xs"
                  >
                    Avg DD % {getSortIcon('open_to_low_mean_pct_return_month')}
                  </Button>
                </TableHead>
                <TableHead className="w-20">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('open_to_low_min_pct_return_month')}
                    className="h-auto p-0 font-medium text-xs"
                  >
                    Worst DD % {getSortIcon('open_to_low_min_pct_return_month')}
                  </Button>
                </TableHead>
                <TableHead className="w-20">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('open_to_low_max_pct_return_month')}
                    className="h-auto p-0 font-medium text-xs"
                  >
                    Best DD % {getSortIcon('open_to_low_max_pct_return_month')}
                  </Button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((row, index) => (
                <TableRow key={`${row.name}-${row.month}-${index}`}>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell>{getMonthName(row.month)}</TableCell>
                  <TableCell>{row.number_of_months_available}</TableCell>
                  <TableCell>
                    <span className={row.pct_pos_return_months >= 70 ? 'text-green-600' : 
                                   row.pct_pos_return_months >= 50 ? 'text-yellow-600' : 'text-red-600'}>
                      {formatNumber(row.pct_pos_return_months, 1)}%
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={row.return_month_mean_pct_return_month >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatNumber(row.return_month_mean_pct_return_month * 100)}%
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={row.open_to_low_mean_pct_return_month >= -0.05 ? 'text-green-600' : 'text-red-600'}>
                      {formatNumber(row.open_to_low_mean_pct_return_month * 100)}%
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-red-600">
                      {formatNumber(row.open_to_low_min_pct_return_month * 100)}%
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={row.open_to_low_max_pct_return_month >= 0 ? 'text-green-600' : 'text-orange-600'}>
                      {formatNumber(row.open_to_low_max_pct_return_month * 100)}%
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          
          <div className="flex items-center space-x-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(pageNum)}
                  className="w-8 h-8 p-0"
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};