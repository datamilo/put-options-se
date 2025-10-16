import React, { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ArrowUpDown } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { VolatilityEventData } from '@/types/volatility';

interface VolatilityDataTableProps {
  data: VolatilityEventData[];
}

type SortKey = keyof VolatilityEventData;
type SortDirection = 'asc' | 'desc';

export const VolatilityDataTable: React.FC<VolatilityDataTableProps> = ({ data }) => {
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const uniqueYears = useMemo(() => {
    return Array.from(new Set(data.map(item => item.year))).sort((a, b) => b - a);
  }, [data]);

  const months = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];

  // Filter and sort data (only by year/month, stock filtering is done in parent)
  const filteredAndSortedData = useMemo(() => {
    let filtered = data;

    if (selectedYear && selectedYear !== 'all') {
      filtered = filtered.filter(item => item.year === parseInt(selectedYear));
    }

    if (selectedMonth && selectedMonth !== 'all') {
      filtered = filtered.filter(item => item.month === parseInt(selectedMonth));
    }

    // Sort data
    return filtered.sort((a, b) => {
      const aValue = a[sortKey];
      const bValue = b[sortKey];

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      const aStr = String(aValue);
      const bStr = String(bValue);
      return sortDirection === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });
  }, [data, selectedYear, selectedMonth, sortKey, sortDirection]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('desc');
    }
  };

  const SortableHeader = ({ children, sortKey: key }: { children: React.ReactNode; sortKey: SortKey }) => (
    <TableHead>
      <Button
        variant="ghost"
        onClick={() => handleSort(key)}
        className="h-auto p-0 font-medium hover:bg-transparent"
      >
        {children}
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    </TableHead>
  );

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Year</Label>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger>
              <SelectValue placeholder="All years..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All years</SelectItem>
              {uniqueYears.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Month</Label>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger>
              <SelectValue placeholder="All months..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All months</SelectItem>
              {months.map((month) => (
                <SelectItem key={month.value} value={month.value}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredAndSortedData.length} of {data.length} records
      </div>

      {/* Table */}
      <ScrollArea className="h-[600px] w-full border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHeader sortKey="date">Date</SortableHeader>
              <SortableHeader sortKey="name">Stock</SortableHeader>
              <SortableHeader sortKey="type_of_event">Event Type</SortableHeader>
              <SortableHeader sortKey="event_value">Event Value</SortableHeader>
              <SortableHeader sortKey="close">Close Price</SortableHeader>
              <SortableHeader sortKey="volume">Volume</SortableHeader>
              <SortableHeader sortKey="close_price_pct_change_from_previous_day">Price Change %</SortableHeader>
              <SortableHeader sortKey="volume_pct_change_from_previous_day">Volume Change %</SortableHeader>
              <SortableHeader sortKey="pct_intraday_high_low_movement">Intraday Spread %</SortableHeader>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedData.map((row, index) => (
              <TableRow key={index}>
                <TableCell>{row.date}</TableCell>
                <TableCell className="font-medium">{row.name}</TableCell>
                <TableCell>{row.type_of_event}</TableCell>
                <TableCell>{row.event_value !== undefined && row.event_value !== null ? Math.round(row.event_value) : 'N/A'}</TableCell>
                <TableCell>{row.close?.toFixed(2)}</TableCell>
                <TableCell>{row.volume?.toLocaleString('sv-SE')}</TableCell>
                <TableCell className={row.close_price_pct_change_from_previous_day >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {(row.close_price_pct_change_from_previous_day * 100)?.toFixed(2)}%
                </TableCell>
                <TableCell className={row.volume_pct_change_from_previous_day >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {(row.volume_pct_change_from_previous_day * 100)?.toFixed(2)}%
                </TableCell>
                <TableCell>{(Math.abs(row.pct_intraday_high_low_movement) * 100)?.toFixed(2)}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
};