/**
 * Lower Bound Distribution Chart Component
 * Displays prediction distribution and breach analysis with daily stock prices
 * Uses Plotly subplots: main chart (distribution + breaches) + secondary chart (span %)
 * Both charts share x-axis and show unified hover info
 * Includes earnings event markers from historical stock event data
 */

import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';
import { LowerBoundExpiryStatistic, LowerBoundDailyPrediction } from '@/types/lowerBound';
import { useStockData } from '@/hooks/useStockData';
import { useVolatilityData } from '@/hooks/useVolatilityData';

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

  // Load earnings events data
  const earningsDataQuery = useVolatilityData();

  // Wait until stock data is loaded (useStockData returns isLoading, not isSuccess)
  const isStockDataReady = !stockDataQuery.isLoading && stockDataQuery.allStockData.length > 0;

  const stockPriceData = useMemo(() => {
    if (!stockDataQuery.allStockData || stockDataQuery.allStockData.length === 0) return [];

    // Filter to start from when options data begins (approximately 2024-05-01)
    const minDate = '2024-05-01';

    return stockDataQuery.allStockData
      .filter((d) => d.name === stock && d.date >= minDate)
      .map((d) => ({
        date: d.date,
        close: d.close,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [stockDataQuery.allStockData, stock]);

  // Use daily predictions from props (already filtered by parent)
  const dailyPredictions = dailyPredictionsProp;

  // Get earnings event dates for this stock (deduped)
  const earningsEventDates = useMemo(() => {
    if (!earningsDataQuery.volatilityData || earningsDataQuery.volatilityData.length === 0) return [];

    // Filter to this stock and earnings events only
    const earningsEvents = earningsDataQuery.volatilityData.filter(
      (event) => event.name === stock &&
      (event.type_of_event === 'Kvartalsrapport' || event.type_of_event === 'Bokslutskommuniké')
    );

    // Deduplicate by date and sort
    const uniqueDates = Array.from(new Set(earningsEvents.map((e) => e.date))).sort();
    return uniqueDates;
  }, [earningsDataQuery.volatilityData, stock]);

  // Get expiry stats for this stock
  const expiryStats = useMemo(() => {
    return data.filter((d) => d.Stock === stock);
  }, [data, stock]);

  // Calculate span percentages for each expiry
  const spanData = useMemo(() => {
    return expiryStats.map((stat) => {
      const minBound = parseFloat(stat.LowerBound_Min);
      const maxBound = parseFloat(stat.LowerBound_Max);
      let spanPercentage = 0;
      if (!isNaN(minBound) && !isNaN(maxBound) && minBound > 0) {
        spanPercentage = ((maxBound - minBound) / minBound) * 100;
      }
      return {
        expiryDate: stat.ExpiryDate,
        spanPercentage,
      };
    });
  }, [expiryStats]);

  // Generate x-axis tick values: sample of expiry dates to avoid overcrowding
  // Shows approximately 15-20 evenly spaced dates for readability
  const xAxisTicksData = useMemo(() => {
    // Get ALL unique expiry dates from the entire dataset
    const allExpiryDates = Array.from(new Set(data.map((d) => d.ExpiryDate)))
      .sort()
      .filter((v) => v); // Remove any empty values

    if (allExpiryDates.length === 0) {
      return { tickvals: [], ticktext: [] };
    }

    // If we have too many dates, sample them evenly to avoid overcrowding
    const maxTicks = 15;
    let selectedDates: string[];

    if (allExpiryDates.length <= maxTicks) {
      selectedDates = allExpiryDates;
    } else {
      // Sample dates evenly across the range
      const step = Math.floor(allExpiryDates.length / maxTicks);
      selectedDates = [];
      for (let i = 0; i < allExpiryDates.length; i += step) {
        selectedDates.push(allExpiryDates[i]);
      }
      // Always include the last date
      if (selectedDates[selectedDates.length - 1] !== allExpiryDates[allExpiryDates.length - 1]) {
        selectedDates.push(allExpiryDates[allExpiryDates.length - 1]);
      }
    }

    return {
      tickvals: selectedDates,
      ticktext: selectedDates,
    };
  }, [data]);

  // Build traces for Plotly subplots
  const plotlyData = useMemo(() => {
    if (stockPriceData.length === 0 && expiryStats.length === 0) {
      return [];
    }

    const traces: any[] = [];

    // ===== ROW 1: MAIN CHART (Distribution + Breaches) =====

    // 1. Breach count bars
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
        xaxis: 'x1',
        hovertemplate:
          '<b>Breaches at %{x}</b><br>Count: %{y}<extra></extra>',
      });
    }

    // 2. Violin plots for prediction distributions
    const uniqueExpiries = Array.from(
      new Set(expiryStats.map((s) => s.ExpiryDate))
    ).sort();

    for (const expiryDate of uniqueExpiries) {
      const expiryPreds = dailyPredictions.filter(
        (p) => p.ExpiryDate === expiryDate
      );

      const expiryStatForViolinSpan = expiryStats.find((s) => s.ExpiryDate === expiryDate);
      const minBound = expiryStatForViolinSpan ? parseFloat(expiryStatForViolinSpan.LowerBound_Min) : null;
      const maxBound = expiryStatForViolinSpan ? parseFloat(expiryStatForViolinSpan.LowerBound_Max) : null;

      if (expiryPreds.length >= 3) {
        const violinTrace: any = {
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
          hoveron: 'violins+points',
          scalemode: 'width',
          spanmode: 'hard',
          width: 432000000,
          xaxis: 'x1',
          yaxis: 'y1',
        };

        if (minBound !== null && maxBound !== null && !isNaN(minBound) && !isNaN(maxBound)) {
          violinTrace.span = [minBound, maxBound];
        }

        traces.push(violinTrace);
      }
    }

    // 3. Stock price line
    if (stockPriceData.length > 0) {
      traces.push({
        x: stockPriceData.map((d) => d.date),
        y: stockPriceData.map((d) => d.close),
        mode: 'lines',
        name: 'Stock Price',
        line: { color: 'black', width: 2.5 },
        xaxis: 'x1',
        yaxis: 'y1',
        hovertemplate: '<b>Stock Price</b><br>Date: %{x}<br>Close: %{y:.2f} SEK<extra></extra>',
      });
    }

    // 4. Earnings event markers
    if (earningsEventDates.length > 0 && stockPriceData.length > 0) {
      const earningsEventPrices = earningsEventDates.map((eventDate) => {
        const priceData = stockPriceData.find((d) => d.date === eventDate);
        if (priceData) return priceData.close;

        const closest = stockPriceData.reduce((prev, current) => {
          const prevDiff = Math.abs(new Date(prev.date).getTime() - new Date(eventDate).getTime());
          const currentDiff = Math.abs(new Date(current.date).getTime() - new Date(eventDate).getTime());
          return currentDiff < prevDiff ? current : prev;
        });
        return closest.close;
      });

      traces.push({
        x: earningsEventDates,
        y: earningsEventPrices,
        mode: 'markers',
        name: 'Earnings Events',
        marker: {
          color: 'rgb(255, 165, 0)',
          size: 12,
          symbol: 'circle',
          line: {
            color: 'rgb(255, 100, 0)',
            width: 2.5,
          },
        },
        xaxis: 'x1',
        yaxis: 'y1',
        hovertemplate: '<b>Earnings Report</b><br>Date: %{x}<br>Price: %{y:.2f} SEK<extra></extra>',
      });
    }

    // ===== ROW 2: SPAN PERCENTAGE CHART =====

    // 5. Span percentage bars (on second subplot)
    if (spanData.length > 0) {
      traces.push({
        x: spanData.map((s) => s.expiryDate),
        y: spanData.map((s) => s.spanPercentage),
        type: 'bar',
        name: 'Span %',
        marker: { color: 'rgb(76, 175, 80)', opacity: 0.7 },
        xaxis: 'x2',
        yaxis: 'y3',
        hovertemplate:
          '<b>Span %</b><br>Date: %{x}<br>Span: %{y:.2f}%<extra></extra>',
      });
    }

    return traces;
  }, [stockPriceData, expiryStats, dailyPredictions, earningsEventDates, spanData]);

  const layout = useMemo(() => {
    if (stockPriceData.length === 0) {
      return {
        title: `${stock} - Prediction Distribution & Breaches (No price data available)`,
        xaxis: { title: 'Date' },
        yaxis: { title: 'Price (SEK)' },
        height: 800,
        template: 'plotly_white',
        hovermode: 'x unified',
      };
    }

    const minDate = stockPriceData[0].date;
    const maxDate = stockPriceData[stockPriceData.length - 1].date;

    // Calculate max values for axis scaling
    const maxBreachCount = expiryStats.reduce((max, s) => {
      const count = parseInt(s.BreachCount) || 0;
      return Math.max(max, count);
    }, 0);

    const maxSpanPercentage = spanData.length > 0
      ? Math.max(...spanData.map((s) => s.spanPercentage))
      : 100;

    const layoutObj: any = {
      title: `<b>${stock} - Lower Bound Prediction Distribution & Breaches</b><br><sub>Blue violins = prediction distribution | Red bars = breach count | Orange dots = earnings events | Green bars = span %</sub>`,

      // ROW 1: Main chart (top ~65% with bottom margin for spacing)
      xaxis: {
        title: '',
        range: [minDate, maxDate],
        tickformat: '%Y-%m-%d',
        tickvals: xAxisTicksData.tickvals.length > 0 ? xAxisTicksData.tickvals : undefined,
        ticktext: xAxisTicksData.ticktext.length > 0 ? xAxisTicksData.ticktext : undefined,
        tickangle: -45,
        showticklabels: false, // Hide labels here, they appear on lower chart
        domain: [0, 1],
        showspikes: true,
        spikemode: 'across',
        spikethickness: 1,
        spikecolor: '#999',
      },
      yaxis: {
        title: 'Price (SEK)',
        side: 'left',
        domain: [0.40, 1], // Start from 0.40 to leave gap
      },
      yaxis2: {
        title: 'Breach Count',
        side: 'right',
        overlaying: 'y',
        showgrid: false,
        range: [0, Math.max(maxBreachCount * 3, 1)],
        domain: [0.40, 1],
      },

      // ROW 2: Span percentage chart (bottom ~35% with top margin for spacing)
      xaxis2: {
        title: '',
        range: [minDate, maxDate],
        tickformat: '%Y-%m-%d',
        tickvals: xAxisTicksData.tickvals.length > 0 ? xAxisTicksData.tickvals : undefined,
        ticktext: xAxisTicksData.ticktext.length > 0 ? xAxisTicksData.ticktext : undefined,
        tickangle: -45,
        showticklabels: true,
        domain: [0, 1],
        anchor: 'y3', // Anchor to yaxis3 so labels appear at bottom of span chart
        showspikes: true,
        spikemode: 'across',
        spikethickness: 1,
        spikecolor: '#999',
        matches: 'x', // Synchronize with main x-axis
      },
      yaxis3: {
        title: 'Span %',
        side: 'left',
        range: [0, Math.max(maxSpanPercentage * 1.1, 10)],
        domain: [0, 0.35], // Ends at 0.35 to leave gap above
        anchor: 'x2', // Anchor to xaxis2
      },

      // Layout configuration
      height: 1000, // Increased height to accommodate spacing
      template: 'plotly_white',
      showlegend: true,
      hovermode: 'x',
      hoverdistance: 50, // Increase hover detection distance
      spikedistance: -1, // Show spikes across all subplots
      violinmode: 'overlay',
      margin: { l: 60, r: 80, t: 120, b: 120 }, // Increased bottom margin

      // Synchronize hover across subplots
      grid: {
        rows: 2,
        columns: 1,
        pattern: 'independent',
        roworder: 'top to bottom',
      },
    };

    return layoutObj;
  }, [stockPriceData, expiryStats, spanData, xAxisTicksData, stock]);

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
        <p>
          <span className="inline-block w-3 h-3 mr-2" style={{ backgroundColor: 'rgb(76, 175, 80)' }}></span>
          <strong>Green bars</strong> = Span percentage (range width: (max - min) / min × 100%, right y-axis)
        </p>
      </div>
    </div>
  );
};
