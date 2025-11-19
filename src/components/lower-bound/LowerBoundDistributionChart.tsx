/**
 * Lower Bound Distribution Chart Component
 * Displays prediction distribution and breach analysis with daily stock prices
 * Uses Plotly for violin plot visualization
 */

import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';
import { LowerBoundExpiryStatistic, LowerBoundDailyPrediction } from '@/types/lowerBound';
import { useStockData } from '@/hooks/useStockData';

interface LowerBoundDistributionChartProps {
  data: LowerBoundExpiryStatistic[];
  dailyPredictions: LowerBoundDailyPrediction[];
  stock: string;
  isLoading?: boolean;
}

export const LowerBoundDistributionChart: React.FC<
  LowerBoundDistributionChartProps
> = ({ data, dailyPredictions: dailyPredictionsProp, stock, isLoading = false }) => {
  // Load stock price data for this stock
  const stockDataQuery = useStockData();

  // Wait until stock data is loaded (useStockData returns isLoading, not isSuccess)
  const isStockDataReady = !stockDataQuery.isLoading && stockDataQuery.allStockData.length > 0;

  const stockPriceData = useMemo(() => {
    if (!stockDataQuery.allStockData || stockDataQuery.allStockData.length === 0) return [];
    return stockDataQuery.allStockData
      .filter((d) => d.name === stock)
      .map((d) => ({
        date: d.date,
        close: d.close,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [stockDataQuery.allStockData, stock]);

  // Use daily predictions from props (already filtered by parent)
  const dailyPredictions = dailyPredictionsProp;

  // Get expiry stats for this stock
  const expiryStats = useMemo(() => {
    return data.filter((d) => d.Stock === stock);
  }, [data, stock]);

  // Build traces for Plotly
  const plotlyData = useMemo(() => {
    if (stockPriceData.length === 0 && expiryStats.length === 0) {
      return [];
    }

    const traces: any[] = [];

    // 1. Breach count bars first (so they appear behind everything)
    const breachesOnly = expiryStats.filter((s) => {
      const count = parseInt(s.BreachCount) || 0;
      return count > 0;
    });
    if (breachesOnly.length > 0) {
      traces.push({
        x: breachesOnly.map((s) => s.ExpiryDate),
        y: breachesOnly.map((s) => parseInt(s.BreachCount)),
        type: 'bar',
        name: 'Breach Count',
        marker: { color: 'red', opacity: 0.6 },
        yaxis: 'y2',
        hovertemplate:
          '<b>Breaches at %{x}</b><br>Count: %{y}<extra></extra>',
      });
    }

    // 2. Violin plots for prediction distributions at each expiry
    const uniqueExpiries = Array.from(
      new Set(expiryStats.map((s) => s.ExpiryDate))
    ).sort();

    for (const expiryDate of uniqueExpiries) {
      const expiryPreds = dailyPredictions.filter(
        (p) => p.ExpiryDate === expiryDate
      );

      // Only create violin if we have at least 3 data points
      if (expiryPreds.length >= 3) {
        traces.push({
          x: expiryPreds.map(() => expiryDate),
          y: expiryPreds.map((p) => {
            const val = parseFloat(p.LowerBound);
            return isNaN(val) ? 0 : val;
          }),
          type: 'violin',
          name: 'Predictions',
          showlegend: false,
          line: { color: 'blue' },
          fillcolor: 'rgba(100, 149, 237, 0.5)',
          opacity: 0.6,
          meanline: { visible: true },
          points: false,
          hoverinfo: 'y',
          spanmode: 'hard',
        });
      }
    }

    // 3. Stock price line last (so it appears on top)
    if (stockPriceData.length > 0) {
      traces.push({
        x: stockPriceData.map((d) => d.date),
        y: stockPriceData.map((d) => d.close),
        mode: 'lines',
        name: 'Stock Price',
        line: { color: 'black', width: 2.5 },
        hovertemplate: '<b>Stock Price</b><br>Date: %{x}<br>Close: %{y:.2f} SEK<extra></extra>',
      });
    }

    return traces;
  }, [stockPriceData, expiryStats, dailyPredictions]);

  const layout = useMemo(() => {
    if (stockPriceData.length === 0) {
      return {
        title: `${stock} - Prediction Distribution & Breaches (No price data available)`,
        xaxis: { title: 'Date' },
        yaxis: { title: 'Price (SEK)' },
        height: 700,
        template: 'plotly_white',
        hovermode: 'x unified',
      };
    }

    const minDate = stockPriceData[0].date;
    const maxDate = stockPriceData[stockPriceData.length - 1].date;

    // Calculate max breach count for y-axis scaling
    const maxBreachCount = expiryStats.reduce((max, s) => {
      const count = parseInt(s.BreachCount) || 0;
      return Math.max(max, count);
    }, 0);

    return {
      title: `<b>${stock} - Lower Bound Prediction Distribution & Breaches</b><br><sub>Blue violins = prediction distribution at expiry | Red bars = breach count</sub>`,
      xaxis: {
        title: 'Date',
        range: [minDate, maxDate],
      },
      yaxis: {
        title: 'Price (SEK)',
        side: 'left',
      },
      yaxis2: {
        title: 'Breach Count',
        side: 'right',
        overlaying: 'y',
        showgrid: false,
        range: [0, Math.max(maxBreachCount * 3, 1)],
      },
      height: 700,
      template: 'plotly_white',
      showlegend: true,
      hovermode: 'x unified',
      violinmode: 'overlay',
    };
  }, [stockPriceData, expiryStats, stock]);

  if (isLoading || !isStockDataReady) {
    return (
      <div className="flex items-center justify-center h-96 bg-slate-50 rounded-lg">
        <p className="text-slate-500">Loading distribution data...</p>
      </div>
    );
  }

  if (stockPriceData.length === 0 && expiryStats.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-slate-50 rounded-lg">
        <p className="text-slate-500">
          No distribution data available for this stock
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {plotlyData.length > 0 && (
        <Plot
          data={plotlyData}
          layout={layout}
          config={{
            responsive: true,
            displayModeBar: true,
            displaylogo: false,
          }}
          style={{ width: '100%', height: '700px' }}
        />
      )}

      <div className="mt-4 space-y-2 text-sm text-slate-600">
        <p>
          <strong>Date range:</strong>{' '}
          {stockPriceData.length > 0
            ? `${stockPriceData[0].date} to ${stockPriceData[stockPriceData.length - 1].date}`
            : 'N/A'}{' '}
          | <strong>Total breaches:</strong>{' '}
          {expiryStats.reduce((sum, d) => sum + d.BreachCount, 0)}
        </p>
        <p>
          <span className="inline-block w-3 h-3 bg-black mr-2"></span>
          <strong>Black line</strong> = Daily stock price (all trading days)
        </p>
        <p>
          <span className="inline-block w-3 h-3 bg-blue-500 mr-2"></span>
          <strong>Blue violin</strong> = Prediction distribution (shown at each
          expiry date)
        </p>
        <p>
          <span className="inline-block w-3 h-3 bg-red-500 mr-2"></span>
          <strong>Red bars</strong> = Breach count per expiry date (right y-axis)
        </p>
      </div>
    </div>
  );
};
