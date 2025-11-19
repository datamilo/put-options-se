/**
 * Lower Bound Analysis Control Components
 * Stock selector, filters, and summary metrics
 */

import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LowerBoundSummaryMetrics } from '@/types/lowerBound';
import { TrendingUp, Target, AlertCircle, Calendar } from 'lucide-react';

interface StockSelectorProps {
  stocks: string[];
  selectedStock: string;
  onStockChange: (stock: string) => void;
  isLoading?: boolean;
}

export const StockSelector: React.FC<StockSelectorProps> = ({
  stocks,
  selectedStock,
  onStockChange,
  isLoading = false,
}) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-700">
        Select Stock
      </label>
      <Select value={selectedStock} onValueChange={onStockChange} disabled={isLoading}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Choose a stock..." />
        </SelectTrigger>
        <SelectContent className="max-h-64">
          {stocks.length === 0 ? (
            <SelectItem value="_none" disabled>
              No stocks available
            </SelectItem>
          ) : (
            stocks.map((stock) => (
              <SelectItem key={stock} value={stock}>
                {stock}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
};

interface SummaryMetricsProps {
  metrics: LowerBoundSummaryMetrics;
  isLoading?: boolean;
}

export const SummaryMetrics: React.FC<SummaryMetricsProps> = ({
  metrics,
  isLoading = false,
}) => {
  const cards = [
    {
      title: 'Total Options',
      value: metrics.totalOptions.toLocaleString(),
      icon: Target,
      color: 'bg-blue-50 text-blue-700',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Overall Hit Rate',
      value: `${metrics.overallHitRate.toFixed(2)}%`,
      icon: TrendingUp,
      color: 'bg-green-50 text-green-700',
      iconColor: 'text-green-600',
    },
    {
      title: 'Total Breaches',
      value: metrics.totalBreaches.toLocaleString(),
      icon: AlertCircle,
      color: 'bg-red-50 text-red-700',
      iconColor: 'text-red-600',
    },
    {
      title: 'Stocks Analyzed',
      value: metrics.totalStocks.toString(),
      icon: Calendar,
      color: 'bg-purple-50 text-purple-700',
      iconColor: 'text-purple-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title} className="overflow-hidden">
            <CardHeader className={`pb-2 ${card.color}`}>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">
                  {card.title}
                </CardTitle>
                <Icon className={`w-5 h-5 ${card.iconColor}`} />
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {isLoading ? (
                <div className="h-8 bg-slate-200 rounded animate-pulse"></div>
              ) : (
                <div className="text-2xl font-bold text-slate-900">
                  {card.value}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

interface StockSummaryMetricsProps {
  stock: string;
  totalPredictions: number;
  totalBreaches: number;
  overallHitRate: number;
  isLoading?: boolean;
}

export const StockSummaryMetrics: React.FC<StockSummaryMetricsProps> = ({
  stock,
  totalPredictions,
  totalBreaches,
  overallHitRate,
  isLoading = false,
}) => {
  const breachRate = totalPredictions > 0
    ? (totalBreaches / totalPredictions) * 100
    : 0;

  const getHitRateColor = (rate: number) => {
    if (rate >= 85) return 'bg-green-100 text-green-900 border-green-300';
    if (rate >= 75) return 'bg-blue-100 text-blue-900 border-blue-300';
    if (rate >= 65) return 'bg-yellow-100 text-yellow-900 border-yellow-300';
    return 'bg-red-100 text-red-900 border-red-300';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{stock} - Summary Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-4 bg-slate-200 rounded animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-600 uppercase">
                Predictions
              </p>
              <p className="text-xl font-bold text-slate-900">
                {totalPredictions.toLocaleString()}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-600 uppercase">
                Breaches
              </p>
              <p className="text-xl font-bold text-red-600">
                {totalBreaches.toLocaleString()}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-600 uppercase">
                Breach Rate
              </p>
              <p className="text-xl font-bold text-slate-900">
                {breachRate.toFixed(1)}%
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-600 uppercase">
                Hit Rate
              </p>
              <p className={`text-xl font-bold px-2 py-1 rounded border ${getHitRateColor(overallHitRate)}`}>
                {overallHitRate.toFixed(1)}%
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
