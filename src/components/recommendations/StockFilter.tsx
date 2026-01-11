import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { RecommendedOption } from '@/types/recommendations';

interface StockFilterProps {
  recommendations: RecommendedOption[];
  selectedStocks: string[];
  onSelectedStocksChange: (stocks: string[]) => void;
}

export const StockFilter: React.FC<StockFilterProps> = ({
  recommendations,
  selectedStocks,
  onSelectedStocksChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get unique stocks with option counts
  const stocksWithCounts = React.useMemo(() => {
    const stockMap = new Map<string, number>();
    recommendations.forEach((rec) => {
      stockMap.set(rec.stockName, (stockMap.get(rec.stockName) || 0) + 1);
    });
    return Array.from(stockMap.entries())
      .map(([stock, count]) => ({ stock, count }))
      .sort((a, b) => a.stock.localeCompare(b.stock));
  }, [recommendations]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleToggleStock = (stock: string) => {
    if (selectedStocks.includes(stock)) {
      onSelectedStocksChange(selectedStocks.filter((s) => s !== stock));
    } else {
      onSelectedStocksChange([...selectedStocks, stock]);
    }
  };

  const handleClearAll = () => {
    onSelectedStocksChange([]);
  };

  const handleSelectAll = () => {
    onSelectedStocksChange(stocksWithCounts.map((s) => s.stock));
  };

  const displayText =
    selectedStocks.length === 0
      ? 'All stocks'
      : selectedStocks.length === 1
        ? selectedStocks[0]
        : `${selectedStocks.length} stocks selected`;

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="outline"
        className="w-full justify-between"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="truncate">{displayText}</span>
        <ChevronDown
          className={`h-4 w-4 ml-2 transition-transform flex-shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-950 border rounded-md shadow-lg z-50 max-h-96 overflow-y-auto">
          {/* Header with Select/Clear All buttons */}
          <div className="sticky top-0 border-b bg-white dark:bg-slate-950 p-2 flex gap-2">
            <Button
              variant="sm"
              size="sm"
              onClick={handleSelectAll}
              className="flex-1 h-8"
            >
              Select All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAll}
              className="flex-1 h-8"
            >
              Clear
            </Button>
          </div>

          {/* Stock list */}
          <div className="p-2 space-y-1">
            {stocksWithCounts.length === 0 ? (
              <div className="text-sm text-muted-foreground p-2">
                No stocks available
              </div>
            ) : (
              stocksWithCounts.map(({ stock, count }) => (
                <label
                  key={stock}
                  className="flex items-center gap-2 p-2 hover:bg-muted rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedStocks.includes(stock)}
                    onChange={() => handleToggleStock(stock)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm flex-1">{stock}</span>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                    {count}
                  </span>
                </label>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
