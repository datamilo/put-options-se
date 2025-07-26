import { useState } from "react";
import { OptionData } from "@/types/options";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown, Filter } from "lucide-react";

interface OptionsTableProps {
  data: OptionData[];
  onRowClick?: (option: OptionData) => void;
}

export const OptionsTable = ({ data, onRowClick }: OptionsTableProps) => {
  const [sortField, setSortField] = useState<keyof OptionData | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState("");

  const handleSort = (field: keyof OptionData) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
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

  const filteredData = sortedData.filter(option =>
    option.StockName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    option.OptionName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatValue = (value: any, field: string) => {
    if (value === null || value === undefined || value === 'NaN') return '-';
    
    if (typeof value === 'number') {
      if (field.includes('Pct') || field.includes('Prob') || field === 'ImpliedVolatility') {
        return `${(value * 100).toFixed(2)}%`;
      }
      if (field.includes('Loss') || field === 'Premium' || field.includes('Price')) {
        return value.toLocaleString('sv-SE');
      }
      return value.toFixed(2);
    }
    
    return String(value);
  };

  const getRiskBadgeColor = (probOfWorthless: number) => {
    if (probOfWorthless < 0.3) return "bg-destructive";
    if (probOfWorthless < 0.6) return "bg-accent";
    return "bg-secondary";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Filter className="h-4 w-4" />
        <Input
          placeholder="Search stocks or options..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort('StockName')}
                  className="h-8 p-0 font-medium"
                >
                  Stock <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort('OptionName')}
                  className="h-8 p-0 font-medium"
                >
                  Option <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort('Premium')}
                  className="h-8 p-0 font-medium"
                >
                  Premium <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort('StrikePrice')}
                  className="h-8 p-0 font-medium"
                >
                  Strike <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort('DaysToExpiry')}
                  className="h-8 p-0 font-medium"
                >
                  Days to Expiry <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort('ProbOfWorthless')}
                  className="h-8 p-0 font-medium"
                >
                  Risk Level <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort('ImpliedVolatility')}
                  className="h-8 p-0 font-medium"
                >
                  IV <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((option, index) => (
              <TableRow
                key={`${option.StockName}-${option.OptionName}-${index}`}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onRowClick?.(option)}
              >
                <TableCell className="font-medium">{option.StockName}</TableCell>
                <TableCell>{option.OptionName}</TableCell>
                <TableCell>{formatValue(option.Premium, 'Premium')}</TableCell>
                <TableCell>{formatValue(option.StrikePrice, 'StrikePrice')}</TableCell>
                <TableCell>{option.DaysToExpiry}</TableCell>
                <TableCell>
                  <Badge className={getRiskBadgeColor(option.ProbOfWorthless)}>
                    {formatValue(option.ProbOfWorthless, 'ProbOfWorthless')}
                  </Badge>
                </TableCell>
                <TableCell>{formatValue(option.ImpliedVolatility, 'ImpliedVolatility')}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};