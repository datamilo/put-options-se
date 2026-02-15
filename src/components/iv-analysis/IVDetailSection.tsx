// src/components/iv-analysis/IVDetailSection.tsx

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Check, ChevronsUpDown } from 'lucide-react';
import { IVStockSummary, IVPerStockPerDay } from '@/types/ivAnalysis';
import { IVDualAxisChart } from './IVDualAxisChart';
import { formatNordicDecimal, formatNordicPercentagePoints } from '@/utils/numberFormatting';

interface Props {
  selectedStock: string;
  onSelectStock: (stock: string) => void;
  stockNames: string[];
  summaries: IVStockSummary[];
  dataByStock: Map<string, IVPerStockPerDay[]>;
}

function KPICard({ label, value, colorClass }: { label: string; value: string; colorClass?: string }) {
  return (
    <Card>
      <CardContent className="pt-4 pb-3 px-4">
        <div className="text-xs text-muted-foreground mb-1">{label}</div>
        <div className={`text-xl font-semibold tabular-nums ${colorClass ?? ''}`}>{value}</div>
      </CardContent>
    </Card>
  );
}

function ivRankColorClass(rank: number | null): string {
  if (rank === null) return '';
  if (rank > 80) return 'text-red-600 dark:text-red-400';
  if (rank < 20) return 'text-green-600 dark:text-green-400';
  return '';
}

function deltaColorClass(val: number | null): string {
  if (val === null) return '';
  return val > 0 ? 'text-red-600 dark:text-red-400' : val < 0 ? 'text-green-600 dark:text-green-400' : '';
}

export const IVDetailSection = React.forwardRef<HTMLDivElement, Props>(
  ({ selectedStock, onSelectStock, stockNames, summaries, dataByStock }, ref) => {
    const [open, setOpen] = useState(false);

    const summary = summaries.find(s => s.stockName === selectedStock) ?? null;
    const stockData = selectedStock ? (dataByStock.get(selectedStock) ?? []) : [];

    const currentIV = summary?.currentIV != null
      ? formatNordicDecimal(summary.currentIV * 100, 2) + '%'
      : '–';

    const ivRank52w = summary?.ivRank52w != null ? `${summary.ivRank52w} / 100` : '–';
    const ivRankHist = summary?.ivRankAllTime != null ? `${summary.ivRankAllTime} / 100` : '–';

    const change1d = summary?.ivChange1d != null
      ? formatNordicPercentagePoints(summary.ivChange1d * 100, 2)
      : '–';
    const change5d = summary?.ivChange5d != null
      ? formatNordicPercentagePoints(summary.ivChange5d * 100, 2)
      : '–';

    return (
      <div ref={ref} className="space-y-4">
        {/* Stock selector */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">Välj aktie:</span>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="w-48 justify-between">
                {selectedStock || 'Välj aktie...'}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-0" align="start">
              <Command>
                <CommandInput placeholder="Sök aktie..." />
                <CommandList>
                  <CommandEmpty>Ingen aktie hittades.</CommandEmpty>
                  <CommandGroup>
                    {stockNames.map(name => (
                      <CommandItem
                        key={name}
                        value={name}
                        onSelect={() => { onSelectStock(name); setOpen(false); }}
                      >
                        <Check className={`mr-2 h-4 w-4 ${selectedStock === name ? 'opacity-100' : 'opacity-0'}`} />
                        {name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {selectedStock && (
          <>
            {/* KPI strip */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <KPICard label="Aktuell IV" value={currentIV} />
              <KPICard
                label="IV Rank 52v"
                value={ivRank52w}
                colorClass={ivRankColorClass(summary?.ivRank52w ?? null)}
              />
              <KPICard
                label="IV Rank Historisk"
                value={ivRankHist}
                colorClass={ivRankColorClass(summary?.ivRankAllTime ?? null)}
              />
              <KPICard
                label="1-dag Δ IV"
                value={change1d}
                colorClass={deltaColorClass(summary?.ivChange1d ?? null)}
              />
              <KPICard
                label="5-dag Δ IV"
                value={change5d}
                colorClass={deltaColorClass(summary?.ivChange5d ?? null)}
              />
            </div>

            {/* Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{selectedStock} — IV & Kursutveckling</CardTitle>
              </CardHeader>
              <CardContent>
                {stockData.length > 0 ? (
                  <IVDualAxisChart data={stockData} stockName={selectedStock} />
                ) : (
                  <p className="text-muted-foreground text-sm">Ingen data tillgänglig.</p>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    );
  }
);

IVDetailSection.displayName = 'IVDetailSection';
