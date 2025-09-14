import React, { useState, useMemo } from 'react';
import { MonthlyStockStats } from '@/hooks/useMonthlyStockData';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface MonthlyStatsTableProps {
  data: MonthlyStockStats[];
}

type SortKey = keyof MonthlyStockStats;

export const MonthlyStatsTable: React.FC<MonthlyStatsTableProps> = ({ data }) => {
  const [sortKey, setSortKey] = useState<SortKey>('top_5_accumulated_score');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

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

    if (searchTerm) {
      filtered = data.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered.sort((a, b) => {
      const aValue = a[sortKey] as number;
      const bValue = b[sortKey] as number;
      
      if (sortDirection === 'asc') {
        return aValue - bValue;
      }
      return bValue - aValue;
    });
  }, [data, searchTerm, sortKey, sortDirection]);

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
      {/* Search */}
      <div className="flex items-center justify-between">
        <Input
          placeholder="Search stocks..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="max-w-sm"
        />
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
                <TableHead className="w-16">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('top_5_accumulated_score')}
                    className="h-auto p-0 font-medium"
                  >
                    Score {getSortIcon('top_5_accumulated_score')}
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
                      {formatNumber(row.return_month_mean_pct_return_month)}%
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={row.open_to_low_mean_pct_return_month >= -5 ? 'text-green-600' : 'text-red-600'}>
                      {formatNumber(row.open_to_low_mean_pct_return_month)}%
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-red-600">
                      {formatNumber(row.open_to_low_min_pct_return_month)}%
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={row.top_5_accumulated_score >= 10 ? 'text-green-600 font-medium' : 
                                   row.top_5_accumulated_score >= 5 ? 'text-blue-600' : 'text-muted-foreground'}>
                      {formatNumber(row.top_5_accumulated_score, 0)}
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